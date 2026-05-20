import { useRef, useState } from "react";
import { isValidEegFile } from "../utils/file";

export function UploadCard(props: {
  selectedFile: File | null;
  patientName: string;
  setPatientName: (name: string) => void;
  busy: boolean;
  uploadProgress?: number;
  onSelectFile: (f: File) => void;
  onInvalidFile: () => void;
  onAnalyze: () => void;
  onDemo: () => void;
}) {
  const { selectedFile, patientName, setPatientName, busy, uploadProgress = 0, onSelectFile, onInvalidFile, onAnalyze, onDemo } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => fileInputRef.current?.click();

  const accept = (file: File | null) => {
    if (!file) return;
    if (isValidEegFile(file)) onSelectFile(file);
    else onInvalidFile();
  };

  return (
    <div className="card">
      <div
        className={`drop-zone ${dragOver ? "drag" : ""}`}
        onClick={openPicker}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          accept(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <i className="fas fa-file-upload" style={{ fontSize: "2.5rem", color: "var(--accent)", marginBottom: "1rem" }} />
        <div><strong>Drop Clinical EEG</strong></div>
        <div className="muted small" style={{ marginTop: 8 }}>
          {selectedFile ? (
            <>File Loaded: <strong style={{ color: "var(--accent)" }}>{selectedFile.name}</strong></>
          ) : (
            <>Supports .set (19-Channel)</>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".set"
          style={{ display: "none" }}
          onChange={(e) => accept(e.target.files?.[0] ?? null)}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          className="input-field"
          placeholder="Patient Name or ID (Optional)"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="btn-group">
        <button className="btn" onClick={onAnalyze} disabled={!selectedFile || busy}>
          Start Neuro-Analysis
        </button>
        <button className="btn secondary" onClick={() => {
          if (!patientName) setPatientName("Vivek Vohra (Demo Profile)");
          onDemo();
        }} disabled={busy}>
          Run Quick Demo
        </button>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="upload-progress-container">
          <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
          <span className="upload-progress-text">{uploadProgress}% Uploaded</span>
        </div>
      )}
    </div>
  );
}