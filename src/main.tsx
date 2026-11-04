import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ToastProvider } from './components/Toast';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Elemento raiz não encontrado.');
}

createRoot(container).render(
  <StrictMode>
    <AppErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
