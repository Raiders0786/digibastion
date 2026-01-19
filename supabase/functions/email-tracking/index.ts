import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// 1x1 transparent GIF for tracking pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

// Simple hash function for IP privacy
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("tid");
    const action = url.searchParams.get("a"); // 'o' for open, 'c' for click
    const redirectUrl = url.searchParams.get("r"); // for click tracking

    if (!trackingId) {
      console.warn("[email-tracking] Missing tracking ID");
      // Still return pixel to avoid breaking email
      return new Response(TRACKING_PIXEL, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Validate tracking ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trackingId)) {
      console.warn("[email-tracking] Invalid tracking ID format");
      return new Response(TRACKING_PIXEL, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client info for analytics
    const userAgent = req.headers.get("user-agent") || "";
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const ipHash = hashIP(clientIP);

    const eventType = action === "c" ? "click" : "open";
    
    // Log the tracking event
    console.log(`[email-tracking] ${eventType} event for tracking_id: ${trackingId.slice(0, 8)}...`);

    // Insert tracking event
    const { error } = await supabase
      .from("email_events")
      .insert({
        tracking_id: trackingId,
        event_type: eventType,
        email_type: "digest", // Default, could be passed as param
        link_url: redirectUrl || null,
        user_agent: userAgent.slice(0, 500), // Limit length
        ip_hash: ipHash,
      });

    if (error) {
      console.error("[email-tracking] Failed to log event:", error);
      // Don't fail the request, just log the error
    }

    // Handle click tracking - redirect to destination
    if (action === "c" && redirectUrl) {
      // Validate URL
      try {
        const targetUrl = new URL(redirectUrl);
        // Only allow http/https redirects
        if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
          throw new Error("Invalid protocol");
        }
        
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            "Location": redirectUrl,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      } catch {
        console.warn("[email-tracking] Invalid redirect URL:", redirectUrl);
        // Fall through to return pixel
      }
    }

    // Return tracking pixel for open tracking
    return new Response(TRACKING_PIXEL, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

  } catch (error) {
    console.error("[email-tracking] Error:", error);
    // Always return the pixel to avoid breaking email display
    return new Response(TRACKING_PIXEL, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
});
