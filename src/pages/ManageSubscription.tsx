import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Shield, Zap, CheckCircle, Loader2, AlertTriangle, Trash2, Lock, Send, Clock } from 'lucide-react';
import { NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import { technologyCategories, newsCategoryConfig } from '@/data/newsData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { dayOptions, hourOptions, timezoneOptions } from '@/lib/digestSchedule';
import { ContentScopeSelector } from '@/components/news/ContentScopeSelector';

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
  const [alertFrequency, setAlertFrequency] = useState<'immediate' | 'daily' | 'weekly'>('daily');
  const [severityThreshold, setSeverityThreshold] = useState<SeverityLevel>('medium');
  const [preferredHour, setPreferredHour] = useState<number>(9);
  const [timezoneOffset, setTimezoneOffset] = useState<number>(0);
  const [preferredDay, setPreferredDay] = useState<number>(0);
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
        setName(sub.name || '');
        setSelectedCategories((sub.categories || []).filter((category: string): category is NewsCategory => category in newsCategoryConfig));
        setContentScope(sub.content_scope === 'web3-incidents' ? 'web3-incidents' : 'all');
        setSelectedTechnologies(sub.technologies || []);
        setAlertFrequency(sub.frequency || 'daily');
        setSeverityThreshold(sub.severity_threshold || 'medium');
        setPreferredHour(sub.preferred_hour ?? 9);
        setTimezoneOffset(sub.timezone_offset ?? 0);
        setPreferredDay(sub.preferred_day ?? 0);
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
          categories: selectedCategories,
          content_scope: contentScope,
          technologies: selectedTechnologies,
          frequency: alertFrequency,
          severity_threshold: severityThreshold,
          preferred_hour: preferredHour,
          timezone_offset: timezoneOffset,
          preferred_day: preferredDay,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setIsActive(true);
        setUpdateSuccess(true);
        toast({
          title: "Preferences Updated! ✓",
          description: "Your subscription preferences have been saved.",
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
          title="Unsubscribed - Digibastion" 
          description="You have been unsubscribed from Digibastion security alerts."
          noindex={true}
        />
        <Navbar />
        <main className="min-h-screen bg-background pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">You've Been Unsubscribed</h2>
                <p className="text-muted-foreground mb-6">
                  You will no longer receive security alerts at this email address.
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
          title="Manage Subscription - Digibastion" 
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
          title="Manage Subscription - Digibastion" 
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
                  : 'Your alerts are paused. Review your preferences, then reactivate them securely.'}
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

                  {/* Alert Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Alert Frequency</Label>
                      <Select value={alertFrequency} onValueChange={(value: any) => setAlertFrequency(value)}>
                        <SelectTrigger id="frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate (Critical &amp; high)</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="severity">Minimum Severity</Label>
                      <Select value={severityThreshold} onValueChange={(value: any) => setSeverityThreshold(value)}>
                        <SelectTrigger id="severity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">
                            <span className={getSeverityColor('critical')}>Critical</span>
                          </SelectItem>
                          <SelectItem value="high">
                            <span className={getSeverityColor('high')}>High</span>
                          </SelectItem>
                          <SelectItem value="medium">
                            <span className={getSeverityColor('medium')}>Medium</span>
                          </SelectItem>
                          <SelectItem value="low">
                            <span className={getSeverityColor('low')}>Low</span>
                          </SelectItem>
                          <SelectItem value="info">
                            <span className={getSeverityColor('info')}>Info</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Delivery Time Preferences */}
                  {(alertFrequency === 'daily' || alertFrequency === 'weekly') && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Preferred Delivery Time
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="manage-delivery-time" className="text-xs text-muted-foreground">Time</Label>
                          <Select value={String(preferredHour)} onValueChange={(v) => setPreferredHour(Number(v))}>
                            <SelectTrigger id="manage-delivery-time">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {hourOptions.map((hour) => (
                                <SelectItem key={hour.value} value={String(hour.value)}>
                                  {hour.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="manage-delivery-timezone" className="text-xs text-muted-foreground">Timezone</Label>
                          <Select value={String(timezoneOffset)} onValueChange={(v) => setTimezoneOffset(Number(v))}>
                            <SelectTrigger id="manage-delivery-timezone">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timezoneOptions.map((timezone) => (
                                <SelectItem key={timezone.value} value={String(timezone.value)}>
                                  {timezone.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {alertFrequency === 'weekly' && (
                          <div className="space-y-1.5">
                            <Label htmlFor="manage-delivery-day" className="text-xs text-muted-foreground">Day</Label>
                            <Select value={String(preferredDay)} onValueChange={(v) => setPreferredDay(Number(v))}>
                              <SelectTrigger id="manage-delivery-day">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                              {dayOptions.map((day) => (
                                <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                        isActive ? 'Save Preferences' : 'Reactivate Alerts'
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
