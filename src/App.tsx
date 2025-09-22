
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { MetaTags } from "./components/MetaTags";
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
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Analytics />
            <Routes>
              <Route path="/" element={<><MetaTags /><Index /></>} />
              <Route path="/category/:categoryId" element={<><MetaTags /><CategoryDetail /></>} />
              <Route path="/news" element={<><MetaTags /><News /></>} />
              <Route path="/share" element={<><MetaTags /><Share /></>} />
              <Route path="/about" element={<><MetaTags /><About /></>} />
              <Route path="/license" element={<><MetaTags /><License /></>} />
              <Route path="/tools" element={<><MetaTags /><Tools /></>} />
              <Route path="/articles" element={<><MetaTags /><Articles /></>} />
              <Route path="/articles/:slug" element={<><MetaTags /><ArticleDetail /></>} />
              <Route path="/links" element={<><MetaTags /><Links /></>} />
              <Route path="/contact" element={<><MetaTags /><Contact /></>} />
              <Route path="/support" element={<><MetaTags /><Support /></>} />
              <Route path="*" element={<><MetaTags /><NotFound /></>} />
            </Routes>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default App;
