import { Fragment, useState, useMemo, useCallback, useEffect, useRef, type KeyboardEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsFilters } from '@/components/news/NewsFilters';
import { SubscriptionForm } from '@/components/news/SubscriptionForm';
import { NewsDetail } from '@/components/news/NewsDetail';
import { countActiveFilters, FeedToolbar } from '@/components/news/FeedToolbar';
import { InlineSubscribeCard } from '@/components/news/InlineSubscribeCard';
import { AlertsPanel } from '@/components/news/AlertsPanel';
import { RealtimeAlertListener } from '@/components/news/RealtimeAlertListener';
import { RealtimeStatusIndicator } from '@/components/news/RealtimeStatusIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { SwipeableTabs } from '@/components/mobile/SwipeableTabs';
import { NewsListSkeleton, StatsSkeleton } from '@/components/news/NewsCardSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewsCategory, SeverityLevel, NewsArticle } from '@/types/news';
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { useThreatIntelAlerts } from '@/hooks/useThreatIntelAlerts';
import { useThreatIntelFacets } from '@/hooks/useThreatIntelFacets';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { ThreatIntelFilterInput } from '@/lib/threatIntel/query';
import { DEFAULT_SCOPE, SEVERITY_STYLES } from '@/lib/threatIntel/taxonomy';
import { METHODOLOGY_PATH, TELEGRAM_CHANNEL_URL } from '@/lib/threatIntel/officialLinks';
import {
  parseThreatIntelFilters,
  withListParam,
  withScopeParam,
  type IncidentListParam,
  type SourceFilter,
  type VerificationFilter,
} from '@/lib/threatIntel/query';
import { serializeJsonLd } from '@/utils/jsonLd';
import {
  getDuplicateOfUid,
  isPublishable,
  mapNewsArticleRow,
  NEWS_ARTICLE_COLUMNS,
} from '@/lib/threatIntel/articleRow';
import {
  buildNewsArticleSchema,
  buildNewsBreadcrumbSchema,
  buildThreatIntelCollectionSchema,
} from '@/utils/seo';
import { 
  Newspaper, Shield, AlertTriangle, Bell, BellRing, Send,
  Clock, ChevronRight, RefreshCw, Loader2, Database, Sparkles, Home, ArrowLeft, Flame, RadioTower
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const SEARCH_DEBOUNCE_MS = 300;

/** The inline subscribe card follows this many results. */
const INLINE_SUBSCRIBE_AFTER = 5;

const News = () => {
  const navigate = useNavigate();
  const { articleId: routeArticleId } = useParams<{ articleId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  // Every shareable filter comes from the URL through one parser. No ?scope
  // (or an unknown value) means the default Web3 incidents view.
  const urlFilters = useMemo(() => parseThreatIntelFilters(searchParams), [searchParams]);
  const selectedCategories = urlFilters.categories;
  const selectedSeverities = urlFilters.severities;
  const [selectedTab, setSelectedTab] = useState(() => {
    const requestedTab = searchParams.get('tab');
    return requestedTab && ['feed', 'alerts', 'subscribe'].includes(requestedTab) ? requestedTab : 'feed';
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alertsPage, setAlertsPage] = useState(1);

  useEffect(() => {
    let active = true;
    let authUpdateTimer: ReturnType<typeof setTimeout> | undefined;

    const updateAdminState = async (providedSession?: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      const session = providedSession ?? (await supabase.auth.getSession()).data.session;
      if (!session) {
        if (active) setIsAdmin(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (active) setIsAdmin(Boolean(roleData));
    };

    void updateAdminState();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase holds an internal auth lock while this callback runs. Defer
      // database work so function invocations cannot become stuck behind it.
      if (authUpdateTimer) clearTimeout(authUpdateTimer);
      authUpdateTimer = setTimeout(() => {
        void updateAdminState(session);
      }, 0);
    });

    return () => {
      active = false;
      if (authUpdateTimer) clearTimeout(authUpdateTimer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    setSelectedTab(tabFromUrl && ['feed', 'alerts', 'subscribe'].includes(tabFromUrl) ? tabFromUrl : 'feed');
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (tabId === 'feed') next.delete('tab');
      else next.set('tab', tabId);
      return next;
    });
  };
const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [deepLinkState, setDeepLinkState] = useState<'idle' | 'loading' | 'not-found' | 'error'>('idle');
  const {
    searchQuery,
    sortBy,
    dateFilter,
    scope: feedView,
    page: currentPage,
    pageSize,
    verification,
    chains,
    attackTypes,
    sources,
  } = urlFilters;
  const incidentFilters = useMemo(
    () => ({ verification, chains, attackTypes, sources }),
    [verification, chains, attackTypes, sources],
  );
  // "Get email alerts" (Subscribe to this view) carries the current view so the
  // form opens pre-filled: scope, categories, chains and the status filter.
  const subscribeHref = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    // Emails do not filter by search text, date, attack type or source, so the
    // subscribe link leaves those out rather than implying that they do.
    ['page', 'q', 'article', 'sort', 'date', 'attack', 'source'].forEach((key) => next.delete(key));
    next.set('scope', feedView);
    next.set('tab', 'subscribe');
    return `/threat-intel?${next.toString()}`;
  }, [searchParams, feedView]);

  const updateFeedParam = useCallback((key: string, value: string | null, replace = false) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('category');
      next.delete('severity');
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    }, { replace });
  }, [setSearchParams]);

  const setCurrentPage = useCallback((page: number | ((current: number) => number)) => {
    const nextPage = typeof page === 'function' ? page(currentPage) : page;
    updateFeedParam('page', nextPage > 1 ? String(nextPage) : null);
  }, [currentPage, updateFeedParam]);

  // Typing stays local; ?q= (and therefore the feed query) only changes after
  // the user pauses for SEARCH_DEBOUNCE_MS.
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const lastSyncedSearch = useRef(searchQuery);

  // URL -> input: Clear filters, Back/Forward and shared links.
  useEffect(() => {
    if (searchQuery === lastSyncedSearch.current) return;
    lastSyncedSearch.current = searchQuery;
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Input -> URL, once typing pauses. Invariant: the URL wins after an
  // external change (Clear filters, Back). updateFeedParam is read through a
  // ref because setSearchParams changes identity on every navigation, and
  // re-running this effect then would write a stale debounced value back.
  const updateFeedParamRef = useRef(updateFeedParam);
  updateFeedParamRef.current = updateFeedParam;
  useEffect(() => {
    if (debouncedSearch !== searchInput) return;
    if (debouncedSearch === lastSyncedSearch.current) return;
    lastSyncedSearch.current = debouncedSearch;
    updateFeedParamRef.current('q', debouncedSearch || null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Fetch articles from database
  const { 
    articles: dbArticles, 
    isLoading, 
    error,
    refetch,
    refreshFromRSS,
    refreshWeb3Incidents,
    summarizeArticles,
    isRefreshing,
    isRefreshingWeb3,
    isSummarizing,
    feedStatus,
    stats,
    statsSource,
    pagination
  } = useNewsArticles({
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    severities: selectedSeverities.length > 0 ? selectedSeverities : undefined,
    searchQuery,
    dateFilter,
    sortBy,
    view: feedView,
    page: currentPage,
    pageSize,
    verification,
    chains,
    attackTypes,
    sources,
  });
  const facets = useThreatIntelFacets(feedView);

  // Alerts follow the same view and filters as the feed (severity is narrowed
  // to critical/high inside the hook) and page 20 at a time.
  // Explicit type: without it `dateFilter` widens to string in the object literal.
  const alertFilters = useMemo<ThreatIntelFilterInput>(() => ({
    scope: feedView,
    categories: selectedCategories,
    severities: selectedSeverities,
    searchQuery,
    dateFilter,
    ...incidentFilters,
  }), [feedView, selectedCategories, selectedSeverities, searchQuery, dateFilter, incidentFilters]);
  const alertFiltersKey = JSON.stringify(alertFilters);

  // A different view or filter set starts the alert list from page 1.
  useEffect(() => {
    setAlertsPage(1);
  }, [alertFiltersKey]);

  const {
    alerts: activeAlerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
    criticalCount: alertsCriticalCount,
    highCount: alertsHighCount,
    totalPages: alertsTotalPages,
  } = useThreatIntelAlerts({
    filters: alertFilters,
    page: alertsPage,
    enabled: selectedTab === 'alerts',
  });

  // Alerts can expire or be merged while someone is paging, so the total can
  // drop below the current page. Move back to the last page that exists.
  useEffect(() => {
    if (!alertsLoading && alertsPage > alertsTotalPages) setAlertsPage(Math.max(1, alertsTotalPages));
  }, [alertsLoading, alertsPage, alertsTotalPages]);

  // Keep legacy ?article= links working while using a crawlable canonical route.
  const requestedArticleId = (routeArticleId || searchParams.get('article') || '').trim();
  const deepLinkLoaded = useRef('');
  // Read the loaded list through a ref: a feed refresh must not cancel an
  // in-flight deep-link fetch (the effect below only restarts on route change).
  const dbArticlesRef = useRef(dbArticles);
  useEffect(() => {
    dbArticlesRef.current = dbArticles;
  }, [dbArticles]);
  useEffect(() => {
    if (!requestedArticleId) {
      // Article content is route-owned. Browser Back/Forward can change the
      // URL without calling our in-page back button, so clear stale detail
      // state whenever the route no longer identifies an article.
      setSelectedArticle(null);
      setDeepLinkState('idle');
      deepLinkLoaded.current = '';
      return;
    }
    if (!/^[A-Za-z0-9._:-]{1,128}$/.test(requestedArticleId)) {
      setDeepLinkState('not-found');
      return;
    }
    if (deepLinkLoaded.current === requestedArticleId) return;
    deepLinkLoaded.current = requestedArticleId;

    // Check if article is already in loaded list
    const found = dbArticlesRef.current.find(a => a.id === requestedArticleId);
    if (found) {
      setSelectedArticle(found);
      setDeepLinkState('idle');
      return;
    }

    // Fetch from DB
    let cancelled = false;
    (async () => {
      setDeepLinkState('loading');
      const { data, error: articleError } = await supabase
        .from('news_articles')
        .select(NEWS_ARTICLE_COLUMNS)
        .eq('id', requestedArticleId)
        .maybeSingle();
      if (cancelled) return;
      if (articleError) {
        setDeepLinkState('error');
        return;
      }
      const article = mapNewsArticleRow(data);
      if (!article) {
        setDeepLinkState('not-found');
        return;
      }

      // A record merged into another provider's incident keeps its old URL
      // working (shared links, emails) by forwarding to the primary record.
      const primaryUid = getDuplicateOfUid(article.metadata);
      if (primaryUid) {
        const { data: primary } = await supabase
          .from('news_articles')
          .select('id, metadata')
          .eq('uid', primaryUid)
          .maybeSingle();
        if (cancelled) return;
        // Only forward to a record that is not itself merged, so a bad merge
        // (A -> B -> A) can never send the browser round in a loop.
        if (primary?.id && primary.id !== article.id && !getDuplicateOfUid(primary.metadata)) {
          deepLinkLoaded.current = '';
          navigate(`/threat-intel/${encodeURIComponent(primary.id)}`, { replace: true });
          return;
        }
        setDeepLinkState('not-found');
        return;
      }

      if (!isPublishable(article.metadata)) {
        setDeepLinkState('not-found');
        return;
      }
      setSelectedArticle(article);
      setDeepLinkState('idle');
    })();

    return () => {
      // Prevent an article request that finishes after browser Back/Forward
      // from restoring detail content for a route the user already left.
      cancelled = true;
    };
  }, [requestedArticleId, navigate]);

  useEffect(() => {
    if (!requestedArticleId) return;
    const refreshedArticle = dbArticles.find((article) => article.id === requestedArticleId);
    if (refreshedArticle) {
      setSelectedArticle((current) => current?.id === requestedArticleId ? refreshedArticle : current);
    }
  }, [dbArticles, requestedArticleId]);

  // Auto-refresh for Active Alerts tab
  useEffect(() => {
    if (selectedTab !== 'alerts' || autoRefreshInterval === 0) return;
    
    const intervalId = setInterval(() => {
      void refetchAlerts();
    }, autoRefreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [selectedTab, autoRefreshInterval, refetchAlerts]);

  const handleCategoryToggle = (category: NewsCategory) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((current) => current !== category)
      : [...selectedCategories, category];
    updateFeedParam('categories', next.length > 0 ? next.join(',') : null);
  };

  const handleSeverityToggle = (severity: SeverityLevel) => {
    const next = selectedSeverities.includes(severity)
      ? selectedSeverities.filter((current) => current !== severity)
      : [...selectedSeverities, severity];
    updateFeedParam('severities', next.length > 0 ? next.join(',') : null);
  };

  const toggleListParam = (key: IncidentListParam, selected: readonly string[], value: string) => {
    const next = selected.includes(value)
      ? selected.filter((current) => current !== value)
      : [...selected, value];
    setSearchParams((current) => withListParam(current, key, next));
  };

  const handleVerificationChange = (value: VerificationFilter) => {
    updateFeedParam('status', value === 'all' ? null : value);
  };

  // Scope changes go through withScopeParam so Web3-only filters leave the
  // URL with the view.
  const handleScopeChange = (value: typeof feedView) => {
    setSearchParams((current) => withScopeParam(current, value));
  };

  const handleClearFilters = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      [
        'categories', 'category', 'severities', 'severity', 'q', 'date', 'sort', 'scope', 'page',
        'status', 'chain', 'attack', 'source',
      ].forEach((key) => next.delete(key));
      return next;
    });
  };

  // Use database articles directly (filtering handled by hook)
  const filteredArticles = dbArticles;

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    const query = searchParams.toString();
    navigate(`/threat-intel/${encodeURIComponent(article.id)}${query ? `?${query}` : ''}`);
  };

  const handleBackToNews = () => {
    setSelectedArticle(null);
    setDeepLinkState('idle');
    deepLinkLoaded.current = '';
    const next = new URLSearchParams(searchParams);
    next.delete('article');
    if (selectedTab === 'feed') next.delete('tab');
    else next.set('tab', selectedTab);
    navigate(`/threat-intel${next.size > 0 ? `?${next.toString()}` : ''}`);
  };

  // Handle new articles from realtime
  const handleNewRealtimeArticle = useCallback(() => {
    void Promise.all([refetch(), refetchAlerts()]);
  }, [refetch, refetchAlerts]);

  // Tiles say "in this view" only when the server counted the whole result.
  const statsCaption = statsSource === 'server' ? 'in this view' : 'on this page';

  // Tab configuration with better visibility
  const tabs = [
    { id: 'feed', label: 'News Feed', shortLabel: 'Feed', icon: Newspaper, count: stats.total },
    // Feed stats share the alerts' scope and filters, so this matches the
    // Alerts tab total and is available before the tab is opened.
    { id: 'alerts', label: 'Active Alerts', shortLabel: 'Alerts', icon: AlertTriangle, count: stats.critical + stats.high },
    { id: 'subscribe', label: 'Subscribe', shortLabel: 'Subscribe', icon: Bell },
  ];

  // Every filter the mobile "Filters (n)" count includes, plus search and a
  // non-default scope, gets the header's "Clear filters" control.
  const hasClearableFilters = countActiveFilters({ selectedCategories, selectedSeverities, dateFilter, sortBy, incidentFilters }) > 0
    || Boolean(searchQuery)
    || feedView !== DEFAULT_SCOPE;
  // Filters that can empty the feed. Sort order and scope only reorder or widen it.
  const hasNarrowingFilters = countActiveFilters({ selectedCategories, selectedSeverities, dateFilter, sortBy: 'date', incidentFilters }) > 0
    || Boolean(searchQuery);

  const isIncidentView = feedView === 'web3-incidents';
  const heroTitle = isIncidentView
    ? 'Crypto and Web3 security incidents, as they happen'
    : 'Security news and incident alerts';
  const heroIntro = isIncidentView
    ? 'Hacks, exploits, phishing and supply-chain attacks, collected from QuillMonitor and other incident trackers, merged into one record per incident, and labelled confirmed or unconfirmed.'
    : 'Security news, vulnerability advisories and Web3 incidents from QuillMonitor, other incident trackers and security publishers, each linked to its source.';
  // The CTA buttons below say the same thing, so phones skip this sentence to
  // keep the first card above the fold.
  const heroAlertsSentence = 'Free alerts on Telegram and by email.';

  // statsCaption comes from task B3: "in this view" when threat_intel_stats
  // counted the whole filtered result, "on this page" when it fell back to
  // counting the loaded page.
  const statTiles = [
    { label: 'Critical', value: stats.critical, color: SEVERITY_STYLES.critical.textClass, border: 'border-red-500/20', scope: statsCaption },
    { label: 'High', value: stats.high, color: SEVERITY_STYLES.high.textClass, border: 'border-orange-500/20', scope: statsCaption },
    { label: 'Supply chain', value: stats.supplyChain, color: 'text-purple-400', border: 'border-purple-500/20', scope: statsCaption },
    { label: 'Total', value: stats.total, color: 'text-blue-400', border: 'border-blue-500/20', scope: statsCaption },
  ];

  // Get current tab index for swipe navigation
  const currentTabIndex = tabs.findIndex(t => t.id === selectedTab);

  // Handle swipe navigation
  const handleSwipe = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? Math.min(currentTabIndex + 1, tabs.length - 1)
      : Math.max(currentTabIndex - 1, 0);
    handleTabChange(tabs[newIndex].id);
  };

  // WAI-ARIA tabs: arrow keys, Home and End move between tabs.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (currentTabIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentTabIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    handleTabChange(nextTab.id);
    document.getElementById(`threat-intel-tab-${nextTab.id}`)?.focus();
  };

  // Pull to refresh handler
  const handlePullToRefresh = async () => {
    await refetch();
  };

  if (requestedArticleId && deepLinkState === 'not-found') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MetaTags
          title="Threat-intelligence article not found | Digibastion"
          description="This threat-intelligence article is unavailable or the link is invalid."
          noindex
        />
        <Navbar />
        <main className="flex-grow pt-28 pb-12 px-4">
          <div className="mx-auto max-w-xl rounded-xl border border-border/60 bg-card/50 p-8 text-center">
            <h1 className="text-2xl font-semibold">Threat-intelligence article not found</h1>
            <p className="mt-3 text-muted-foreground">The record may have been removed, or the link may be incomplete.</p>
            <Button className="mt-6" onClick={() => navigate('/threat-intel')}>Browse threat intelligence</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If an article is selected, show the detail view
  if (selectedArticle) {
    const articleStructuredData = [
      buildNewsArticleSchema({
        id: selectedArticle.id,
        title: selectedArticle.title,
        description: selectedArticle.summary,
        category: selectedArticle.category,
        publishedAt: selectedArticle.publishedAt,
        author: selectedArticle.author,
        tags: selectedArticle.tags,
        sourceUrl: selectedArticle.link,
      }),
      buildNewsBreadcrumbSchema(selectedArticle),
    ];

    return (
      <div className="min-h-screen bg-background">
        <MetaTags 
          title={`${selectedArticle.title} | Digibastion Threat Intel`}
          description={selectedArticle.summary}
          canonical={`https://www.digibastion.com/threat-intel/${encodeURIComponent(selectedArticle.id)}`}
          image="https://www.digibastion.com/og-threat-intel.png"
          imageAlt={`${selectedArticle.title} — Digibastion threat intelligence`}
          type="article"
          publishedTime={selectedArticle.publishedAt.toISOString()}
          author={selectedArticle.author || selectedArticle.sourceName || 'Digibastion'}
          section={selectedArticle.category}
          tags={selectedArticle.tags}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleStructuredData) }} />
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
    <PullToRefresh onRefresh={handlePullToRefresh} isRefreshing={isLoading}>
      <div className="min-h-screen bg-background">
        {/* Realtime Alert Listener */}
        <RealtimeAlertListener
        onNewArticle={handleNewRealtimeArticle} 
        enabled={true} 
      />

      <MetaTags
        title="Crypto and Web3 Security Incidents, As They Happen | Digibastion"
        description="Crypto and Web3 hacks, exploits, phishing and supply-chain attacks from QuillMonitor and other trackers, one record per incident, labelled confirmed or unconfirmed. Free alerts on Telegram and email."
        keywords="crypto hacks, web3 security incidents, defi exploits, crypto phishing, supply chain attacks, crypto security alerts, telegram security alerts"
        image="https://www.digibastion.com/og-threat-intel.png"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildThreatIntelCollectionSchema()) }} />
      
      <Navbar />
      
      <main className="pt-[4.5rem] pb-12 sm:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="mb-3 text-center sm:mb-6" aria-labelledby="threat-intel-heading">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden="true" />
              <RealtimeStatusIndicator />
            </div>
            <h1
              id="threat-intel-heading"
              className="mx-auto max-w-3xl text-balance text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl"
            >
              {heroTitle}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl px-2 text-sm text-muted-foreground sm:text-base">
              {heroIntro}
              <span className="hidden sm:inline"> {heroAlertsSentence}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:mt-4">
              <Button asChild size="sm" className="gap-2">
                <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Join on Telegram
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to={subscribeHref}>
                  <BellRing className="h-4 w-4" aria-hidden="true" />
                  Get email alerts
                </Link>
              </Button>
            </div>
          </section>

          {/* Stat tiles: one row on every screen size. Counts cover the whole
              filtered result (threat_intel_stats) unless statsCaption says otherwise. */}
          {isLoading && stats.total === 0 ? (
            <div className="mb-3 sm:mb-6">
              <StatsSkeleton />
            </div>
          ) : (
            <div className="mb-3 grid grid-cols-4 gap-1.5 sm:mb-6 sm:gap-2">
              {statTiles.map((tile) => (
                <Card key={tile.label} className={`glass-card ${tile.border}`}>
                  <CardContent className="p-1.5 text-center sm:p-3">
                    <div className={`text-base font-bold sm:text-xl ${tile.color}`}>{tile.value}</div>
                    <div className="text-[10px] leading-tight text-muted-foreground sm:text-xs">{tile.label}</div>
                    <div className="mt-0.5 text-[9px] leading-tight text-muted-foreground/60 sm:text-[10px]">{tile.scope}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Section tabs: three equal columns with short labels on phones */}
          <div className="mb-3 sm:mb-6">
            <div
              role="tablist"
              aria-label="Threat intelligence sections"
              className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card/80 p-1 shadow-lg sm:flex sm:gap-2 sm:p-1.5"
            >
              {tabs.map((tab) => {
                const selected = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`threat-intel-tab-${tab.id}`}
                    aria-selected={selected}
                    aria-label={tab.count ? `${tab.label} (${tab.count})` : tab.label}
                    aria-controls={`threat-intel-panel-${tab.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => handleTabChange(tab.id)}
                    onKeyDown={handleTabKeyDown}
                    className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                      selected
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <Badge
                        variant={selected ? 'secondary' : 'outline'}
                        className={`h-5 min-w-5 px-1 text-[10px] sm:ml-1 sm:px-1.5 sm:text-xs ${
                          tab.id === 'alerts' ? 'bg-red-500 text-white border-0' : ''
                        }`}
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content - Swipeable on mobile */}
          <SwipeableTabs
            currentIndex={currentTabIndex}
            tabCount={tabs.length}
            onSwipe={handleSwipe}
          >
          {selectedTab === 'feed' && (
            <div
              className="space-y-4 sm:space-y-6"
              role="tabpanel"
              id="threat-intel-panel-feed"
              aria-labelledby="threat-intel-tab-feed"
            >
              {/* Search stays debounced: the toolbar edits searchInput, and the
                  effect above writes ?q= once typing pauses. */}
              <FeedToolbar
                searchQuery={searchInput}
                onSearchChange={setSearchInput}
                scope={feedView}
                onScopeChange={handleScopeChange}
                dateFilter={dateFilter}
                onDateFilterChange={(value) => updateFeedParam('date', value === 'all' ? null : value)}
                sortBy={sortBy}
                onSortChange={(value) => updateFeedParam('sort', value === 'date' ? null : value)}
                selectedCategories={selectedCategories}
                selectedSeverities={selectedSeverities}
                onCategoryToggle={handleCategoryToggle}
                onSeverityToggle={handleSeverityToggle}
                onClearFilters={handleClearFilters}
                incidentFilters={incidentFilters}
                facets={facets}
                onVerificationChange={handleVerificationChange}
                onChainToggle={(value) => toggleListParam('chain', chains, value)}
                onAttackTypeToggle={(value) => toggleListParam('attack', attackTypes, value)}
                onSourceToggle={(value: SourceFilter) => toggleListParam('source', sources, value)}
              />

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar (the toolbar's sheet replaces it below md) */}
                <div className="hidden md:block lg:col-span-1">
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
                    <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        {isLoading ? 'Loading...' : (
                          pagination.totalCount > 0 
                            ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, pagination.totalCount)} of ${pagination.totalCount} articles`
                            : 'No articles found'
                        )}
                      </span>
                      {pagination.totalCount > 0 && (
                        <Link
                          to={`${METHODOLOGY_PATH}#sources`}
                          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Badge
                            variant="outline"
                            className={`text-xs hover:border-primary/60 ${
                              feedStatus.source === 'cache' || feedStatus.pipelineIsStale
                                ? 'border-yellow-500/40 text-yellow-500'
                                : 'border-emerald-500/40 text-emerald-400'
                            }`}
                            title={feedStatus.pipelineCheckedAt
                              ? `All active RSS sources checked by ${format(feedStatus.pipelineCheckedAt, 'PPpp')}`
                              : (feedStatus.checkedAt ? `Database checked ${format(feedStatus.checkedAt, 'PPpp')}` : undefined)}
                          >
                            <Database className="w-3 h-3 mr-1" aria-hidden="true" />
                            {feedStatus.source === 'cache'
                              ? (feedStatus.isStale ? 'Cached · stale' : 'Cached')
                              : feedStatus.pipelineCheckedAt
                                ? `${feedStatus.checkedFeedCount}/${feedStatus.activeFeedCount} sources checked ${formatDistanceToNow(feedStatus.pipelineCheckedAt, { addSuffix: true })}`
                                : 'Live database'}
                          </Badge>
                        </Link>
                      )}
                      {/* Phones skip this line to keep the first card above the fold; the sources chip already shows freshness. */}
                      {feedStatus.newestPublishedAt && (
                        <span
                          className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex"
                          title={`Newest publisher timestamp: ${format(feedStatus.newestPublishedAt, 'PPpp')}`}
                        >
                          <Clock className="h-3 w-3" />
                          Newest source report {formatDistanceToNow(feedStatus.newestPublishedAt, { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isAdmin && (
                        <>
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
                        onClick={async () => { await refreshWeb3Incidents(); await refetchAlerts(); }}
                        disabled={isRefreshingWeb3}
                        className="bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
                        title="Fetch latest Web3 security incidents"
                      >
                        {isRefreshingWeb3 ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Flame className="w-4 h-4 mr-1 text-orange-400" />
                        )}
                        {isRefreshingWeb3 ? 'Fetching...' : 'Web3 Incidents'}
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
                        {isRefreshing ? 'Fetching...' : 'RSS Feeds'}
                      </Button>
                        </>
                      )}
                      {hasClearableFilters && (
                        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <Card className="border-yellow-500/30 bg-yellow-500/5">
                      <CardContent className="p-4 text-sm">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                          <div>
                            <p className="font-medium">Live feed refresh unavailable</p>
                            <p className="text-muted-foreground">
                              {feedStatus.source === 'cache'
                                ? `Showing the last cached response${feedStatus.checkedAt ? ` from ${format(feedStatus.checkedAt, 'PPpp')}` : ''}. Verify time-sensitive details with the linked source.`
                                : 'No live feed response is available right now. Try again shortly.'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {isLoading ? (
                    <NewsListSkeleton count={5} />
                  ) : filteredArticles.length > 0 ? (
                    filteredArticles.map((article, index) => (
                      <Fragment key={article.id}>
                        <NewsCard
                          article={article}
                          onClick={() => handleArticleClick(article)}
                        />
                        {index === INLINE_SUBSCRIBE_AFTER - 1 && (
                          <InlineSubscribeCard subscribeHref={subscribeHref} />
                        )}
                      </Fragment>
                    ))
                  ) : (
                    <Card className="glass-card" data-testid="feed-empty-state">
                      <CardContent className="p-8 text-center">
                        <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          {hasNarrowingFilters
                            ? `No ${isIncidentView ? 'incidents' : 'articles'} match these filters`
                            : `No ${isIncidentView ? 'incidents' : 'articles'} yet`}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {hasNarrowingFilters
                            ? (isIncidentView
                              ? 'Try removing a status, chain, attack type or source filter, or widening your search, category, severity or date.'
                              : 'Try removing a source filter, or widening your search, category, severity or date.')
                            : error
                              ? 'The threat feed could not be loaded.'
                              : `No ${isIncidentView ? 'incident reports' : 'threat-intelligence articles'} are available for this view yet.`}
                        </p>
                        {hasNarrowingFilters ? (
                          <Button variant="outline" onClick={handleClearFilters}>
                            Clear filters
                          </Button>
                        ) : isAdmin ? (
                          <Button onClick={refreshFromRSS} disabled={isRefreshing}>
                            {isRefreshing ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Fetch News
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  )}

                  {/* Pagination Controls */}
                  {!isLoading && pagination.totalPages > 1 && (
                    <Card className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Page {currentPage} of {pagination.totalPages}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                              disabled={!pagination.hasPrevPage}
                            >
                              First
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={!pagination.hasPrevPage}
                            >
                              <ChevronRight className="w-4 h-4 rotate-180" />
                              Previous
                            </Button>
                            
                            {/* Page numbers */}
                            <div className="hidden sm:flex items-center gap-1">
                              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (pagination.totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= pagination.totalPages - 2) {
                                  pageNum = pagination.totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                    onClick={() => setCurrentPage(pageNum)}
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              })}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                              disabled={!pagination.hasNextPage}
                            >
                              Next
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(pagination.totalPages)}
                              disabled={!pagination.hasNextPage}
                            >
                              Last
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'alerts' && (
            <ErrorBoundary>
              <div
                className="space-y-6"
                role="tabpanel"
                id="threat-intel-panel-alerts"
                aria-labelledby="threat-intel-tab-alerts"
              >
                <AlertsPanel
                  alerts={activeAlerts}
                  criticalCount={alertsCriticalCount}
                  highCount={alertsHighCount}
                  loading={alertsLoading}
                  error={alertsError}
                  autoRefreshInterval={autoRefreshInterval}
                  onAutoRefreshIntervalChange={setAutoRefreshInterval}
                  onRefresh={() => void refetchAlerts()}
                  onSelectAlert={handleArticleClick}
                  onNavigateHome={() => navigate('/')}
                  onNavigateFeed={() => handleTabChange('feed')}
                />

              {/* Alert pagination */}
              {!alertsLoading && alertsTotalPages > 1 && (
                <nav className="flex items-center justify-between gap-2" aria-label="Alert pages">
                  <span className="text-sm text-muted-foreground">
                    Page {alertsPage} of {alertsTotalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAlertsPage((current) => Math.max(1, current - 1))}
                      disabled={alertsPage <= 1}
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAlertsPage((current) => Math.min(alertsTotalPages, current + 1))}
                      disabled={alertsPage >= alertsTotalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </nav>
              )}
              </div>
            </ErrorBoundary>
          )}

          {selectedTab === 'subscribe' && (
            <ErrorBoundary>
              <div
                className="space-y-4"
                role="tabpanel"
                id="threat-intel-panel-subscribe"
                aria-labelledby="threat-intel-tab-subscribe"
              >
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
                    onClick={() => handleTabChange('feed')}
                    className="h-auto p-1 hover:text-foreground"
                  >
                    Threat Intel
                  </Button>
                  <span>/</span>
                  <span className="text-foreground">Subscribe</span>
                </nav>
                <SubscriptionForm
                  initialCategories={selectedCategories}
                  initialScope={searchParams.has('scope') ? feedView : undefined}
                  initialChains={chains}
                  initialVerification={verification}
                  initialWeekly={searchParams.get('weekly') === '1'}
                />
              </div>
            </ErrorBoundary>
          )}
          </SwipeableTabs>

          <p className="mt-10 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
            Where these records come from, how severity is set and how to report a mistake:{' '}
            <Link to={METHODOLOGY_PATH} className="font-medium text-primary underline-offset-2 hover:underline">
              sources and methodology
            </Link>
            .
          </p>
        </div>
      </main>

        <Footer />
      </div>
    </PullToRefresh>
  );
};

export default News;
