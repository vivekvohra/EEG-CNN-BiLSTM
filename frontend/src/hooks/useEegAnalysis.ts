import { useCallback, useState } from "react";
import type { StatusState } from "./useEngineWarmup";
import { useRunClinicalAnalysisMutation, useRunDemoAnalysisMutation } from "../api/eegApiSlice";

export function useEegAnalysis(initialStatus: StatusState, setStatus: (s: StatusState) => void) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [clinicalTrigger, clinicalStatus] = useRunClinicalAnalysisMutation();
  const [demoTrigger, demoStatus] = useRunDemoAnalysisMutation();

  const busy = clinicalStatus.isLoading || demoStatus.isLoading;
  const result = clinicalStatus.data || demoStatus.data || null;

  const clearResult = useCallback(() => {
    clinicalStatus.reset();
    demoStatus.reset();
    setUploadProgress(0);
  }, [clinicalStatus, demoStatus]);

  const runRealAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    setUploadProgress(0);
    try {
      await clinicalTrigger({ 
        file: selectedFile,
        setStatusText: (text: string, iconClass: string) => {
          setStatus({ text, iconClass, tone: "muted" });
        },
        onProgress: setUploadProgress
      }).unwrap();
      
      setStatus({
        iconClass: "fas fa-check-circle",
        text: "Analysis Complete",
        tone: "success",
      });
    } catch (err: any) {
      setStatus({
        iconClass: "fas fa-exclamation-triangle",
        text: `Error: ${err?.error || "Diagnostic engine failed"}`,
        tone: "error",
      });
    }
  }, [selectedFile, setStatus, clinicalTrigger]);

  const runDemoAnalysis = useCallback(async () => {
    setStatus({
      iconClass: "fas fa-brain fa-pulse",
      text: "Loading clinical demo data...",
      tone: "muted",
    });

    try {
      await demoTrigger().unwrap();
      setStatus({
        iconClass: "fas fa-check-circle",
        text: "Demo Analysis Complete",
        tone: "success",
      });
    } catch (err: any) {
      setStatus({
        iconClass: "fas fa-exclamation-triangle",
        text: `Error: ${err?.error || "Demo Failed. Please check API connection."}`,
        tone: "error",
      });
    }
  }, [setStatus, demoTrigger]);

  return {
    selectedFile,
    setSelectedFile,
    busy,
    result,
    uploadProgress,
    clearResult,
    runRealAnalysis,
    runDemoAnalysis,
  };
}