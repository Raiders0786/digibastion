import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@4.0.0';

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

interface HealthSnapshot {
  id: string;
  recorded_at: string;
  health_status: string;
  total_jobs: number;
  active_jobs: number;
  total_runs: number;
  failed_runs: number;
  timeout_errors: number;
  success_rate: number;
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user JWT
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('[cron-monitor] Auth failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.warn(`[cron-monitor] Admin access denied for user ${user.id}`);
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
    
    const { data: notificationLogs } = await supabase
      .from('notification_log')
      .select('id, sent_at, status, error_message')
      .gte('sent_at', oneDayAgo)
      .order('sent_at', { ascending: false })
      .limit(100);

    // Query news_articles for recent fetches
    const { data: recentArticles } = await supabase
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
        const relevantLogs = notificationLogs || [];
        recent_successes = relevantLogs.filter(n => n.status === 'sent').length;
        recent_failures = relevantLogs.filter(n => n.status === 'failed').length;
        if (relevantLogs.length > 0) {
          last_run = relevantLogs[0].sent_at;
          last_status = relevantLogs[0].status === 'sent' ? 'succeeded' : 'failed';
          last_error = relevantLogs[0].error_message || undefined;
        }
      } else if (job.jobname.includes('rss') || job.jobname.includes('web3') || job.jobname.includes('fetch')) {
        const articleCount = recentArticles?.length || 0;
        recent_successes = articleCount > 0 ? Math.ceil(articleCount / 10) : 0;
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
    const successRate = totalRuns > 0 ? ((totalRuns - failedRuns) / totalRuns * 100) : 100;
    const successRateStr = successRate.toFixed(1);

    // Determine health status
    const healthStatus = failedRuns === 0 && timeoutCount === 0 ? 'healthy' : 
                        failedRuns > 5 || timeoutCount > 10 ? 'critical' : 'warning';
    const healthMessage = failedRuns === 0 && timeoutCount === 0 
      ? 'All cron jobs running normally' 
      : `${failedRuns} failed runs, ${timeoutCount} timeouts in last 24h`;

    // Store health snapshot (every request, will be deduplicated by cleanup)
    const { error: snapshotError } = await supabase
      .from('cron_health_snapshots')
      .insert({
        health_status: healthStatus,
        total_jobs: enrichedJobs.length,
        active_jobs: enrichedJobs.filter(j => j.active).length,
        total_runs: totalRuns,
        failed_runs: failedRuns,
        timeout_errors: timeoutCount,
        success_rate: parseFloat(successRateStr),
        message: healthMessage,
        alert_sent: false,
      });

    if (snapshotError) {
      console.warn('[cron-monitor] Failed to store snapshot:', snapshotError.message);
    }

    // Check if we need to send a critical alert
    if (healthStatus === 'critical' && resendApiKey) {
      // Check if we already sent an alert in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentAlerts } = await supabase
        .from('cron_health_snapshots')
        .select('id')
        .eq('health_status', 'critical')
        .eq('alert_sent', true)
        .gte('recorded_at', oneHourAgo)
        .limit(1);

      if (!recentAlerts || recentAlerts.length === 0) {
        // Send critical alert email
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: 'DigiBastion Alerts <alerts@digibastion.com>',
            to: [user.email || 'admin@digibastion.com'],
            subject: '🚨 CRITICAL: Cron Job Health Alert',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #dc2626;">🚨 Critical Cron Health Alert</h1>
                <p style="font-size: 16px; color: #374151;">
                  The cron job monitoring system has detected critical issues:
                </p>
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p style="margin: 0; color: #991b1b;"><strong>Status:</strong> ${healthStatus.toUpperCase()}</p>
                  <p style="margin: 8px 0 0 0; color: #991b1b;"><strong>Message:</strong> ${healthMessage}</p>
                </div>
                <h2 style="color: #374151; font-size: 18px;">Summary (Last 24h)</h2>
                <ul style="color: #4b5563;">
                  <li>Total Runs: ${totalRuns}</li>
                  <li>Failed Runs: ${failedRuns}</li>
                  <li>Timeout Errors: ${timeoutCount}</li>
                  <li>Success Rate: ${successRateStr}%</li>
                </ul>
                <p style="font-size: 14px; color: #6b7280;">
                  View the full dashboard at: <a href="https://digibastion.com/admin/cron">Cron Monitor</a>
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="font-size: 12px; color: #9ca3af;">
                  This is an automated alert from DigiBastion. You will not receive another alert for 1 hour.
                </p>
              </div>
            `,
          });

          // Mark alert as sent
          await supabase
            .from('cron_health_snapshots')
            .update({ alert_sent: true })
            .eq('health_status', 'critical')
            .gte('recorded_at', oneHourAgo);

          console.log('[cron-monitor] Critical alert email sent to', user.email);
        } catch (emailError) {
          console.error('[cron-monitor] Failed to send alert email:', emailError);
        }
      }
    }

    // Get 7-day health history for chart
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: healthHistory } = await supabase
      .from('cron_health_snapshots')
      .select('id, recorded_at, health_status, total_runs, failed_runs, timeout_errors, success_rate')
      .gte('recorded_at', sevenDaysAgo)
      .order('recorded_at', { ascending: true })
      .limit(200);

    // Aggregate history by day for chart
    const dailyHistory: Record<string, { date: string; healthy: number; warning: number; critical: number; avgSuccessRate: number; totalRuns: number; failedRuns: number }> = {};
    
    healthHistory?.forEach((snapshot: HealthSnapshot) => {
      const date = snapshot.recorded_at.split('T')[0];
      if (!dailyHistory[date]) {
        dailyHistory[date] = { 
          date, 
          healthy: 0, 
          warning: 0, 
          critical: 0, 
          avgSuccessRate: 0, 
          totalRuns: 0, 
          failedRuns: 0 
        };
      }
      dailyHistory[date][snapshot.health_status as 'healthy' | 'warning' | 'critical']++;
      dailyHistory[date].avgSuccessRate += snapshot.success_rate;
      dailyHistory[date].totalRuns += snapshot.total_runs;
      dailyHistory[date].failedRuns += snapshot.failed_runs;
    });

    // Calculate averages
    const historyData = Object.values(dailyHistory).map(day => {
      const totalSnapshots = day.healthy + day.warning + day.critical;
      return {
        date: day.date,
        healthy: day.healthy,
        warning: day.warning,
        critical: day.critical,
        successRate: totalSnapshots > 0 ? Math.round(day.avgSuccessRate / totalSnapshots) : 100,
        totalRuns: day.totalRuns,
        failedRuns: day.failedRuns,
      };
    });

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_jobs: enrichedJobs.length,
        active_jobs: enrichedJobs.filter(j => j.active).length,
        total_runs_24h: totalRuns,
        failed_runs_24h: failedRuns,
        success_rate: `${successRateStr}%`,
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
        status: healthStatus,
        message: healthMessage,
      },
      history: historyData,
    };

    console.log(`[cron-monitor] ${response.health.status} - ${response.summary.success_rate} success rate`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cron-monitor] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch cron status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});