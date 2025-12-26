import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Bell, ShieldAlert } from 'lucide-react';
import { NewsCategory, SeverityLevel } from '@/types/news';

interface RealtimeAlertListenerProps {
  onNewArticle?: (article: any) => void;
  enabled?: boolean;
}

export const RealtimeAlertListener = ({ 
  onNewArticle, 
  enabled = true 
}: RealtimeAlertListenerProps) => {
  const { toast } = useToast();
  const hasShownWelcomeToast = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Show connection toast once
    if (!hasShownWelcomeToast.current) {
      hasShownWelcomeToast.current = true;
      console.log('[Realtime] Connecting to threat intelligence feed...');
    }

    const channel = supabase
      .channel('critical-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_articles',
        },
        (payload) => {
          console.log('[Realtime] New article received:', payload);
          
          const article = payload.new as {
            id: string;
            title: string;
            severity: SeverityLevel;
            category: NewsCategory;
            summary: string;
            cve_id?: string;
          };

          // Only show notifications for critical and high severity
          if (article.severity === 'critical' || article.severity === 'high') {
            const isCritical = article.severity === 'critical';
            
            toast({
              title: (
                <div className="flex items-center gap-2">
                  {isCritical ? (
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  )}
                  <span className={isCritical ? 'text-red-500' : 'text-orange-500'}>
                    {isCritical ? 'CRITICAL ALERT' : 'High Priority Alert'}
                  </span>
                </div>
              ) as any,
              description: (
                <div className="mt-1">
                  <p className="font-medium text-sm">{article.title}</p>
                  {article.cve_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      CVE: {article.cve_id}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Category: {article.category.replace(/-/g, ' ')}
                  </p>
                </div>
              ) as any,
              duration: isCritical ? 10000 : 6000, // Critical stays longer
              variant: isCritical ? 'destructive' : 'default',
            });

            // Play notification sound for critical alerts
            if (isCritical && typeof window !== 'undefined') {
              try {
                // Create a simple beep sound using Web Audio API
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.1;
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
              } catch (e) {
                console.log('[Realtime] Could not play notification sound:', e);
              }
            }
          }

          // Notify parent component
          if (onNewArticle) {
            onNewArticle(article);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to critical alerts');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Failed to subscribe to alerts');
        }
      });

    return () => {
      console.log('[Realtime] Unsubscribing from critical alerts');
      supabase.removeChannel(channel);
    };
  }, [enabled, onNewArticle, toast]);

  // This component doesn't render anything visible
  return null;
};
