import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Shield, Zap, CheckCircle, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
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
  
  const [email, setEmail] = useState(emailParam);
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [alertFrequency, setAlertFrequency] = useState<'immediate' | 'daily' | 'weekly'>('daily');
  const [severityThreshold, setSeverityThreshold] = useState<SeverityLevel>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [subscriptionFound, setSubscriptionFound] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false);
  const { toast } = useToast();

  const loadSubscription = async () => {
    if (!email) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-subscription", {
        body: { email },
      });

      if (error) throw error;

      if (data?.subscription) {
        const sub = data.subscription;
        setName(sub.name || '');
        setSelectedCategories(sub.categories || []);
        setSelectedTechnologies(sub.technologies || []);
        setAlertFrequency(sub.frequency || 'daily');
        setSeverityThreshold(sub.severity_threshold || 'medium');
        setSubscriptionFound(true);
      } else {
        setSubscriptionFound(false);
        toast({
          title: "Subscription Not Found",
          description: "No subscription found for this email address.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Load subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (emailParam) {
      loadSubscription();
    }
  }, [emailParam]);

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
          name: name || null,
          categories: selectedCategories,
          technologies: selectedTechnologies,
          frequency: alertFrequency,
          severity_threshold: severityThreshold,
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
    if (!confirm('Are you sure you want to unsubscribe? You will stop receiving all security alerts.')) {
      return;
    }

    setIsUnsubscribing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("unsubscribe", {
        body: { email },
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
                <Button variant="outline" onClick={() => window.location.href = '/news'}>
                  Back to News
                </Button>
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
              {!subscriptionFound ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lookup-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Enter Your Email to Manage Subscription
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="lookup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={loadSubscription} disabled={isLoading || !email}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-6">
                  {/* Email Display */}
                  <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{email}</span>
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
                          <div
                            key={category}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => handleCategoryToggle(category)}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                checked={isSelected} 
                                onClick={(e) => e.stopPropagation()}
                                onCheckedChange={() => handleCategoryToggle(category)}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{categoryInfo.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {categoryInfo.description}
                                </div>
                              </div>
                            </div>
                          </div>
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
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}