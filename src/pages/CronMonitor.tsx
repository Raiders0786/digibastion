import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Activity, ArrowLeft } from 'lucide-react';
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
    // Parse common cron patterns
    if (schedule === '0 * * * *') return 'Every hour';
    if (schedule === '15 * * * *') return 'Every hour at :15';
    if (schedule === '30 */6 * * *') return 'Every 6 hours at :30';
    if (schedule === '45 */6 * * *') return 'Every 6 hours at :45';
    if (schedule === '0 0 * * *') return 'Daily at midnight';
    return schedule;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Data</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate('/admin/analytics')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Cron Job Monitor</h1>
                <p className="text-muted-foreground">
                  Last updated: {data?.timestamp ? formatTime(data.timestamp) : 'Never'}
                </p>
              </div>
            </div>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Health Status */}
          {data?.health && (
            <Card className={`border ${getHealthColor(data.health.status)}`}>
              <CardContent className="flex items-center gap-4 py-4">
                {getHealthIcon(data.health.status)}
                <div>
                  <p className="font-semibold capitalize">{data.health.status}</p>
                  <p className="text-sm text-muted-foreground">{data.health.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Jobs</CardDescription>
                <CardTitle className="text-3xl">{data?.summary.active_jobs || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Runs (24h)</CardDescription>
                <CardTitle className="text-3xl">{data?.summary.total_runs_24h || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-3xl text-green-600">{data?.summary.success_rate || '100%'}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Timeouts (24h)</CardDescription>
                <CardTitle className={`text-3xl ${(data?.summary.timeout_errors_24h || 0) > 0 ? 'text-yellow-600' : ''}`}>
                  {data?.summary.timeout_errors_24h || 0}
                </CardTitle>
              </CardHeader>
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
                <table className="w-full">
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
                        <td className="py-3 px-4 text-sm text-muted-foreground">
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
                        <td className="py-3 px-4 text-sm">
                          {job.last_run ? (
                            <div>
                              <p>{formatTime(job.last_run)}</p>
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
                <CardDescription>HTTP errors and timeouts from the last 24 hours</CardDescription>
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
      </main>
      <Footer />
    </div>
  );
};

export default CronMonitor;
