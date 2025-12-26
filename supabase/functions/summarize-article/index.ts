import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface ArticleToSummarize {
  id: string;
  title: string;
  content: string;
  raw_content?: string;
}

async function summarizeArticle(article: ArticleToSummarize): Promise<string> {
  const contentToSummarize = article.raw_content || article.content || '';
  
  // Strip HTML if present
  const cleanContent = contentToSummarize
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
    .substring(0, 3000); // Limit content length

  const prompt = `You are a cybersecurity analyst. Summarize this security news article in 2-3 concise sentences focusing on:
- What happened (the threat/vulnerability/incident)
- Who/what is affected
- Key actions or mitigations if mentioned

Title: ${article.title}

Content: ${cleanContent}

Provide only the summary, no preamble or labels.`;

  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[summarize-article] AI API error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      if (response.status === 402) {
        throw new Error('Payment required');
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();
    
    if (!summary) {
      throw new Error('No summary generated');
    }

    return summary;
  } catch (error) {
    console.error(`[summarize-article] Error summarizing article ${article.id}:`, error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[summarize-article] Starting summarization...');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 10;
    const articleId = body.articleId;

    let query = supabase
      .from('news_articles')
      .select('id, title, content, raw_content, summary')
      .eq('is_processed', false);

    if (articleId) {
      query = query.eq('id', articleId);
    } else {
      query = query.order('published_at', { ascending: false }).limit(limit);
    }

    const { data: articles, error: fetchError } = await query;

    if (fetchError) {
      console.error('[summarize-article] Fetch error:', fetchError);
      throw fetchError;
    }

    console.log(`[summarize-article] Found ${articles?.length || 0} articles to summarize`);

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No articles to summarize', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const article of articles) {
      // Skip if already has a good summary
      if (article.summary && article.summary.length > 50) {
        await supabase
          .from('news_articles')
          .update({ is_processed: true })
          .eq('id', article.id);
        processed++;
        continue;
      }

      try {
        console.log(`[summarize-article] Summarizing: ${article.title.substring(0, 50)}...`);
        
        const summary = await summarizeArticle(article);
        
        const { error: updateError } = await supabase
          .from('news_articles')
          .update({ 
            summary,
            is_processed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', article.id);

        if (updateError) {
          console.error(`[summarize-article] Update error for ${article.id}:`, updateError);
          errors.push(`${article.id}: ${updateError.message}`);
          failed++;
        } else {
          processed++;
          console.log(`[summarize-article] Summarized: ${article.id}`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[summarize-article] Error processing ${article.id}:`, error);
        errors.push(`${article.id}: ${error.message}`);
        failed++;
        
        // If rate limited, stop processing
        if (error.message === 'Rate limit exceeded') {
          console.log('[summarize-article] Rate limited, stopping...');
          break;
        }
      }
    }

    console.log(`[summarize-article] Completed: ${processed} processed, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[summarize-article] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
