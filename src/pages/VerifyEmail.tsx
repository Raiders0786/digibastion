import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CheckCircle, XCircle, Loader2, Send, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetaTags } from "@/components/MetaTags";
import { TELEGRAM_CHANNEL_HANDLE, TELEGRAM_CHANNEL_URL } from "@/lib/threatIntel/officialLinks";

/**
 * The management link from verify-email is absolute (www). Keep only the path
 * and query so the router navigates in place on any host (preview, apex).
 */
export function manageLinkPath(manageUrl: string | undefined): string {
  if (!manageUrl) return "/manage-subscription";
  try {
    const url = new URL(manageUrl);
    return `${url.pathname}${url.search}`;
  } catch {
    return "/manage-subscription";
  }
}

type VerificationStatus = "loading" | "success" | "error" | "invalid";

interface VerificationResult {
  status: VerificationStatus;
  message: string;
  email?: string;
  manageUrl?: string;
}

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<VerificationResult>({
    status: "loading",
    message: "Verifying your email...",
  });

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setResult({
        status: "invalid",
        message: "Invalid verification link. Token is missing.",
      });
      return;
    }

    const verifyEmail = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-email", {
          body: { token },
        });

        if (error) {
          console.error("Verification error:", error);
          setResult({
            status: "error",
            message: "An error occurred during verification. Please try again.",
          });
          return;
        }

        if (data?.success) {
          setResult({
            status: "success",
            message: data.message || "Your email has been verified!",
            email: data.email,
            manageUrl: data.manageUrl,
          });
        } else {
          setResult({
            status: "error",
            message: data?.message || "Verification failed. The link may be invalid or expired.",
          });
        }
      } catch (err) {
        console.error("Verification error:", err);
        setResult({
          status: "error",
          message: "An unexpected error occurred. Please try again.",
        });
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <MetaTags title="Verify Email - Digibastion" description="Verify your email for Digibastion security alerts." noindex={true} />
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-2xl font-bold">
              <Shield className="h-8 w-8 text-primary" />
              <span>Digibastion</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">Security Threat Intelligence</p>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {result.status === "loading" && (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            )}
            {result.status === "success" && (
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            )}
            {(result.status === "error" || result.status === "invalid") && (
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-center mb-2">
            {result.status === "loading" && "Verifying Email"}
            {result.status === "success" && "Email Verified!"}
            {result.status === "error" && "Verification Failed"}
            {result.status === "invalid" && "Invalid Link"}
          </h1>

          {/* Message */}
          <p className="text-muted-foreground text-center mb-6">
            {result.message}
          </p>

          {/* Show email if verified */}
          {result.status === "success" && result.email && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Subscribed as: <strong className="text-foreground">{result.email}</strong>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {result.status === "success" && (
              <>
                {result.manageUrl && (
                  <Button asChild className="w-full">
                    <Link to={manageLinkPath(result.manageUrl)}>
                      Manage Preferences
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild className="w-full">
                  <Link to="/threat-intel">View Threat Intel</Link>
                </Button>
                <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                  <p className="mb-2">While you wait for your first email:</p>
                  <ul className="space-y-2">
                    <li>
                      <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Join {TELEGRAM_CHANNEL_HANDLE} on Telegram for new Web3 incidents
                      </a>
                    </li>
                    <li>
                      <Link to="/threat-intel/weekly" className="inline-flex items-center gap-2 text-primary hover:underline">
                        <Newspaper className="h-4 w-4" aria-hidden="true" />
                        Read the latest weekly report
                      </Link>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {(result.status === "error" || result.status === "invalid") && (
              <>
                <Button asChild className="w-full">
                  <Link to="/threat-intel?tab=subscribe">Subscribe Again</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Back to Home</Link>
                </Button>
              </>
            )}
          </div>

          {/* Footer note for success */}
          {result.status === "success" && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                You'll now receive security alerts based on your preferences.
                <br />
                Check your{' '}
                <Link to={manageLinkPath(result.manageUrl)} className="text-primary hover:underline">
                  preferences
                </Link>{' '}
                to see your delivery schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
