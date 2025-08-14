import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error display function
function displayError(error: any) {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; background: #f8f9fa;">
        <h2 style="color: #dc3545; margin-bottom: 20px;">🚨 Loading Error</h2>
        <div style="background: #fff; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px; margin-bottom: 15px;">
          <strong>Error:</strong><br>
          <code style="background: #f8f9fa; padding: 5px; display: block; margin-top: 5px; font-size: 12px; word-break: break-all;">
            ${error.message || error.toString()}
          </code>
        </div>
        <div style="background: #fff; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px; margin-bottom: 15px;">
          <strong>Stack:</strong><br>
          <code style="background: #f8f9fa; padding: 5px; display: block; margin-top: 5px; font-size: 10px; word-break: break-all;">
            ${error.stack || 'No stack trace available'}
          </code>
        </div>
        <div style="background: #fff; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px; margin-bottom: 15px;">
          <strong>Browser:</strong> ${navigator.userAgent}<br>
          <strong>URL:</strong> ${window.location.href}<br>
          <strong>Time:</strong> ${new Date().toISOString()}
        </div>
        <button onclick="location.reload()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          🔄 Refresh Page
        </button>
      </div>
    `;
  }
}

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  displayError(event.error || new Error(event.message));
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  displayError(new Error(`Promise rejection: ${event.reason}`));
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found in DOM');
  }

  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Rendering App...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App rendered successfully');
  
} catch (error) {
  console.error('Failed to initialize React app:', error);
  displayError(error);
}
