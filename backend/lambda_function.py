import os
import json
import boto3
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from tensorflow.keras.models import load_model
from mangum import Mangum
from preprocess import preprocess_eeg_to_model_input
from botocore.config import Config

# -------- Config --------
BUCKET_NAME = os.environ.get("BUCKET_NAME", "")
DEMO_KEY = os.environ.get("DEMO_KEY", "sample_data/sample_eeg.set")
MODEL_PATH = os.environ.get("MODEL_PATH", "/var/task/model.h5")
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")

s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
)

app = FastAPI()

# -------- CORS --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


CLASS_LABELS = os.environ.get("CLASS_LABELS", "Alzheimer,FTD,Control").split(",")
model = None  # Start with no model to allow instant boot

def get_model():
    # Lazy load the model only when needed, but keep it warm for future requests.
    global model
    if model is None:
        print("Loading TensorFlow model into memory...")
        model = load_model(MODEL_PATH, compile=False)
    return model


# -------- Pydantic Models --------
class PredictRequest(BaseModel):
    demo: bool = False
    demo_key: Optional[str] = None
    s3_key: Optional[str] = None

# -------- Routes --------
@app.get("/health")
def health():
    # This forces the ~35-second model load to happen immediately.
    # API Gateway might time out to the frontend, but Lambda will finish this in the background!
    get_model()
    return {"status": "ok", "message": "Model is loaded and warm!"}

@app.get("/presign")
def presign(key: str, expires: int = 3600):
    if not BUCKET_NAME:
        raise HTTPException(status_code=500, detail="BUCKET_NAME not configured")
    try:
        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={"Bucket": BUCKET_NAME, "Key": key},
            ExpiresIn=expires,
        )
        return {"uploadUrl": url, "key": key}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
def predict(request: PredictRequest):
    key = request.demo_key if request.demo else request.s3_key
    if request.demo and not key:
        key = DEMO_KEY

    if not key:
        raise HTTPException(status_code=400, detail="Provide 's3_key' or set 'demo': true")
    if not BUCKET_NAME:
        raise HTTPException(status_code=500, detail="BUCKET_NAME not configured")

    local_path = f"/tmp/{os.path.basename(key)}"
    try:
        s3.download_file(BUCKET_NAME, key, local_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 download failed: {e}")

    try:
        X = preprocess_eeg_to_model_input(local_path)
        if X.ndim == 3:
            X = np.expand_dims(X, axis=0)

        current_model = get_model()
        preds = current_model.predict(X, verbose=0)
        probs = preds[0].astype(float).tolist()
        top_idx = int(np.argmax(preds[0]))
        confidence = float(preds[0][top_idx])
        label = CLASS_LABELS[top_idx] if top_idx < len(CLASS_LABELS) else str(top_idx)

        return {
            "predicted_class": label,
            "confidence": confidence,
            "probs": probs,
            "top_index": top_idx
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

# -------- Lambda handler adapter --------
lambda_handler = Mangum(app)
