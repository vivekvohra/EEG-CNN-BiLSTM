# Use an official AWS Lambda Python 3.10 base image
FROM public.ecr.aws/lambda/python:3.10

ENV TF_CPP_MIN_LOG_LEVEL=2 \
    CUDA_VISIBLE_DEVICES=-1 \
    PYTHONUNBUFFERED=1

# Install necessary Python packages for FastAPI and Mangum
RUN pip install --no-cache-dir \
    tensorflow==2.15.0 \
    h5py==3.10.0 \
    mne==1.6.1 \
    fastapi==0.109.0 \
    mangum==0.17.0 \
    uvicorn==0.27.0 \
    pydantic==2.5.3 \
    boto3

WORKDIR /var/task
COPY alzheimer_eeg_cnn_bilstm_model.h5 /var/task/model.h5
COPY preprocess.py /var/task/preprocess.py
COPY lambda_function.py /var/task/lambda_function.py

CMD ["lambda_function.lambda_handler"]
