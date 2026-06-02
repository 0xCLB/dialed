import { create } from 'zustand';

type DiagnosticsState = {
  lastAuthError: string | null;
  lastProfileError: string | null;
  lastEntryInsertError: string | null;
  lastStorageUploadError: string | null;
  lastScoringError: string | null;
  lastFoodAnalysisError: string | null;
  lastHealthKitError: string | null;
  lastVerificationMethod: string | null;
  lastScoringTrust: string | null;
  setLastAuthError: (message: string | null) => void;
  setLastProfileError: (message: string | null) => void;
  setLastEntryInsertError: (message: string | null) => void;
  setLastStorageUploadError: (message: string | null) => void;
  setLastScoringError: (message: string | null) => void;
  setLastFoodAnalysisError: (message: string | null) => void;
  setLastHealthKitError: (message: string | null) => void;
  setLastVerificationMethod: (message: string | null) => void;
  setLastScoringTrust: (message: string | null) => void;
};

export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  lastAuthError: null,
  lastProfileError: null,
  lastEntryInsertError: null,
  lastStorageUploadError: null,
  lastScoringError: null,
  lastFoodAnalysisError: null,
  lastHealthKitError: null,
  lastVerificationMethod: null,
  lastScoringTrust: null,
  setLastAuthError: (message) => set({ lastAuthError: message }),
  setLastProfileError: (message) => set({ lastProfileError: message }),
  setLastEntryInsertError: (message) => set({ lastEntryInsertError: message }),
  setLastStorageUploadError: (message) => set({ lastStorageUploadError: message }),
  setLastScoringError: (message) => set({ lastScoringError: message }),
  setLastFoodAnalysisError: (message) => set({ lastFoodAnalysisError: message }),
  setLastHealthKitError: (message) => set({ lastHealthKitError: message }),
  setLastVerificationMethod: (message) => set({ lastVerificationMethod: message }),
  setLastScoringTrust: (message) => set({ lastScoringTrust: message }),
}));

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function noteAuthError(error: unknown) {
  useDiagnosticsStore.getState().setLastAuthError(errorMessage(error, 'Unknown auth error.'));
}

export function clearAuthError() {
  useDiagnosticsStore.getState().setLastAuthError(null);
}

export function noteProfileError(error: unknown) {
  useDiagnosticsStore.getState().setLastProfileError(errorMessage(error, 'Unknown profile error.'));
}

export function clearProfileError() {
  useDiagnosticsStore.getState().setLastProfileError(null);
}

export function noteEntryInsertError(error: unknown) {
  useDiagnosticsStore.getState().setLastEntryInsertError(errorMessage(error, 'Unknown entry error.'));
}

export function clearEntryInsertError() {
  useDiagnosticsStore.getState().setLastEntryInsertError(null);
}

export function noteStorageUploadError(error: unknown) {
  useDiagnosticsStore
    .getState()
    .setLastStorageUploadError(errorMessage(error, 'Unknown storage upload error.'));
}

export function clearStorageUploadError() {
  useDiagnosticsStore.getState().setLastStorageUploadError(null);
}

export function noteScoringError(message: string | null) {
  useDiagnosticsStore.getState().setLastScoringError(message);
}

export function noteFoodAnalysisError(message: string | null) {
  useDiagnosticsStore.getState().setLastFoodAnalysisError(message);
}

export function noteHealthKitError(error: unknown) {
  useDiagnosticsStore
    .getState()
    .setLastHealthKitError(errorMessage(error, 'Unknown HealthKit error.'));
}

export function clearHealthKitError() {
  useDiagnosticsStore.getState().setLastHealthKitError(null);
}

export function noteVerification({
  method,
  trust,
}: {
  method?: string | null;
  trust?: string | number | null;
}) {
  if (method !== undefined) {
    useDiagnosticsStore.getState().setLastVerificationMethod(method);
  }
  if (trust !== undefined) {
    useDiagnosticsStore
      .getState()
      .setLastScoringTrust(trust === null ? null : String(trust));
  }
}
