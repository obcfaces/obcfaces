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
  console.log("App: Window size:", typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : 'SSR');
  
  try {
    return (
      <div className="min-h-screen w-full">
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthCallbackHandler />
                <TopBar />
                <main className="w-full">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/contest" element={<Contest />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/u/:id" element={<Profile />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </HelmetProvider>
      </div>
    );
  } catch (error) {
    console.error("App: Error in render:", error);
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-red-100">
        <div className="text-center p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Ошибка приложения</h1>
          <p className="text-red-700">Произошла ошибка при загрузке приложения</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }
};

export default App;
