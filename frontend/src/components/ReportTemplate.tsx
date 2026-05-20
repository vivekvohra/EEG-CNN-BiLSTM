import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from "recharts";
import type { PredictResponse } from "../types";
import { getInsight } from "../utils/insights";

export const ReportTemplate = React.forwardRef<
  HTMLDivElement,
  { result: PredictResponse; patientName: string; selectedFile: File | null }
>(({ result, patientName, selectedFile }, ref) => {
  const data = [
    { subject: "Alzheimer's", probability: Number((result.probs[0] * 100).toFixed(1)), fullMark: 100 },
    { subject: "FTD", probability: Number((result.probs[1] * 100).toFixed(1)), fullMark: 100 },
    { subject: "Healthy Control", probability: Number((result.probs[2] * 100).toFixed(1)), fullMark: 100 },
  ];

  const insightHtml = getInsight(result.predicted_class);

  return (
    <div ref={ref} className="pdf-report-container">
      <div className="pdf-header">
        <div className="pdf-logo">IPlusFlow Research</div>
        <h1 className="pdf-title">Clinical Neuro-Analysis Report</h1>
      </div>

      <div className="pdf-metadata">
        <div className="pdf-meta-col">
          <strong>Patient / Reference ID:</strong>
          <span>{patientName || selectedFile?.name || "Anonymous Patient"}</span>
        </div>
        <div className="pdf-meta-col">
          <strong>Date of Analysis:</strong>
          <span>{new Date().toLocaleString()}</span>
        </div>
        <div className="pdf-meta-col">
          <strong>Diagnostic Model:</strong>
          <span>CNN-BiLSTM (19-Channel)</span>
        </div>
      </div>

      <div className="pdf-body">
        <div className="pdf-primary-result">
          <h3>Primary Classification</h3>
          <div className="pdf-diagnosis">{result.predicted_class}</div>
        </div>

        <div className="pdf-charts-container">
          <div className="pdf-radar-chart">
            <RadarChart width={300} height={250} cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 13, fontWeight: 600 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip />
              <Radar
                name="Probability"
                dataKey="probability"
                stroke="#00d1e0"
                fill="#00d1e0"
                fillOpacity={0.4}
              />
            </RadarChart>
          </div>

          <div className="pdf-bar-charts">
            {data.map((d) => (
              <div key={d.subject} className="pdf-bar-row">
                <div className="pdf-bar-label">
                  <span>{d.subject}</span>
                  <strong>{d.probability}%</strong>
                </div>
                <div className="pdf-bar-bg">
                  <div
                    className="pdf-bar-fill"
                    style={{
                      width: `${d.probability}%`,
                      backgroundColor: d.probability > 50 ? "#10b981" : "#00d1e0",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pdf-explainability">
          <h3>AI Analysis Insights</h3>
          <div dangerouslySetInnerHTML={{ __html: insightHtml }} />
        </div>
        
        <div className="pdf-footer">
          <p><strong>DISCLAIMER:</strong> This AI-generated report is for research and demonstration purposes only. It does not replace a formal medical diagnosis. Always consult a qualified neurologist or healthcare professional.</p>
        </div>
      </div>
    </div>
  );
});
