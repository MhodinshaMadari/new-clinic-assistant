import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept third-party stylesheet/styled-components errors to protect SPA lifecycle
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = String(event?.message || '');
    if (msg.includes('styled-components') || msg.includes('CSSStyleSheet') || msg.includes('errors.md#17')) {
      event.preventDefault();
      console.warn('[Global Guard] Handled styled-components stylesheet collision notice.');
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event?.reason?.message || event?.reason || '');
    if (reason.includes('styled-components') || reason.includes('CSSStyleSheet') || reason.includes('errors.md#17')) {
      event.preventDefault();
      console.warn('[Global Guard] Handled styled-components rejection notice.');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
