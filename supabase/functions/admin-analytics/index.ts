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
      { data: subscriptions, error: subsError }
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
      
      // Subscription stats
      supabase
        .from("subscriptions")
        .select("id, is_active, is_verified, frequency, created_at")
    ]);

    if (eventsError) console.error("[admin-analytics] Events error:", eventsError);
    if (dailyError) console.error("[admin-analytics] Daily error:", dailyError);
    if (subsError) console.error("[admin-analytics] Subs error:", subsError);

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
