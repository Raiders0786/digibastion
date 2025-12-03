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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewsCategory, SeverityLevel, NewsArticle } from '@/types/news';
import { mockNewsArticles, mockSecurityAlerts } from '@/data/newsData';
import { 
  Newspaper, Shield, AlertTriangle, Bell, BarChart3, 
  Search, Calendar, Clock, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

const News = () => {
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<SeverityLevel[]>([]);
  const [selectedTab, setSelectedTab] = useState('feed'); // Default to News Feed
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

  // Enhanced filtering with search, date, and proper sorting (newest first)
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

    // Sort - ALWAYS by date descending first (newest first - Dec/Nov 2025 first)
    if (sortBy === 'date') {
      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      articles.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    }

    return articles;
  }, [mockNewsArticles, selectedCategories, selectedSeverities, searchQuery, dateFilter, sortBy]);

  // Sort alerts by date descending (newest first)
  const sortedAlerts = useMemo(() => {
    return [...mockSecurityAlerts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [mockSecurityAlerts]);

  const criticalAlerts = sortedAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = sortedAlerts.filter(alert => alert.severity === 'high');
  const actionRequiredAlerts = sortedAlerts.filter(alert => alert.actionRequired);

  // Calculate real statistics
  const stats = useMemo(() => {
    const total = mockNewsArticles.length;
    const critical = mockNewsArticles.filter(a => a.severity === 'critical').length;
    const high = mockNewsArticles.filter(a => a.severity === 'high').length;
    const supplyChain = mockNewsArticles.filter(a => a.category === 'supply-chain').length;
    
    return { total, critical, high, supplyChain };
  }, [mockNewsArticles]);

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const handleBackToNews = () => {
    setSelectedArticle(null);
  };

  // Tab configuration with better visibility
  const tabs = [
    { id: 'feed', label: 'News Feed', icon: Newspaper, count: stats.total },
    { id: 'alerts', label: 'Active Alerts', icon: AlertTriangle, count: actionRequiredAlerts.length },
    { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
    { id: 'subscribe', label: 'Subscribe', icon: Bell },
  ];

  // If an article is selected, show the detail view
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-background">
        <MetaTags 
          title={`${selectedArticle.title} | Digibastion Threat Intel`}
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
        title="Threat Intelligence Feed | Digibastion Security News"
        description="Real-time Web3 security intelligence, vulnerability disclosures, and threat analysis. Track supply chain attacks, DeFi exploits, and North Korean operations."
      />
      
      <Navbar />
      
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section - Compact */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Threat Intelligence Feed</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time security intelligence covering Web3, DeFi, and supply chain threats.
            </p>
          </div>

          {/* Quick Stats Banner - Compact */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
            <Card className="glass-card border-red-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-red-400">{stats.critical}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Critical</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-orange-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-orange-400">{stats.high}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">High</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-purple-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-purple-400">{stats.supplyChain}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Supply Chain</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-blue-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-400">{stats.total}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Tab Navigation - More Visible */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 p-1.5 bg-card/80 rounded-xl border border-border shadow-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                    selectedTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge 
                      variant={selectedTab === tab.id ? "secondary" : "outline"} 
                      className={`ml-1 h-5 min-w-5 px-1.5 text-xs ${
                        tab.id === 'alerts' && tab.count > 0 ? 'bg-red-500 text-white border-0' : ''
                      }`}
                    >
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {selectedTab === 'feed' && (
            <div className="space-y-6">
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
            </div>
          )}

          {selectedTab === 'alerts' && (
            <div className="space-y-6">
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
                              <Badge className="bg-red-500 text-white">CRITICAL</Badge>
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
                            <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {alert.affectedTechnologies.map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
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
              {highAlerts.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-orange-500" />
                      High Priority Alerts ({highAlerts.length})
                    </CardTitle>
                    <CardDescription>Important security alerts requiring attention</CardDescription>
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
                              <Badge className="bg-orange-500 text-white">HIGH</Badge>
                              {alert.actionRequired && (
                                <Badge variant="outline" className="border-orange-500 text-orange-400">
                                  Action Required
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-medium mb-1">{alert.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {alert.affectedTechnologies.map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
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

              {/* Other Alerts */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Other Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sortedAlerts
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(alert.createdAt), 'MMM d')}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTab === 'dashboard' && (
            <ThreatStatsDashboard />
          )}

          {selectedTab === 'subscribe' && (
            <SubscriptionForm />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
