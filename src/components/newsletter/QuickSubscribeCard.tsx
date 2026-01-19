import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Users, Loader2, CheckCircle, Mail, Shield, User, Settings, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscriberCount } from '@/hooks/useSubscriberCount';
import { supabase } from '@/integrations/supabase/client';

interface QuickSubscribeCardProps {
  className?: string;
}

// Auto-detect user's timezone offset (in whole hours)
const getDefaultTimezoneOffset = (): number => {
  const offsetMinutes = new Date().getTimezoneOffset();
  const offsetHours = Math.round(-offsetMinutes / 60);
  return Math.max(-12, Math.min(14, offsetHours));
};

// Format timezone for display
const formatTimezone = (offset: number): string => {
  const sign = offset >= 0 ? '+' : '';
  return `UTC${sign}${offset}`;
};

// Format expected delivery time
const formatDeliveryTime = (hour: number, offset: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period} ${formatTimezone(offset)}`;
};

export const QuickSubscribeCard = ({ className = '' }: QuickSubscribeCardProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { data: subscriberCount } = useSubscriberCount();
  
  // Auto-detect timezone on component mount
  const timezoneOffset = useMemo(() => getDefaultTimezoneOffset(), []);
  const preferredHour = 9; // Default to 9 AM local time
  const deliveryTimeDisplay = useMemo(() => formatDeliveryTime(preferredHour, timezoneOffset), [timezoneOffset]);

  const handleQuickSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("submit-form", {
        body: { 
          type: "subscription", 
          data: {
            email,
            name: name.trim() || undefined,
            categories: ['defi-exploits', 'wallet-security', 'smart-contract-vulnerabilities'],
            frequency: 'daily',
            severity: 'high',
            preferred_hour: preferredHour,
            timezone_offset: timezoneOffset,
            preferred_day: 0
          }
        },
      });

      if (error) throw error;

      if (data?.success) {
        setIsSuccess(true);
        const toastTitle = data.alreadyVerified 
          ? "Welcome Back! 👋" 
          : "Check Your Email! 📧";
        const toastDesc = data.alreadyVerified
          ? "You're already subscribed. We've sent a confirmation to your email."
          : "Please verify your subscription to start receiving alerts.";
        
        toast({
          title: toastTitle,
          description: toastDesc,
        });
        
        setTimeout(() => {
          setEmail('');
          setName('');
          setIsSuccess(false);
        }, 5000);
      } else {
        throw new Error(data?.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Quick subscribe error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className={`glass-card border-green-500/30 ${className}`}>
        <CardContent className="p-5 sm:p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">You're Almost In!</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Check your inbox for a verification email.
          </p>
          <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground space-y-1">
            <p className="flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              <span>You'll receive daily alerts at <strong className="text-foreground">{deliveryTimeDisplay}</strong></span>
            </p>
            <p>
              Want to customize?{' '}
              <Link to="/threat-intel?tab=subscribe" className="text-primary hover:underline">
                Adjust preferences
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card glow border-primary/20 overflow-hidden ${className}`}>
      <CardContent className="p-5 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Get Security Alerts
                </h3>
                {subscriberCount && subscriberCount.count > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] sm:text-xs">{subscriberCount.label}</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Daily digest of critical crypto security threats at <span className="font-medium text-foreground">{deliveryTimeDisplay}</span>
              </p>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleQuickSubscribe} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Name field */}
              <div className="relative flex-1 sm:flex-none">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 w-full sm:w-40"
                  maxLength={100}
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Email field */}
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 w-full"
                  maxLength={255}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Bell className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Subscribe</span>
                  </>
                )}
              </Button>
            </div>
            
            {/* Advanced options link */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Detected: {formatTimezone(timezoneOffset)}</span>
              </div>
              <Link 
                to="/threat-intel?tab=subscribe" 
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Settings className="w-3 h-3" />
                <span>Advanced options</span>
              </Link>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};