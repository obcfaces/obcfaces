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
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const TestTransition = lazy(() => import("./pages/TestTransition"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Redirect components for routing
function CountryRedirect() {
  const { cc } = useParams();
  const location = useLocation();
  const savedLang = localStorage.getItem("ui_lang") || "en";
  const query = location.search || "";
  
  // Normalize country code to uppercase
  const normalizedCc = cc?.toLowerCase() || "ph";
  
  return <Navigate to={`/${savedLang}-${normalizedCc}${query}`} replace />;
}

function LegacyContestRedirect() {
  const location = useLocation();
  const savedLang = localStorage.getItem("ui_lang") || "en";
  const savedCc = localStorage.getItem("ui_cc") || "ph";
  const query = location.search || "";
  
  return <Navigate to={`/${savedLang}-${savedCc}/contest${query}`} replace />;
}

function LocaleNormalizer() {
  const { locale } = useParams();
  const location = useLocation();
  
  if (!locale) return <Navigate to="/en-ph" replace />;
  
  // Normalize to lowercase
  const normalized = locale.toLowerCase();
  
  // Check if already normalized
  if (locale !== normalized) {
    return <Navigate to={`/${normalized}${location.pathname.substring(locale.length + 1)}${location.search}`} replace />;
  }
  
  // Validate locale format (lang-country)
  const localePattern = /^[a-z]{2}-[a-z]{2}$/;
  if (!localePattern.test(normalized)) {
    return <Navigate to="/en-ph" replace />;
  }
  
  return null;
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
                    {/* Root redirect to default locale */}
                    <Route path="/" element={<Navigate to="/en-ph" replace />} />
                    
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
                    <Route path="/verify" element={<VerifyEmail />} />
                    <Route path="/test-transition" element={<TestTransition />} />
                    
                    {/* Locale-based routes */}
                    <Route path="/:locale" element={<Index />} />
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
