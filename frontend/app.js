/* -------- Configuration --------
   Set your API base (Lambda URL / API Gateway base).
   You can also pass ?api=https://... to override via query param for quick tests.
*/
const DEFAULT_API_BASE = "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com"; // no trailing slash
const API_BASE = new URLSearchParams(location.search).get("api") || DEFAULT_API_BASE;

// Optional: prefix for uploads in your bucket (Lambda's /presign returns key back)
const UPLOAD_PREFIX = "uploads";

/* ------- UI Elements ------- */
const elFile = document.getElementById("fileInput");
const elUpload = document.getElementById("btnUpload");
const elDemo = document.getElementById("btnDemo");
const elStatus = document.getElementById("status");
const elResult = document.getElementById("result");
const elPredClass = document.getElementById("predClass");
const elPredConf = document.getElementById("predConf");
const elPredProbs = document.getElementById("predProbs");
const elRawJson = document.getElementById("rawJson");

/* ------- Helpers ------- */
function setStatus(msg, type = "") {
  elStatus.textContent = msg;
  elStatus.className = `status ${type}`;
}
function showResult(json) {
  elResult.style.display = "block";
  elPredClass.textContent = json.predicted_class ?? "-";
  elPredConf.textContent = json.confidence != null ? `${(json.confidence * 100).toFixed(2)}%` : "-";
  elPredProbs.textContent = Array.isArray(json.probs)
    ? `[${json.probs.map(p => (p*100).toFixed(1) + "%").join(", ")}]`
    : "-";
  elRawJson.textContent = JSON.stringify(json, null, 2);
}
function ext(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}
function uniqueKeyFor(filename) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${UPLOAD_PREFIX}/${stamp}-${rand}-${safe}`;
}

/* ------- API Calls ------- */
async function getPresignedUrl(key, contentType = "application/octet-stream") {
  const url = `${API_BASE}/presign?key=${encodeURIComponent(key)}&content_type=${encodeURIComponent(contentType)}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Presign failed: ${res.status}`);
  const data = await res.json();
  if (!data.uploadUrl) throw new Error("No uploadUrl in response");
  return data;
}
async function uploadToS3(presignedUrl, file, contentType = "application/octet-stream") {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file
  });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
}
async function requestPredictionByKey(s3Key) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ s3_key: s3Key })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Predict failed: ${res.status}`);
  return data;
}
async function requestDemoPrediction() {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demo: true })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Predict failed: ${res.status}`);
  return data;
}

/* ------- Event Handlers ------- */
elUpload.addEventListener("click", async () => {
  try {
    elResult.style.display = "none";
    const file = elFile.files?.[0];
    if (!file) {
      setStatus("Please choose a .set file first.", "err");
      return;
    }
    if (ext(file.name) !== ".set") {
      setStatus("Only .set files are allowed.", "err");
      return;
    }

    elUpload.disabled = true;
    elDemo.disabled = true;
    setStatus("Requesting upload URL…");

    const key = uniqueKeyFor(file.name);
    const { uploadUrl, key: confirmedKey } = await getPresignedUrl(key);

    setStatus("Uploading to S3…");
    await uploadToS3(uploadUrl, file);

    setStatus("Running prediction…");
    const result = await requestPredictionByKey(confirmedKey);

    setStatus("Done ✔", "ok");
    showResult(result);
  } catch (err) {
    console.error(err);
    setStatus(String(err.message || err), "err");
  } finally {
    elUpload.disabled = false;
    elDemo.disabled = false;
  }
});

elDemo.addEventListener("click", async () => {
  try {
    elResult.style.display = "none";
    elUpload.disabled = true;
    elDemo.disabled = true;
    setStatus("Running demo (Lambda)…");
    const result = await requestDemoPrediction();
    setStatus("Done ✔", "ok");
    showResult(result);
  } catch (err) {
    console.error(err);
    setStatus(String(err.message || err), "err");
  } finally {
    elUpload.disabled = false;
    elDemo.disabled = false;
  }
});

/* ------- Quick health check (optional) ------- */
(async function ping() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return; // silent success
  } catch {}
})();
