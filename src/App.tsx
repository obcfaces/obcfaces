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
import MobileSafeTopBar from "@/components/mobile-safe-top-bar";


const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendering");
  console.log("Window dimensions:", typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : 'SSR');
  
  return (
    <div className="min-h-screen w-full">
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>
              <MobileSafeTopBar />
              
              <main className="w-full">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallbackHandler />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/contest" element={<Contest />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </div>
  );
};

export default App;
