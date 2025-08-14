import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx loading, window size:', window.innerWidth, 'x', window.innerHeight);
console.log('User agent:', navigator.userAgent);

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error, e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
