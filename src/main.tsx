import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Mobile compatibility wrapper
function initializeApp() {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h2>Loading Error</h2>
          <p>Please refresh the page or try a different browser.</p>
          <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
