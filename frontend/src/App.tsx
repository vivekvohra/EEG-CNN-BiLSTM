import { Header } from "./components/Header";
import { UploadCard } from "./components/UploadCard";
import { StatusLine } from "./components/StatusLine";
import { ResultsPanel } from "./components/ResultsPanel";
import { InfoGrid } from "./components/InfoGrid";
import { Footer } from "./components/Footer";
import { useState } from "react";

import { useEngineWarmup } from "./hooks/useEngineWarmup";
import { useEegAnalysis } from "./hooks/useEegAnalysis";

export default function App() {
  const [patientName, setPatientName] = useState("");
  const { status, setStatus } = useEngineWarmup();

  const {
    selectedFile,
    setSelectedFile,
    busy,
    result,
    uploadProgress,
    runRealAnalysis,
    runDemoAnalysis,
  } = useEegAnalysis(status, setStatus);

  return (
    <div className="container">
      <Header />

      <UploadCard
        selectedFile={selectedFile}
        patientName={patientName}
        setPatientName={setPatientName}
        busy={busy}
        uploadProgress={uploadProgress}
        onSelectFile={(f) => setSelectedFile(f)}
        onInvalidFile={() =>
          setStatus({ iconClass: "fas fa-exclamation-triangle", text: "Please upload a valid .set EEG file.", tone: "error" })
        }
        onAnalyze={runRealAnalysis}
        onDemo={runDemoAnalysis}
      />

      <StatusLine status={status} />

      {result ? <ResultsPanel result={result} patientName={patientName} selectedFile={selectedFile} /> : null}

      <InfoGrid />

      <p className="disclaimer">
        <strong>DISCLAIMER:</strong> This tool is for research and demonstration purposes only.
        It does not provide medical diagnosis. Always consult a qualified healthcare professional
        for neurological assessments.
      </p>

      <Footer />
    </div>
  );
}