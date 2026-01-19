import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {result.status === "success" && (
              <>
                {result.manageUrl && (
                  <Button asChild className="w-full">
                    <Link to={result.manageUrl.replace("https://digibastion.com", "")}>
                      Manage Preferences
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild className="w-full">
                  <Link to="/threat-intel">View Threat Intel</Link>
                </Button>
              </>
            )}

            {(result.status === "error" || result.status === "invalid") && (
              <>
                <Button asChild className="w-full">
                  <Link to="/threat-intel">View Threat Intel</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Back to Home</Link>
                </Button>
              </>
            )}
          </div>

          {/* Footer note for success */}
          {result.status === "success" && (
            <p className="text-xs text-muted-foreground text-center mt-6">
              You'll now receive security alerts based on your preferences.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
