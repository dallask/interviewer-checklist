import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Welcome } from './Welcome.js';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Welcome page: root element not found');
createRoot(root).render(
  <StrictMode>
    <Welcome />
  </StrictMode>,
);
