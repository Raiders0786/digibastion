import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "./components/ThemeProvider";
import { PageTransition } from "./components/PageTransition";
import { MetaTags } from "./components/MetaTags";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { SecurityStateProvider } from "./hooks/useSecurityState";

const Index = React.lazy(() => import("./pages/Index"));
const CategoryDetail = React.lazy(() => import("./pages/CategoryDetail"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Share = React.lazy(() => import("./pages/Share"));
const About = React.lazy(() => import("./pages/About"));
const License = React.lazy(() => import("./pages/License"));
const Tools = React.lazy(() => import("./pages/Tools"));
const Articles = React.lazy(() => import("./pages/Articles"));
const ArticleDetail = React.lazy(() => import("./pages/ArticleDetail"));
const Links = React.lazy(() => import("./pages/Links"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Support = React.lazy(() => import("./pages/Support"));
const News = React.lazy(() => import("./pages/News"));
const ThreatIntelMethodology = React.lazy(() => import("./pages/ThreatIntelMethodology"));
const WeeklyNewsletter = React.lazy(() => import("./pages/WeeklyNewsletter"));
const WeeklyArchive = React.lazy(() => import("./pages/WeeklyArchive"));
const Faq = React.lazy(() => import("./pages/Faq"));
const QuizResult = React.lazy(() => import("./pages/QuizResult"));
const Quiz = React.lazy(() => import("./pages/Quiz"));
const Leaderboard = React.lazy(() => import("./pages/Leaderboard"));
const ManageSubscription = React.lazy(() => import("./pages/ManageSubscription"));
const Unsubscribe = React.lazy(() => import("./pages/Unsubscribe"));
const VerifyEmail = React.lazy(() => import("./pages/VerifyEmail"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin"));
const AdminAnalytics = React.lazy(() => import("./pages/AdminAnalytics"));
const CronMonitor = React.lazy(() => import("./pages/CronMonitor"));
const AdminApiKeys = React.lazy(() => import("./pages/AdminApiKeys"));
const Services = React.lazy(() => import("./pages/Services"));
const OpsecConsulting = React.lazy(() => import("./pages/services/OpsecConsulting"));
const FullStackReview = React.lazy(() => import("./pages/services/FullStackReview"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Admin pages render no MetaTags of their own; keep them out of every index.
const AdminMeta = () => <MetaTags robots="noindex,nofollow" title="Admin | Digibastion" />;

const LegacyNewsRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/threat-intel${location.search}${location.hash}`} replace />;
};

const App = () => {
  const shouldLoadVercelAnalytics = typeof window !== 'undefined'
    && window.location.hostname.endsWith('.vercel.app');

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <SecurityStateProvider>
                <TooltipProvider>
                <Toaster />
                <Sonner />
                {shouldLoadVercelAnalytics && <Analytics />}
                <PageTransition>
                  <React.Suspense fallback={<main className="min-h-screen grid place-items-center" aria-busy="true"><span className="text-muted-foreground">Loading…</span></main>}>
                    <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/category/:categoryId" element={<CategoryDetail />} />
                    <Route path="/threat-intel" element={<News />} />
                    {/* Keep before :articleId so "methodology" is never read as an article id. */}
                    <Route path="/threat-intel/methodology" element={<ThreatIntelMethodology />} />
                    {/* Keep the archive before :weekStart and :articleId so "weekly" is never read as an id. */}
                    <Route path="/threat-intel/weekly" element={<WeeklyArchive />} />
                    <Route path="/threat-intel/weekly/:weekStart" element={<WeeklyNewsletter />} />
                    <Route path="/threat-intel/:articleId" element={<News />} />
                    <Route path="/news" element={<LegacyNewsRedirect />} />
                    <Route path="/share" element={<Share />} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/quiz-result" element={<QuizResult />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/faq" element={<Faq />} />
                    <Route path="/license" element={<License />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/articles" element={<Articles />} />
                    <Route path="/articles/:slug" element={<ArticleDetail />} />
                    <Route path="/links" element={<Links />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/services/opsec-consulting" element={<OpsecConsulting />} />
                    <Route path="/services/full-stack-review" element={<FullStackReview />} />
                    <Route path="/manage-subscription" element={<ManageSubscription />} />
                    <Route path="/unsubscribe" element={<Unsubscribe />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    {/* Retired 2025 pitch deck: preserve old links without serving stale claims. */}
                    <Route path="/present" element={<Navigate to="/about" replace />} />
                    {/* Admin routes - private, not in navigation */}
                    <Route path="/admin" element={<><AdminMeta /><AdminLogin /></>} />
                    <Route path="/admin/analytics" element={<><AdminMeta /><AdminAnalytics /></>} />
                    <Route path="/admin/cron" element={<><AdminMeta /><CronMonitor /></>} />
                    <Route path="/admin/api-keys" element={<><AdminMeta /><AdminApiKeys /></>} />
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                  </React.Suspense>
                </PageTransition>
                <MobileBottomNav />
                <OfflineIndicator />
                </TooltipProvider>
              </SecurityStateProvider>
            </QueryClientProvider>
          </BrowserRouter>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

export default App;
