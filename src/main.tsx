import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Starting app render');
console.log('Main.tsx: Window dimensions:', { width: window.innerWidth, height: window.innerHeight });

try {
  const root = document.getElementById("root");
  if (!root) {
    console.error('Main.tsx: Root element not found!');
    throw new Error('Root element not found');
  }
  
  console.log('Main.tsx: Root element found, creating React root');
  createRoot(root).render(<App />);
  console.log('Main.tsx: App rendered successfully');
} catch (error) {
  console.error('Main.tsx: Error rendering app:', error);
}
