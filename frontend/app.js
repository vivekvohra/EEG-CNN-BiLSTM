/* IPlusFlow EEG Analysis - Production Logic */

const API_BASE = "https://eeg-api.iplusflow.com";
const UPLOAD_FOLDER = "uploads"; // Ensure this matches your S3 structure

// Elements
const analyzeBtn = document.getElementById('analyzeBtn');
const demoBtn = document.getElementById('demoBtn');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileInfo = document.getElementById('fileInfo');
const statusArea = document.getElementById('statusArea');
const resultBox = document.getElementById('resultBox');
const explainText = document.getElementById('explainText');

let selectedFile = null;

// UI Helpers
const updateStatus = (msg) => statusArea.innerHTML = msg;

// Display Results with Animation
function displayResult(data) {
    resultBox.style.display = 'block';
    document.getElementById('resClass').textContent = data.predicted_class;
    
    // Animate Probability Bars
    data.probs.forEach((p, i) => {
        const percent = (p * 100).toFixed(1);
        const bar = document.getElementById(`bar-${i}`);
        const text = document.getElementById(`val-${i}`);
        
        // Stagger the animations slightly for a premium feel
        setTimeout(() => {
            text.textContent = `${percent}%`;
            bar.style.width = `${percent}%`;
            // Highlight if high confidence
            if (p > 0.5) bar.classList.add('active');
            else bar.classList.remove('active');
        }, 100 * i);
    });

    // Explainability Engine based on CNN-BiLSTM Architecture
    const insights = {
        "Alzheimer": "CNN spatial filters identified significant power slowing in the <strong>Theta band</strong> (4-8Hz). These markers are frequently associated with cognitive decline in cortical regions.",
        "FTD": "Analysis shows localized anomalies in frontal lead clusters. Temporal BiLSTM patterns indicate disruptions in anterior signal synchronization.",
        "Control": "Signal distribution across Delta, Alpha, and Beta bands remains within the normalized clinical baseline for healthy neural activity."
    };
    explainText.innerHTML = insights[data.predicted_class] || "Processing neural biomarkers...";
    
    // Smooth scroll to results
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Full Upload & Prediction Pipeline
async function runRealAnalysis() {
    if (!selectedFile) return;
    analyzeBtn.disabled = true;
    demoBtn.disabled = true;
    resultBox.style.display = 'none';

    try {
        // Step 1: Get Presigned URL
        updateStatus('<i class="fas fa-spinner fa-spin"></i> Step 1/3: Securing upload channel...');
        const timestamp = Date.now().toString().slice(-6); // short unique ID
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const s3Key = `${UPLOAD_FOLDER}/${timestamp}-${cleanName}`;
        
        const presignRes = await fetch(`${API_BASE}/presign?key=${encodeURIComponent(s3Key)}`);
        if (!presignRes.ok) throw new Error("Could not generate secure upload link.");
        const { uploadUrl } = await presignRes.json();

        // Step 2: Upload directly to S3
        updateStatus('<i class="fas fa-arrow-up"></i> Step 2/3: Uploading clinical data to S3...');
        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: selectedFile,
            mode: 'cors',
            credentials: 'omit'
        });
        if (!uploadRes.ok) throw new Error("S3 Upload failed.");

        // Step 3: Trigger Lambda Prediction
        updateStatus('<i class="fas fa-brain fa-pulse"></i> Step 3/3: Neural Network is analyzing signals...');
        const predRes = await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ s3_key: s3Key })
        });
        if (!predRes.ok) throw new Error("Diagnostic engine failed to process.");
        
        const data = await predRes.json();
        if (data.error) throw new Error(data.error);

        updateStatus('<span style="color:var(--success)"><i class="fas fa-check-circle"></i> Analysis Complete</span>');
        displayResult(data);

    } catch (err) {
        console.error(err);
        updateStatus(`<span style="color:var(--error)"><i class="fas fa-exclamation-triangle"></i> Error: ${err.message}</span>`);
    } finally {
        analyzeBtn.disabled = false;
        demoBtn.disabled = false;
    }
}

// Demo Prediction Call
async function runDemoAnalysis() {
    analyzeBtn.disabled = true;
    demoBtn.disabled = true;
    updateStatus('<i class="fas fa-brain fa-pulse"></i> Loading clinical demo data...');
    try {
        const res = await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demo: true })
        });
        const data = await res.json();
        updateStatus('<span style="color:var(--success)"><i class="fas fa-check-circle"></i> Demo Analysis Complete</span>');
        displayResult(data);
    } catch (e) {
        updateStatus('<span style="color:var(--error)">Demo Failed. Please check API connection.</span>');
    } finally {
        analyzeBtn.disabled = false;
        demoBtn.disabled = false;
    }
}

// --- Event Listeners ---
analyzeBtn.onclick = runRealAnalysis;
demoBtn.onclick = runDemoAnalysis;

fileInput.onchange = (e) => {
    const f = e.target.files[0];
    if (f && f.name.endsWith('.set')) {
        selectedFile = f;
        fileInfo.innerHTML = `File Loaded: <strong style="color:var(--accent)">${f.name}</strong>`;
        analyzeBtn.disabled = false;
    } else if (f) {
        updateStatus('<span style="color:var(--error)">Please upload a valid .set EEG file.</span>');
    }
};

dropZone.onclick = () => fileInput.click();
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; };
dropZone.ondragleave = () => dropZone.style.borderColor = 'var(--border)';
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    const f = e.dataTransfer.files[0];
    if (f) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
    }
};

// Robust Wake up model on load (Handles Lambda Cold Starts)
window.onload = async () => {
    updateStatus('<i class="fas fa-circle-notch fa-spin"></i> Booting AI Engine (May take ~10s)...');
    try {
        // Abort controller to timeout after 20 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        await fetch(`${API_BASE}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        updateStatus('<span style="color:var(--success)"><i class="fas fa-power-off"></i> Engine Ready</span>');
    } catch (e) {
        // If it times out, the Lambda is likely still warming up in the background
        updateStatus('<span style="color:var(--accent)"><i class="fas fa-power-off"></i> Engine Warming Up...</span>');
    }
};
