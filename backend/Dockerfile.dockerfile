# Use an official AWS Lambda Python 3.10 base image
FROM public.ecr.aws/lambda/python:3.10

# Set environment variables for cleaner logs
ENV TF_CPP_MIN_LOG_LEVEL=2 \
    CUDA_VISIBLE_DEVICES=-1 \
    PYTHONUNBUFFERED=1

# Install all necessary Python packages
RUN pip install --no-cache-dir \
    tensorflow==2.15.0 \
    h5py==3.10.0 \
    mne==1.6.1 \
    Flask==3.1.0 \
    serverless-wsgi==3.0.3 \
    boto3

# Copy your application files into the container
WORKDIR /var/task
COPY alzheimer_eeg_cnn_bilstm_model.h5 /var/task/model.h5
COPY preprocess.py /var/task/preprocess.py
COPY lambda_function.py /var/task/lambda_function.py

# Set the command for the Lambda handler
CMD ["lambda_function.lambda_handler"]