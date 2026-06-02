import { create } from 'zustand';

type DiagnosticsState = {
  lastEntryInsertError: string | null;
  lastScoringError: string | null;
  setLastEntryInsertError: (message: string | null) => void;
  setLastScoringError: (message: string | null) => void;
};

export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  lastEntryInsertError: null,
  lastScoringError: null,
  setLastEntryInsertError: (message) => set({ lastEntryInsertError: message }),
  setLastScoringError: (message) => set({ lastScoringError: message }),
}));

export function noteEntryInsertError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown entry error.';
  useDiagnosticsStore.getState().setLastEntryInsertError(message);
}

export function clearEntryInsertError() {
  useDiagnosticsStore.getState().setLastEntryInsertError(null);
}

export function noteScoringError(message: string | null) {
  useDiagnosticsStore.getState().setLastScoringError(message);
}
