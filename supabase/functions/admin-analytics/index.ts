import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn("[admin-analytics] Auth failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.warn(`[admin-analytics] User ${user.id} is not admin`);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[admin-analytics] Admin ${user.email} accessing analytics`);

    // Parse request body for date range
    let startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let endDate = new Date().toISOString();

    try {
      const body = await req.json();
      if (body.startDate) startDate = body.startDate;
      if (body.endDate) endDate = body.endDate;
    } catch {
      // Use defaults
    }

    // Fetch email analytics
    const [
      { data: events, error: eventsError },
      { data: dailyStats, error: dailyError },
      { data: subscriptions, error: subsError },
      { data: allEmailEvents, error: allEventsError }
    ] = await Promise.all([
      // Recent events
      supabase
        .from("email_events")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false })
        .limit(500),
      
      // Daily aggregates
      supabase
        .from("email_events")
        .select("created_at, email_type, event_type")
        .gte("created_at", startDate)
        .lte("created_at", endDate),
      
      // Full subscription details for subscriber table
      supabase
        .from("subscriptions")
        .select("id, email, name, is_active, is_verified, frequency, severity_threshold, categories, last_notified_at, created_at, preferred_hour, timezone_offset")
        .order("created_at", { ascending: false }),
      
      // All email events with subscription_id for per-user stats
      supabase
        .from("email_events")
        .select("subscription_id, event_type")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
    ]);

    if (eventsError) console.error("[admin-analytics] Events error:", eventsError);
    if (dailyError) console.error("[admin-analytics] Daily error:", dailyError);
    if (subsError) console.error("[admin-analytics] Subs error:", subsError);
    if (allEventsError) console.error("[admin-analytics] All events error:", allEventsError);

    // Calculate aggregated stats
    const allEvents = dailyStats || [];
    const sentCount = allEvents.filter(e => e.event_type === "sent").length;
    const openCount = allEvents.filter(e => e.event_type === "open").length;
    const clickCount = allEvents.filter(e => e.event_type === "click").length;

    // Group by day for charts
    const dailyAggregates: Record<string, { sent: number; open: number; click: number }> = {};
    
    for (const event of allEvents) {
      const day = new Date(event.created_at).toISOString().split("T")[0];
      if (!dailyAggregates[day]) {
        dailyAggregates[day] = { sent: 0, open: 0, click: 0 };
      }
      if (event.event_type === "sent") dailyAggregates[day].sent++;
      else if (event.event_type === "open") dailyAggregates[day].open++;
      else if (event.event_type === "click") dailyAggregates[day].click++;
    }

    // Convert to array for charts
    const dailyData = Object.entries(dailyAggregates)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build per-subscriber stats
    const subscriberStats: Record<string, { sent: number; opens: number; clicks: number }> = {};
    for (const event of (allEmailEvents || [])) {
      if (!event.subscription_id) continue;
      if (!subscriberStats[event.subscription_id]) {
        subscriberStats[event.subscription_id] = { sent: 0, opens: 0, clicks: 0 };
      }
      if (event.event_type === "sent") subscriberStats[event.subscription_id].sent++;
      else if (event.event_type === "open") subscriberStats[event.subscription_id].opens++;
      else if (event.event_type === "click") subscriberStats[event.subscription_id].clicks++;
    }

    // Subscription breakdown
    const subs = subscriptions || [];
    const subStats = {
      total: subs.length,
      active: subs.filter(s => s.is_active && s.is_verified).length,
      unverified: subs.filter(s => !s.is_verified).length,
      inactive: subs.filter(s => !s.is_active).length,
      byFrequency: {
        immediate: subs.filter(s => s.frequency === "immediate" && s.is_active).length,
        daily: subs.filter(s => s.frequency === "daily" && s.is_active).length,
        weekly: subs.filter(s => s.frequency === "weekly" && s.is_active).length,
      }
    };

    // Build subscriber details with stats
    const subscriberDetails = subs.map(sub => ({
      id: sub.id,
      email: sub.email,
      name: sub.name,
      is_active: sub.is_active,
      is_verified: sub.is_verified,
      frequency: sub.frequency,
      severity_threshold: sub.severity_threshold,
      categories: sub.categories,
      preferred_hour: sub.preferred_hour,
      timezone_offset: sub.timezone_offset,
      last_notified_at: sub.last_notified_at,
      created_at: sub.created_at,
      stats: subscriberStats[sub.id] || { sent: 0, opens: 0, clicks: 0 }
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          summary: {
            sent: sentCount,
            opens: openCount,
            clicks: clickCount,
            openRate: sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(1) : "0",
            clickRate: openCount > 0 ? ((clickCount / openCount) * 100).toFixed(1) : "0",
          },
          dailyData,
          subscriptions: subStats,
          subscriberDetails,
          recentEvents: (events || []).slice(0, 50),
          dateRange: { startDate, endDate }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[admin-analytics] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
