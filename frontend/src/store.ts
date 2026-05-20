import { configureStore } from '@reduxjs/toolkit';
import { eegApiSlice } from './api/eegApiSlice';

export const store = configureStore({
  reducer: {
    [eegApiSlice.reducerPath]: eegApiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(eegApiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
