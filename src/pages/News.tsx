import { useState, useMemo } from 'react';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsFilters } from '@/components/news/NewsFilters';
import { SubscriptionForm } from '@/components/news/SubscriptionForm';
import { NewsDetail } from '@/components/news/NewsDetail';
import { ThreatStatsDashboard } from '@/components/news/ThreatStatsDashboard';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewsCategory, SeverityLevel, NewsArticle } from '@/types/news';
import { mockNewsArticles, mockSecurityAlerts } from '@/data/newsData';
import { 
  Newspaper, Shield, AlertTriangle, TrendingUp, Bell, BarChart3, 
  Search, Calendar, Clock, ExternalLink, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

const News = () => {
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<SeverityLevel[]>([]);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');

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
    setSearchQuery('');
    setDateFilter('all');
  };

  // Enhanced filtering with search and date
  const filteredArticles = useMemo(() => {
    let articles = [...mockNewsArticles];

    // Category filter
    if (selectedCategories.length > 0) {
      articles = articles.filter(a => selectedCategories.includes(a.category));
    }

    // Severity filter
    if (selectedSeverities.length > 0) {
      articles = articles.filter(a => selectedSeverities.includes(a.severity));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query)) ||
        a.affectedTechnologies?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const cutoff = new Date(now.getTime() - daysMap[dateFilter] * 24 * 60 * 60 * 1000);
      articles = articles.filter(a => new Date(a.publishedAt) >= cutoff);
    }

    // Sort
    if (sortBy === 'date') {
      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      articles.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }

    return articles;
  }, [mockNewsArticles, selectedCategories, selectedSeverities, searchQuery, dateFilter, sortBy]);

  const criticalAlerts = mockSecurityAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = mockSecurityAlerts.filter(alert => alert.severity === 'high');
  const actionRequiredAlerts = mockSecurityAlerts.filter(alert => alert.actionRequired);

  // Calculate real statistics
  const stats = useMemo(() => {
    const total = mockNewsArticles.length;
    const critical = mockNewsArticles.filter(a => a.severity === 'critical').length;
    const high = mockNewsArticles.filter(a => a.severity === 'high').length;
    const supplyChain = mockNewsArticles.filter(a => a.category === 'supply-chain').length;
    const defi = mockNewsArticles.filter(a => a.category === 'defi-exploits').length;
    
    return { total, critical, high, supplyChain, defi };
  }, [mockNewsArticles]);

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const handleBackToNews = () => {
    setSelectedArticle(null);
  };

  // If an article is selected, show the detail view
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-background">
        <MetaTags 
          title={`${selectedArticle.title} | Digibastion Security News`}
          description={selectedArticle.summary}
        />
        <Navbar />
        <main className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <NewsDetail article={selectedArticle} onBack={handleBackToNews} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MetaTags 
        title="Security News & Threat Intelligence | Digibastion"
        description="Real-time Web3 security intelligence, vulnerability disclosures, and threat analysis. Track $2.9B+ in 2024 crypto losses and emerging attack vectors."
      />
      
      <Navbar />
      
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Threat Intelligence Feed</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real-time security intelligence covering $2.9B+ in 2024 crypto losses across 300+ incidents.
              Track North Korean operations, supply chain attacks, and emerging threats.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <Card className="glass-card border-red-500/20">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-red-400">{stats.critical}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-orange-500/20">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-orange-400">{stats.high}</div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-yellow-500/20">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-yellow-400">{actionRequiredAlerts.length}</div>
                <div className="text-xs text-muted-foreground">Action Required</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-purple-500/20">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-purple-400">{stats.supplyChain}</div>
                <div className="text-xs text-muted-foreground">Supply Chain</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-blue-500/20">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-blue-400">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Articles</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                <span className="hidden sm:inline">News Feed</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Alerts</span>
                {actionRequiredAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {actionRequiredAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="subscribe" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Subscribe</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <ThreatStatsDashboard />
            </TabsContent>

            {/* Security News Tab */}
            <TabsContent value="news" className="space-y-6">
              {/* Search and Sort Bar */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search articles, technologies, tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                        <SelectTrigger className="w-32">
                          <Calendar className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="7d">Last 7 Days</SelectItem>
                          <SelectItem value="30d">Last 30 Days</SelectItem>
                          <SelectItem value="90d">Last 90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Latest First</SelectItem>
                          <SelectItem value="severity">By Severity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                  {/* Results count */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Showing {filteredArticles.length} of {mockNewsArticles.length} articles
                    </span>
                    {(selectedCategories.length > 0 || selectedSeverities.length > 0 || searchQuery) && (
                      <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                        Clear all filters
                      </Button>
                    )}
                  </div>

                  {filteredArticles.length > 0 ? (
                    filteredArticles.map((article) => (
                      <NewsCard 
                        key={article.id} 
                        article={article}
                        onClick={() => handleArticleClick(article)}
                      />
                    ))
                  ) : (
                    <Card className="glass-card">
                      <CardContent className="p-8 text-center">
                        <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No articles match your filters</h3>
                        <p className="text-muted-foreground mb-4">
                          Try adjusting your search, category, or severity filters
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
              {/* Critical Alerts */}
              {criticalAlerts.length > 0 && (
                <Card className="glass-card border-red-500/30 bg-red-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                      Critical Alerts ({criticalAlerts.length})
                    </CardTitle>
                    <CardDescription>
                      Immediate action required - these threats are actively being exploited
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {criticalAlerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className="p-4 border border-red-500/20 rounded-lg bg-background/50 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-red-500 text-white">
                                CRITICAL
                              </Badge>
                              {alert.actionRequired && (
                                <Badge variant="outline" className="border-red-500 text-red-400">
                                  Action Required
                                </Badge>
                              )}
                              {alert.cveId && (
                                <Badge variant="secondary">{alert.cveId}</Badge>
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
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* High Priority Alerts */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    High Priority Alerts ({highAlerts.length})
                  </CardTitle>
                  <CardDescription>
                    Important security alerts requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {highAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-orange-500 text-white">
                              HIGH
                            </Badge>
                            {alert.actionRequired && (
                              <Badge variant="outline" className="border-orange-500 text-orange-400">
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
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* All Other Alerts */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    All Active Alerts ({mockSecurityAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockSecurityAlerts
                    .filter(a => a.severity !== 'critical' && a.severity !== 'high')
                    .map((alert) => (
                      <div 
                        key={alert.id}
                        className="p-3 border rounded-lg bg-card/50 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline" 
                              className={
                                alert.severity === 'medium' 
                                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }
                            >
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className="font-medium text-sm">{alert.title}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
