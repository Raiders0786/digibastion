import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Mail, 
  MousePointerClick, 
  Eye, 
  Users, 
  LogOut, 
  RefreshCw,
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface SubscriberDetail {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  is_verified: boolean;
  frequency: string;
  severity_threshold: string;
  categories: string[];
  preferred_hour: number | null;
  timezone_offset: number | null;
  last_notified_at: string | null;
  created_at: string;
  stats: {
    sent: number;
    opens: number;
    clicks: number;
  };
}

interface AnalyticsData {
  summary: {
    sent: number;
    opens: number;
    clicks: number;
    openRate: string;
    clickRate: string;
  };
  dailyData: Array<{ date: string; sent: number; open: number; click: number }>;
  subscriptions: {
    total: number;
    active: number;
    unverified: number;
    inactive: number;
    byFrequency: {
      immediate: number;
      daily: number;
      weekly: number;
    };
  };
  subscriberDetails: SubscriberDetail[];
  recentEvents: Array<{
    id: string;
    event_type: string;
    email_type: string;
    created_at: string;
    link_url?: string;
  }>;
  dateRange: { startDate: string; endDate: string };
}

export default function AdminAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState(30); // days
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [subscriberFilter, setSubscriberFilter] = useState<'all' | 'active' | 'unverified' | 'inactive'>('all');
  const navigate = useNavigate();

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin');
        return;
      }

      const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await supabase.functions.invoke('admin-analytics', {
        body: { startDate, endDate },
      });

      if (response.error) {
        if (response.error.message?.includes('403') || response.error.message?.includes('Forbidden')) {
          await supabase.auth.signOut();
          navigate('/admin');
          return;
        }
        throw response.error;
      }

      if (response.data?.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data?.error || 'Failed to fetch analytics');
      }
    } catch (err: any) {
      console.error('Analytics error:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange, navigate]);

  useEffect(() => {
    // Check auth on mount
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin');
        return;
      }

      // Verify admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        navigate('/admin');
        return;
      }

      fetchAnalytics();
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/admin');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, fetchAnalytics]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Analytics</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Email Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/cron')}>
              <Clock className="w-4 h-4 mr-2" />
              Cron Monitor
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Emails Sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.summary.sent || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Opens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.summary.opens || 0}</div>
              <p className="text-sm text-muted-foreground">
                {data?.summary.openRate}% open rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" />
                Clicks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.summary.clicks || 0}</div>
              <p className="text-sm text-muted-foreground">
                {data?.summary.clickRate}% click rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Subscribers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.subscriptions.active || 0}</div>
              <p className="text-sm text-muted-foreground">
                {data?.subscriptions.total} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Email Activity
              </CardTitle>
              <CardDescription>Daily email engagement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {data?.dailyData && data.dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="Sent" strokeWidth={2} />
                      <Line type="monotone" dataKey="open" stroke="#22c55e" name="Opens" strokeWidth={2} />
                      <Line type="monotone" dataKey="click" stroke="#f59e0b" name="Clicks" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data available for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscriber Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Subscriber Breakdown
              </CardTitle>
              <CardDescription>Subscription frequency distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {data?.subscriptions && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Immediate', count: data.subscriptions.byFrequency.immediate },
                      { name: 'Daily', count: data.subscriptions.byFrequency.daily },
                      { name: 'Weekly', count: data.subscriptions.byFrequency.weekly },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" name="Subscribers" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Badge variant="outline">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  {data?.subscriptions.active} Active
                </Badge>
                <Badge variant="outline">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  {data?.subscriptions.unverified} Unverified
                </Badge>
                <Badge variant="outline">
                  <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                  {data?.subscriptions.inactive} Inactive
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriber Details */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Subscriber Details
                </CardTitle>
                <CardDescription>Individual subscriber stats for debugging</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search email or name..."
                    value={subscriberSearch}
                    onChange={(e) => setSubscriberSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <select
                  value={subscriberFilter}
                  onChange={(e) => setSubscriberFilter(e.target.value as any)}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="unverified">Unverified</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-center">Sent</TableHead>
                    <TableHead className="text-center">Opens</TableHead>
                    <TableHead className="text-center">Clicks</TableHead>
                    <TableHead>Last Notified</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.subscriberDetails
                    ?.filter(sub => {
                      // Search filter
                      const searchLower = subscriberSearch.toLowerCase();
                      const matchesSearch = !subscriberSearch || 
                        sub.email.toLowerCase().includes(searchLower) ||
                        (sub.name?.toLowerCase().includes(searchLower));
                      
                      // Status filter
                      const matchesFilter = 
                        subscriberFilter === 'all' ||
                        (subscriberFilter === 'active' && sub.is_active && sub.is_verified) ||
                        (subscriberFilter === 'unverified' && !sub.is_verified) ||
                        (subscriberFilter === 'inactive' && !sub.is_active);
                      
                      return matchesSearch && matchesFilter;
                    })
                    .map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.email}</div>
                            {sub.name && <div className="text-xs text-muted-foreground">{sub.name}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {sub.is_verified ? (
                              <Badge variant="outline" className="text-green-600 border-green-600 w-fit">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600 w-fit">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                            {!sub.is_active && (
                              <Badge variant="outline" className="text-red-600 border-red-600 w-fit">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="capitalize">{sub.frequency}</div>
                            <div className="text-xs text-muted-foreground">
                              {sub.preferred_hour !== null ? `${sub.preferred_hour}:00` : '-'} UTC{sub.timezone_offset !== null && sub.timezone_offset >= 0 ? '+' : ''}{sub.timezone_offset ?? 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-mono">{sub.stats.sent}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-mono">{sub.stats.opens}</div>
                          {sub.stats.sent > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {((sub.stats.opens / sub.stats.sent) * 100).toFixed(0)}%
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-mono">{sub.stats.clicks}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {sub.last_notified_at 
                            ? new Date(sub.last_notified_at).toLocaleDateString()
                            : <span className="text-yellow-600">Never</span>
                          }
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )) || (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No subscribers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Events
            </CardTitle>
            <CardDescription>Last 50 email tracking events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Time</th>
                    <th className="text-left py-2 px-4">Type</th>
                    <th className="text-left py-2 px-4">Event</th>
                    <th className="text-left py-2 px-4">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentEvents && data.recentEvents.length > 0 ? (
                    data.recentEvents.map((event) => (
                      <tr key={event.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4 text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 px-4">
                          <Badge variant="secondary">{event.email_type}</Badge>
                        </td>
                        <td className="py-2 px-4">
                          <Badge 
                            variant={event.event_type === 'click' ? 'default' : 
                                    event.event_type === 'open' ? 'secondary' : 'outline'}
                          >
                            {event.event_type}
                          </Badge>
                        </td>
                        <td className="py-2 px-4 text-muted-foreground truncate max-w-xs">
                          {event.link_url || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No events recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
