import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Shield, Zap, CheckCircle, Loader2, Trash2, Lock, Send, PauseCircle } from 'lucide-react';
import { NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import { technologyCategories, newsCategoryConfig } from '@/data/newsData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { ContentScopeSelector } from '@/components/news/ContentScopeSelector';
import { DeliveryPreferencesFields, type DeliveryPreferencesValue } from '@/components/news/DeliveryPreferencesFields';
import { useThreatIntelFacets } from '@/hooks/useThreatIntelFacets';
import {
  CHANNEL_REQUIRED_MESSAGE,
  buildSubscriptionPayload,
  defaultFormStateForBrowser,
  hasDeliveryChannel,
  stateFromSubscription,
} from '@/lib/subscriptionPayload';

type DeliveryState = Omit<DeliveryPreferencesValue, 'scope'>;

function deliveryFrom(state: DeliveryPreferencesValue): DeliveryState {
  const { realtime, daily, weekly, includePreliminary, chains, preferredHour, timezone, timezoneOffset } = state;
  return { realtime, daily, weekly, includePreliminary, chains, preferredHour, timezone, timezoneOffset };
}

export default function ManageSubscription() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  const hasSecureAccess = Boolean(emailParam && tokenParam);
  
  const [email, setEmail] = useState(emailParam);
  const [token] = useState(tokenParam); // Token from URL, not editable
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [contentScope, setContentScope] = useState<ThreatIntelScope>('all');
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [severityThreshold, setSeverityThreshold] = useState<SeverityLevel>('medium');
  const [delivery, setDelivery] = useState<DeliveryState>(() => deliveryFrom(defaultFormStateForBrowser()));
  const [channelError, setChannelError] = useState<string | null>(null);
  const [isResubscribing, setIsResubscribing] = useState(false);
  const [resubscribeRequested, setResubscribeRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(hasSecureAccess);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [subscriptionFound, setSubscriptionFound] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [requestLinkEmail, setRequestLinkEmail] = useState('');
  const [isRequestingLink, setIsRequestingLink] = useState(false);
  const [linkRequested, setLinkRequested] = useState(false);
  const { toast } = useToast();
  const facets = useThreatIntelFacets(contentScope);

  const loadSubscription = useCallback(async () => {
    if (!emailParam || !tokenParam) {
      setAuthError(true);
      return;
    }
    
    setIsLoading(true);
    setAuthError(false);
    
    try {
      const { data, error } = await supabase.functions.invoke("get-subscription", {
        body: { email: emailParam, token: tokenParam },
      });

      if (error) throw error;

      if (data?.success && data?.subscription) {
        const sub = data.subscription;
        const state = stateFromSubscription(sub);
        setName(sub.name || '');
        setSelectedCategories(state.categories.filter((category): category is NewsCategory => category in newsCategoryConfig));
        setContentScope(state.scope);
        setSelectedTechnologies(state.technologies);
        setSeverityThreshold(state.severity);
        setDelivery(deliveryFrom(state));
        setIsActive(sub.is_active !== false);
        setSubscriptionFound(true);
      } else {
        setAuthError(true);
        toast({
          title: "Access Denied",
          description: "Invalid or expired link. Please use the link from your email.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Load subscription error:', error);
      setAuthError(true);
      toast({
        title: "Error",
        description: "Failed to verify access. Please use the link from your email.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [emailParam, tokenParam, toast]);

  useEffect(() => {
    if (hasSecureAccess) {
      loadSubscription();
    }
  }, [hasSecureAccess, loadSubscription]);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestLinkEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setIsRequestingLink(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("request-management-link", {
        body: { email: requestLinkEmail },
      });

      if (error) throw error;

      setLinkRequested(true);
      toast({
        title: "Check Your Email",
        description: "If a verified subscription exists, a management link will be sent shortly.",
      });
    } catch (error) {
      console.error('Request link error:', error);
      toast({
        title: "Error",
        description: "Failed to send link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRequestingLink(false);
    }
  };

  const handleCategoryToggle = (category: NewsCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleTechnologyToggle = (techId: string) => {
    setSelectedTechnologies(prev =>
      prev.includes(techId)
        ? prev.filter(t => t !== techId)
        : [...prev, techId]
    );
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Access Denied",
        description: "Missing authentication token.",
        variant: "destructive"
      });
      return;
    }

    if (!hasDeliveryChannel(delivery)) {
      setChannelError(CHANNEL_REQUIRED_MESSAGE);
      return;
    }

    if (selectedCategories.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one category.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("update-subscription", {
        body: {
          email,
          token,
          name: name || null,
          ...buildSubscriptionPayload({
            ...delivery,
            categories: selectedCategories,
            technologies: selectedTechnologies,
            scope: contentScope,
            severity: severityThreshold,
          }, 'manage'),
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Saving never re-activates an unsubscribed address; trust the server.
        if (typeof data.subscription?.is_active === 'boolean') setIsActive(data.subscription.is_active);
        setUpdateSuccess(true);
        toast({
          title: "Preferences saved",
          description: isActive
            ? "Your subscription preferences have been saved."
            : "Saved. You stay unsubscribed until you resubscribe.",
        });
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        throw new Error(data?.error || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResubscribe = async () => {
    if (!token) return;
    setIsResubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-subscription", {
        body: { action: 'resubscribe', email, token },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Resubscribe failed');
      if (data.alreadyActive) {
        setIsActive(true);
        return;
      }
      setResubscribeRequested(true);
      toast({ title: "Check your inbox to confirm", description: "Your emails restart after you click the link we sent." });
    } catch (error) {
      console.error('Resubscribe error:', error);
      toast({
        title: "Error",
        description: "Could not send the confirmation email. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsResubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!token) {
      toast({
        title: "Access Denied",
        description: "Missing authentication token.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Are you sure you want to unsubscribe? You will stop receiving all security alerts.')) {
      return;
    }

    setIsUnsubscribing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("unsubscribe", {
        body: { email, token },
      });

      if (error) throw error;

      if (data?.success) {
        setUnsubscribeSuccess(true);
        toast({
          title: "Unsubscribed",
          description: "You have been unsubscribed from security alerts.",
        });
      } else {
        throw new Error(data?.error || 'Unsubscribe failed');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  if (unsubscribeSuccess) {
    return (
      <>
        <MetaTags 
          title="Unsubscribed | Digibastion" 
          description="You have been unsubscribed from Digibastion security alerts."
          noindex={true}
        />
        <Navbar />
        <main className="min-h-screen bg-background pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">You're unsubscribed from all Digibastion emails.</h2>
                <p className="text-muted-foreground mb-6">
                  You will not get real-time alerts, the daily brief or the weekly deep-dive at this address.
                </p>
                <Button variant="outline" onClick={() => window.location.href = '/threat-intel'}>
                  Back to Threat Intel
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Show secure access required message if no token
  if (!hasSecureAccess || authError) {
    return (
      <>
        <MetaTags 
          title="Manage Subscription | Digibastion" 
          description="Manage your Digibastion security alert subscription preferences."
          noindex={true}
        />
        <Navbar />
        <main className="min-h-screen bg-background pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="glass-card">
              <CardContent className="p-8 md:p-12">
                {linkRequested ? (
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                    <p className="text-muted-foreground mb-6">
                      If a verified subscription exists for <strong>{requestLinkEmail}</strong>,
                      a management link will be sent shortly. Please check your inbox and spam folder.
                    </p>
                    <div className="space-y-3">
                      <Button variant="outline" onClick={() => setLinkRequested(false)}>
                        Request Another Link
                      </Button>
                      <Button variant="ghost" onClick={() => window.location.href = '/threat-intel'}>
                        Go to Threat Intel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Secure Access Required</h2>
                    <p className="text-muted-foreground mb-6">
                      To manage your subscription, please use the secure link from your email notifications.
                      This protects your subscription from unauthorized changes.
                    </p>
                    
                    {/* Request New Link Form */}
                    <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border">
                      <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" />
                        Lost Your Link?
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter your email to receive a new management link.
                      </p>
                      <form onSubmit={handleRequestLink} className="space-y-3">
                        <Label htmlFor="management-email" className="sr-only">Subscription email address</Label>
                        <Input
                          id="management-email"
                          type="email"
                          autoComplete="email"
                          placeholder="your@email.com"
                          value={requestLinkEmail}
                          onChange={(e) => setRequestLinkEmail(e.target.value)}
                          className="text-center"
                          maxLength={255}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={isRequestingLink || !requestLinkEmail}
                        >
                          {isRequestingLink ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Management Link
                            </>
                          )}
                        </Button>
                      </form>
                    </div>

                    <div className="mt-6">
                      <Button variant="ghost" onClick={() => window.location.href = '/threat-intel'}>
                        Go to Threat Intel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
        <MetaTags 
          title="Manage Subscription | Digibastion" 
          description="Manage your Digibastion security alert subscription preferences."
          noindex={true}
        />
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="glass-card glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                Manage Your Subscription
              </CardTitle>
              <CardDescription>
                {isActive
                  ? 'Update your security alert preferences or unsubscribe.'
                  : 'Review the preferences saved for this address.'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2">Loading your preferences...</span>
                </div>
              ) : subscriptionFound ? (
                <form onSubmit={handleUpdate} className="space-y-6">
                  {/* Email Display */}
                  <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{email}</span>
                    <Lock className="w-3 h-3 text-green-500 ml-auto" />
                  </div>

                  {!isActive && (
                    <div role="status" className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                      <p className="flex items-start gap-2 text-sm">
                        <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                        <span>You're unsubscribed. Saving keeps your preferences without sending emails.</span>
                      </p>
                      {resubscribeRequested ? (
                        <p className="text-sm font-medium">Check your inbox to confirm. Your emails restart after you click the link.</p>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={handleResubscribe} disabled={isResubscribing}>
                          {isResubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="mr-2 h-4 w-4" aria-hidden="true" />}
                          Resubscribe
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <ContentScopeSelector
                    value={contentScope}
                    onChange={setContentScope}
                    label="Content coverage"
                    showDescription
                    idPrefix="manage-content-scope"
                  />

                  {/* Categories Selection */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Security Categories
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(Object.keys(newsCategoryConfig) as NewsCategory[]).map((category) => {
                        const categoryInfo = newsCategoryConfig[category];
                        const isSelected = selectedCategories.includes(category);
                        
                        return (
                          <label
                            key={category}
                            htmlFor={`manage-category-${category}`}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`manage-category-${category}`}
                                checked={isSelected} 
                                onCheckedChange={() => handleCategoryToggle(category)}
                              />
                              <div className="flex-1">
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
                      Your Technology Stack
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
                              const isSelected = selectedTechnologies.includes(tech.id);
                              
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

                  <DeliveryPreferencesFields
                    value={{ ...delivery, scope: contentScope }}
                    onChange={(patch) => {
                      const next = deliveryFrom({ ...delivery, scope: contentScope, ...patch });
                      if (hasDeliveryChannel(next)) setChannelError(null);
                      setDelivery(next);
                    }}
                    chainOptions={facets.chains}
                    idPrefix="manage"
                    channelError={channelError}
                  />

                  <div className="space-y-2 sm:max-w-xs">
                    <Label htmlFor="severity">Minimum Severity</Label>
                    <Select value={severityThreshold} onValueChange={(value) => setSeverityThreshold(value as SeverityLevel)}>
                      <SelectTrigger id="severity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['critical', 'high', 'medium', 'low', 'info'] as const).map((level) => (
                          <SelectItem key={level} value={level}>
                            <span className={getSeverityColor(level)}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : updateSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Saved!
                        </>
                      ) : (
                        'Save Preferences'
                      )}
                    </Button>
                    
                    {isActive && <Button
                      type="button"
                      aria-label={isUnsubscribing ? 'Unsubscribing from security alerts' : 'Unsubscribe from security alerts'}
                      variant="destructive"
                      onClick={handleUnsubscribe}
                      disabled={isUnsubscribing}
                    >
                      {isUnsubscribing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Unsubscribe
                        </>
                      )}
                    </Button>}
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
