import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = "chiragkcv2020@gmail.com";

interface InactiveSub {
  email: string;
  name: string | null;
  updated_at: string;
}

interface WeeklyStats {
  // Subscribers
  totalSubscribers: number;
  verifiedSubscribers: number;
  newSubscribersThisWeek: number;
  subscribersByFrequency: Record<string, number>;
  // Articles
  totalArticles: number;
  newArticlesThisWeek: number;
  articlesBySeverity: Record<string, number>;
  articlesByCategory: Record<string, number>;
  // Email engagement
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  openRate: string;
  clickRate: string;
  // API usage
  totalApiRequests: number;
  uniqueKeysUsed: number;
  apiErrors: number;
  apiErrorRate: string;
  avgResponseTime: number;
  // Quiz
  totalQuizScores: number;
  newQuizScoresThisWeek: number;
  avgQuizScore: number;
  // Notifications
  notificationsSent: number;
  notificationsFailed: number;
  // Cron health
  latestHealthStatus: string;
  avgSuccessRate: number;
  // Churn
  inactiveSubscribers: InactiveSub[];
  totalInactive: number;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateEmailHtml(stats: WeeklyStats, weekStart: string, weekEnd: string): string {
  const statBlock = (label: string, value: string | number, color = "#f3f4f6") =>
    `<td style="padding:12px 16px;text-align:center;">
      <div style="font-size:28px;font-weight:700;color:${color};">${value}</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:4px;">${label}</div>
    </td>`;

  const row = (label: string, value: string | number) =>
    `<tr><td style="padding:8px 12px;color:#9ca3af;border-bottom:1px solid #374151;">${label}</td><td style="padding:8px 12px;color:#f3f4f6;border-bottom:1px solid #374151;text-align:right;font-weight:500;">${value}</td></tr>`;

  const section = (title: string, emoji: string, content: string) =>
    `<tr><td style="padding:24px 24px 8px;">
      <h2 style="margin:0;color:#f3f4f6;font-size:18px;">${emoji} ${title}</h2>
    </td></tr>
    <tr><td style="padding:0 24px 16px;">${content}</td></tr>`;

  // Severity breakdown
  const severityRows = Object.entries(stats.articlesBySeverity)
    .sort(([, a], [, b]) => b - a)
    .map(([sev, count]) => {
      const colors: Record<string, string> = { critical: "#dc2626", high: "#ea580c", medium: "#f59e0b", low: "#3b82f6", info: "#6b7280" };
      return `<span style="display:inline-block;background:${colors[sev] || '#6b7280'};color:white;padding:2px 10px;border-radius:12px;font-size:12px;margin:2px 4px 2px 0;">${sev}: ${count}</span>`;
    }).join("");

  // Category breakdown
  const categoryRows = Object.entries(stats.articlesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([cat, count]) => row(cat, fmt(count))).join("");

  // Frequency breakdown
  const freqRows = Object.entries(stats.subscribersByFrequency)
    .map(([freq, count]) => row(freq, fmt(count))).join("");

  // Inactive/unsubscribed table
  const inactiveSection = stats.inactiveSubscribers.length > 0 ? `
    <h4 style="color:#ef4444;margin:16px 0 8px;font-size:14px;">🚪 Unsubscribed / Inactive (${fmt(stats.totalInactive)} total)</h4>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr style="background:#374151;">
        <td style="padding:6px 12px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;">Email</td>
        <td style="padding:6px 12px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;">Name</td>
        <td style="padding:6px 12px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;">Inactive Since</td>
      </tr>
      ${stats.inactiveSubscribers.map(s => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #374151;color:#f3f4f6;font-size:13px;">${escapeHtml(s.email)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #374151;color:#d1d5db;font-size:13px;">${escapeHtml(s.name || '—')}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #374151;color:#9ca3af;font-size:13px;">${new Date(s.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        </tr>
      `).join('')}
    </table>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background-color:#1f2937;border-radius:8px;overflow:hidden;">
  <!-- Header -->
  <tr>
    <td style="padding:28px 24px;background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);">
      <h1 style="margin:0;color:white;font-size:22px;">📊 Weekly Platform Summary</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${weekStart} → ${weekEnd}</p>
    </td>
  </tr>

  <!-- Hero Stats -->
  <tr>
    <td style="padding:20px 12px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${statBlock("Subscribers", fmt(stats.totalSubscribers), "#22c55e")}
          ${statBlock("New This Week", `+${fmt(stats.newSubscribersThisWeek)}`, "#3b82f6")}
          ${statBlock("Articles", fmt(stats.newArticlesThisWeek), "#f59e0b")}
          ${statBlock("API Requests", fmt(stats.totalApiRequests), "#8b5cf6")}
        </tr>
      </table>
    </td>
  </tr>

  <!-- Subscribers -->
  ${section("Subscribers", "👥", `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Total active", fmt(stats.totalSubscribers))}
      ${row("Verified", fmt(stats.verifiedSubscribers))}
      ${row("New this week", `+${fmt(stats.newSubscribersThisWeek)}`)}
      ${row("Inactive / Unsubscribed", `<span style="color:#ef4444;">${fmt(stats.totalInactive)}</span>`)}
      ${freqRows}
    </table>
    ${inactiveSection}
  `)}

  <!-- Articles & Threats -->
  ${section("Threat Intelligence", "🛡️", `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Total articles (all time)", fmt(stats.totalArticles))}
      ${row("New this week", `+${fmt(stats.newArticlesThisWeek)}`)}
    </table>
    <div style="margin-top:12px;">${severityRows}</div>
    <h4 style="color:#d1d5db;margin:16px 0 8px;font-size:14px;">Top Categories (This Week)</h4>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${categoryRows}
    </table>
  `)}

  <!-- Email Engagement -->
  ${section("Email Engagement (7 days)", "📧", `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Emails sent", fmt(stats.emailsSent))}
      ${row("Opens", fmt(stats.emailsOpened))}
      ${row("Clicks", fmt(stats.emailsClicked))}
      ${row("Open rate", stats.openRate)}
      ${row("Click rate", stats.clickRate)}
    </table>
  `)}

  <!-- Notifications -->
  ${section("Alert Notifications (7 days)", "🔔", `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Sent", fmt(stats.notificationsSent))}
      ${row("Failed", fmt(stats.notificationsFailed))}
    </table>
  `)}

  <!-- API Usage -->
  ${section("API Usage (7 days)", "🔑", `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Total requests", fmt(stats.totalApiRequests))}
      ${row("Unique keys used", fmt(stats.uniqueKeysUsed))}
      ${row("Errors", fmt(stats.apiErrors))}
      ${row("Error rate", stats.apiErrorRate)}
      ${row("Avg response time", `${stats.avgResponseTime}ms`)}
    </table>
  `)}

  <!-- Quiz -->
  ${section("OPSEC Quiz", "🧠", `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Total scores (all time)", fmt(stats.totalQuizScores))}
      ${row("New this week", `+${fmt(stats.newQuizScoresThisWeek)}`)}
      ${row("Average score", `${stats.avgQuizScore}%`)}
    </table>
  `)}

  <!-- Cron Health -->
  ${section("System Health", "⚙️", `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Latest status", stats.latestHealthStatus)}
      ${row("Avg success rate (7d)", `${stats.avgSuccessRate}%`)}
    </table>
  `)}

  <!-- Footer -->
  <tr>
    <td style="padding:20px 24px;background:#111827;text-align:center;">
      <p style="margin:0;color:#6b7280;font-size:12px;">
        Digibastion Admin Summary · Delivered every Monday 12:35 PM IST<br>
        <a href="https://digibastion.com/admin/analytics" style="color:#60a5fa;">Open Dashboard</a>
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[weekly-admin-summary] Starting weekly summary...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // --- Gather all stats in parallel ---
    const [
      subsResult, newSubsResult, totalArticlesResult, newArticlesResult,
      emailEventsResult, apiLogsResult, apiErrorsResult, apiAvgResult,
      apiUniqueKeysResult, quizTotalResult, quizNewResult, quizAvgResult,
      notifSentResult, notifFailedResult, cronHealthResult,
      inactiveSubsResult, inactiveCountResult,
    ] = await Promise.all([
      // Subscribers
      supabase.from('subscriptions').select('frequency, is_verified, is_active').eq('is_active', true),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('created_at', sevenDaysAgo),
      // Articles
      supabase.from('news_articles').select('id', { count: 'exact', head: true }),
      supabase.from('news_articles').select('severity, category').gte('created_at', sevenDaysAgo),
      // Email events
      supabase.from('email_events').select('event_type').gte('created_at', sevenDaysAgo),
      // API usage
      supabase.from('api_usage_logs').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('api_usage_logs').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo).gte('status_code', 400),
      supabase.from('api_usage_logs').select('response_time_ms').gte('created_at', sevenDaysAgo).not('response_time_ms', 'is', null),
      supabase.from('api_usage_logs').select('api_key_id').gte('created_at', sevenDaysAgo),
      // Quiz
      supabase.from('quiz_scores').select('id', { count: 'exact', head: true }),
      supabase.from('quiz_scores').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('quiz_scores').select('score'),
      // Notifications
      supabase.from('notification_log').select('id', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', sevenDaysAgo),
      supabase.from('notification_log').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('sent_at', sevenDaysAgo),
      // Cron health
      supabase.from('cron_health_snapshots').select('health_status, success_rate').order('recorded_at', { ascending: false }).limit(7),
      // Inactive subscribers (most recent 20 with emails)
      supabase.from('subscriptions').select('email, name, updated_at').eq('is_active', false).order('updated_at', { ascending: false }).limit(20),
      // Total inactive count
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('is_active', false),
    ]);

    // Process subscriber stats
    const subs = subsResult.data || [];
    const totalSubscribers = subs.length;
    const verifiedSubscribers = subs.filter(s => s.is_verified).length;
    const subscribersByFrequency: Record<string, number> = {};
    subs.forEach(s => { subscribersByFrequency[s.frequency] = (subscribersByFrequency[s.frequency] || 0) + 1; });

    // Process articles
    const newArticles = newArticlesResult.data || [];
    const articlesBySeverity: Record<string, number> = {};
    const articlesByCategory: Record<string, number> = {};
    newArticles.forEach(a => {
      articlesBySeverity[a.severity] = (articlesBySeverity[a.severity] || 0) + 1;
      articlesByCategory[a.category] = (articlesByCategory[a.category] || 0) + 1;
    });

    // Process email events
    const emailEvents = emailEventsResult.data || [];
    const emailsSent = emailEvents.filter(e => e.event_type === 'sent').length;
    const emailsOpened = emailEvents.filter(e => e.event_type === 'open').length;
    const emailsClicked = emailEvents.filter(e => e.event_type === 'click').length;

    // Process API stats
    const totalApiRequests = apiLogsResult.count ?? 0;
    const apiErrors = apiErrorsResult.count ?? 0;
    const apiTimings = (apiAvgResult.data || []).map(r => r.response_time_ms).filter(Boolean);
    const avgResponseTime = apiTimings.length > 0 ? Math.round(apiTimings.reduce((a: number, b: number) => a + b, 0) / apiTimings.length) : 0;
    const uniqueKeyIds = new Set((apiUniqueKeysResult.data || []).map(r => r.api_key_id));

    // Process quiz stats
    const allScores = (quizAvgResult.data || []).map(r => r.score);
    const avgQuizScore = allScores.length > 0 ? Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length) : 0;

    // Process cron health
    const cronSnapshots = cronHealthResult.data || [];
    const latestHealthStatus = cronSnapshots[0]?.health_status || 'unknown';
    const avgSuccessRate = cronSnapshots.length > 0
      ? Math.round(cronSnapshots.reduce((a: number, s: any) => a + Number(s.success_rate), 0) / cronSnapshots.length * 100) / 100
      : 100;

    // Process inactive subscribers
    const inactiveSubscribers: InactiveSub[] = (inactiveSubsResult.data || []).map((s: any) => ({
      email: s.email,
      name: s.name,
      updated_at: s.updated_at,
    }));

    const stats: WeeklyStats = {
      totalSubscribers,
      verifiedSubscribers,
      newSubscribersThisWeek: newSubsResult.count ?? 0,
      subscribersByFrequency,
      totalArticles: totalArticlesResult.count ?? 0,
      newArticlesThisWeek: newArticles.length,
      articlesBySeverity,
      articlesByCategory,
      emailsSent,
      emailsOpened,
      emailsClicked,
      openRate: emailsSent > 0 ? `${Math.min(Math.round(emailsOpened / emailsSent * 100), 100)}%` : '0%',
      clickRate: emailsSent > 0 ? `${Math.min(Math.round(emailsClicked / emailsSent * 100), 100)}%` : '0%',
      totalApiRequests,
      uniqueKeysUsed: uniqueKeyIds.size,
      apiErrors,
      apiErrorRate: totalApiRequests > 0 ? `${Math.round(apiErrors / totalApiRequests * 100)}%` : '0%',
      avgResponseTime,
      totalQuizScores: quizTotalResult.count ?? 0,
      newQuizScoresThisWeek: quizNewResult.count ?? 0,
      avgQuizScore,
      notificationsSent: notifSentResult.count ?? 0,
      notificationsFailed: notifFailedResult.count ?? 0,
      latestHealthStatus,
      avgSuccessRate,
      inactiveSubscribers,
      totalInactive: inactiveCountResult.count ?? 0,
    };

    console.log('[weekly-admin-summary] Stats compiled:', JSON.stringify(stats));

    // Send email
    if (!resendApiKey) {
      console.warn('[weekly-admin-summary] RESEND_API_KEY not set — logging only');
      return new Response(
        JSON.stringify({ success: true, message: 'No RESEND_API_KEY — stats logged only', stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailHtml = generateEmailHtml(stats, weekStart, weekEnd);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Digibastion <alerts@digibastion.com>',
        to: [ADMIN_EMAIL],
        subject: `📊 Weekly Summary: ${stats.newSubscribersThisWeek > 0 ? `+${stats.newSubscribersThisWeek} subs` : `${stats.totalSubscribers} subs`}, ${stats.newArticlesThisWeek} articles, ${stats.totalInactive > 0 ? `${stats.totalInactive} churned` : `${stats.totalApiRequests} API calls`}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('[weekly-admin-summary] Resend error:', errorText);
      throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`);
    }

    console.log('[weekly-admin-summary] Summary email sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Weekly summary sent', stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[weekly-admin-summary] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
