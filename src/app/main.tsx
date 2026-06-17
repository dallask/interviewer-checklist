import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrap } from '../storage/bootstrap.js';
import { registerLifecycleListeners } from '../storage/lifecycle.js';
import { App } from './App.tsx';

const rootEl = document.getElementById('root');
if (rootEl === null) {
  throw new Error('Root element not found');
}

// Await migration pipeline before mounting — STORE-03
const _initialState = await bootstrap();
registerLifecycleListeners();
// TODO Phase 4: pass _initialState to Zustand store hydration

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
