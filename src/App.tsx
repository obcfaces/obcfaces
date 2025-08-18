import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import Contest from "./pages/Contest";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";
import AuthCallbackHandler from "@/components/auth-callback-handler";
import TopBar from "@/components/top-bar";


const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendering");
  console.log("Window dimensions:", typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : 'SSR');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      backgroundColor: '#f0f0f0', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>
        OBC Mobile Test - App Component
      </h1>
      <p style={{ color: '#666', marginBottom: '10px' }}>
        Время: {new Date().toLocaleTimeString()}
      </p>
      <p style={{ color: '#666', marginBottom: '10px' }}>
        Размер экрана: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'SSR'}
      </p>
      
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>
              <div style={{ 
                backgroundColor: '#fff', 
                padding: '20px', 
                borderRadius: '8px',
                marginTop: '20px'
              }}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="*" element={<div>Страница не найдена</div>} />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </div>
  );
};

export default App;
