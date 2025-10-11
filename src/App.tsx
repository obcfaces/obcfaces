import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import AuthCallbackHandler from "@/features/auth/components/AuthCallbackHandler";
import TopBar from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SocialWidgets } from "@/components/social-widgets";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CookieConsent } from "@/components/cookie-consent";
import { ReferralBanner } from "@/components/referral-banner";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";

// Lazy load heavy pages that aren't needed initially
const Admin = lazy(() => import("./features/admin/pages/AdminPage"));
const Contest = lazy(() => import("./features/contest/pages/ContestPage"));
const Profile = lazy(() => import("./features/profile/pages/ProfilePage"));
const Messages = lazy(() => import("./features/messages/pages/MessagesPage"));
const Likes = lazy(() => import("./features/profile/pages/LikesPage"));
const Account = lazy(() => import("./features/profile/pages/AccountPage"));
const Auth = lazy(() => import("./features/auth/pages/AuthPage"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const ResetPassword = lazy(() => import("./features/auth/pages/ResetPasswordPage"));
const TestTransition = lazy(() => import("./pages/TestTransition"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Redirect components for routing
function CountryRedirect() {
  const { cc } = useParams();
  const savedLang = localStorage.getItem("ui_lang") || "en";
  return <Navigate to={`/${savedLang}-${cc}`} replace />;
}

function LegacyContestRedirect() {
  const savedLang = localStorage.getItem("ui_lang") || "en";
  const savedCc = localStorage.getItem("ui_cc") || "ph";
  return <Navigate to={`/${savedLang}-${savedCc}/contest`} replace />;
}

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
                    
                    {/* Legacy redirect for /contest */}
                    <Route path="/contest" element={<LegacyContestRedirect />} />
                    
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
                    
                    {/* Locale-based contest routes */}
                    <Route path="/:locale" element={<Contest />} />
                    <Route path="/:locale/contest" element={<Contest />} />
                    <Route path="/:locale/contest/:week" element={<Contest />} />
                    
                    {/* Country code redirect (e.g., /ph -> /en-ph) */}
                    <Route path="/:cc" element={<CountryRedirect />} />
                    
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
