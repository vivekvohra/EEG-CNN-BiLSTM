# EEG-CNN-BiLSTM:Brain Signal Classification

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=amazonaws)](https://eeg.iplusflow.com)
[![Portfolio](https://img.shields.io/badge/Portfolio-iplusflow.com-blue?style=for-the-badge)](https://iplusflow.com)

An end-to-end deep learning pipeline that classifies EEG (Electroencephalogram) data into three categories: **Alzheimer’s, FTD, or Healthy Control**. This project demonstrates the deployment of a heavy Keras/TensorFlow model using a modern, scalable serverless architecture.

## 🚀 Live Site: [eeg.iplusflow.com](https://eeg.iplusflow.com)


## 📽️ Demo Video

![Project Demo](https://github.com/user-attachments/assets/1141bf82-997f-40cb-a9b8-2ffe1c7f22f6)
*(Update this link with your new dark-mode screen recording!)*


## 🏗️ System Architecture
The application is built for high availability and zero idle cost, utilizing a **Serverless Cloud Architecture**:

1.  **Frontend:** Optimized JS/CSS hosted on **AWS S3** and distributed globally via **AWS CloudFront** (HTTPS).
2.  **API Layer:** **AWS API Gateway** (HTTP API) handles CORS and routes requests to the compute layer.
3.  **Compute:** **AWS Lambda** (running a Docker Container) performs signal preprocessing (MNE-Python) and model inference (TensorFlow).
4.  **Storage:** **AWS S3** acts as a staging area for large EEG `.set` files using **Presigned URLs** for secure, direct-to-S3 uploads, bypassing Lambda payload limits.



## 🧠 The Model: CNN-BiLSTM
The core is a hybrid neural network designed to extract both spatial features and temporal dependencies from brainwaves:
* **CNN Layers:** Act as automated feature extractors for spatial patterns across EEG channels.
* **BiLSTM Layers:** Capture long-term temporal dependencies in the time-series signal.
* **Framework:** TensorFlow 2.15.0 (Containerized for Lambda).



## 📂 Project Structure
```text
.
├── backend/                # Lambda + Docker Container logic
│   ├── lambda_function.py  # Entry point (Flask-WSGI wrapper)
│   ├── preprocess.py       # MNE-Python signal processing & .set loading
│   ├── requirements.txt    # Python dependencies (TF, MNE, Flask)
│   └── model/              # Trained Keras (.h5) model
├── frontend/               # Optimized Dark-Mode UI
│   ├── index.html          # UI Structure & Canvas
│   ├── app.js              # API Orchestration & Chart.js logic
│   └── style.css           # Custom CSS3 styling
├── research/               # Data Science R&D
│   ├── train.ipynb         # Training & Validation notebook
│   └── conference.pdf      # Supporting research paper
└── README.md

-----
```
## 🛠️ Deployment Workflow

### 1\. Backend (Docker & AWS ECR)

The backend is containerized to bypass AWS Lambda's 250MB layer limit, allowing for a full TensorFlow installation.

```powershell
# 1. Build the production image (Single manifest)
$env:DOCKER_BUILDKIT="0"
docker build -f backend/Dockerfile.dockerfile -t eeg-classifier:v1 ./backend

# 2. Authenticate and Push to Amazon ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com"
docker tag eeg-classifier:v1 "$ECR_URL:v1"
docker push "$ECR_URL:v1"


### 2\. Frontend (S3 + CloudFront)

1.  Update the `apiUrl` in `frontend/app.js` to point to your API Gateway endpoint.
2.  Sync assets to your S3 bucket:

<!-- end list -->

```bash
aws s3 sync frontend/ s3://eeg-site-bucket-name/
```



## 📊 Key Features

  * **Dark Mode UI:** High-contrast, professional interface optimized for data visualization.
  * **Real-time Results:** Dynamic probability distribution charts powered by **Chart.js**.
  * **Secure Data Handling:** Uses **S3 Presigned URLs**—user data is uploaded directly to S3, ensuring the Lambda never handles large raw file streams, significantly reducing latency.
  * **Serverless Scaling:** The system scales to zero when not in use and automatically handles concurrent requests.



## 👤 Author

**Vivek Vohra**
🌐 [iplusflow.com](https://iplusflow.com)


*Disclaimer: This is a research demonstration and is not intended for clinical diagnostic use.*
