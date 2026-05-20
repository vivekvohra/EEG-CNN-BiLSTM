# EEG-CNN-BiLSTM: Clinical Brain Signal Classification

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=amazonaws)](https://eeg.iplusflow.com)
[![Portfolio](https://img.shields.io/badge/Portfolio-iplusflow.com-blue?style=for-the-badge)](https://iplusflow.com)

An end-to-end deep learning pipeline that classifies 19-channel clinical EEG (Electroencephalogram) data into three categories: **Alzheimer’s, FTD, or Healthy Control**. This project demonstrates the deployment of a heavy TensorFlow model using a modern, scalable serverless architecture and a React-based frontend.

## 🚀 Live Site: [eeg.iplusflow.com](https://eeg.iplusflow.com)

## 📽️ Demo Video

https://github.com/user-attachments/assets/976c4cbe-4ed3-40fc-9775-333f7b776553

---

## 🏗️ System Architecture
The application is built for high availability and zero idle cost, utilizing a **Serverless Cloud Architecture**:

1.  **Frontend:** A modern **React SPA (Single Page Application)** compiled to static assets, hosted on **AWS S3**, and distributed globally via **AWS CloudFront** (HTTPS).
2.  **API Layer:** **AWS API Gateway** (HTTP API) handles CORS and routes requests to the compute layer.
3.  **Compute:** **AWS Lambda** (running a Docker Container) performs signal preprocessing (MNE-Python) and model inference (TensorFlow) managed by **FastAPI**.
4.  **Storage:** **AWS S3** acts as a staging area for large EEG `.set` files using **Presigned URLs** for secure, direct-to-S3 uploads, bypassing Lambda payload limits.

---

## 🧠 The Model: CNN-BiLSTM
The core is a hybrid neural network designed to extract both spatial features and temporal dependencies from brainwaves across 5 frequency bands (Delta, Theta, Alpha, Beta, Gamma):
* **CNN Layers:** Act as automated feature extractors for spatial patterns across the 19 EEG channels.
* **BiLSTM Layers:** Capture long-term temporal dependencies and cognitive markers in the time-series signal.
* **Framework:** TensorFlow 2.15.0 (Containerized for Lambda).

---

## 📂 Project Structure
```text
.
├── backend/                # Lambda + Docker Container logic
│   ├── lambda_function.py  # Entry point (Flask-WSGI/FastAPI wrapper)
│   ├── preprocess.py       # MNE-Python signal processing & .set loading
│   ├── requirements.txt    # Python dependencies (TF, MNE, FastAPI)
│   └── model/              # Trained Keras (.h5) model
├── frontend/               # React Frontend (SPA)
│   ├── src/                # React components, UI, and API logic
│   ├── package.json        # Node.js dependencies & build scripts
│   └── dist/               # Compiled production build (generated via Vite/Webpack)
├── research/               # Data Science R&D
│   ├── train.ipynb         # Training & Validation notebook
│   └── conference.pdf      # Supporting research paper (TIET)
└── README.md

```

## 🛠️ Local Development & Deployment Workflow

### 1. Frontend (React UI)

To run the React frontend locally or build it for production, you must navigate into the `frontend` directory first.

**Local Development:**

```bash
cd frontend
npm install
npm run dev

```

**Production Build & AWS S3 Deployment:**

```bash
# 1. Compile the React app into static files in the /dist folder
cd frontend
npm run build

# 2. Sync the compiled /dist folder directly to your AWS S3 bucket
aws s3 sync dist/ s3://eeg-site-bucket-name/ --delete

# 3. (Optional) Invalidate CloudFront cache to show updates instantly
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"

```

### 2. Backend (Docker & AWS ECR)

The backend is containerized to bypass AWS Lambda's 250MB layer limit, allowing for a full TensorFlow installation.

```powershell
# 1. Build the production image
$env:DOCKER_BUILDKIT="0"
docker build -f backend/Dockerfile.dockerfile -t eeg-classifier:v1 ./backend

# 2. Authenticate and Push to Amazon ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com"
docker tag eeg-classifier:v1 "$ECR_URL:v1"
docker push "$ECR_URL:v1"

```

---

## 📊 Key Features

* **Modern React UI:** High-contrast, component-based interface utilizing glassmorphism design principles tailored for clinical AI tools.
* **Explainability Engine:** Goes beyond simple classification by translating raw model predictions into interpretable clinical insights (e.g., detecting Theta band power slowing).
* **Animated Probability Visualization:** Dynamic, state-driven CSS bars displaying real-time confidence splits across diagnostic categories.
* **Secure Data Handling:** Uses **S3 Presigned URLs**—user data is uploaded directly to S3, ensuring the Lambda never handles large raw file streams, significantly reducing latency and memory overhead.

---

## 👤 Author

**Vivek Vohra** 🌐 [vivekvohra.com](https://vivekvohra.com) | [iplusflow.com](https://iplusflow.com)

*Disclaimer: This platform uses an architecture trained on clinical OpenNeuro EEG data. It is intended for research demonstration purposes and does not constitute a medical diagnosis.*
