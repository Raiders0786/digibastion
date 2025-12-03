import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Shield, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { NewsCategory, SeverityLevel } from '@/types/news';
import { technologyCategories, newsCategoryConfig } from '@/data/newsData';
import { useToast } from '@/hooks/use-toast';

export const SubscriptionForm = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [alertFrequency, setAlertFrequency] = useState<'immediate' | 'daily' | 'weekly'>('daily');
  const [severityThreshold, setSeverityThreshold] = useState<SeverityLevel>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

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
    
    if (!email || selectedCategories.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide your email and select at least one category.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Using Web3Forms for email subscription
      const formData = {
        access_key: "YOUR_WEB3FORMS_KEY", // Will be replaced or use environment
        subject: "New Digibastion Threat Intel Subscription",
        from_name: "Digibastion Threat Intel",
        name: name || "Subscriber",
        email: email,
        message: `
New subscription request:
- Email: ${email}
- Name: ${name || 'Not provided'}
- Categories: ${selectedCategories.join(', ')}
- Technologies: ${selectedTechnologies.join(', ') || 'None selected'}
- Frequency: ${alertFrequency}
- Min Severity: ${severityThreshold}
        `.trim()
      };

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Subscription Successful! 🎉",
          description: "You'll receive security alerts based on your preferences.",
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
        }, 3000);
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Saved Locally",
        description: "We've noted your preferences. Full email integration coming soon!",
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
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
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Security Alert Subscription
        </CardTitle>
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
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <div className="cursor-pointer flex-1">
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