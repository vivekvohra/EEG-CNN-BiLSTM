/* eslint-env browser */

// --- Elements ---
const apiUrlInput = document.getElementById('apiUrl');
const pickBtn = document.getElementById('pickBtn');
const submitBtn = document.getElementById('submitBtn');
const pingBtn = document.getElementById('pingBtn');
const sampleBtn = document.getElementById('sampleBtn');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const dropArea = document.getElementById('dropArea');
const output = document.getElementById('output');
const statusEl = document.getElementById('status');
const errBox = document.getElementById('errBox');
const resultBox = document.getElementById('resultBox');
const predClass = document.getElementById('predClass');
const predConf = document.getElementById('predConf');
const predProbs = document.getElementById('predProbs');
const respWrap = document.getElementById('respWrap');

// --- State ---
let selectedFile = null;
const UPLOAD_PREFIX = "uploads";

// --- UI Helpers ---
function setStatus(msg, spin = false) {
  statusEl.innerHTML = spin ? `<span class="spinner"></span> ${msg}` : msg;
}
function showError(msg) {
  errBox.style.display = 'block';
  errBox.textContent = msg;
}
function clearError() {
  errBox.style.display = 'none';
  errBox.textContent = '';
}


function showResult(json) {
  resultBox.style.display = 'block';
  predClass.textContent = json.predicted_class ?? "N/A";
  predConf.textContent = json.confidence != null ? `${(json.confidence * 100).toFixed(2)}%` : "N/A";
  predProbs.textContent = Array.isArray(json.probs)
    ? `[${json.probs.map(p => (p * 100).toFixed(1) + "%").join(", ")}]`
    : "N/A";
  output.textContent = JSON.stringify(json, null, 2);
  if (!respWrap.open) respWrap.open = true;
}
function resetResult() {
  resultBox.style.display = 'none';
  output.textContent = '{}';
}
function setButtonsDisabled(disabled) {
  submitBtn.disabled = disabled;
  sampleBtn.disabled = disabled;
  pickBtn.disabled = disabled;
}

// --- API Helpers ---
function getApiBase() {
  return apiUrlInput.value.replace(/\/$/, '');
}
function uniqueKeyFor(filename) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${UPLOAD_PREFIX}/${stamp}-${rand}-${safe}`;
}
function ext(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

// --- API Calls ---
async function getPresignedUrl(key) {
  const url = `${getApiBase()}/presign?key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Presign failed: ${res.status}`);
  if (!data.uploadUrl) throw new Error("API did not return an uploadUrl");
  return data;
}


async function uploadToS3(uploadUrl, file) {
  // No headers => no CORS preflight
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    mode: 'cors',
    credentials: 'omit'
  });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
}

async function requestPredictionByKey(s3Key) {
  const res = await fetch(`${getApiBase()}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ s3_key: s3Key })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Predict failed: ${res.status}`);
  return data;
}
async function requestDemoPrediction() {
  const res = await fetch(`${getApiBase()}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demo: true })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Predict failed: ${res.status}`);
  return data;
}

// --- Event Handlers ---

// File Picker
pickBtn.onclick = () => fileInput.click();
fileInput.onchange = () => {
  selectedFile = fileInput.files[0] || null;
  fileName.textContent = selectedFile ? selectedFile.name : 'No file selected';
};

// Drag & Drop
['dragenter', 'dragover'].forEach(ev => dropArea.addEventListener(ev, e => {
  e.preventDefault(); e.stopPropagation(); dropArea.classList.add('drag');
}));
['dragleave', 'drop'].forEach(ev => dropArea.addEventListener(ev, e => {
  e.preventDefault(); e.stopPropagation(); dropArea.classList.remove('drag');
}));
dropArea.addEventListener('drop', e => {
  const f = e.dataTransfer.files?.[0];
  if (f) {
    selectedFile = f;
    fileInput.files = e.dataTransfer.files;
    fileName.textContent = f.name;
  }
});

// Main Submit Button
submitBtn.onclick = async () => {
  clearError();
  resetResult();
  if (!selectedFile) {
    showError('Please choose a .set file first.');
    return;
  }
  if (ext(selectedFile.name) !== ".set") {
    showError("Only .set files are allowed.");
    return;
  }

  setButtonsDisabled(true);
  try {
    setStatus("1/3: Requesting upload URL…", true);
    const key = uniqueKeyFor(selectedFile.name);
    const { uploadUrl, key: confirmedKey } = await getPresignedUrl(key);

    setStatus("2/3: Uploading file to S3…", true);
    await uploadToS3(uploadUrl, selectedFile);

    setStatus("3/3: Running prediction…", true);
    const result = await requestPredictionByKey(confirmedKey);

    showResult(result);
    setStatus('Done ✅');
  } catch (err) {
    console.error(err);
    showError(err.message || 'An unknown error occurred.');
    setStatus('');
  } finally {
    setButtonsDisabled(false);
  }
};

// Demo Button
sampleBtn.onclick = async () => {
  clearError();
  resetResult();
  setButtonsDisabled(true);
  try {
    setStatus("Running demo prediction…", true);
    const result = await requestDemoPrediction();
    showResult(result);
    setStatus('Done ✅');
  } catch (err) {
    console.error(err);
    showError(err.message || 'An unknown error occurred.');
    setStatus('');
  } finally {
    setButtonsDisabled(false);
  }
};

// Health Check Button
pingBtn.onclick = async () => {
  clearError();
  setStatus('Checking API…', true);
  try {
    const r = await fetch(getApiBase() + '/health');
    setStatus(r.ok ? 'API is reachable ✅' : `API check failed (HTTP ${r.status})`);
  } catch (e) {
    setStatus('API not reachable ❌');
  }
};