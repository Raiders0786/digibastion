
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <MetaTags /> {/* Default meta tags */}
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/category/:categoryId" element={<CategoryDetail />} />
                <Route path="/share" element={<Share />} />
                <Route path="/about" element={<About />} />
                <Route path="/license" element={<License />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:slug" element={<ArticleDetail />} />
                <Route path="/links" element={<Links />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/support" element={<Support />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
