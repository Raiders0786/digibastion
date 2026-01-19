import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Users, Loader2, CheckCircle, Mail, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscriberCount } from '@/hooks/useSubscriberCount';
import { supabase } from '@/integrations/supabase/client';

interface QuickSubscribeCardProps {
  className?: string;
}

export const QuickSubscribeCard = ({ className = '' }: QuickSubscribeCardProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { data: subscriberCount } = useSubscriberCount();

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
            categories: ['defi-exploits', 'wallet-security', 'smart-contract-vulnerabilities'],
            frequency: 'daily',
            severity: 'high',
            preferred_hour: 9,
            timezone_offset: 0,
            preferred_day: 0
          }
        },
      });

      if (error) throw error;

      if (data?.success) {
        setIsSuccess(true);
        toast({
          title: "Check Your Email! 📧",
          description: "Please verify your subscription to start receiving alerts.",
        });
        
        setTimeout(() => {
          setEmail('');
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
      <Card className={`glass-card border-primary/30 ${className}`}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">You're Almost In!</h3>
          <p className="text-sm text-muted-foreground">
            Check your email to verify your subscription.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card glow border-primary/20 overflow-hidden ${className}`}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon and Text */}
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
              Daily digest of critical threats. Customize preferences after signup.
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleQuickSubscribe} className="w-full sm:w-auto flex gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 w-full sm:w-56"
                maxLength={255}
                disabled={isSubmitting}
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
          </form>
        </div>
      </CardContent>
    </Card>
  );
};