import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsFilters } from '@/components/news/NewsFilters';
import { SubscriptionForm } from '@/components/news/SubscriptionForm';
import { NewsDetail } from '@/components/news/NewsDetail';
import { ThreatStatsDashboard } from '@/components/news/ThreatStatsDashboard';
import { RealtimeAlertListener } from '@/components/news/RealtimeAlertListener';
import { RealtimeStatusIndicator } from '@/components/news/RealtimeStatusIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewsCategory, SeverityLevel, NewsArticle } from '@/types/news';
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { 
  Newspaper, Shield, AlertTriangle, Bell, BarChart3, 
  Search, Calendar, Clock, ChevronRight, RefreshCw, Loader2, Database, Sparkles, Home, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

const News = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<SeverityLevel[]>([]);
  const [selectedTab, setSelectedTab] = useState('feed');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');

  // Fetch articles from database
  const { 
    articles: dbArticles, 
    isLoading, 
    error,
    refetch,
    refreshFromRSS, 
    summarizeArticles,
    isRefreshing,
    isSummarizing,
    stats 
  } = useNewsArticles({
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    severities: selectedSeverities.length > 0 ? selectedSeverities : undefined,
    searchQuery,
    dateFilter,
    sortBy,
  });

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

  // Use database articles directly (filtering handled by hook)
  const filteredArticles = dbArticles;

  // Filter articles by severity for alerts tab - using real database data
  const criticalAlerts = useMemo(() => {
    return dbArticles.filter(article => article.severity === 'critical');
  }, [dbArticles]);

  const highAlerts = useMemo(() => {
    return dbArticles.filter(article => article.severity === 'high');
  }, [dbArticles]);

  const actionRequiredAlerts = useMemo(() => {
    return dbArticles.filter(article => 
      article.severity === 'critical' || article.severity === 'high'
    );
  }, [dbArticles]);

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const handleBackToNews = () => {
    setSelectedArticle(null);
  };

  // Handle new articles from realtime
  const handleNewRealtimeArticle = useCallback(() => {
    // Refetch to include the new article
    refetch();
  }, [refetch]);

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
            <NewsDetail 
              article={selectedArticle} 
              onBack={handleBackToNews} 
              onArticleClick={handleArticleClick}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Realtime Alert Listener */}
      <RealtimeAlertListener 
        onNewArticle={handleNewRealtimeArticle} 
        enabled={true} 
      />

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
              <RealtimeStatusIndicator />
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
                  {/* Results count and refresh button */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {isLoading ? 'Loading...' : `Showing ${filteredArticles.length} articles`}
                      </span>
                      {stats.total > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Database className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={summarizeArticles}
                        disabled={isSummarizing || stats.total === 0}
                        className="bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20"
                      >
                        {isSummarizing ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-1 text-purple-400" />
                        )}
                        {isSummarizing ? 'Summarizing...' : 'AI Summarize'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refreshFromRSS}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-1" />
                        )}
                        {isRefreshing ? 'Fetching...' : 'Refresh'}
                      </Button>
                      {(selectedCategories.length > 0 || selectedSeverities.length > 0 || searchQuery) && (
                        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </div>

                  {isLoading ? (
                    <Card className="glass-card">
                      <CardContent className="p-8 text-center">
                        <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                        <h3 className="text-lg font-medium mb-2">Loading threat intelligence...</h3>
                        <p className="text-muted-foreground">
                          Fetching the latest security news
                        </p>
                      </CardContent>
                    </Card>
                  ) : filteredArticles.length > 0 ? (
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
                        <h3 className="text-lg font-medium mb-2">
                          {stats.total === 0 ? 'No articles yet' : 'No articles match your filters'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {stats.total === 0 
                            ? 'Click "Refresh" to fetch the latest security news from RSS feeds'
                            : 'Try adjusting your search, category, or severity filters'
                          }
                        </p>
                        {stats.total === 0 ? (
                          <Button onClick={refreshFromRSS} disabled={isRefreshing}>
                            {isRefreshing ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Fetch News
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={handleClearFilters}>
                            Clear Filters
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'alerts' && (
            <ErrorBoundary>
              <div className="space-y-6">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/')}
                    className="h-auto p-1 hover:text-foreground"
                  >
                    <Home className="w-4 h-4" />
                  </Button>
                  <span>/</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedTab('feed')}
                    className="h-auto p-1 hover:text-foreground"
                  >
                    Threat Intel
                  </Button>
                  <span>/</span>
                  <span className="text-foreground">Active Alerts</span>
                </nav>

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
                        className="p-4 border border-red-500/20 rounded-lg bg-background/50 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handleArticleClick(alert)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-red-500 text-white">CRITICAL</Badge>
                              <Badge variant="outline" className="border-red-500 text-red-400">
                                Action Required
                              </Badge>
                              {alert.cveId && (
                                <Badge variant="secondary">{alert.cveId}</Badge>
                              )}
                            </div>
                            <h3 className="font-medium mb-1">{alert.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{alert.summary}</p>
                            <div className="flex flex-wrap gap-1">
                              {alert.affectedTechnologies?.map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(alert.publishedAt), 'MMM d, yyyy')}
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
                        className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handleArticleClick(alert)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-orange-500 text-white">HIGH</Badge>
                              <Badge variant="outline" className="border-orange-500 text-orange-400">
                                Action Required
                              </Badge>
                            </div>
                            <h3 className="font-medium mb-1">{alert.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{alert.summary}</p>
                            <div className="flex flex-wrap gap-1">
                              {alert.affectedTechnologies?.map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(alert.publishedAt), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Other Alerts (Medium/Low) */}
              {dbArticles.filter(a => a.severity !== 'critical' && a.severity !== 'high').length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Other Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dbArticles
                    .filter(a => a.severity !== 'critical' && a.severity !== 'high')
                    .map((alert) => (
                      <div 
                        key={alert.id}
                        className="p-3 border rounded-lg bg-card/50 hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => handleArticleClick(alert)}
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
                              {format(new Date(alert.publishedAt), 'MMM d')}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
              )}

              {/* Empty state */}
              {dbArticles.length === 0 && (
                <Card className="glass-card">
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No alerts available</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Refresh" on the News Feed tab to fetch the latest security alerts
                    </p>
                    <Button onClick={() => setSelectedTab('feed')}>
                      Go to News Feed
                    </Button>
                  </CardContent>
                </Card>
              )}
              </div>
            </ErrorBoundary>
          )}

          {selectedTab === 'dashboard' && (
            <ErrorBoundary>
              <div className="space-y-4">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/')}
                    className="h-auto p-1 hover:text-foreground"
                  >
                    <Home className="w-4 h-4" />
                  </Button>
                  <span>/</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedTab('feed')}
                    className="h-auto p-1 hover:text-foreground"
                  >
                    Threat Intel
                  </Button>
                  <span>/</span>
                  <span className="text-foreground">Analytics</span>
                </nav>
                <ThreatStatsDashboard />
              </div>
            </ErrorBoundary>
          )}

          {selectedTab === 'subscribe' && (
            <ErrorBoundary>
              <div className="space-y-4">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/')}
                    className="h-auto p-1 hover:text-foreground"
                  >
                    <Home className="w-4 h-4" />
                  </Button>
                  <span>/</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedTab('feed')}
                    className="h-auto p-1 hover:text-foreground"
                  >
                    Threat Intel
                  </Button>
                  <span>/</span>
                  <span className="text-foreground">Subscribe</span>
                </nav>
                <SubscriptionForm />
              </div>
            </ErrorBoundary>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
