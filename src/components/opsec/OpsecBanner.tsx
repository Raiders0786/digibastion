import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OpsecBanner = () => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-primary/20">
      {/* Animated shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" 
        style={{ backgroundSize: '200% 100%' }} />
      
      <div className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Icon */}
            <div className="shrink-0 hidden sm:flex">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center animate-pulse-soft">
                  <Zap className="w-2.5 h-2.5 text-warning-foreground" />
                </div>
              </div>
            </div>
            
            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-medium text-foreground">
                <span className="badge-primary mr-2 hidden sm:inline-flex">New</span>
                <span className="hidden md:inline">Take the OpSec Assessment Quiz and </span>
                <span className="md:hidden">Test your </span>
                <span className="font-semibold text-primary">discover your security level</span>
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
                8 questions • Personalized recommendations • Share on X
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => navigate('/quiz')}
              size="sm"
              className="gap-2 btn-primary text-sm"
            >
              <span className="hidden sm:inline">Take Quiz</span>
              <span className="sm:hidden">Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
