import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isPublishable } from '@/lib/threatIntel/articleRow';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';

interface NotificationState {
  alertCount: number;
  hasNewQuiz: boolean;
  lastCheckedAlerts: string | null;
}

export const useMobileNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationState>({
    alertCount: 0,
    hasNewQuiz: false,
    lastCheckedAlerts: null,
  });

  useEffect(() => {
    // Load last checked timestamp from localStorage
    const lastChecked = localStorage.getItem('lastCheckedAlerts');
    const lastQuizVisit = localStorage.getItem('lastQuizVisit');

    // Check for new critical/high severity alerts since last check
    const fetchNewAlerts = async () => {
      try {
        const checkTime = lastChecked || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { count, error } = await supabase
          .from('news_articles')
          .select('id', { count: 'exact', head: true })
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .in('severity', ['critical', 'high'])
          .gte('published_at', checkTime);

        if (!error && count !== null) {
          setNotifications(prev => ({
            ...prev,
            alertCount: Math.min(count, 99), // Cap at 99
            lastCheckedAlerts: checkTime,
          }));
        }
      } catch (err) {
        console.error('Error fetching alert count:', err);
      }
    };

    // Check if there's a new quiz challenge (weekly reset)
    const checkQuizStatus = () => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const hasNewChallenge = !lastQuizVisit || new Date(lastQuizVisit) < weekStart;
      setNotifications(prev => ({ ...prev, hasNewQuiz: hasNewChallenge }));
    };

    fetchNewAlerts();
    checkQuizStatus();

    // Subscribe to realtime updates for new critical alerts
    const channel = supabase
      .channel('mobile-alert-badges')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_articles',
        },
        (payload) => {
          const row = payload.new as { severity?: string; metadata?: unknown } | null;
          const isAlertSeverity = row?.severity === 'critical' || row?.severity === 'high';
          // Merged duplicates and classifier rejections never reach the feed,
          // so they must not raise the badge either.
          if (isAlertSeverity && isPublishable(row?.metadata)) {
            setNotifications(prev => ({
              ...prev,
              alertCount: Math.min(prev.alertCount + 1, 99),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAlertsRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastCheckedAlerts', now);
    setNotifications(prev => ({ ...prev, alertCount: 0, lastCheckedAlerts: now }));
  };

  const markQuizVisited = () => {
    localStorage.setItem('lastQuizVisit', new Date().toISOString());
    setNotifications(prev => ({ ...prev, hasNewQuiz: false }));
  };

  return {
    alertCount: notifications.alertCount,
    hasNewQuiz: notifications.hasNewQuiz,
    markAlertsRead,
    markQuizVisited,
  };
};
