import type { PredictedClass } from "../types";

const INSIGHTS: Record<string, string> = {
  Alzheimer:
    'CNN spatial filters identified significant power slowing in the <strong>Theta band</strong> (4-8Hz). These markers are frequently associated with cognitive decline in cortical regions.',
  FTD:
    "Analysis shows localized anomalies in frontal lead clusters. Temporal BiLSTM patterns indicate disruptions in anterior signal synchronization.",
  Control:
    "Signal distribution across Delta, Alpha, and Beta bands remains within the normalized clinical baseline for healthy neural activity.",
};

export function getInsight(predicted: PredictedClass) {
  return INSIGHTS[predicted] ?? "Processing neural biomarkers...";
}
``