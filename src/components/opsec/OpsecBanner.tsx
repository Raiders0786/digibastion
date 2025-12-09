
import { useState } from 'react';
import { Shield, Zap, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OpsecQuiz } from './OpsecQuiz';

export const OpsecBanner = () => {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/15 via-primary/10 to-secondary/15 border-y border-primary/20">
        {/* Animated background effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 animate-pulse" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon */}
              <div className="shrink-0 hidden sm:flex">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                    <Zap className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-foreground truncate">
                  <span className="hidden sm:inline">🔐 </span>
                  <span className="font-semibold text-primary">New:</span>{' '}
                  <span className="hidden md:inline">Take the OpSec Assessment Quiz and </span>
                  <span className="md:hidden">Test your </span>
                  <span className="font-semibold">discover your security level</span>
                </p>
                <p className="text-xs text-foreground-secondary hidden sm:block">
                  8 questions • Get personalized recommendations • Share on X
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => setIsQuizOpen(true)}
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                <span className="hidden sm:inline">Take Quiz</span>
                <span className="sm:hidden">Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-foreground-secondary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <OpsecQuiz isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
    </>
  );
};
