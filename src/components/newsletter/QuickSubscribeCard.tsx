import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Loader2, CheckCircle, Mail, Shield, User, Settings, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmailPreview } from '@/components/news/EmailPreview';
import type { NewsCategory } from '@/types/news';
import { supabase } from '@/integrations/supabase/client';
import { formatDeliveryTimeIn, formatUtcOffset } from '@/lib/digestSchedule';
import {
  CHANNEL_REQUIRED_MESSAGE,
  buildSubscriptionPayload,
  defaultFormStateForBrowser,
  hasDeliveryChannel,
  type SubscriptionFormState,
} from '@/lib/subscriptionPayload';
import { emailChannelCopy, type EmailChannelKey } from '@/lib/threatIntel/channelCopy';
import { NEWSLETTERS_LIVE } from '@/seo/siteFacts';

const QUICK_SUBSCRIBE_CATEGORIES: NewsCategory[] = ['web3-security', 'defi-exploits', 'vulnerability-disclosure'];

const QUICK_CHANNELS = emailChannelCopy();

interface QuickSubscribeCardProps {
  className?: string;
}

function initialQuickState(): SubscriptionFormState {
  return {
    ...defaultFormStateForBrowser(),
    categories: [...QUICK_SUBSCRIBE_CATEGORIES],
    scope: 'web3-incidents',
    severity: 'high',
    realtime: true,
    daily: false,
    weekly: false,
  };
}

export const QuickSubscribeCard = ({ className = '' }: QuickSubscribeCardProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [form, setForm] = useState<SubscriptionFormState>(initialQuickState);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionOutcome, setSubmissionOutcome] = useState<'new' | 'pending' | 'existing' | 'inactive'>('new');
  const { toast } = useToast();

  const timezoneLabel = form.timezone ?? formatUtcOffset(form.timezoneOffset);
  const deliveryTimeDisplay = useMemo(
    () => formatDeliveryTimeIn(form.preferredHour, form.timezoneOffset, form.timezone),
    [form.preferredHour, form.timezoneOffset, form.timezone],
  );

  const toggleChannel = (key: EmailChannelKey, checked: boolean) => {
    const next = { ...form, [key]: checked };
    if (hasDeliveryChannel(next)) setChannelError(null);
    setForm(next);
  };

  const handleQuickSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasDeliveryChannel(form)) {
      setChannelError(CHANNEL_REQUIRED_MESSAGE);
      return;
    }

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
            ...buildSubscriptionPayload(form, 'quick-subscribe'),
          }
        },
      });

      if (error) throw error;

      if (data?.success) {
        setIsSuccess(true);
        setSubmissionOutcome(data.inactive ? 'inactive' : data.alreadyVerified ? 'existing' : data.isNewSubscription ? 'new' : 'pending');
        const toastTitle = data.inactive
          ? "Check your inbox to confirm"
          : data.alreadyVerified
          ? "You're already subscribed"
          : "Check your email";
        const toastDesc = data.inactive
          ? "We sent a link to confirm you want these emails again."
          : data.alreadyVerified
          ? "We've sent a confirmation to your email."
          : "Please verify your subscription to start receiving alerts.";

        toast({
          title: toastTitle,
          description: toastDesc,
        });

        setTimeout(() => {
          setEmail('');
          setName('');
          setForm(initialQuickState());
          setSubmissionOutcome('new');
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
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {submissionOutcome === 'inactive' ? 'Confirm From Your Inbox' : submissionOutcome === 'existing' ? 'You’re Already Subscribed' : submissionOutcome === 'pending' ? 'Verification Email Resent' : 'You’re Almost In'}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {submissionOutcome === 'inactive'
              ? 'Check your inbox for a link to confirm you want these emails again.'
              : submissionOutcome === 'existing'
              ? 'Check your inbox for a secure link to manage your saved preferences.'
              : submissionOutcome === 'pending'
                ? 'Verify from your inbox; your earlier preferences remain unchanged until then.'
                : 'Check your inbox for a verification email.'}
          </p>
          <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground space-y-1">
            {submissionOutcome === 'new' && (form.daily || form.weekly) && (
            <p className="flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 shrink-0" />
              <span data-testid="quick-delivery-line">
                Your {form.daily ? 'daily brief' : 'weekly deep-dive'} {NEWSLETTERS_LIVE ? 'arrives' : 'will arrive'}
                {form.daily ? '' : ' on Mondays'} at <strong className="text-foreground">{deliveryTimeDisplay}</strong>
                {NEWSLETTERS_LIVE ? '.' : ' once the newsletter launches.'}
                {form.realtime ? ' Real-time alerts start with the next matching incident.' : ''}
              </span>
            </p>
            )}
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
                  Get alerts
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Web3 incident reports by email, each with its source named.{' '}
                <EmailPreview
                  initialTab={form.realtime ? 'alert' : form.daily ? 'daily' : 'weekly'}
                  triggerLabel="See a sample email"
                  triggerVariant="link"
                  triggerClassName="h-auto p-0 text-xs sm:text-sm"
                />
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleQuickSubscribe} noValidate className="space-y-3">
            <fieldset className="space-y-1">
              <legend className="sr-only">Emails to receive</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {QUICK_CHANNELS.map((channel) => (
                  <label key={channel.key} htmlFor={`quick-${channel.key}`} className="flex cursor-pointer items-center gap-2 text-xs sm:text-sm">
                    <Checkbox
                      id={`quick-${channel.key}`}
                      checked={form[channel.key]}
                      onCheckedChange={(checked) => toggleChannel(channel.key, checked === true)}
                      disabled={isSubmitting}
                    />
                    {channel.label}
                  </label>
                ))}
              </div>
              {channelError && <p role="alert" className="text-xs font-medium text-destructive">{channelError}</p>}
            </fieldset>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Name field */}
              <div className="relative flex-1 sm:flex-none">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  aria-label="Name (optional)"
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
                  aria-label="Email address"
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
                aria-label={isSubmitting ? 'Subscribing to security alerts' : 'Subscribe to security alerts'}
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
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Detected: {timezoneLabel}</span>
              </div>
              <Link
                to="/threat-intel?tab=subscribe&scope=web3-incidents"
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
