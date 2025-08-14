import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from '@/pages/Index';
import Contest from '@/pages/Contest';
import Profile from '@/pages/Profile';
import Account from '@/pages/Account';
import Auth from '@/pages/Auth';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import NotFound from '@/pages/NotFound';
import AuthCallbackHandler from '@/components/auth-callback-handler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Отключаем рефетч на фокус для мобильных
    },
  },
});

const App = () => {
  console.log('[APP] Full app optimized for mobile');
  
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthCallbackHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contest" element={<Contest />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/account" element={<Account />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;