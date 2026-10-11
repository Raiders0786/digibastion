import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  formatReportedUsd,
  formatWeekDay,
  parseWeeklyArchiveResponse,
  weeklyPagePath,
  type WeeklyArchiveEntry,
} from '@/lib/threatIntel/weekly';
import { METHODOLOGY_PATH, TELEGRAM_CHANNEL_URL } from '@/lib/threatIntel/officialLinks';
import { staticRouteMeta, toMetaTagsProps } from '@/seo/routeMeta';
import { buildItemListSchema } from '@/utils/seo';
import { serializeJsonLd } from '@/utils/jsonLd';
import { canonicalWeeklyUrl } from '../../supabase/functions/_shared/site-urls';

const pageMeta = staticRouteMeta('/threat-intel/weekly');
const ARCHIVE_LIMIT = 52;

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; weeks: WeeklyArchiveEntry[] }
  | { status: 'error' };

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "7 incidents, ~$18.4M reported" or "7 incidents". */
function weeklyArchiveSummary(week: WeeklyArchiveEntry): string {
  const loss = formatReportedUsd(week.lossUsd);
  const count = plural(week.incidentCount, 'incident', 'incidents');
  return loss ? `${count}, ${loss}` : count;
}

const WeeklyArchive = () => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    // list_weekly_newsletters is newer than the generated types; Lovable regenerates types.ts later.
    supabase.rpc('list_weekly_newsletters' as never, { p_limit: ARCHIVE_LIMIT } as never).then(
      ({ data, error }) => {
        if (cancelled) return;
        setState(error ? { status: 'error' } : { status: 'ready', weeks: parseWeeklyArchiveResponse(data) });
      },
      () => {
        if (!cancelled) setState({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const weeks = state.status === 'ready' ? state.weeks : [];
  const jsonLd = weeks.length > 0
    ? [...pageMeta.jsonLd, buildItemListSchema('Weekly Web3 hack reports', weeks.map((week) => ({
      url: canonicalWeeklyUrl(week.weekStart),
      name: `Week of ${formatWeekDay(week.weekStart, true)}`,
    })))]
    : pageMeta.jsonLd;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* An error keeps robots at index: a transient failure must not deindex the archive. */}
      <MetaTags {...toMetaTagsProps(pageMeta)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Navbar />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-4">
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link to="/threat-intel" className="hover:text-foreground">Threat Intel</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">Weekly reports</span>
            </nav>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{pageMeta.body.h1}</h1>
            <p className="leading-7 text-muted-foreground">{pageMeta.description}</p>
          </header>

          {state.status === 'loading' && (
            <p className="text-muted-foreground" aria-busy="true">Loading the weekly reports…</p>
          )}
          {state.status === 'error' && (
            <p className="text-muted-foreground" role="alert">
              We could not load the weekly reports. Try again in a minute, or read the{' '}
              <Link to="/threat-intel" className="font-medium text-primary hover:underline">Threat Intel feed</Link>.
            </p>
          )}
          {state.status === 'ready' && weeks.length === 0 && (
            <p className="text-muted-foreground">The first weekly report is published on Monday.</p>
          )}
          {weeks.length > 0 && (
            <ol className="space-y-3">
              {weeks.map((week) => (
                <li key={week.weekStart}>
                  <Card className="p-4">
                    <Link to={weeklyPagePath(week.weekStart)} className="font-semibold text-foreground hover:text-primary hover:underline">
                      {`Week of ${formatWeekDay(week.weekStart, true)}`}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{weeklyArchiveSummary(week)}</p>
                  </Card>
                </li>
              ))}
            </ol>
          )}

          <p className="text-sm leading-6 text-muted-foreground">
            Every item in a report names its source.{' '}
            <Link to={METHODOLOGY_PATH} className="font-medium text-primary hover:underline">How we track incidents</Link>
            {' · '}
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              Get each report on Telegram
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WeeklyArchive;
