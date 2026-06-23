import { render } from 'preact';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { App } from './app';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// ToastProvider must be outer so AuthContext can call showToast on session expiry
render(
  <ToastProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ToastProvider>,
  document.getElementById('app')
);
