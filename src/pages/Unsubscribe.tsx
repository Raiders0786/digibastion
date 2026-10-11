import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertTriangle, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';

type Status = 'idle' | 'working' | 'done' | 'error';

const linkClass = 'text-primary underline underline-offset-4 hover:text-primary/80';

/**
 * Body unsubscribe link target. With an email and token it unsubscribes once
 * on load (the RFC 8058 header link stays POST-only), then offers the
 * management page and a way back in through the opt-in flow.
 */
export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const hasLink = Boolean(email && token);
  const [status, setStatus] = useState<Status>(hasLink ? 'working' : 'idle');
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development; send the request once.
    if (!hasLink || started.current) return;
    started.current = true;
    supabase.functions.invoke('unsubscribe', { body: { email, token } })
      .then(({ data, error }) => setStatus(!error && data?.success ? 'done' : 'error'))
      .catch(() => setStatus('error'));
  }, [hasLink, email, token]);

  const manageUrl = hasLink
    ? `/manage-subscription?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
    : '/manage-subscription';

  return (
    <>
      <MetaTags
        title="Unsubscribe | Digibastion"
        description="Unsubscribe from Digibastion emails."
        noindex={true}
      />
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="glass-card">
            <CardContent className="p-8 md:p-12 text-center">
              {status === 'working' && (
                <div role="status" className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
                  <p className="text-muted-foreground">Unsubscribing…</p>
                </div>
              )}

              {status === 'done' && (
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle className="w-14 h-14 text-green-500" aria-hidden="true" />
                  <h1 className="text-2xl font-bold">You're unsubscribed from all Digibastion emails.</h1>
                  <p className="text-muted-foreground">
                    You will not get real-time alerts, the daily brief or the weekly deep-dive at this address.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center">
                    <Link to={manageUrl} className={linkClass}>Manage preferences</Link>
                    <Link to={manageUrl} className={linkClass}>Changed your mind? Resubscribe</Link>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-center gap-4">
                  <AlertTriangle className="w-14 h-14 text-destructive" aria-hidden="true" />
                  <h1 className="text-2xl font-bold">We could not unsubscribe you.</h1>
                  <p className="text-muted-foreground">
                    The link may be out of date, or the request failed. Try again from the management page.
                  </p>
                  <Link to={manageUrl} className={linkClass}>Manage preferences</Link>
                </div>
              )}

              {status === 'idle' && (
                <div className="flex flex-col items-center gap-4">
                  <Mail className="w-14 h-14 text-primary" aria-hidden="true" />
                  <h1 className="text-2xl font-bold">Unsubscribe</h1>
                  <p className="text-muted-foreground">
                    Use the unsubscribe link in any Digibastion email, or request a secure link from the management page.
                  </p>
                  <Link to={manageUrl} className={linkClass}>Go to subscription management</Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
