import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('[MAIN] Starting app initialization...');
console.log('[MAIN] React version:', React.version);

try {
  console.log('[MAIN] Creating root...');
  const rootElement = document.getElementById('root');
  console.log('[MAIN] Root element found:', !!rootElement);
  
  const root = ReactDOM.createRoot(rootElement!);
  console.log('[MAIN] Root created successfully');
  
  console.log('[MAIN] Starting render...');
  root.render(<App />);
  console.log('[MAIN] Render called successfully');
} catch (error) {
  console.error('[MAIN] Error during initialization:', error);
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; color: red; font-family: system-ui;">
      <h2>Loading Error:</h2>
      <p>${String(error)}</p>
    </div>
  `;
}
