import type { PredictResponse, PresignResponse } from "../types";

const API_BASE = "https://eeg-api.iplusflow.com";
const UPLOAD_FOLDER = "uploads";

export function buildS3Key(fileName: string) {
  const timestamp = Date.now().toString().slice(-6);
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${UPLOAD_FOLDER}/${timestamp}-${cleanName}`;
}

export async function healthCheck(signal?: AbortSignal) {
  await fetch(`${API_BASE}/health`, { signal });
}

export async function getPresignedUrl(s3Key: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/presign?key=${encodeURIComponent(s3Key)}`);
    if (!res.ok) throw new Error("Could not generate secure upload link.");
    const data = (await res.json()) as PresignResponse;
    return data.uploadUrl;
  } catch (err: any) {
    if (err.name === 'TypeError') throw new Error("Network connection lost. Please check your Wi-Fi.");
    throw err;
  }
}

export function uploadToS3(uploadUrl: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network connection lost during upload. Please check your Wi-Fi."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted."));
    });

    xhr.open("PUT", uploadUrl, true);
    xhr.send(file);
  });
}

export async function predict(payload: { s3_key?: string; demo?: boolean }): Promise<PredictResponse> {
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Diagnostic engine failed to process.");
    const data = (await res.json()) as PredictResponse;
    if ((data as any).error) throw new Error((data as any).error);
    return data;
  } catch (err: any) {
    if (err.name === 'TypeError') throw new Error("Network connection lost. Please check your Wi-Fi.");
    throw err;
  }
}