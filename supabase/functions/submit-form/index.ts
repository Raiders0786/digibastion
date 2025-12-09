import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SOCIAL_LENGTH = 100;
const MAX_URL_LENGTH = 500;

interface ContactFormData {
  name: string;
  email: string;
  inquiryType?: string;
  social?: string;
  meetingLink?: string;
  message: string;
}

interface SubscriptionFormData {
  name?: string;
  email: string;
  categories: string[];
  technologies?: string[];
  frequency: string;
  severity: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= MAX_EMAIL_LENGTH;
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return url.length <= MAX_URL_LENGTH;
  } catch {
    return false;
  }
}

function sanitizeString(str: string, maxLength: number): string {
  return str.trim().slice(0, maxLength);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    const web3formsKey = Deno.env.get("WEB3FORMS_KEY");

    if (!web3formsKey) {
      console.error("WEB3FORMS_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formData: Record<string, string>;

    if (type === "contact") {
      const contactData = data as ContactFormData;
      
      // Validate required fields
      if (!contactData.name || !contactData.email || !contactData.message) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate email
      if (!validateEmail(contactData.email)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid email address" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate meeting link if provided
      if (contactData.meetingLink && !validateUrl(contactData.meetingLink)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid meeting link URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sanitize inputs
      formData = {
        access_key: web3formsKey,
        subject: "New Contact Form Submission - Digibastion",
        from_name: "Digibastion Contact Form",
        name: sanitizeString(contactData.name, MAX_NAME_LENGTH),
        email: sanitizeString(contactData.email, MAX_EMAIL_LENGTH),
        inquiry_type: sanitizeString(contactData.inquiryType || "general", 50),
        social: sanitizeString(contactData.social || "", MAX_SOCIAL_LENGTH),
        meeting_link: contactData.meetingLink ? sanitizeString(contactData.meetingLink, MAX_URL_LENGTH) : "",
        message: sanitizeString(contactData.message, MAX_MESSAGE_LENGTH),
      };

    } else if (type === "subscription") {
      const subData = data as SubscriptionFormData;
      
      // Validate required fields
      if (!subData.email || !subData.categories || subData.categories.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate email
      if (!validateEmail(subData.email)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid email address" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sanitize inputs
      formData = {
        access_key: web3formsKey,
        subject: "New Digibastion Threat Intel Subscription",
        from_name: "Digibastion Threat Intel",
        name: sanitizeString(subData.name || "Subscriber", MAX_NAME_LENGTH),
        email: sanitizeString(subData.email, MAX_EMAIL_LENGTH),
        message: `
New subscription request:
- Email: ${sanitizeString(subData.email, MAX_EMAIL_LENGTH)}
- Name: ${sanitizeString(subData.name || 'Not provided', MAX_NAME_LENGTH)}
- Categories: ${subData.categories.slice(0, 10).map(c => sanitizeString(c, 50)).join(', ')}
- Technologies: ${(subData.technologies || []).slice(0, 20).map(t => sanitizeString(t, 50)).join(', ') || 'None selected'}
- Frequency: ${sanitizeString(subData.frequency, 20)}
- Min Severity: ${sanitizeString(subData.severity, 20)}
        `.trim()
      };

    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid form type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Submitting form to Web3Forms:", type);

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    console.log("Web3Forms response:", result.success ? "success" : "failed");

    return new Response(
      JSON.stringify({ success: result.success, message: result.message }),
      { status: result.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in submit-form function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
