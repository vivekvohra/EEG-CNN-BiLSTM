# EEG-CNN-BiLSTM (AWS Lambda + S3 demo)

End-to-end demo that serves a Keras **CNN-BiLSTM** EEG classifier from **AWS Lambda (container image)** with a **static frontend on S3**.
You can upload an EEGLAB `.set` file (or run a demo prediction), and get class probabilities back.


[**Live:**](https://az-eeg-site-109598917777.s3.ap-south-1.amazonaws.com/index.html)  
[**Blog**](https://dev.to/vivekvohra/deploying-a-cnn-bilstm-model-on-aws-lambda-4kcj)

```
EG-CNN-BiLSTM/
├── backend/                  # Lambda + Docker code
│   ├── lambda_function.py
│   ├── preprocess.py
│   ├── Dockerfile.dockerfile
│   ├── requirements.txt
│   └── model/
│       └── alzheimer_eeg_cnn_bilstm_model.h5
├── frontend/                 # S3 static site
│   ├── index.html
│   ├── app.js
│   └── style.css
├── research/                 # papers & notebooks
│   ├── train.ipynb
│   └── conference.pdf
├── LICENSE
└── README.md
```
## Demo video


https://github.com/user-attachments/assets/1141bf82-997f-40cb-a9b8-2ffe1c7f22f6


---

## What’s inside

* **Model**: Keras `.h5` CNN-BiLSTM saved with TF 2.x (pinned to TF 2.15 at runtime).
* **Backend** (`backend/`):

  * `lambda_function.py` – Flask app wrapped by `serverless-wsgi` for API Gateway HTTP API.
  * `preprocess.py` – loads `.set` and prepares input for the network.
  * `Dockerfile.dockerfile` – AWS Lambda Python 3.10 base image, installs deps, copies model/code.
  * **Endpoints**

    * `GET /health` – health check.
    * `GET /presign?key=uploads/yourfile.set` – presigned S3 URL for direct browser upload.
    * `POST /predict` – `{ "demo": true }` *or* `{ "s3_key": "uploads/yourfile.set" }`.
* **Frontend** (`frontend/`):

  * `index.html`, `app.js`, `style.css` – small UI hosted on S3 + (optional) CF.
  * Configure `apiUrl` in `app.js` to your API Gateway base, e.g.:

    ```js
    const apiUrl = "https://<api-id>.execute-api.<region>.amazonaws.com";
    ```
* **Research** (`research/`): training notebook + conference PDF.

---

## Deploying the backend (Lambda container)

We push a **single-image manifest** to ECR (Lambda rejects multi-arch *image indexes*).

**PowerShell (Windows)**


0) AWS auth
```powershell
aws configure        # set your keys + region (e.g., ap-south-1)
```

1) ECR repo once
```powershell
$ACCOUNT="123456789012"
$REGION="ap-south-1"
$REPO="eg-cnn-bilstm"
aws ecr create-repository --repository-name $REPO --region $REGION
```

2) Build a SINGLE image (disable buildkit to avoid manifest list)
```powershell
$env:DOCKER_BUILDKIT="0"
cd backend
docker build -f Dockerfile.dockerfile -t eg-cnn-bilstm:app-v1 .
```

3) Login, tag, push
```powershell
$ECR="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$REPO"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"
docker tag eg-cnn-bilstm:app-v1 "$ECR:app-v1"
docker push "$ECR:app-v1"
```

**Create Lambda (console)**

* Create function → **Container image**.
* Image URI: `123456789012.dkr.ecr.ap-south-1.amazonaws.com/eg-cnn-bilstm:app-v1`.
* **Architecture**: x86\_64.
* **Basic settings**:

  * Memory: start with 2048 MB (scale up if slow).
  * Ephemeral `/tmp`: e.g., 4096 MB (bigger files).
  * Timeout: 2–10 min (model load + inference).
* **Env vars** (Configuration → Environment variables):

  * `BUCKET_NAME` = your data bucket (e.g., `eg-cnn-bilstm-<account-id>`)
  * `DEMO_KEY` = `sample_data/sample_eeg.set` (optional)
  * `MODEL_PATH` = `/var/task/model.h5`
  * `CLASS_LABELS` = `Alzheimer,FTD,Control`
  * `TF_CPP_MIN_LOG_LEVEL` = `2`
  * `CUDA_VISIBLE_DEVICES` = `-1`

**IAM role**
Attach:

* `AWSLambdaBasicExecutionRole`
* `AmazonS3ReadOnlyAccess` (or a tight bucket-only policy)

---

## API Gateway (HTTP API)

Create an HTTP API with **ANY /{proxy+}** integration to your Lambda.
CORS must allow your S3 site origin **and** the headers you use:

* **Allowed origins**: your S3 static site / CF domain (e.g., `https://my-site.s3-website-...`).
* **Allowed headers**: `Content-Type,Authorization,Accept,Origin,x-requested-with`
* **Allowed methods**: `GET,POST,OPTIONS`

**Test events (Lambda Console)**

**/health**

```json
{
  "version": "2.0",
  "routeKey": "GET /health",
  "rawPath": "/health",
  "requestContext": { "http": { "method": "GET" } }
}
```

**/predict (demo)**

```json
{
  "version": "2.0",
  "routeKey": "POST /predict",
  "rawPath": "/predict",
  "requestContext": { "http": { "method": "POST" } },
  "body": "{\"demo\": true}",
  "isBase64Encoded": false
}
```

---

## Deploying the frontend (S3 static website)

1. Create a **public website bucket** (e.g., `eg-cnn-bilstm-site-<account-id>`).
2. Enable **Static website hosting** for the bucket (Properties → Static website hosting).
3. Upload `frontend/index.html`, `app.js`, `style.css`.
4. In **app.js**, set:

   ```js
   const apiUrl = "https://<api-id>.execute-api.<region>.amazonaws.com";
   const bucketName = "<your-data-bucket-name>"; // used by /presign
   ```
5. **Bucket CORS** for the website bucket (allow GET of site assets).
   For the **data bucket** (the one that receives uploads), allow:

   * `PUT` from your site origin (for presigned PUT uploads).
   * `GET` for Lambda to read (or Lambda’s IAM handles this; browser only needs PUT).

**Typical data bucket CORS**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT","GET","HEAD"],
    "AllowedOrigins": ["https://eg-cnn-bilstm-site-<account-id>.s3.<region>.amazonaws.com"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Endpoints

* `GET /health` → `{"status":"ok"}`
* `GET /presign?key=uploads/filename.set` → `{ uploadUrl, key }`

  * Use that `uploadUrl` with a **PUT** from the browser to upload the `.set` directly to S3.
* `POST /predict`

  * **Demo**: `{ "demo": true }`
  * **Uploaded file**: `{ "s3_key": "uploads/filename.set" }`
  * Response:

    ```json
    {
      "predicted_class": "Control",
      "confidence": 0.83,
      "probs": [0.05, 0.12, 0.83],
      "top_index": 2
    }
    ```

---

## Dockerfile notes

We pin TF and friends to avoid Keras 3 / optree build surprises, and we use the Lambda base:

```dockerfile
FROM public.ecr.aws/lambda/python:3.10

ENV TF_CPP_MIN_LOG_LEVEL=2 \
    CUDA_VISIBLE_DEVICES=-1 \
    PYTHONUNBUFFERED=1

# Or use requirements.txt if you prefer
RUN pip install --no-cache-dir \
    tensorflow==2.15.0 \
    h5py==3.10.0 \
    mne==1.6.1 \
    Flask==3.1.0 \
    serverless-wsgi==3.0.3 \
    boto3

WORKDIR /var/task
COPY model/alzheimer_eeg_cnn_bilstm_model.h5 /var/task/model.h5
COPY preprocess.py lambda_function.py ./

CMD ["lambda_function.lambda_handler"]
```

> If you **must** use `buildx`, push a single image (not an index):
>
> ```bash
> docker buildx build --platform linux/amd64 -f Dockerfile.dockerfile \
>   --output type=image,name="$ECR:app-v2",push=true .
> ```

---

## Troubleshooting

* **Lambda says:** *“image manifest… not supported”*
  Your ECR tag points to an **Image Index**. Rebuild with classic builder (`$env:DOCKER_BUILDKIT=0`) and push again. Verify `imageManifestMediaType` is a **single image** type.
* **CORS errors in the browser**

  * API Gateway CORS must allow your site origin and headers.
  * **Data S3 bucket** must allow `PUT` from your site origin for **presigned uploads**.
* **Timeouts**
  Increase Lambda **memory**, **ephemeral storage**, and **timeout**. Warm starts help.
* **Model not found**
  Ensure the Dockerfile copies the `.h5` to `/var/task/model.h5` and `MODEL_PATH` matches.
* **.fdt companion file**
  Some `.set` files need a `.fdt`. Extend `lambda_function.py` to download both if needed.

---

## License

See [LICENSE](./LICENSE).

---

## Acknowledgements

* Built with Keras / TensorFlow.
* Deployed on AWS Lambda (container image), API Gateway (HTTP API), and S3 static hosting.

If you use this repo, a ⭐ helps others find it!
