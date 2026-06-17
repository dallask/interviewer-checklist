import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Difficulty } from '../data/bank/index.js';
import { bootstrap } from '../storage/bootstrap.js';
import { storageAdapter } from '../storage/index.js';
import { registerLifecycleListeners } from '../storage/lifecycle.js';
import type { V2Manifest, V3Session } from '../storage/types.js';
import type { AppState } from '../store/app.js';
import { useAppStore } from '../store/app.js';
import { App } from './App.tsx';

const rootEl = document.getElementById('root');
if (rootEl === null) {
  throw new Error('Root element not found');
}

// Await migration pipeline before mounting — STORE-03
const initialState = await bootstrap();
registerLifecycleListeners();

// Hydrate Zustand store from persisted uiState — Phase 4 (T-04-03-01 mitigation)
// Phase 5: read uiState directly from storage to ensure it reflects the latest
// persisted state (not just the bootstrap return, which focuses on sessions).
const uiStateRaw = await storageAdapter.read(['uiState']);
const uiState = (uiStateRaw.uiState as Partial<AppState> | undefined) ?? {};

// Read activeSessionId from the manifest so the store knows which session is loaded.
const activeSessionId = initialState.manifest.activeSessionId ?? '';

useAppStore.setState({
  ...uiState,
  selectedDifficulties: new Set<Difficulty>(
    (uiState.selectedDifficulties as Difficulty[] | undefined) ?? [],
  ),
  selectedSections: new Set(
    (uiState.selectedSections as string[] | undefined) ?? [],
  ),
  activeSessionId,
});

// Hydrate manifest into store — Phase 6 (SESS-01: reactive session list)
useAppStore.setState({ manifest: initialState.manifest });

// Hydrate scoring state from the active session — Phase 5 (notes/scores/customQuestions persist)
if (activeSessionId) {
  const sessionRaw = await storageAdapter.read([`session:${activeSessionId}`]);
  const session = sessionRaw[`session:${activeSessionId}`] as
    | V3Session
    | undefined;
  if (session) {
    useAppStore.setState({
      scores: session.scores ?? {},
      overrides: session.overrides ?? {},
      notes: session.notes ?? {},
      topicNotes: session.topicNotes ?? {},
      customQuestions: session.customQuestions ?? [],
      candidate: session.candidate ?? null,
    });
  }
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
