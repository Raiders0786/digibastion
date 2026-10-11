import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QuestionList } from '@/components/QuestionList';
import { supabase } from '@/integrations/supabase/client';
import { formatWeekDay, parseWeeklyArchiveResponse, weeklyPagePath } from '@/lib/threatIntel/weekly';
import { faqEntries, THREAT_INTEL_FAQ_IDS } from '@/seo/siteFacts';

const linkClass = 'font-medium text-primary underline-offset-2 hover:underline';

/** Newest published weekly issue, or null while loading or when the list is unavailable. */
function useLatestWeekStart(): string | null {
  const [weekStart, setWeekStart] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      // list_weekly_newsletters is newer than the generated types; Lovable regenerates types.ts later.
      supabase.rpc('list_weekly_newsletters' as never, { p_limit: 1 } as never).then(
        ({ data, error }) => {
          if (cancelled || error) return;
          setWeekStart(parseWeeklyArchiveResponse(data)[0]?.weekStart ?? null);
        },
        () => undefined,
      );
    } catch {
      // The archive link below still works without the newest issue.
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return weekStart;
}

/** The /threat-intel Q&A block and the links into the weekly reports. */
export const ThreatIntelAnswers = () => {
  const latestWeekStart = useLatestWeekStart();
  const entries = faqEntries().filter((entry) => THREAT_INTEL_FAQ_IDS.includes(entry.id));

  return (
    <section aria-labelledby="threat-intel-questions" className="mx-auto mt-12 max-w-3xl space-y-6">
      <h2 id="threat-intel-questions" className="text-2xl font-bold tracking-tight text-foreground">
        Questions about Threat Intel
      </h2>
      <QuestionList entries={entries} idPrefix="threat-intel-faq" />
      <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 pt-4 text-sm">
        {latestWeekStart && (
          <li>
            <Link to={weeklyPagePath(latestWeekStart)} className={linkClass}>
              Latest weekly report (week of {formatWeekDay(latestWeekStart)})
            </Link>
          </li>
        )}
        <li><Link to="/threat-intel/weekly" className={linkClass}>All weekly reports</Link></li>
        <li><Link to="/faq" className={linkClass}>More questions and answers</Link></li>
      </ul>
    </section>
  );
};
