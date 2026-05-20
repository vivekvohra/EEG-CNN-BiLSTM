import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { PredictResponse } from '../types';
import { buildS3Key, getPresignedUrl, uploadToS3, predict } from './eegApi';

export const eegApiSlice = createApi({
  reducerPath: 'eegApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://eeg-api.iplusflow.com' }),
  endpoints: (builder) => ({
    runDemoAnalysis: builder.mutation<PredictResponse, void>({
      queryFn: async () => {
        try {
          const data = await predict({ demo: true });
          return { data };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message || 'Demo failed' } };
        }
      },
    }),
    runClinicalAnalysis: builder.mutation<PredictResponse, { file: File; setStatusText: (msg: string, icon: string) => void; onProgress?: (percent: number) => void }>({
      queryFn: async ({ file, setStatusText, onProgress }) => {
        try {
          setStatusText("Step 1/3: Securing upload channel...", "fas fa-spinner fa-spin");
          const s3Key = buildS3Key(file.name);
          const uploadUrl = await getPresignedUrl(s3Key);

          setStatusText("Step 2/3: Uploading clinical data to S3...", "fas fa-arrow-up");
          await uploadToS3(uploadUrl, file, onProgress);

          setStatusText("Step 3/3: Neural Network is analyzing signals...", "fas fa-brain fa-pulse");
          const data = await predict({ s3_key: s3Key });
          
          return { data };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message || 'Diagnostic engine failed.' } };
        }
      },
    }),
  }),
});

export const { useRunDemoAnalysisMutation, useRunClinicalAnalysisMutation } = eegApiSlice;
