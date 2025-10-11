import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from "@sentry/react"
import App from './App.tsx'
import './index.css'

// Initialize Sentry for error tracking
Sentry.init({
  dsn: "https://16eaf8ee6e0c5ba24bda9f31528f9d91@o4510169786220544.ingest.de.sentry.io/4510169792381008",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
})

// Register Service Worker for PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 3600000);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000, // 1 minute
      gcTime: 300000, // 5 minutes
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Sentry.ErrorBoundary fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Произошла ошибка</h1>
        <p className="text-muted-foreground mb-4">Мы уже получили уведомление и работаем над исправлением</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Перезагрузить
        </button>
      </div>
    </div>}>
      <App />
    </Sentry.ErrorBoundary>
  </QueryClientProvider>
);
