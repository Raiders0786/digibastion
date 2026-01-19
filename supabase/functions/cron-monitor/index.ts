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

    // Get all cron jobs
    const { data: cronJobs, error: cronError } = await supabase.rpc('get_cron_jobs');
    
    // Fallback: direct query if RPC doesn't exist
    let jobs: CronJobStatus[] = [];
    
    if (cronError) {
      // Query cron.job directly (requires service role)
      const { data: jobData, error: jobError } = await supabase
        .from('cron.job' as any)
        .select('jobid, jobname, schedule, active');
      
      if (!jobError && jobData) {
        jobs = jobData.map((job: any) => ({
          jobname: job.jobname,
          schedule: job.schedule,
          active: job.active,
          recent_failures: 0,
          recent_successes: 0,
        }));
      }
    } else {
      jobs = cronJobs || [];
    }

    // Get recent job run details (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: runDetails, error: runError } = await supabase
      .from('cron.job_run_details' as any)
      .select('jobid, jobname, status, return_message, start_time, end_time')
      .gte('start_time', oneDayAgo)
      .order('start_time', { ascending: false })
      .limit(200);

    // Get recent HTTP response errors (timeouts, failures)
    const { data: httpErrors, error: httpError } = await supabase
      .from('net._http_response' as any)
      .select('id, created, error_msg, status_code')
      .not('error_msg', 'is', null)
      .gte('created', oneDayAgo)
      .order('created', { ascending: false })
      .limit(50);

    // Aggregate job statistics
    const jobStats: Record<string, { successes: number; failures: number; lastRun?: string; lastStatus?: string; lastError?: string }> = {};
    
    if (runDetails) {
      for (const run of runDetails) {
        if (!jobStats[run.jobname]) {
          jobStats[run.jobname] = { successes: 0, failures: 0 };
        }
        
        if (run.status === 'succeeded') {
          jobStats[run.jobname].successes++;
        } else {
          jobStats[run.jobname].failures++;
        }
        
        // Track most recent run
        if (!jobStats[run.jobname].lastRun) {
          jobStats[run.jobname].lastRun = run.start_time;
          jobStats[run.jobname].lastStatus = run.status;
          if (run.status !== 'succeeded') {
            jobStats[run.jobname].lastError = run.return_message;
          }
        }
      }
    }

    // Merge stats into jobs
    const enrichedJobs = jobs.map(job => ({
      ...job,
      recent_successes: jobStats[job.jobname]?.successes || 0,
      recent_failures: jobStats[job.jobname]?.failures || 0,
      last_run: jobStats[job.jobname]?.lastRun,
      last_status: jobStats[job.jobname]?.lastStatus,
      last_error: jobStats[job.jobname]?.lastError,
    }));

    // Count timeout errors
    const timeoutCount = httpErrors?.filter((e: HttpResponseError) => 
      e.error_msg?.includes('Timeout')
    ).length || 0;

    const failedRequests = httpErrors?.filter((e: HttpResponseError) => 
      e.status_code && e.status_code >= 400
    ).length || 0;

    // Calculate health score
    const totalRuns = runDetails?.length || 0;
    const failedRuns = runDetails?.filter((r: any) => r.status !== 'succeeded').length || 0;
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
      recent_errors: httpErrors?.slice(0, 10).map((e: HttpResponseError) => ({
        id: e.id,
        created: e.created,
        error: e.error_msg?.substring(0, 200),
        status_code: e.status_code,
      })) || [],
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
