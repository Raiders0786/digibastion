import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  tags: string[];
}

interface Subscription {
  id: string;
  email: string;
  name: string | null;
  categories: string[];
  technologies: string[];
  frequency: string;
  severity_threshold: string;
  last_notified_at: string | null;
  verification_token: string | null;
  preferred_hour: number;
  timezone_offset: number;
  preferred_day: number;
}

// Severity ranking for comparison
const severityRank: Record<string, number> = {
  'critical': 0,
  'high': 1,
  'medium': 2,
  'low': 3,
  'info': 4,
};

// HTML escape function
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function shouldIncludeArticle(article: NewsArticle, subscription: Subscription): boolean {
  // Check severity threshold
  const articleRank = severityRank[article.severity] ?? 4;
  const thresholdRank = severityRank[subscription.severity_threshold] ?? 2;
  
  if (articleRank > thresholdRank) {
    return false;
  }

  // Check category match (if subscriber has categories)
  if (subscription.categories.length > 0) {
    if (!subscription.categories.includes(article.category)) {
      return false;
    }
  }

  // Check technology match (optional filter)
  if (subscription.technologies.length > 0 && article.tags.length > 0) {
    const techMatch = subscription.technologies.some(tech => 
      article.tags.some(tag => tag.toLowerCase().includes(tech.toLowerCase()))
    );
    // If they specified technologies but none match, include only critical/high
    if (!techMatch && articleRank > 1) {
      return false;
    }
  }

  return true;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#eab308';
    case 'low': return '#3b82f6';
    default: return '#6b7280';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function generateDigestEmailHtml(
  articles: NewsArticle[], 
  subscriberName: string | null, 
  subscriberEmail: string,
  verificationToken: string | null,
  frequency: string,
  periodStart: Date,
  periodEnd: Date
): string {
  const name = escapeHtml(subscriberName || 'Security Professional');
  const periodLabel = frequency === 'weekly' ? 'Weekly' : 'Daily';
  const dateRange = `${formatDate(periodStart.toISOString())} - ${formatDate(periodEnd.toISOString())}`;
  
  // Group articles by severity
  const criticalArticles = articles.filter(a => a.severity === 'critical');
  const highArticles = articles.filter(a => a.severity === 'high');
  const otherArticles = articles.filter(a => !['critical', 'high'].includes(a.severity));

  const renderArticle = (article: NewsArticle) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #333;">
        <div style="margin-bottom: 6px;">
          <span style="background: ${getSeverityColor(article.severity)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">
            ${escapeHtml(article.severity)}
          </span>
          <span style="color: #6b7280; font-size: 11px; margin-left: 8px;">
            ${formatDate(article.published_at)}
          </span>
          ${article.cve_id ? `<span style="background: #4b5563; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">${escapeHtml(article.cve_id)}</span>` : ''}
        </div>
        <a href="${escapeHtml(article.link)}" style="color: #60a5fa; text-decoration: none; font-weight: 500; font-size: 14px; line-height: 1.4;">
          ${escapeHtml(article.title)}
        </a>
        ${article.summary ? `<p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 1.4;">${escapeHtml(article.summary.slice(0, 150))}${article.summary.length > 150 ? '...' : ''}</p>` : ''}
      </td>
    </tr>
  `;

  const renderSection = (title: string, sectionArticles: NewsArticle[], bgColor: string) => {
    if (sectionArticles.length === 0) return '';
    return `
      <tr>
        <td style="padding: 16px 0 8px 0;">
          <h3 style="margin: 0; color: ${bgColor}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${title} (${sectionArticles.length})
          </h3>
        </td>
      </tr>
      ${sectionArticles.map(renderArticle).join('')}
    `;
  };

  const encodedEmail = encodeURIComponent(subscriberEmail);
  const encodedToken = verificationToken ? encodeURIComponent(verificationToken) : '';
  const manageUrl = verificationToken 
    ? `https://digibastion.com/manage-subscription?email=${encodedEmail}&token=${encodedToken}`
    : `https://digibastion.com/manage-subscription?email=${encodedEmail}`;

  // Summary stats
  const criticalCount = criticalArticles.length;
  const highCount = highArticles.length;
  const totalCount = articles.length;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1f2937; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 24px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);">
        <h1 style="margin: 0; color: white; font-size: 22px;">📊 ${periodLabel} Security Digest</h1>
        <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">
          ${dateRange}
        </p>
      </td>
    </tr>
    
    <!-- Summary Stats -->
    <tr>
      <td style="padding: 20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%" style="text-align: center; padding: 12px; background: rgba(220, 38, 38, 0.1); border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${criticalCount}</div>
              <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase;">Critical</div>
            </td>
            <td width="4%"></td>
            <td width="33%" style="text-align: center; padding: 12px; background: rgba(234, 88, 12, 0.1); border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #ea580c;">${highCount}</div>
              <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase;">High</div>
            </td>
            <td width="4%"></td>
            <td width="33%" style="text-align: center; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${totalCount}</div>
              <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase;">Total</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding: 0 24px 16px 24px;">
        <p style="color: #d1d5db; margin: 0; font-size: 14px;">
          Hi ${name}, here's your ${frequency} security digest with ${totalCount} threat${totalCount !== 1 ? 's' : ''} matching your preferences.
        </p>
      </td>
    </tr>

    <!-- Articles -->
    <tr>
      <td style="padding: 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${renderSection('🚨 Critical Threats', criticalArticles, '#dc2626')}
          ${renderSection('⚠️ High Severity', highArticles, '#ea580c')}
          ${renderSection('📋 Other Alerts', otherArticles.slice(0, 10), '#6b7280')}
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
      <td style="padding: 24px; text-align: center;">
        <a href="https://digibastion.com/threat-intel" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
          View All Threats
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 24px; background: #111827; text-align: center;">
        <p style="margin: 0; color: #6b7280; font-size: 11px;">
          You're receiving this ${frequency} digest because you subscribed to Digibastion Threat Intel.<br>
          <a href="${manageUrl}" style="color: #60a5fa;">Manage preferences</a> | <a href="${manageUrl}" style="color: #60a5fa;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Check if a subscriber should receive digest at this hour
function shouldSendToSubscriber(sub: Subscription, currentUtcHour: number, currentUtcDay: number): boolean {
  // Handle null/undefined values with defaults
  const preferredHour = sub.preferred_hour ?? 9;
  const timezoneOffset = sub.timezone_offset ?? 0;
  const preferredDay = sub.preferred_day ?? 0;
  
  // Convert preferred local hour to UTC
  // preferred_hour is stored as subscriber's local time
  // timezone_offset is their UTC offset (e.g., +5 for UTC+5)
  // To find what UTC hour corresponds to their preferred local hour:
  // UTC hour = local hour - timezone offset
  let preferredUtcHour = preferredHour - timezoneOffset;
  
  // Normalize to 0-23 range
  while (preferredUtcHour < 0) preferredUtcHour += 24;
  while (preferredUtcHour >= 24) preferredUtcHour -= 24;
  
  if (Math.floor(preferredUtcHour) !== currentUtcHour) {
    return false;
  }
  
  // For weekly digests, also check the day
  if (sub.frequency === 'weekly') {
    // Calculate what day it is in subscriber's timezone when we send
    // If timezone_offset is positive (ahead of UTC), and current UTC hour is small,
    // they might already be on the next day
    let subscriberLocalDay = currentUtcDay;
    const subscriberLocalHour = currentUtcHour + timezoneOffset;
    
    if (subscriberLocalHour >= 24) {
      subscriberLocalDay = (subscriberLocalDay + 1) % 7;
    } else if (subscriberLocalHour < 0) {
      subscriberLocalDay = (subscriberLocalDay - 1 + 7) % 7;
    }
    
    if (subscriberLocalDay !== preferredDay) {
      return false;
    }
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let targetHour: number | null = null;
    let targetFrequency: 'daily' | 'weekly' | 'both' = 'both';
    
    try {
      const body = await req.json();
      if (typeof body.target_hour === 'number') {
        targetHour = body.target_hour;
      }
      if (body.frequency === 'daily' || body.frequency === 'weekly') {
        targetFrequency = body.frequency;
      }
    } catch {
      // No body or invalid JSON - will run for all matching subscribers
    }

    const now = new Date();
    const currentUtcHour = targetHour !== null ? targetHour : now.getUTCHours();
    const currentUtcDay = now.getUTCDay(); // 0 = Sunday

    console.log(`[send-digest-emails] Starting digest for hour: ${currentUtcHour}, day: ${currentUtcDay}, frequency: ${targetFrequency}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      shouldSendToSubscriber(sub, currentUtcHour, currentUtcDay)
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
      
      // Determine period based on frequency
      let periodStart: Date;
      if (sub.frequency === 'weekly') {
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Use last_notified_at if available and more recent
      if (sub.last_notified_at) {
        const lastNotified = new Date(sub.last_notified_at);
        if (lastNotified > periodStart) {
          periodStart = lastNotified;
        }
      }

      // Fetch articles for this period
      const { data: articles, error: articlesError } = await supabase
        .from('news_articles')
        .select('id, title, summary, severity, category, link, published_at, cve_id, tags')
        .gte('published_at', periodStart.toISOString())
        .order('published_at', { ascending: false });

      if (articlesError) {
        console.error(`[send-digest-emails] Error fetching articles for ${sub.email}:`, articlesError);
        continue;
      }

      if (!articles || articles.length === 0) {
        console.log(`[send-digest-emails] No articles in period for ${sub.email}`);
        continue;
      }

      // Filter articles based on subscriber preferences
      const matchingArticles = articles.filter(a => shouldIncludeArticle(a as NewsArticle, sub));

      if (matchingArticles.length === 0) {
        console.log(`[send-digest-emails] No matching articles for ${sub.email}`);
        continue;
      }

      console.log(`[send-digest-emails] Sending ${matchingArticles.length} articles to ${sub.email}`);

      try {
        const emailHtml = generateDigestEmailHtml(
          matchingArticles as NewsArticle[], 
          sub.name, 
          sub.email,
          sub.verification_token,
          sub.frequency,
          periodStart,
          now
        );
        
        const periodLabel = sub.frequency === 'weekly' ? 'Weekly' : 'Daily';
        const criticalCount = matchingArticles.filter(a => a.severity === 'critical').length;
        const subjectPrefix = criticalCount > 0 ? '🚨 ' : '📊 ';
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Digibastion Digest <alerts@digibastion.com>',
            to: [sub.email],
            subject: `${subjectPrefix}${periodLabel} Security Digest: ${matchingArticles.length} Threat${matchingArticles.length !== 1 ? 's' : ''} Detected`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`);
        }

        // Update last_notified_at
        await supabase
          .from('subscriptions')
          .update({ last_notified_at: now.toISOString() })
          .eq('id', sub.id);

        sent++;
        console.log(`[send-digest-emails] Successfully sent digest to ${sub.email}`);

      } catch (error) {
        console.error(`[send-digest-emails] Failed to send to ${sub.email}:`, error);
        errors.push(`${sub.email}: ${error.message}`);
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
        currentUtcDay,
        eligibleCount: eligibleSubscriptions.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-digest-emails] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});