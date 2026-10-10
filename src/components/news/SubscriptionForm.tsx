import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Shield, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import { technologyCategories } from '@/data/newsData';
import { NEWS_CATEGORIES, NEWS_CATEGORY_CONFIG, SEVERITY_LEVELS, SEVERITY_STYLES } from '@/lib/threatIntel/taxonomy';
import type { VerificationFilter } from '@/lib/threatIntel/query';
import { useToast } from '@/hooks/use-toast';
import { useThreatIntelFacets } from '@/hooks/useThreatIntelFacets';
import { supabase } from "@/integrations/supabase/client";
import { EmailPreview } from './EmailPreview';
import { z } from 'zod';
import { formatDeliveryTimeIn } from '@/lib/digestSchedule';
import { ContentScopeSelector } from './ContentScopeSelector';
import { DeliveryPreferencesFields, type DeliveryPreferencesValue } from './DeliveryPreferencesFields';
import {
  CHANNEL_REQUIRED_MESSAGE,
  buildSubscriptionPayload,
  defaultFormStateForBrowser,
  describeFormChannels,
  hasDeliveryChannel,
  initialStateFromView,
  type SubscriptionFormState,
} from '@/lib/subscriptionPayload';

// Identity fields; the email types are checked by hasDeliveryChannel and the
// rest of the preferences by the API (parseSubscriptionPreferences).
const subscriberSchema = z.object({
  name: z.string().max(100, "Name must be less than 100 characters").optional(),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  categories: z.array(z.string()).min(1, "Select at least one category").max(10),
});

interface SubscriptionFormProps {
  /** Pre-selected categories, e.g. from `?categories=` when opened from an incident page. */
  initialCategories?: NewsCategory[];
  /** Pre-selected content scope, e.g. from `?scope=`. */
  initialScope?: ThreatIntelScope;
  /** Chains of the view the form was opened from (`?chain=`). */
  initialChains?: string[];
  /** Status filter of that view (`?status=`); confirmed turns unconfirmed reports off. */
  initialVerification?: VerificationFilter;
  /** Opened from the weekly page: only the weekly box starts checked. */
  initialWeekly?: boolean;
}

function initialFormState(props: SubscriptionFormProps): SubscriptionFormState {
  return {
    ...defaultFormStateForBrowser(),
    ...initialStateFromView({
      categories: props.initialCategories,
      scope: props.initialScope,
      chains: props.initialChains,
      verification: props.initialVerification,
      weekly: props.initialWeekly,
    }),
  };
}

export const SubscriptionForm = (props: SubscriptionFormProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [form, setForm] = useState<SubscriptionFormState>(() => initialFormState(props));
  const [channelError, setChannelError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionOutcome, setSubmissionOutcome] = useState<'new' | 'pending' | 'existing' | 'inactive'>('new');
  const { toast } = useToast();
  const facets = useThreatIntelFacets(form.scope);

  const update = (patch: Partial<SubscriptionFormState>) => setForm((current) => ({ ...current, ...patch }));

  const updateDelivery = (patch: Partial<DeliveryPreferencesValue>) => {
    const next = { ...form, ...patch };
    if (hasDeliveryChannel(next)) setChannelError(null);
    setForm(next);
  };

  const handleCategoryToggle = (category: NewsCategory) => {
    update({
      categories: form.categories.includes(category)
        ? form.categories.filter((c) => c !== category)
        : [...form.categories, category],
    });
  };

  const handleTechnologyToggle = (techId: string) => {
    update({
      technologies: form.technologies.includes(techId)
        ? form.technologies.filter((t) => t !== techId)
        : [...form.technologies, techId],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasDeliveryChannel(form)) {
      setChannelError(CHANNEL_REQUIRED_MESSAGE);
      return;
    }

    const validation = subscriberSchema.safeParse({ name: name || undefined, email, categories: form.categories });
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Invalid input";
      toast({
        title: "Validation Error",
        description: firstError,
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
            name: validation.data.name,
            email: validation.data.email,
            ...buildSubscriptionPayload(form, 'threat-intel-form'),
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        setIsSuccess(true);
        setSubmissionOutcome(data.inactive ? 'inactive' : data.alreadyVerified ? 'existing' : data.isNewSubscription ? 'new' : 'pending');

        let title = "Verification email sent";
        let message = "Please check your email to verify your subscription.";
        if (data.alreadyVerified) {
          title = data.inactive ? "Check your inbox to confirm" : "You're already subscribed";
          message = data.inactive
            ? "We sent a link to confirm you want these emails again. Nothing changes until you click it."
            : "We've sent a confirmation with your current settings.";
        }
        toast({ title, description: message });

        // Reset form after delay
        setTimeout(() => {
          setEmail('');
          setName('');
          setForm(defaultFormStateForBrowser());
          setSubmissionOutcome('new');
          setIsSuccess(false);
        }, 5000);
      } else {
        throw new Error(data?.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: SeverityLevel) => SEVERITY_STYLES[severity].textClass;

  if (isSuccess) {
    return (
      <Card className="w-full max-w-4xl mx-auto glass-card glow border-green-500/30">
        <CardContent className="p-8 md:p-12">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {submissionOutcome === 'inactive' ? 'Confirm From Your Inbox' : submissionOutcome === 'existing' ? 'You’re Already Subscribed' : submissionOutcome === 'pending' ? 'Verification Email Resent' : 'Almost There'}
            </h2>
            <p className="text-muted-foreground">
              {submissionOutcome === 'inactive'
                ? 'We sent a link to confirm you want these emails again. Nothing changes until you click it.'
                : submissionOutcome === 'existing'
                ? 'We sent a secure management link to your email. Use it to review or change your saved preferences.'
                : submissionOutcome === 'pending'
                  ? 'Your earlier preferences remain unchanged until you verify your email.'
                  : 'Verify your email to activate these threat-intelligence preferences.'}
            </p>
          </div>

          {/* Summary of preferences */}
          {submissionOutcome === 'new' && <div className="bg-muted/30 rounded-lg p-6 space-y-4 max-w-md mx-auto">
            <h3 className="font-semibold text-center mb-4">Your Alert Settings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Emails</span>
                <span className="font-medium text-right">{describeFormChannels(form).join(', ')}</span>
              </div>
              {(form.daily || form.weekly) && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Delivery Time</span>
                  <span className="font-medium text-right">{formatDeliveryTimeIn(form.preferredHour, form.timezoneOffset, form.timezone)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Content</span>
                <span className="font-medium">{form.scope === 'web3-incidents' ? 'Web3 incidents only' : 'All intelligence'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Unconfirmed reports</span>
                <span className="font-medium">{form.includePreliminary ? 'Included' : 'Left out'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Categories</span>
                <span className="font-medium">{form.categories.length} selected</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Min Severity</span>
                <span className={`font-medium ${getSeverityColor(form.severity)}`}>
                  {form.severity.charAt(0).toUpperCase() + form.severity.slice(1)}
                </span>
              </div>
            </div>
          </div>}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {submissionOutcome === 'existing'
              ? 'Check your inbox for the management link.'
              : submissionOutcome === 'inactive'
                ? 'Check your inbox for the confirmation link.'
                : 'Check your inbox for the verification link.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto glass-card glow">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Security Alert Subscription
          </CardTitle>
        </div>
        <CardDescription>
          Real-time alerts, a daily brief or a weekly deep-dive, filtered like the Threat Intel page. No login required.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Name & Email Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                className="w-full"
              />
            </div>
          </div>

          <ContentScopeSelector
            value={form.scope}
            onChange={(scope) => update({ scope })}
            label="Content coverage"
            showDescription
            idPrefix="subscription-content-scope"
          />

          <DeliveryPreferencesFields
            value={form}
            onChange={updateDelivery}
            chainOptions={facets.chains}
            idPrefix="subscription"
            channelError={channelError}
          />

          {/* Categories Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Categories *
            </Label>
            <p className="text-sm text-muted-foreground">
              Select the types of security news you want to receive
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {NEWS_CATEGORIES.map((category) => {
                const categoryInfo = NEWS_CATEGORY_CONFIG[category];
                const isSelected = form.categories.includes(category);

                return (
                  <label
                    key={category}
                    htmlFor={`category-${category}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={isSelected}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <div className="cursor-pointer flex-1 min-w-0">
                        <div className="font-medium">{categoryInfo.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {categoryInfo.description}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Technology Stack Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Your Technology Stack (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Prioritize technologies you use. Critical and high-severity incidents may still be included for safety.
            </p>
            <div className="space-y-4">
              {technologyCategories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <h4 className="font-medium text-sm">{category.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.technologies.map((tech) => {
                      const isSelected = form.technologies.includes(tech.id);

                      return (
                        <button
                          key={tech.id}
                          type="button"
                          aria-pressed={isSelected}
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            isSelected ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-transparent text-foreground hover:bg-accent'
                          } ${tech.isPopular ? 'border-primary/50' : ''}`}
                          onClick={() => handleTechnologyToggle(tech.id)}
                        >
                          {tech.name}
                          {tech.isPopular && <span className="ml-1" aria-label="Popular">⭐</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="severity">Minimum Severity</Label>
            <Select value={form.severity} onValueChange={(value) => update({ severity: value as SeverityLevel })}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    <span className={getSeverityColor(level)}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up alerts...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Subscribe to Security Alerts
                </>
              )}
            </Button>

            <EmailPreview initialTab={form.realtime ? 'alert' : form.daily ? 'daily' : 'weekly'} />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your email will only be used for security alerts. You can unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
