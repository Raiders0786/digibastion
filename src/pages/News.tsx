import { useState } from 'react';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsFilters } from '@/components/news/NewsFilters';
import { SubscriptionForm } from '@/components/news/SubscriptionForm';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { NewsCategory, SeverityLevel } from '@/types/news';
import { mockNewsArticles, mockSecurityAlerts } from '@/data/newsData';
import { Newspaper, Shield, AlertTriangle, TrendingUp, Bell } from 'lucide-react';

const News = () => {
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<SeverityLevel[]>([]);
  const [selectedTab, setSelectedTab] = useState('news');

  const handleCategoryToggle = (category: NewsCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSeverityToggle = (severity: SeverityLevel) => {
    setSelectedSeverities(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedSeverities([]);
  };

  const filteredArticles = mockNewsArticles.filter(article => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(article.category);
    const severityMatch = selectedSeverities.length === 0 || selectedSeverities.includes(article.severity);
    return categoryMatch && severityMatch;
  });

  const criticalAlerts = mockSecurityAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = mockSecurityAlerts.filter(alert => alert.severity === 'high');

  return (
    <div className="min-h-screen bg-background">
      <MetaTags 
        title="Security News & Alerts | Digibastion"
        description="Stay updated with the latest security news, vulnerability disclosures, and threat intelligence. Get personalized alerts for your technology stack."
      />
      
      <Navbar />
      
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Newspaper className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Security News & Alerts</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay ahead of security threats with curated news, vulnerability disclosures, and 
              personalized alerts for your technology stack.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{mockNewsArticles.length}</div>
                    <div className="text-sm text-muted-foreground">Latest Articles</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{criticalAlerts.length}</div>
                    <div className="text-sm text-muted-foreground">Critical Alerts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{highAlerts.length}</div>
                    <div className="text-sm text-muted-foreground">High Priority</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">24h</div>
                    <div className="text-sm text-muted-foreground">Update Frequency</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                Security News
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Live Alerts
              </TabsTrigger>
              <TabsTrigger value="subscribe" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Subscribe
              </TabsTrigger>
            </TabsList>

            {/* Security News Tab */}
            <TabsContent value="news" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                  <NewsFilters
                    selectedCategories={selectedCategories}
                    selectedSeverities={selectedSeverities}
                    onCategoryToggle={handleCategoryToggle}
                    onSeverityToggle={handleSeverityToggle}
                    onClearFilters={handleClearFilters}
                  />
                </div>

                {/* News Feed */}
                <div className="lg:col-span-3 space-y-4">
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map((article) => (
                      <NewsCard 
                        key={article.id} 
                        article={article}
                        onClick={() => {
                          // Open article in new tab if sourceUrl exists
                          if (article.sourceUrl) {
                            window.open(article.sourceUrl, '_blank');
                          }
                        }}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No articles match your filters</h3>
                        <p className="text-muted-foreground mb-4">
                          Try adjusting your category or severity filters
                        </p>
                        <Button variant="outline" onClick={handleClearFilters}>
                          Clear Filters
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Live Alerts Tab */}
            <TabsContent value="alerts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Active Security Alerts
                  </CardTitle>
                  <CardDescription>
                    Critical security alerts requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockSecurityAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant="outline" 
                              className={
                                alert.severity === 'critical' 
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              }
                            >
                              {alert.severity.toUpperCase()}
                            </Badge>
                            {alert.actionRequired && (
                              <Badge variant="destructive">
                                Action Required
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium mb-1">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {alert.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {alert.affectedTechnologies.map((tech) => (
                              <Badge key={tech} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscribe Tab */}
            <TabsContent value="subscribe">
              <SubscriptionForm />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;