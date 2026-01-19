import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CriticalArticle {
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
  verification_token: string | null;
}

// Severity ranking for comparison
const severityRank: Record<string, number> = {
  'critical': 0,
  'high': 1,
  'medium': 2,
  'low': 3,
  'info': 4,
};

// HTML escape function to prevent injection attacks
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function shouldNotify(article: CriticalArticle, subscription: Subscription): boolean {
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

  // Check technology match (if subscriber has technologies and article has tags)
  if (subscription.technologies.length > 0 && article.tags.length > 0) {
    const techMatch = subscription.technologies.some(tech => 
      article.tags.some(tag => tag.toLowerCase().includes(tech.toLowerCase()))
    );
    // Technologies are optional filter - only exclude if no match AND subscriber specified technologies
    // For critical alerts, we still notify even without tech match
    if (!techMatch && article.severity !== 'critical') {
      return false;
    }
  }

  return true;
}

function generateEmailHtml(articles: CriticalArticle[], subscriberName: string | null, subscriberEmail: string, verificationToken: string | null): string {
  const name = escapeHtml(subscriberName || 'Security Professional');
  
  const articlesList = articles.map(article => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #333;">
        <div style="margin-bottom: 8px;">
          <span style="background: ${article.severity === 'critical' ? '#dc2626' : '#ea580c'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
            ${escapeHtml(article.severity)}
          </span>
          ${article.cve_id ? `<span style="background: #4b5563; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">${escapeHtml(article.cve_id)}</span>` : ''}
        </div>
        <h3 style="margin: 0 0 8px 0; color: #f3f4f6;">
          <a href="${escapeHtml(article.link)}" style="color: #60a5fa; text-decoration: none;">${escapeHtml(article.title)}</a>
        </h3>
        <p style="margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
          ${escapeHtml(article.summary || 'Click to read more...')}
        </p>
        <div style="margin-top: 8px;">
          ${article.tags.slice(0, 5).map(tag => 
            `<span style="background: #374151; color: #d1d5db; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 4px;">#${escapeHtml(tag)}</span>`
          ).join('')}
        </div>
      </td>
    </tr>
  `).join('');

  const encodedEmail = encodeURIComponent(subscriberEmail);
  const encodedToken = verificationToken ? encodeURIComponent(verificationToken) : '';
  const manageUrl = verificationToken 
    ? `https://digibastion.com/manage-subscription?email=${encodedEmail}&token=${encodedToken}`
    : `https://digibastion.com/manage-subscription?email=${encodedEmail}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1f2937; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="padding: 24px; background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);">
        <h1 style="margin: 0; color: white; font-size: 24px;">🚨 Critical Security Alert</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
          ${articles.length} new critical/high severity ${articles.length === 1 ? 'threat' : 'threats'} detected
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px;">
        <p style="color: #d1d5db; margin: 0 0 16px 0;">
          Hi ${name},<br><br>
          We've detected new security threats that match your alert preferences. Review them immediately:
        </p>
      </td>
    </tr>
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${articlesList}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; text-align: center; border-top: 1px solid #374151;">
        <a href="https://digibastion.com/threat-intel" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          View All Threats
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; background: #111827; text-align: center;">
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          You're receiving this because you subscribed to Digibastion Threat Intel alerts.<br>
          <a href="${manageUrl}" style="color: #60a5fa;">Manage preferences</a> | <a href="${manageUrl}" style="color: #60a5fa;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[send-critical-alerts] Starting alert check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recent critical/high articles (last 6 hours for immediate alerts)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .select('id, title, summary, severity, category, link, published_at, cve_id, tags')
      .in('severity', ['critical', 'high'])
      .gte('created_at', sixHoursAgo)
      .order('published_at', { ascending: false });

    if (articlesError) {
      console.error('[send-critical-alerts] Error fetching articles:', articlesError);
      throw articlesError;
    }

    console.log(`[send-critical-alerts] Found ${articles?.length || 0} recent critical/high articles`);

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No critical articles to notify about', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active subscriptions with immediate frequency
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .eq('frequency', 'immediate');

    if (subsError) {
      console.error('[send-critical-alerts] Error fetching subscriptions:', subsError);
      throw subsError;
    }

    console.log(`[send-critical-alerts] Found ${subscriptions?.length || 0} immediate subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No immediate subscriptions', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if Resend is configured
    if (!resendApiKey) {
      console.warn('[send-critical-alerts] RESEND_API_KEY not configured - logging notifications only');
      
      // Log what would be sent
      let wouldSend = 0;
      for (const subscription of subscriptions) {
        const matchingArticles = articles.filter(a => shouldNotify(a as CriticalArticle, subscription as Subscription));
        if (matchingArticles.length > 0) {
          console.log(`[send-critical-alerts] Would notify ${subscription.email} about ${matchingArticles.length} articles`);
          wouldSend++;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'RESEND_API_KEY not configured - notifications logged only',
          wouldSend,
          articles: articles.length,
          subscriptions: subscriptions.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      const sub = subscription as Subscription;
      
      // Filter articles for this subscriber
      const matchingArticles = articles.filter(a => shouldNotify(a as CriticalArticle, sub));
      
      if (matchingArticles.length === 0) {
        continue;
      }

      // Check which articles haven't been notified yet
      const { data: sentLogs } = await supabase
        .from('notification_log')
        .select('article_id')
        .eq('subscription_id', sub.id)
        .in('article_id', matchingArticles.map(a => a.id));

      const sentArticleIds = new Set((sentLogs || []).map(l => l.article_id));
      const newArticles = matchingArticles.filter(a => !sentArticleIds.has(a.id));

      if (newArticles.length === 0) {
        continue;
      }

      console.log(`[send-critical-alerts] Sending ${newArticles.length} articles to ${sub.email}`);

      try {
        // Send email via Resend
        const emailHtml = generateEmailHtml(newArticles as CriticalArticle[], sub.name, sub.email, sub.verification_token);
        
        // Build one-click unsubscribe URL for RFC 8058 compliance
        const encodedToken = sub.verification_token ? encodeURIComponent(sub.verification_token) : '';
        const encodedEmail = encodeURIComponent(sub.email);
        const oneClickUnsubUrl = `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/one-click-unsubscribe?token=${encodedToken}&email=${encodedEmail}`;
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Digibastion Alerts <alerts@digibastion.com>',
            to: [sub.email],
            subject: `🚨 ${newArticles.length} Critical Security Alert${newArticles.length > 1 ? 's' : ''} - Immediate Action Required`,
            html: emailHtml,
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

        // Log successful notifications
        for (const article of newArticles) {
          await supabase
            .from('notification_log')
            .insert({
              subscription_id: sub.id,
              article_id: article.id,
              status: 'sent',
            })
            .single();
        }

        // Update last_notified_at
        await supabase
          .from('subscriptions')
          .update({ last_notified_at: new Date().toISOString() })
          .eq('id', sub.id);

        sent++;
        console.log(`[send-critical-alerts] Successfully sent to ${sub.email}`);

      } catch (error) {
        console.error(`[send-critical-alerts] Failed to send to ${sub.email}:`, error);
        errors.push(`${sub.email}: ${error.message}`);
        failed++;

        // Log failed notification
        for (const article of newArticles) {
          await supabase
            .from('notification_log')
            .insert({
              subscription_id: sub.id,
              article_id: article.id,
              status: 'failed',
              error_message: error.message,
            })
            .single();
        }
      }
    }

    console.log(`[send-critical-alerts] Completed: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        articles: articles.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-critical-alerts] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
