import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Difficulty } from '../data/bank/index.js';
import { bootstrap } from '../storage/bootstrap.js';
import { registerLifecycleListeners } from '../storage/lifecycle.js';
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
const uiState = (initialState as Record<string, unknown>).uiState as
  | Partial<AppState>
  | undefined;
if (uiState) {
  useAppStore.setState({
    ...uiState,
    selectedDifficulties: new Set<Difficulty>(
      (uiState.selectedDifficulties as Difficulty[] | undefined) ?? [],
    ),
    selectedSections: new Set(
      (uiState.selectedSections as string[] | undefined) ?? [],
    ),
  });
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
