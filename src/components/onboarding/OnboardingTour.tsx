import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, Bell, Shield, CheckCircle2, Sparkles } from 'lucide-react';

const TOUR_STORAGE_KEY = 'digibastion_onboarding_completed';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Digibastion! 👋',
    description: 'Your free, open-source security companion. Let us show you around in 30 seconds.',
    icon: <Sparkles className="w-6 h-6 text-primary" />,
  },
  {
    id: 'alerts',
    title: 'Live Threat Alerts',
    description: 'Get real-time notifications about phishing sites, wallet drainers, and exploits. Subscribe to stay protected.',
    icon: <Bell className="w-6 h-6 text-destructive" />,
  },
  {
    id: 'quiz',
    title: 'OpSec Quiz',
    description: 'Test your security knowledge in 2 minutes. Get a crypto character ranking and share your score!',
    icon: <Shield className="w-6 h-6 text-primary" />,
  },
  {
    id: 'checklists',
    title: 'Security Checklists',
    description: 'Step-by-step guides to secure your wallets, devices, and accounts. Start with the essentials below.',
    icon: <CheckCircle2 className="w-6 h-6 text-success" />,
  },
];

export const OnboardingTour = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has completed the tour
    const hasCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompleted) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleSkip}
      />
      
      {/* Tour Card */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md animate-fade-in-up">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close tour"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8 text-center">
            {/* Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              {step.icon}
            </div>

            {/* Step indicator */}
            <p className="text-xs text-muted-foreground mb-2">
              {currentStep + 1} of {tourSteps.length}
            </p>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground mb-2">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-6">
              {step.description}
            </p>

            {/* Dots indicator */}
            <div className="flex justify-center gap-1.5 mb-6">
              {tourSteps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 gap-2"
              >
                {isLastStep ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
