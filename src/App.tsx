import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import AuthCallbackHandler from "@/components/auth-callback-handler";
import TopBar from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SocialWidgets } from "@/components/social-widgets";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CookieConsent } from "@/components/cookie-consent";
import { ReferralBanner } from "@/components/referral-banner";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";

// Lazy load heavy pages that aren't needed initially
const Admin = lazy(() => import("./pages/Admin"));
const Contest = lazy(() => import("./features/contest/pages/ContestPage"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Likes = lazy(() => import("./pages/Likes"));
const Account = lazy(() => import("./pages/Account"));
const Auth = lazy(() => import("./pages/Auth"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TestTransition = lazy(() => import("./pages/TestTransition"));
const NotFound = lazy(() => import("./pages/NotFound"));



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
  console.log("App component rendering - with lazy loading optimization");
  
  // Инициализируем fingerprint tracking
  useDeviceFingerprint();
  
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
              <ReferralBanner />
              <TopBar />
              <main className="w-full flex-1">
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    </div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    {/* Legacy /contest route */}
                    <Route path="/contest" element={<Contest />} />
                    {/* Locale-specific contest routes (e.g., /en-ph, /ru-kz) */}
                    <Route path="/:locale" element={<Contest />} />
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
                    <Route path="/test-transition" element={<TestTransition />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
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
