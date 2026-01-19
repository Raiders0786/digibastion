import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Shield, Zap, CheckCircle, Loader2, AlertTriangle, Trash2, Lock, Send, Clock } from 'lucide-react';
import { NewsCategory, SeverityLevel } from '@/types/news';
import { technologyCategories, newsCategoryConfig } from '@/data/newsData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';

export default function ManageSubscription() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  
  const [email, setEmail] = useState(emailParam);
  const [token] = useState(tokenParam); // Token from URL, not editable
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [alertFrequency, setAlertFrequency] = useState<'immediate' | 'daily' | 'weekly'>('daily');
  const [severityThreshold, setSeverityThreshold] = useState<SeverityLevel>('medium');
  const [preferredHour, setPreferredHour] = useState<number>(9);
  const [timezoneOffset, setTimezoneOffset] = useState<number>(0);
  const [preferredDay, setPreferredDay] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [subscriptionFound, setSubscriptionFound] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [requestLinkEmail, setRequestLinkEmail] = useState('');
  const [isRequestingLink, setIsRequestingLink] = useState(false);
  const [linkRequested, setLinkRequested] = useState(false);
  const { toast } = useToast();

  // Check if we have both email and token for secure access
  const hasSecureAccess = Boolean(emailParam && tokenParam);

  const loadSubscription = async () => {
    if (!email || !token) {
      setAuthError(true);
      return;
    }
    
    setIsLoading(true);
    setAuthError(false);
    
    try {
      const { data, error } = await supabase.functions.invoke("get-subscription", {
        body: { email, token },
      });

      if (error) throw error;

      if (data?.success && data?.subscription) {
        const sub = data.subscription;
        setName(sub.name || '');
        setSelectedCategories(sub.categories || []);
        setSelectedTechnologies(sub.technologies || []);
        setAlertFrequency(sub.frequency || 'daily');
        setSeverityThreshold(sub.severity_threshold || 'medium');
        setPreferredHour(sub.preferred_hour ?? 9);
        setTimezoneOffset(sub.timezone_offset ?? 0);
        setPreferredDay(sub.preferred_day ?? 0);
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
  };

  useEffect(() => {
    if (hasSecureAccess) {
      loadSubscription();
    }
  }, [emailParam, tokenParam]);

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
        description: "If an active subscription exists, a management link will be sent shortly.",
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
          title="Unsubscribed - ESP Security" 
          description="You have been unsubscribed from security alerts."
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
          title="Manage Subscription - ESP Security" 
          description="Manage your security alert subscription preferences."
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
                      If an active subscription exists for <strong>{requestLinkEmail}</strong>, 
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
                        <Input
                          type="email"
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
        title="Manage Subscription - ESP Security" 
        description="Manage your security alert subscription preferences."
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
                Update your security alert preferences or unsubscribe.
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
                    <div className="space-y-4">
                      {technologyCategories.map((category) => (
                        <div key={category.id} className="space-y-2">
                          <h4 className="font-medium text-sm">{category.name}</h4>
                          <div className="flex flex-wrap gap-2">
                            {category.technologies.map((tech) => {
                              const isSelected = selectedTechnologies.includes(tech.id);
                              
                              return (
                                <Badge
                                  key={tech.id}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer transition-all hover:scale-105 ${
                                    tech.isPopular ? 'border-primary/50' : ''
                                  }`}
                                  onClick={() => handleTechnologyToggle(tech.id)}
                                >
                                  {tech.name}
                                  {tech.isPopular && <span className="ml-1">⭐</span>}
                                </Badge>
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate (Critical only)</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="severity">Minimum Severity</Label>
                      <Select value={severityThreshold} onValueChange={(value: any) => setSeverityThreshold(value)}>
                        <SelectTrigger>
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
                          <Label className="text-xs text-muted-foreground">Time</Label>
                          <Select value={String(preferredHour)} onValueChange={(v) => setPreferredHour(Number(v))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map((h) => (
                                <SelectItem key={h} value={String(h)}>
                                  {h <= 12 ? `${h}:00 AM` : `${h-12}:00 PM`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Timezone</Label>
                          <Select value={String(timezoneOffset)} onValueChange={(v) => setTimezoneOffset(Number(v))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[-8,-5,0,1,5,8,9].map((tz) => (
                                <SelectItem key={tz} value={String(tz)}>
                                  UTC{tz >= 0 ? '+' : ''}{tz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {alertFrequency === 'weekly' && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Day</Label>
                            <Select value={String(preferredDay)} onValueChange={(v) => setPreferredDay(Number(v))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
                                  <SelectItem key={i} value={String(i)}>{d}</SelectItem>
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
                        'Save Preferences'
                      )}
                    </Button>
                    
                    <Button 
                      type="button"
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
                    </Button>
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
