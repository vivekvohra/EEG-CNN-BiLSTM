export type PredictedClass = "Alzheimer" | "FTD" | "Control" | string;

export interface PredictResponse {
  predicted_class: PredictedClass;
  probs: number[]; // [alz, ftd, control]
  error?: string;
}

export interface PresignResponse {
  uploadUrl: string;
}