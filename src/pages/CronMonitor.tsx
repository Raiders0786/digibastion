import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Activity, 
  LogOut,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface CronJob {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run?: string;
  last_status?: string;
  last_error?: string;
  recent_failures: number;
  recent_successes: number;
}

interface CronError {
  id: number;
  created: string;
  error: string;
  status_code: number | null;
}

interface CronMonitorData {
  success: boolean;
  timestamp: string;
  summary: {
    total_jobs: number;
    active_jobs: number;
    total_runs_24h: number;
    failed_runs_24h: number;
    success_rate: string;
    timeout_errors_24h: number;
    http_errors_24h: number;
  };
  jobs: CronJob[];
  recent_errors: CronError[];
  health: {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
  };
}

const CronMonitor = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CronMonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
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

      const response = await supabase.functions.invoke('cron-monitor', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch cron data:', err);
      setError(err.message || 'Failed to load cron monitoring data');
      if (err.message?.includes('Admin') || err.message?.includes('auth')) {
        navigate('/admin');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    toast.success('Refreshing cron data...');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Activity className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500/30 text-green-600';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600';
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-600';
      default:
        return 'bg-muted';
    }
  };

  const formatSchedule = (schedule: string) => {
    if (schedule === '0 * * * *') return 'Every hour';
    if (schedule === '5 * * * *') return 'Every hour at :05';
    if (schedule === '15 * * * *') return 'Every hour at :15';
    if (schedule === '30 */6 * * *') return 'Every 6 hours at :30';
    if (schedule === '45 */6 * * *') return 'Every 6 hours at :45';
    if (schedule === '0 0 * * *') return 'Daily at midnight';
    if (schedule === '0 3 * * *') return 'Daily at 3:00 AM';
    return schedule;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) {
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
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
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
            <Clock className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Cron Job Monitor</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Health Status */}
        {data?.health && (
          <Card className={`border ${getHealthColor(data.health.status)}`}>
            <CardContent className="flex items-center gap-4 py-4">
              {getHealthIcon(data.health.status)}
              <div>
                <p className="font-semibold capitalize">{data.health.status}</p>
                <p className="text-sm text-muted-foreground">{data.health.message}</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                Last updated: {data?.timestamp ? formatTime(data.timestamp) : 'Never'}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.summary.active_jobs || 0}</div>
              <p className="text-sm text-muted-foreground">
                of {data?.summary.total_jobs || 0} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Runs (24h)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.summary.total_runs_24h || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{data?.summary.success_rate || '100%'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Timeouts (24h)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${(data?.summary.timeout_errors_24h || 0) > 0 ? 'text-yellow-600' : ''}`}>
                {data?.summary.timeout_errors_24h || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Jobs</CardTitle>
            <CardDescription>All configured cron jobs and their recent status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Job Name</th>
                    <th className="text-left py-3 px-4 font-medium">Schedule</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Last Run</th>
                    <th className="text-right py-3 px-4 font-medium">Success / Fail (24h)</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.jobs.map((job) => (
                    <tr key={job.jobname} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{job.jobname}</code>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatSchedule(job.schedule)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {job.active ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {job.last_run ? (
                          <div>
                            <p className="text-sm">{formatTime(job.last_run)}</p>
                            {job.last_status && (
                              <Badge 
                                variant="outline" 
                                className={job.last_status === 'succeeded' 
                                  ? 'bg-green-500/10 text-green-600' 
                                  : 'bg-red-500/10 text-red-600'
                                }
                              >
                                {job.last_status}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No recent runs</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-green-600 font-medium">{job.recent_successes}</span>
                        {' / '}
                        <span className={job.recent_failures > 0 ? 'text-red-600 font-medium' : ''}>
                          {job.recent_failures}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Errors */}
        {data?.recent_errors && data.recent_errors.length > 0 && (
          <Card className="border-yellow-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
                Recent Errors
              </CardTitle>
              <CardDescription>Failed notifications from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recent_errors.map((err) => (
                  <div key={err.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">{formatTime(err.created)}</span>
                      {err.status_code && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600">
                          {err.status_code}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-mono break-all">{err.error}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CronMonitor;