import os
import json
import boto3
import numpy as np
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import serverless_wsgi
from preprocess import preprocess_eeg_to_model_input
from botocore.config import Config




# -------- Config --------
BUCKET_NAME = os.environ.get("BUCKET_NAME", "")  # set this in Lambda env
DEMO_KEY = os.environ.get("DEMO_KEY", "sample_data/sample_eeg.set")  # optional
MODEL_PATH = os.environ.get("MODEL_PATH", "/var/task/model.h5")
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")  # <-- set this env in Lambda


s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "virtual"}  # URL will be bucket.s3.<region>.amazonaws.com
    ),
)



app = Flask(__name__)

# Load the model at init time so it stays warm across invocations
model = load_model(MODEL_PATH, compile=False)
# If you have class names, list them here in order of the model's output indices:
CLASS_LABELS = os.environ.get("CLASS_LABELS", "Alzheimer,FTD,Control").split(",")

# -------- CORS (simple) --------
@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return resp

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


    

@app.route("/presign", methods=["GET"])
def presign():
    key = request.args.get("key")
    if not key:
        return jsonify({"error": "Missing ?key=uploads/yourfile.set"}), 400

    try:
        expires = int(request.args.get("expires", "3600"))
    except ValueError:
        expires = 3600

    if not BUCKET_NAME:
        return jsonify({"error": "BUCKET_NAME not configured"}), 500

    try:
        # IMPORTANT: no ContentType, no ACL => no signed headers
        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={"Bucket": BUCKET_NAME, "Key": key},
            ExpiresIn=expires,
        )
        return jsonify({"uploadUrl": url, "key": key}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    



@app.route("/predict", methods=["POST"])
def predict():
    """
    Body JSON:
      - demo: bool (if true, uses DEMO_KEY in S3)
      - demo_key: optional override for demo S3 key
      - s3_key: the uploaded file key in S3 (if not demo)

    Returns:
      { predicted_class: str, confidence: float, probs: [..], top_index: int }
    """
    if request.is_json:
        body = request.get_json()
    else:
        try:
            body = json.loads(request.data.decode("utf-8"))
        except Exception:
            body = {}

    use_demo = bool(body.get("demo", False))
    key = None
    if use_demo:
        key = body.get("demo_key", DEMO_KEY)
    else:
        key = body.get("s3_key")

    if not key:
        return jsonify({"error": "Provide 's3_key' or set 'demo': true"}), 400
    if not BUCKET_NAME:
        return jsonify({"error": "BUCKET_NAME not configured"}), 500

    # Download to /tmp (Lambda's writable space)
    local_path = f"/tmp/{os.path.basename(key)}"
    try:
        s3.download_file(BUCKET_NAME, key, local_path)
    except Exception as e:
        return jsonify({"error": f"S3 download failed: {e}"}), 500

    # If your .set requires a companion .fdt, you'll need to also download it.
    # E.g., if key endswith .set, also try key.replace('.set', '.fdt') if it exists.

    try:
        X = preprocess_eeg_to_model_input(local_path)
        # Ensure batch dimension
        if X.ndim == 3:
            X = np.expand_dims(X, axis=0)

        preds = model.predict(X, verbose=0)
        probs = preds[0].astype(float).tolist()
        top_idx = int(np.argmax(preds[0]))
        confidence = float(preds[0][top_idx])
        label = CLASS_LABELS[top_idx] if top_idx < len(CLASS_LABELS) else str(top_idx)

        return jsonify({
            "predicted_class": label,
            "confidence": confidence,
            "probs": probs,
            "top_index": top_idx
        }), 200
    except Exception as e:
        return jsonify({"error": f"Inference failed: {e}"}), 500

# -------- Lambda handler (Flask -> Lambda via awsgi) --------

def lambda_handler(event, context):
    # Debug log
    print("Incoming event:", json.dumps(event))

    stage = (event.get("requestContext", {}).get("stage") or "").lstrip("/")
    if stage:
        # Strip stage prefix from rawPath and path if present
        if "rawPath" in event and event["rawPath"].startswith(f"/{stage}"):
            event["rawPath"] = event["rawPath"][len(stage) + 1:]
        if "path" in event and event["path"].startswith(f"/{stage}"):
            event["path"] = event["path"][len(stage) + 1:]

    return serverless_wsgi.handle_request(app, event, context)

# -------- Local dev (optional): run Flask directly inside container --------
if __name__ == "__main__":
    # For local testing: docker run -p 9000:8080 ... and curl http://localhost:8080/health
    app.run(host="0.0.0.0", port=8080)
