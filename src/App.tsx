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
const QuizResult = React.lazy(() => import("./pages/QuizResult"));
const Quiz = React.lazy(() => import("./pages/Quiz"));
const Leaderboard = React.lazy(() => import("./pages/Leaderboard"));
const ManageSubscription = React.lazy(() => import("./pages/ManageSubscription"));
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

const LegacyNewsRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/threat-intel${location.search}${location.hash}`} replace />;
};

const App = () => {
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
                <Analytics />
                <PageTransition>
                  <React.Suspense fallback={<main className="min-h-screen grid place-items-center" aria-busy="true"><span className="text-muted-foreground">Loading…</span></main>}>
                    <Routes>
                    <Route path="/" element={<><MetaTags /><Index /></>} />
                    <Route path="/category/:categoryId" element={<><MetaTags /><CategoryDetail /></>} />
                    <Route path="/threat-intel" element={<><MetaTags /><News /></>} />
                    <Route path="/threat-intel/:articleId" element={<><MetaTags /><News /></>} />
                    <Route path="/news" element={<LegacyNewsRedirect />} />
                    <Route path="/share" element={<><MetaTags /><Share /></>} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/quiz-result" element={<QuizResult />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/about" element={<><MetaTags /><About /></>} />
                    <Route path="/license" element={<><MetaTags /><License /></>} />
                    <Route path="/tools" element={<><MetaTags /><Tools /></>} />
                    <Route path="/articles" element={<><MetaTags /><Articles /></>} />
                    <Route path="/articles/:slug" element={<><MetaTags /><ArticleDetail /></>} />
                    <Route path="/links" element={<><MetaTags /><Links /></>} />
                    <Route path="/contact" element={<><MetaTags /><Contact /></>} />
                    <Route path="/support" element={<><MetaTags /><Support /></>} />
                    <Route path="/services" element={<><MetaTags /><Services /></>} />
                    <Route path="/services/opsec-consulting" element={<><MetaTags /><OpsecConsulting /></>} />
                    <Route path="/services/full-stack-review" element={<><MetaTags /><FullStackReview /></>} />
                    <Route path="/manage-subscription" element={<ManageSubscription />} />
                    <Route path="/unsubscribe" element={<ManageSubscription />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    {/* Retired 2025 pitch deck: preserve old links without serving stale claims. */}
                    <Route path="/present" element={<Navigate to="/about" replace />} />
                    {/* Admin routes - private, not in navigation */}
                    <Route path="/admin" element={<AdminLogin />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/admin/cron" element={<CronMonitor />} />
                    <Route path="/admin/api-keys" element={<AdminApiKeys />} />
                    <Route path="*" element={<><MetaTags /><NotFound /></>} />
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
