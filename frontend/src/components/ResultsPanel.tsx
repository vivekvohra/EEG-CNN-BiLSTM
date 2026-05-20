import { useEffect, useMemo, useRef, useState } from "react";
import type { PredictResponse } from "../types";
import { getInsight } from "../utils/insights";
import { ProbabilityBar } from "./ProbabilityBar";
import { useReactToPrint } from "react-to-print";
import { ReportTemplate } from "./ReportTemplate";

export function ResultsPanel({ result, patientName, selectedFile }: { result: PredictResponse; patientName: string; selectedFile: File | null }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [percents, setPercents] = useState([0, 0, 0]);
  const [active, setActive] = useState([false, false, false]);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Neuro_Report_${patientName || selectedFile?.name || "Patient"}`,
  });

  const insightHtml = useMemo(() => getInsight(result.predicted_class), [result.predicted_class]);

  useEffect(() => {
    // reset
    setPercents([0, 0, 0]);
    setActive([false, false, false]);

    const timeouts: number[] = [];
    (result.probs || []).forEach((p, i) => {
      const pct = Number((p * 100).toFixed(1));
      const id = window.setTimeout(() => {
        setPercents((prev) => {
          const next = [...prev];
          next[i] = pct;
          return next as [number, number, number];
        });
        setActive((prev) => {
          const next = [...prev];
          next[i] = p > 0.5;
          return next as [boolean, boolean, boolean];
        });
      }, 100 * i);
      timeouts.push(id);
    });

    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    return () => timeouts.forEach(window.clearTimeout);
  }, [result]);

  return (
    <div className="result-box" ref={ref}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <span className="muted small">Primary Classification</span>
        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent)" }}>
          {result.predicted_class}
        </div>
      </div>

      <ProbabilityBar label="Alzheimer's" percent={percents[0]} active={active[0]} />
      <ProbabilityBar label="FTD (Frontotemporal)" percent={percents[1]} active={active[1]} />
      <ProbabilityBar label="Healthy Control" percent={percents[2]} active={active[2]} />

      <div className="explainability">
        <span className="explain-title">Analysis Insights</span>
        <p dangerouslySetInnerHTML={{ __html: insightHtml }} />
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button className="btn" onClick={() => handlePrint()}>
          <i className="fas fa-file-pdf" style={{ marginRight: "8px" }} />
          Download Clinical Report (PDF)
        </button>
      </div>

      <div style={{ display: "none" }}>
        <ReportTemplate
          ref={reportRef}
          result={result}
          patientName={patientName}
          selectedFile={selectedFile}
        />
      </div>
    </div>
  );
}