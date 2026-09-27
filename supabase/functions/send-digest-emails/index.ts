import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { normalizeUtcMinuteToQuarterHour, prepareDigestArticles, severityRank, shouldSendToSubscriber } from "../_shared/digest-logic.ts";
import {
  escapeHtml,
  formatDeliveryArticleText,
  matchesDeliveryPreferences,
  renderIncidentContextHtml,
  safeHttpUrl,
  stripHtml,
  type ContentScope,
} from "../_shared/subscription-delivery.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  severity: string;
  category: string;
  link: string;
  published_at: string;
  cve_id?: string;
  tags: string[] | null;
  affected_technologies?: string[] | null;
  source_name?: string;
  metadata?: Record<string, unknown> | null;
}

interface Subscription {
  id: string;
  email: string;
  name: string | null;
  categories: string[] | null;
  technologies: string[] | null;
  frequency: string;
  severity_threshold: string;
  last_notified_at: string | null;
  verification_token: string | null;
  preferred_hour: number;
  timezone_offset: number;
  preferred_day: number;
  content_scope: ContentScope;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#b91c1c';
    case 'high': return '#9a3412';
    case 'medium': return '#854d0e';
    case 'low': return '#1e40af';
    default: return '#6b7280';
  }
}

// Category configuration for display
const categoryConfig: Record<string, { label: string; color: string; icon: string }> = {
  'web3-security': { label: 'Web3 Security', color: '#8b5cf6', icon: '🔗' },
  'defi-exploits': { label: 'DeFi Exploit', color: '#ec4899', icon: '💰' },
  'operational-security': { label: 'OpSec', color: '#ef4444', icon: '🛡️' },
  'supply-chain': { label: 'Supply Chain', color: '#f97316', icon: '📦' },
  'personal-protection': { label: 'Personal Security', color: '#3b82f6', icon: '🔐' },
  'vulnerability-disclosure': { label: 'Vulnerability', color: '#facc15', icon: '⚠️' },
  'tools-reviews': { label: 'Tools', color: '#22c55e', icon: '🛠️' },
};

function getCategoryDisplay(category: string): { label: string; color: string; icon: string } {
  return categoryConfig[category] || { label: 'Security', color: '#6b7280', icon: '🔒' };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function generateDigestEmailText(
  articles: NewsArticle[],
  subscriberName: string | null,
  frequency: string,
  periodStart: Date,
  periodEnd: Date,
  manageUrl: string,
): string {
  const periodLabel = frequency === 'weekly' ? 'Weekly' : 'Daily';
  const displayedArticles = articles.slice(0, 20);
  const lines = displayedArticles.map((article) => {
    return formatDeliveryArticleText(
      article,
      `https://www.digibastion.com/threat-intel/${encodeURIComponent(article.id)}`,
    );
  });

  return [
    `${periodLabel} Security Briefing`,
    `${formatDate(periodStart.toISOString())} – ${formatDate(periodEnd.toISOString())}`,
    '',
    `Hi ${subscriberName || 'Security Professional'},`,
    `${articles.length} security update${articles.length === 1 ? '' : 's'} matched your preferences.`,
    ...(articles.length > displayedArticles.length ? [`Showing the top ${displayedArticles.length}; ${articles.length - displayedArticles.length} more are available online.`] : []),
    '',
    ...lines,
    '',
    'View all threat intelligence: https://www.digibastion.com/threat-intel',
    `Manage preferences or unsubscribe: ${manageUrl}`,
  ].join('\n');
}

function generateDigestEmailHtml(
  articles: NewsArticle[], 
  subscriberName: string | null, 
  subscriberEmail: string,
  verificationToken: string | null,
  frequency: string,
  periodStart: Date,
  periodEnd: Date,
  trackingId: string
): string {
  const greeting = subscriberName ? `Hi ${escapeHtml(subscriberName)},` : 'Hi there,';
  const periodLabel = frequency === 'weekly' ? 'Weekly' : 'Daily';
  const dateRange = `${formatDate(periodStart.toISOString())} - ${formatDate(periodEnd.toISOString())}`;
  
  // Tracking URLs
  const trackingBaseUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/email-tracking`;
  const trackingPixelUrl = `${trackingBaseUrl}?tid=${trackingId}&a=o`;
  
  // The full unique count remains visible, while rendering is capped to keep
  // Gmail from clipping the footer and unsubscribe controls.
  const displayedArticles = articles.slice(0, 20);
  const criticalArticles = displayedArticles.filter(a => a.severity === 'critical');
  const highArticles = displayedArticles.filter(a => a.severity === 'high');
  const otherArticles = displayedArticles.filter(a => !['critical', 'high'].includes(a.severity));

  const renderArticle = (article: NewsArticle) => {
    const cat = getCategoryDisplay(article.category);
    const digiLink = `https://www.digibastion.com/threat-intel/${article.id}`;
    const cleanSummary = stripHtml(article.summary);
    const safeOriginalLink = escapeHtml(safeHttpUrl(article.link, digiLink));
    return `
    <tr>
      <td style="padding: 18px 0; border-bottom: 1px solid #334155;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 9px;"><tr>
          <td style="background: ${getSeverityColor(article.severity)}; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; line-height: 14px; text-transform: uppercase; font-weight: 700;">${escapeHtml(article.severity)}</td>
          <td width="6"></td>
          <td style="color: ${cat.color}; padding: 3px 7px; border: 1px solid ${cat.color}; border-radius: 4px; font-size: 11px; line-height: 14px; font-weight: 600;">${cat.icon} ${cat.label}</td>
        </tr></table>
        <p style="margin: 0 0 7px; color: #a8b3c7; font-size: 12px; line-height: 18px;">
          ${escapeHtml(article.source_name || 'Digibastion Intelligence')} · ${formatDate(article.published_at)}${article.cve_id ? ` · ${escapeHtml(article.cve_id)}` : ''}
        </p>
        <a href="${digiLink}" style="color: #93c5fd; text-decoration: none; font-weight: 700; font-size: 17px; line-height: 1.45;">
          ${escapeHtml(stripHtml(article.title))}
        </a>
        ${cleanSummary ? `<p style="margin: 8px 0 0; color: #cbd5e1; font-size: 14px; line-height: 1.55;">${escapeHtml(cleanSummary.slice(0, 190))}${cleanSummary.length > 190 ? '…' : ''}</p>` : ''}
        ${renderIncidentContextHtml(article)}
        <div style="margin-top: 10px;">
          <a href="${safeOriginalLink}" style="color: #93c5fd; text-decoration: underline; font-size: 13px;">Read source report</a>
        </div>
      </td>
    </tr>
  `;
  };

  const renderSection = (title: string, sectionArticles: NewsArticle[], bgColor: string) => {
    if (sectionArticles.length === 0) return '';
    return `
      <tr>
        <td style="padding: 16px 0 8px 0;">
          <h2 style="margin: 0; color: ${bgColor}; font-size: 15px; text-transform: uppercase; letter-spacing: 0.6px;">
            ${title} (${sectionArticles.length})
          </h2>
        </td>
      </tr>
      ${sectionArticles.map(renderArticle).join('')}
    `;
  };

  const encodedEmail = encodeURIComponent(subscriberEmail);
  const encodedToken = verificationToken ? encodeURIComponent(verificationToken) : '';
  const manageUrl = verificationToken 
    ? `https://www.digibastion.com/manage-subscription?email=${encodedEmail}&token=${encodedToken}`
    : `https://www.digibastion.com/manage-subscription?email=${encodedEmail}`;

  // Summary stats
  const criticalCount = articles.filter(a => a.severity === 'critical').length;
  const highCount = articles.filter(a => a.severity === 'high').length;
  const totalCount = articles.length;
  const hiddenCount = Math.max(0, totalCount - displayedArticles.length);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${periodLabel} Security Briefing</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    @media only screen and (max-width: 680px) {
      .email-shell { padding: 0 !important; }
      .email-card { border-radius: 0 !important; }
      .email-pad { padding-left: 18px !important; padding-right: 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${criticalCount > 0 ? `${criticalCount} critical · ` : ''}${totalCount} security updates matched your preferences.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background-color:#111827;">
    <tr><td class="email-shell" align="center" style="padding:24px 12px;">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" class="email-card" style="width:100%;max-width:640px;margin:0 auto;background-color:#1f2937;border-radius:10px;overflow:hidden;">
    <!-- Header -->
    <tr>
      <td class="email-pad" style="padding:26px 28px;background-color:#6d4aff;background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);">
        <p style="margin:0 0 10px;color:#ede9fe;font-size:12px;line-height:16px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">DIGIBASTION · THREAT INTELLIGENCE</p>
        <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:31px;">${periodLabel} Security Briefing</h1>
        <p style="margin:7px 0 0;color:#ede9fe;font-size:13px;line-height:20px;">
          ${dateRange}
        </p>
      </td>
    </tr>
    
    <!-- Summary Stats -->
    <tr>
      <td class="email-pad" style="padding:22px 28px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="31%" style="text-align:center;padding:13px 4px;background-color:#3b2530;border-radius:7px;">
              <div style="font-size:24px;line-height:28px;font-weight:bold;color:#f87171;">${criticalCount}</div>
              <div style="font-size:11px;line-height:16px;color:#cbd5e1;text-transform:uppercase;">Critical</div>
            </td>
            <td width="3%"></td>
            <td width="31%" style="text-align:center;padding:13px 4px;background-color:#3a2d2b;border-radius:7px;">
              <div style="font-size:24px;line-height:28px;font-weight:bold;color:#fb923c;">${highCount}</div>
              <div style="font-size:11px;line-height:16px;color:#cbd5e1;text-transform:uppercase;">High</div>
            </td>
            <td width="3%"></td>
            <td width="32%" style="text-align:center;padding:13px 4px;background-color:#263752;border-radius:7px;">
              <div style="font-size:24px;line-height:28px;font-weight:bold;color:#60a5fa;">${totalCount}</div>
              <div style="font-size:11px;line-height:16px;color:#cbd5e1;text-transform:uppercase;">Updates</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td class="email-pad" style="padding:0 28px 18px;">
        <p style="color:#e2e8f0;margin:0;font-size:15px;line-height:23px;">
          ${greeting} here are ${totalCount} security update${totalCount !== 1 ? 's' : ''} matching your preferences.
        </p>
      </td>
    </tr>

    <!-- Articles -->
    <tr>
      <td class="email-pad" style="padding:0 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${renderSection('🚨 Critical Threats', criticalArticles, '#f87171')}
          ${renderSection('⚠️ High Severity', highArticles, '#fb923c')}
          ${renderSection('📋 Other Alerts', otherArticles.slice(0, 10), '#cbd5e1')}
          ${hiddenCount > 0 ? `
            <tr><td style="padding:18px 0;color:#cbd5e1;font-size:13px;line-height:20px;text-align:center;">
              Showing the top ${displayedArticles.length} of ${totalCount} unique updates. Open Threat Intelligence to review the remaining ${hiddenCount}.
            </td></tr>
          ` : ''}
          ${otherArticles.length > 10 ? `
            <tr>
              <td style="padding: 12px 0; color: #6b7280; font-size: 12px;">
                + ${otherArticles.length - 10} more alerts
              </td>
            </tr>
          ` : ''}
        </table>
      </td>
    </tr>

    <!-- CTA Button -->
    <tr>
      <td class="email-pad" style="padding:28px;text-align:center;">
        <a href="https://www.digibastion.com/threat-intel" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;line-height:20px;">
          Open Threat Intelligence
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td class="email-pad" style="padding:20px 28px;background-color:#111827;text-align:center;">
        <p style="margin:0;color:#a8b3c7;font-size:12px;line-height:19px;">
          You're receiving this ${frequency} digest because you subscribed to Digibastion Threat Intel.<br>
          <a href="${manageUrl}" style="color:#93c5fd;">Manage preferences</a> &nbsp;·&nbsp; <a href="${manageUrl}" style="color:#93c5fd;">Unsubscribe</a>
        </p>
        <!-- Tracking pixel -->
        <img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display: block; width: 1px; height: 1px; border: 0;" />
      </td>
    </tr>
  </table>
    </td></tr>
  </table>
</body>
</html>
  `;
}

async function timingSafeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index++) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authorization: accept CRON_SECRET or authenticated admin user
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization');
  let isAuthorized = false;
  let adminEmail: string | null = null;

  // Check cron secret first
  if (cronSecret && authHeader && await timingSafeEqual(authHeader, `Bearer ${cronSecret}`)) {
    isAuthorized = true;
  }

  // If not cron, check for authenticated user JWT
  if (!isAuthorized && authHeader) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await authClient.auth.getUser(token);
      if (user && !error) {
        // Require admin role — non-admins must NOT trigger bulk email
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: roleData } = await adminClient
          .from('user_roles').select('role')
          .eq('user_id', user.id).eq('role', 'admin').maybeSingle();
        if (roleData) {
          isAuthorized = true;
          adminEmail = user.email?.toLowerCase().trim() || null;
        }
      }
    } catch {
      // JWT validation failed
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request body
    let targetHour: number | null = null;
    let targetMinute: number | null = null;
    let targetFrequency: 'daily' | 'weekly' | 'both' = 'both';
    let testEmail: string | null = null;
    
    try {
      const body = await req.json();
      if (typeof body.target_hour === 'number') {
        targetHour = body.target_hour;
      }
      if (typeof body.target_minute === 'number') {
        targetMinute = body.target_minute;
      }
      if (body.frequency === 'daily' || body.frequency === 'weekly') {
        targetFrequency = body.frequency;
      }
      if (typeof body.test_email === 'string' && body.test_email.includes('@')) {
        testEmail = body.test_email.toLowerCase().trim();
      }
    } catch {
      // No body or invalid JSON - will run for all matching subscribers
    }

    const now = new Date();
    const currentUtcHour = targetHour !== null ? targetHour : now.getUTCHours();
    const currentUtcMinute = targetMinute !== null ? targetMinute : normalizeUtcMinuteToQuarterHour(now.getUTCMinutes());
    const currentUtcDay = now.getUTCDay(); // 0 = Sunday

    console.log(`[send-digest-emails] Starting digest for UTC ${currentUtcHour}:${String(currentUtcMinute).padStart(2, '0')}, day: ${currentUtcDay}, frequency: ${targetFrequency}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (testEmail && (!adminEmail || testEmail !== adminEmail)) {
      return new Response(JSON.stringify({ error: 'Test digests can only be sent to the signed-in administrator.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle test email mode - bypass hour check and send directly to specific email
    if (testEmail) {
      console.log('[send-digest-emails] TEST MODE: Sending administrator test digest');
      
      // Find or create a mock subscription for this email
      const { data: testSub, error: testSubError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', testEmail)
        .maybeSingle();
      
      if (testSubError) {
        console.error('[send-digest-emails] Error fetching test subscription:', testSubError);
        throw testSubError;
      }
      
      // Use found subscription or create a default one for testing
      const mockSubscription: Subscription = testSub || {
        id: 'test-id',
        email: testEmail,
        name: 'Test User',
        categories: [],
        technologies: [],
        content_scope: 'all',
        frequency: 'daily',
        severity_threshold: 'low', // Include all severities for test
        last_notified_at: null,
        verification_token: null,
        preferred_hour: 9,
        timezone_offset: 0,
        preferred_day: 0
      };
      
      // Fetch latest articles (last 48 hours to ensure content)
      const testPeriodStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      
      const { data: articles, error: articlesError } = await supabase
        .from('news_articles')
        .select('id, title, summary, severity, category, link, published_at, cve_id, tags, affected_technologies, source_name, metadata')
        .gte('published_at', testPeriodStart.toISOString())
        .order('published_at', { ascending: false })
        .limit(50);
      
      if (articlesError) {
        console.error('[send-digest-emails] Error fetching articles for test:', articlesError);
        throw articlesError;
      }
      
      if (!articles || articles.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'No articles found in last 48 hours for test', sent: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const testArticles = prepareDigestArticles(
        articles.filter((article) => matchesDeliveryPreferences(article as NewsArticle, mockSubscription)) as NewsArticle[],
        Number.POSITIVE_INFINITY,
      );
      if (testArticles.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'No articles match the test subscription preferences', sent: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      console.log(`[send-digest-emails] Prepared ${testArticles.length} articles for test email`);
      
      // Generate and send test email
      const trackingId = crypto.randomUUID();
      const emailHtml = generateDigestEmailHtml(
        testArticles,
        mockSubscription.name,
        testEmail,
        mockSubscription.verification_token,
        mockSubscription.frequency,
        testPeriodStart,
        now,
        trackingId
      );
      
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ success: false, message: 'RESEND_API_KEY not configured', sent: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const testManageUrl = 'https://www.digibastion.com/manage-subscription';
      const emailText = generateDigestEmailText(testArticles, mockSubscription.name, mockSubscription.frequency, testPeriodStart, now, testManageUrl);
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Digibastion Alerts <alerts@digibastion.com>',
          to: [testEmail],
          subject: `[TEST] ${testArticles.length} security update${testArticles.length === 1 ? '' : 's'}`,
          html: emailHtml,
          text: emailText,
          reply_to: 'support@digibastion.com',
        }),
      });
      
      const resendResult = await resendResponse.json();
      
      if (!resendResponse.ok) {
        console.error('[send-digest-emails] Resend error for test:', resendResult);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to send test email', error: resendResult, sent: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Log sent event
      await supabase.from('email_events').insert({
        subscription_id: testSub?.id || null,
        tracking_id: trackingId,
        email_type: 'test_digest',
        event_type: 'sent',
      });
      
      console.log('[send-digest-emails] Test email sent successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Test digest sent to ${testEmail}`, 
          sent: 1,
          articles_included: testArticles.length,
          categories: [...new Set(testArticles.map(a => a.category))]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all active, verified subscribers
    const frequencies = targetFrequency === 'both' ? ['daily', 'weekly'] : [targetFrequency];
    
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .eq('is_verified', true)
      .in('frequency', frequencies);

    if (subsError) {
      console.error('[send-digest-emails] Error fetching subscriptions:', subsError);
      throw subsError;
    }

    console.log(`[send-digest-emails] Found ${subscriptions?.length || 0} total subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No digest subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter subscribers who should receive at this hour
    const eligibleSubscriptions = subscriptions.filter((sub: Subscription) => 
      shouldSendToSubscriber(sub, currentUtcHour, currentUtcMinute, currentUtcDay)
    );

    console.log(`[send-digest-emails] ${eligibleSubscriptions.length} subscribers eligible for this hour`);

    if (eligibleSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No subscribers scheduled for this hour', 
          sent: 0,
          checked: subscriptions.length,
          currentUtcHour,
          currentUtcMinute,
          currentUtcDay
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resendApiKey) {
      console.warn('[send-digest-emails] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: true, message: 'RESEND_API_KEY not configured', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const subscription of eligibleSubscriptions) {
      const sub = subscription as Subscription;
      
      // Determine the maximum lookback, then advance from the last successful
      // delivery when possible so overlapping windows do not resend articles.
      let periodStart: Date;
      if (sub.frequency === 'weekly') {
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        // For daily: always fetch last 26 hours to account for timezone edge cases
        periodStart = new Date(now.getTime() - 26 * 60 * 60 * 1000);
      }

      const lastNotifiedAt = sub.last_notified_at ? new Date(sub.last_notified_at) : null;
      const effectivePeriodStart = lastNotifiedAt && !Number.isNaN(lastNotifiedAt.getTime()) && lastNotifiedAt > periodStart && lastNotifiedAt < now
        ? lastNotifiedAt
        : periodStart;

      console.log(`[send-digest-emails] Fetching articles since ${effectivePeriodStart.toISOString()} for subscription ${sub.id}`);

      // Push stable preference filters into the database before limiting so a
      // busy unrelated category cannot crowd out this subscriber's matches.
      const thresholdRank = severityRank[sub.severity_threshold] ?? 2;
      const allowedSeverities = Object.keys(severityRank).filter((severity) => severityRank[severity] <= thresholdRank);
      const articlesQuery = supabase
        .from('news_articles')
        .select('id, title, summary, severity, category, link, published_at, cve_id, tags, affected_technologies, source_name, metadata, created_at')
        .gte('created_at', effectivePeriodStart.toISOString())
        .lte('created_at', now.toISOString())
        .gte('published_at', periodStart.toISOString())
        .lte('published_at', now.toISOString())
        .in('severity', allowedSeverities)
        .order('created_at', { ascending: false })
        .limit(200);
      const { data: articles, error: articlesError } = await articlesQuery;

      if (articlesError) {
        console.error(`[send-digest-emails] Error fetching articles for subscription ${sub.id}:`, articlesError);
        continue;
      }

      if (!articles || articles.length === 0) {
        console.log(`[send-digest-emails] No articles in period for subscription ${sub.id}`);
        continue;
      }

      console.log(`[send-digest-emails] Found ${articles.length} articles for subscription ${sub.id}`);

      // Filter articles based on subscriber preferences
      const matchingArticles = prepareDigestArticles(
        articles.filter(a => matchesDeliveryPreferences(a as NewsArticle, sub)) as NewsArticle[],
        Number.POSITIVE_INFINITY,
      );

      if (matchingArticles.length === 0) {
        console.log(`[send-digest-emails] No matching articles for subscription ${sub.id}`);
        continue;
      }

      console.log(`[send-digest-emails] Sending ${matchingArticles.length} articles for subscription ${sub.id}`);

      // Generate unique tracking ID for this email
      const trackingId = crypto.randomUUID();

      try {
        const emailHtml = generateDigestEmailHtml(
          matchingArticles as NewsArticle[], 
          sub.name, 
          sub.email,
          sub.verification_token,
          sub.frequency,
          effectivePeriodStart,
          now,
          trackingId
        );
        
        const periodLabel = sub.frequency === 'weekly' ? 'Weekly' : 'Daily';
        const criticalCount = matchingArticles.filter(a => a.severity === 'critical').length;
        const subject = criticalCount > 0
          ? `${periodLabel} security briefing · ${criticalCount} critical · ${matchingArticles.length} updates`
          : `${periodLabel} security briefing · ${matchingArticles.length} update${matchingArticles.length === 1 ? '' : 's'}`;
        
        // Build one-click unsubscribe URL for RFC 8058 compliance
        const encodedToken = sub.verification_token ? encodeURIComponent(sub.verification_token) : '';
        const encodedEmail = encodeURIComponent(sub.email);
        const oneClickUnsubUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/one-click-unsubscribe?token=${encodedToken}&email=${encodedEmail}`;
        const manageUrl = `https://www.digibastion.com/manage-subscription?email=${encodedEmail}&token=${encodedToken}`;
        const emailText = generateDigestEmailText(matchingArticles, sub.name, sub.frequency, effectivePeriodStart, now, manageUrl);
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Digibastion Digest <alerts@digibastion.com>',
            to: [sub.email],
            subject,
            html: emailHtml,
            text: emailText,
            reply_to: 'support@digibastion.com',
            headers: {
              'List-Unsubscribe': `<${oneClickUnsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`);
        }

        // Only count a message as sent after the provider accepts it.
        const { error: eventError } = await supabase
          .from('email_events')
          .insert({
            subscription_id: sub.id,
            email_type: 'digest',
            event_type: 'sent',
            tracking_id: trackingId,
          });
        if (eventError) console.error(`[send-digest-emails] Failed to log sent event for ${sub.id}:`, eventError);

        // Update last_notified_at
        await supabase
          .from('subscriptions')
          .update({ last_notified_at: now.toISOString() })
          .eq('id', sub.id);

        sent++;
        console.log(`[send-digest-emails] Successfully sent digest for subscription ${sub.id}`);

      } catch (error) {
        console.error(`[send-digest-emails] Failed for subscription ${sub.id}:`, error);
        errors.push(`${sub.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    console.log(`[send-digest-emails] Completed: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        targetFrequency,
        currentUtcHour,
        currentUtcMinute,
        currentUtcDay,
        eligibleCount: eligibleSubscriptions.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-digest-emails] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
