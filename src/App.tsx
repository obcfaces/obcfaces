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
import AuthCallbackHandler from "@/components/auth-callback-handler";
import TopBar from "@/components/top-bar";


const queryClient = new QueryClient();

const App = () => {
  console.log('[APP] App component rendering...');
  
  // Simple test without complex providers
  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px', 
      fontFamily: 'system-ui',
      backgroundColor: '#f0f0f0'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        OBC Faces of Philippines
      </h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Mobile app test - React is working!
      </p>
      <button 
        onClick={() => {
          alert('Button works!');
          console.log('Button clicked on mobile');
        }}
        style={{
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
        User Agent: {navigator.userAgent}
      </div>
    </div>
  );
};

export default App;
