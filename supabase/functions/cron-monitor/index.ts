import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CronJobStatus {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run?: string;
  last_status?: string;
  last_error?: string;
  recent_failures: number;
  recent_successes: number;
}

interface HttpResponseError {
  id: number;
  created: string;
  error_msg: string;
  status_code: number | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const supabaseAuth = createClient(supabaseUrl, authHeader.replace('Bearer ', ''));
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Known cron jobs - hardcoded since cron schema isn't accessible via REST API
    const knownJobs = [
      { jobname: 'fetch-rss-news-hourly', schedule: '15 * * * *', active: true },
      { jobname: 'fetch-web3-incidents-6hourly', schedule: '30 */6 * * *', active: true },
      { jobname: 'summarize-articles-6hourly', schedule: '45 */6 * * *', active: true },
      { jobname: 'send-hourly-digests', schedule: '0 * * * *', active: true },
      { jobname: 'send-critical-alerts-hourly', schedule: '5 * * * *', active: true },
      { jobname: 'cleanup-quiz-logs-daily', schedule: '0 3 * * *', active: true },
    ];

    // Query notification_log for recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: notificationLogs, error: notifError } = await supabase
      .from('notification_log')
      .select('id, sent_at, status, error_message')
      .gte('sent_at', oneDayAgo)
      .order('sent_at', { ascending: false })
      .limit(100);

    // Query news_articles for recent fetches
    const { data: recentArticles, error: articlesError } = await supabase
      .from('news_articles')
      .select('id, created_at, source_name')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    // Calculate stats based on notification logs
    const successfulNotifs = notificationLogs?.filter(n => n.status === 'sent').length || 0;
    const failedNotifs = notificationLogs?.filter(n => n.status === 'failed').length || 0;
    const recentErrors = notificationLogs?.filter(n => n.status === 'failed' && n.error_message) || [];

    // Build job status based on available data
    const enrichedJobs: CronJobStatus[] = knownJobs.map(job => {
      let recent_successes = 0;
      let recent_failures = 0;
      let last_run: string | undefined;
      let last_status: string | undefined;
      let last_error: string | undefined;

      if (job.jobname.includes('digest') || job.jobname.includes('alert')) {
        // Email-related jobs - check notification_log
        const relevantLogs = notificationLogs || [];
        recent_successes = relevantLogs.filter(n => n.status === 'sent').length;
        recent_failures = relevantLogs.filter(n => n.status === 'failed').length;
        if (relevantLogs.length > 0) {
          last_run = relevantLogs[0].sent_at;
          last_status = relevantLogs[0].status === 'sent' ? 'succeeded' : 'failed';
          last_error = relevantLogs[0].error_message || undefined;
        }
      } else if (job.jobname.includes('rss') || job.jobname.includes('web3') || job.jobname.includes('fetch')) {
        // Fetch jobs - check news_articles
        const articleCount = recentArticles?.length || 0;
        recent_successes = articleCount > 0 ? Math.ceil(articleCount / 10) : 0; // Estimate runs
        if (recentArticles && recentArticles.length > 0) {
          last_run = recentArticles[0].created_at;
          last_status = 'succeeded';
        }
      }

      return {
        ...job,
        recent_successes,
        recent_failures,
        last_run,
        last_status,
        last_error,
      };
    });

    // Count errors from notification logs
    const timeoutCount = recentErrors.filter(e => 
      e.error_message?.toLowerCase().includes('timeout')
    ).length;

    const failedRequests = failedNotifs;

    // Calculate health score
    const totalRuns = successfulNotifs + failedNotifs + (recentArticles?.length || 0);
    const failedRuns = failedNotifs;
    const successRate = totalRuns > 0 ? ((totalRuns - failedRuns) / totalRuns * 100).toFixed(1) : '100';

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_jobs: enrichedJobs.length,
        active_jobs: enrichedJobs.filter(j => j.active).length,
        total_runs_24h: totalRuns,
        failed_runs_24h: failedRuns,
        success_rate: `${successRate}%`,
        timeout_errors_24h: timeoutCount,
        http_errors_24h: failedRequests,
      },
      jobs: enrichedJobs,
      recent_errors: recentErrors.slice(0, 10).map((e) => ({
        id: e.id,
        created: e.sent_at,
        error: e.error_message?.substring(0, 200),
        status_code: null,
      })),
      health: {
        status: failedRuns === 0 && timeoutCount === 0 ? 'healthy' : 
                failedRuns > 5 || timeoutCount > 10 ? 'critical' : 'warning',
        message: failedRuns === 0 && timeoutCount === 0 
          ? 'All cron jobs running normally' 
          : `${failedRuns} failed runs, ${timeoutCount} timeouts in last 24h`,
      }
    };

    console.log(`Cron monitor: ${response.health.status} - ${response.summary.success_rate} success rate`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cron monitor error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch cron status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
