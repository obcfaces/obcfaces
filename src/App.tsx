import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import Contest from "./pages/Contest";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import CookiePolicy from "./pages/CookiePolicy";
import Messages from "./pages/Messages";
import Likes from "./pages/Likes";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import AuthCallbackHandler from "@/components/auth-callback-handler";
import TopBar from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SocialWidgets } from "@/components/social-widgets";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CookieConsent } from "@/components/cookie-consent";



const queryClient = new QueryClient();

const ConditionalSocialWidgets = () => {
  const location = useLocation();
  
  // Don't show social widgets on admin page
  if (location.pathname === '/admin') {
    return null;
  }
  
  return <SocialWidgets />;
};

const App = () => {
  console.log("App component rendering");
  
  return (
    <div className="min-h-screen w-full flex flex-col">
      <HelmetProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthCallbackHandler />
              <TopBar />
              <main className="w-full flex-1">
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
                  <Route path="/cookie-policy" element={<CookiePolicy />} />
                  <Route path="/likes" element={<Likes />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <ConditionalSocialWidgets />
              <CookieConsent />
              
            </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </HelmetProvider>
    </div>
  );
};

export default App;
