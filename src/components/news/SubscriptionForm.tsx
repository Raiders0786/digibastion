import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Shield, Zap, CheckCircle, Loader2, Clock, Users } from 'lucide-react';
import { NewsCategory, SeverityLevel } from '@/types/news';
import { technologyCategories, newsCategoryConfig } from '@/data/newsData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useSubscriberCount } from '@/hooks/useSubscriberCount';
import { z } from 'zod';

// Input validation schema
const subscriptionSchema = z.object({
  name: z.string().max(100, "Name must be less than 100 characters").optional(),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  categories: z.array(z.string()).min(1, "Select at least one category").max(10),
  technologies: z.array(z.string()).max(20).optional(),
  frequency: z.enum(["immediate", "daily", "weekly"]),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  preferred_hour: z.number().min(0).max(23).optional(),
  timezone_offset: z.number().min(-12).max(14).optional(),
  preferred_day: z.number().min(0).max(6).optional(),
});

// Timezone options
const timezoneOptions = [
  { value: -12, label: 'UTC-12' },
  { value: -11, label: 'UTC-11' },
  { value: -10, label: 'UTC-10 (Hawaii)' },
  { value: -9, label: 'UTC-9 (Alaska)' },
  { value: -8, label: 'UTC-8 (Pacific)' },
  { value: -7, label: 'UTC-7 (Mountain)' },
  { value: -6, label: 'UTC-6 (Central)' },
  { value: -5, label: 'UTC-5 (Eastern)' },
  { value: -4, label: 'UTC-4 (Atlantic)' },
  { value: -3, label: 'UTC-3' },
  { value: -2, label: 'UTC-2' },
  { value: -1, label: 'UTC-1' },
  { value: 0, label: 'UTC+0 (London)' },
  { value: 1, label: 'UTC+1 (Paris)' },
  { value: 2, label: 'UTC+2 (Cairo)' },
  { value: 3, label: 'UTC+3 (Moscow)' },
  { value: 4, label: 'UTC+4 (Dubai)' },
  { value: 5, label: 'UTC+5 (Karachi)' },
  { value: 5.5, label: 'UTC+5:30 (India)' },
  { value: 6, label: 'UTC+6 (Dhaka)' },
  { value: 7, label: 'UTC+7 (Bangkok)' },
  { value: 8, label: 'UTC+8 (Singapore)' },
  { value: 9, label: 'UTC+9 (Tokyo)' },
  { value: 10, label: 'UTC+10 (Sydney)' },
  { value: 11, label: 'UTC+11' },
  { value: 12, label: 'UTC+12 (Auckland)' },
];

const dayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const hourOptions = [
  { value: 6, label: '6:00 AM' },
  { value: 7, label: '7:00 AM' },
  { value: 8, label: '8:00 AM' },
  { value: 9, label: '9:00 AM' },
  { value: 10, label: '10:00 AM' },
  { value: 11, label: '11:00 AM' },
  { value: 12, label: '12:00 PM' },
  { value: 13, label: '1:00 PM' },
  { value: 14, label: '2:00 PM' },
  { value: 15, label: '3:00 PM' },
  { value: 16, label: '4:00 PM' },
  { value: 17, label: '5:00 PM' },
  { value: 18, label: '6:00 PM' },
  { value: 19, label: '7:00 PM' },
  { value: 20, label: '8:00 PM' },
];

export const SubscriptionForm = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [alertFrequency, setAlertFrequency] = useState<'immediate' | 'daily' | 'weekly'>('daily');
  const [severityThreshold, setSeverityThreshold] = useState<SeverityLevel>('medium');
  const [preferredHour, setPreferredHour] = useState<number>(9);
  const [timezoneOffset, setTimezoneOffset] = useState<number>(0);
  const [preferredDay, setPreferredDay] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { data: subscriberCount } = useSubscriberCount();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rawData = {
      name: name || undefined,
      email,
      categories: selectedCategories,
      technologies: selectedTechnologies,
      frequency: alertFrequency,
      severity: severityThreshold,
      preferred_hour: preferredHour,
      timezone_offset: Math.floor(timezoneOffset), // Handle .5 offsets
      preferred_day: preferredDay,
    };

    // Validate inputs
    const validation = subscriptionSchema.safeParse(rawData);
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
        body: { type: "subscription", data: validation.data },
      });

      if (error) throw error;

      if (data?.success) {
        setIsSuccess(true);
        const message = data?.needsVerification 
          ? "Please check your email to verify your subscription."
          : "You'll receive security alerts based on your preferences.";
        toast({
          title: data?.needsVerification ? "Verification Email Sent! 📧" : "Subscription Updated! 🎉",
          description: message,
        });
        
        // Reset form after delay
        setTimeout(() => {
          setEmail('');
          setName('');
          setSelectedCategories([]);
          setSelectedTechnologies([]);
          setAlertFrequency('daily');
          setSeverityThreshold('medium');
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

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-4xl mx-auto glass-card glow">
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">You're Subscribed!</h2>
          <p className="text-muted-foreground">
            You'll receive threat intelligence updates based on your preferences.
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
          {subscriberCount && subscriberCount.count > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">{subscriberCount.label}</span>
            </Badge>
          )}
        </div>
        <CardDescription>
          Get personalized security alerts based on your technology stack. No login required - 
          we'll send updates directly to your email.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Email Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
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
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                className="w-full"
              />
            </div>
          </div>

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
              {(Object.keys(newsCategoryConfig) as NewsCategory[]).map((category) => {
                const categoryInfo = newsCategoryConfig[category];
                const isSelected = selectedCategories.includes(category);
                
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
                      <div className="cursor-pointer flex-1">
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
              Select technologies to get alerts when they're compromised
            </p>
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
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour.value} value={String(hour.value)}>
                          {hour.label}
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
                      {timezoneOptions.map((tz) => (
                        <SelectItem key={tz.value} value={String(tz.value)}>
                          {tz.label}
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
                        {dayOptions.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {alertFrequency === 'weekly' 
                  ? `You'll receive your digest every ${dayOptions.find(d => d.value === preferredDay)?.label} at ${hourOptions.find(h => h.value === preferredHour)?.label}`
                  : `You'll receive your digest daily at ${hourOptions.find(h => h.value === preferredHour)?.label}`
                }
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
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

          <p className="text-xs text-muted-foreground text-center">
            Your email will only be used for security alerts. You can unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
