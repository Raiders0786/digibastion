import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "./components/ThemeProvider";
import { PageTransition } from "./components/PageTransition";
import { MetaTags } from "./components/MetaTags";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { FloatingActionButton } from "./components/mobile/FloatingActionButton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import Index from "./pages/Index";
import CategoryDetail from "./pages/CategoryDetail";
import NotFound from "./pages/NotFound";
import Share from "./pages/Share";
import About from "./pages/About";
import License from "./pages/License";
import Tools from "./pages/Tools";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import Links from "./pages/Links";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import News from "./pages/News";
import QuizResult from "./pages/QuizResult";
import Quiz from "./pages/Quiz";
import Leaderboard from "./pages/Leaderboard";
import ManageSubscription from "./pages/ManageSubscription";
import VerifyEmail from "./pages/VerifyEmail";
import AdminLogin from "./pages/AdminLogin";
import AdminAnalytics from "./pages/AdminAnalytics";
import CronMonitor from "./pages/CronMonitor";
import Present from "./pages/Present";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Analytics />
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<><MetaTags /><Index /></>} />
                    <Route path="/category/:categoryId" element={<><MetaTags /><CategoryDetail /></>} />
                    <Route path="/threat-intel" element={<><MetaTags /><News /></>} />
                    <Route path="/news" element={<><MetaTags /><News /></>} /> {/* Legacy redirect */}
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
                    <Route path="/manage-subscription" element={<ManageSubscription />} />
                    <Route path="/unsubscribe" element={<ManageSubscription />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    {/* Utility routes - private, not in navigation */}
                    <Route path="/present" element={<><MetaTags title="DigiBastion — Secure the Stack | Partnership Overview" description="Open-source, Ethereum Foundation-backed security platform delivering real-time threat intelligence, operational security assessments, and comprehensive protection for Web3." image="https://www.digibastion.com/og-image.png" /><Present /></>} />
                    {/* Admin routes - private, not in navigation */}
                    <Route path="/admin" element={<AdminLogin />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/admin/cron" element={<CronMonitor />} />
                    <Route path="*" element={<><MetaTags /><NotFound /></>} />
                  </Routes>
                </PageTransition>
                <MobileBottomNav />
                <FloatingActionButton />
                <OfflineIndicator />
              </TooltipProvider>
            </QueryClientProvider>
          </BrowserRouter>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

export default App;
