import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, Mail } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import { METHODOLOGY_PATH, SITE_URL } from '@/lib/threatIntel/officialLinks';
import {
  formatReportedUsd,
  formatWeekDay,
  parseWeekStart,
  parseWeeklyNewsletterResponse,
  safeHttpUrl,
  weeklyDescription,
  weeklyPagePath,
  weeklyPageTitle,
  weeklySubscribeHref,
  type NewsletterItem,
  type WeeklyNewsletterPage,
  type WeeklyParagraph,
  type WeeklyPublicContent,
} from '@/lib/threatIntel/weekly';

const AI_NOTE = 'Written by AI from the data above';
const TOP_LIMIT = 5;
type WeeklyDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: Database['public']['Functions'] & {
      get_weekly_newsletter: { Args: { p_week_start: string }; Returns: Json };
    };
  };
};
const weeklyClient = supabase as unknown as SupabaseClient<WeeklyDatabase>;
const SEVERITY_CLASSES: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
  info: 'text-muted-foreground',
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; page: WeeklyNewsletterPage }
  | { status: 'not-found' }
  | { status: 'error' };

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Same-site links stay inside the app; anything else must be http(s). */
function SmartLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const site = SITE_URL.replace(/\/+$/, '');
  if (href.startsWith(`${site}/`)) {
    return <Link to={href.slice(site.length)} className={className}>{children}</Link>;
  }
  const safe = safeHttpUrl(href);
  if (!safe) return <span className={className}>{children}</span>;
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} aria-labelledby={`${id}-heading`} className="space-y-4">
    <h2 id={`${id}-heading`} className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
    {children}
  </section>
);

function Paragraph({ paragraph }: { paragraph: WeeklyParagraph }) {
  return (
    <div>
      <p className="leading-7 text-foreground/90">{paragraph.text}</p>
      {paragraph.origin === 'ai' && <p className="mt-1 text-xs italic text-muted-foreground">{AI_NOTE}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: NewsletterItem['status'] }) {
  if (status === 'confirmed') {
    return <span className="rounded-md border border-emerald-500/40 px-2 py-0.5 text-xs font-semibold text-emerald-300">Confirmed</span>;
  }
  if (status === 'unconfirmed') {
    return <span className="rounded-md border border-amber-500/40 px-2 py-0.5 text-xs font-semibold text-amber-300">Unconfirmed</span>;
  }
  return null;
}

function ItemFacts({ item }: { item: NewsletterItem }) {
  const loss = item.isWeb3Incident ? formatReportedUsd(item.amountUsd ?? 0) : null;
  const facts = item.isWeb3Incident ? [item.chain, item.attackType] : [item.cveId];
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span className={`font-semibold uppercase ${SEVERITY_CLASSES[item.severity] ?? SEVERITY_CLASSES.info}`}>{item.severity}</span>
      <StatusBadge status={item.status} />
      {facts.filter(Boolean).map((fact) => <span key={fact}>{fact}</span>)}
      {loss && <span className="font-medium text-foreground">{loss}</span>}
    </div>
  );
}

function ItemLinks({ item }: { item: NewsletterItem }) {
  const sourceUrl = safeHttpUrl(item.sourceUrl);
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      {item.sourceName && (
        <span>
          Source:{' '}
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
              {item.sourceName}
            </a>
          ) : item.sourceName}
        </span>
      )}
      <SmartLink href={item.incidentUrl} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline">
        Details on Digibastion
      </SmartLink>
    </p>
  );
}

function TotalsTile({ label, value, detail }: { label: string; value: string; detail?: string | null }) {
  return (
    <Card className="min-w-0 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-2xl font-bold text-foreground">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </Card>
  );
}

function Breakdown({ title, entries }: { title: string; entries: WeeklyPublicContent['totals']['byChain'] }) {
  if (entries.length === 0) return null;
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {entries.map((entry) => {
          const loss = formatReportedUsd(entry.lossUsd);
          return <li key={entry.key ?? entry.label}>{`${entry.label}: ${plural(entry.count, 'incident', 'incidents')}${loss ? `, ${loss}` : ''}`}</li>;
        })}
      </ul>
    </div>
  );
}

function Totals({ content }: { content: WeeklyPublicContent }) {
  const t = content.totals;
  const previous = formatReportedUsd(t.previousLossUsd) ?? 'no loss amounts reported';
  const unconfirmedLoss = formatReportedUsd(t.unconfirmedLossUsd);
  return (
    <Section id="totals" title="This week in numbers">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TotalsTile label="Reported losses" value={formatReportedUsd(t.lossUsd) ?? 'None reported'} detail={`Previous week: ${previous}`} />
        <TotalsTile label="Incidents" value={String(t.incidentCount)} detail={t.lateReportCount > 0 ? `${plural(t.lateReportCount, 'late report', 'late reports')} not counted` : null} />
        <TotalsTile
          label="Unconfirmed"
          value={String(t.unconfirmedCount)}
          detail={unconfirmedLoss ? `${unconfirmedLoss}, not included above` : 'Not included above'}
        />
        <TotalsTile label="Funds returned" value={String(t.fundsReturnedCount)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Breakdown title="By attack type" entries={t.byAttackType} />
        <Breakdown title="By chain" entries={t.byChain} />
      </div>
    </Section>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Weekly issue not found</h1>
      <p className="leading-7 text-muted-foreground">{message}</p>
      <Link to="/threat-intel" className="inline-flex items-center gap-2 font-medium text-primary underline-offset-2 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Threat Intel
      </Link>
    </div>
  );
}

function WeeklyIssue({ page }: { page: WeeklyNewsletterPage }) {
  const { content } = page;
  const top = content.top.slice(0, TOP_LIMIT);
  const tipUrl = content.opsecTip.url;
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header className="space-y-4">
        <Link to="/threat-intel" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Threat Intel
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Weekly deep-dive</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{weeklyPageTitle(content)}</h1>
        <p className="leading-7 text-muted-foreground">
          {`Web3 incidents added ${formatWeekDay(content.weekStart)} to ${formatWeekDay(content.weekEnd, true)} (UTC). `}
          Figures are computed from the source data, and each item names its source. Statuses are the sources&apos; own.{' '}
          <Link to={METHODOLOGY_PATH} className="font-medium text-primary underline-offset-2 hover:underline">How we track incidents</Link>
        </p>
      </header>

      <Totals content={content} />

      {top.length > 0 && (
        <Section id="top" title="Top incidents">
          <div className="space-y-4">
            {top.map(({ item, what, action }) => (
              <Card key={item.uid} className="min-w-0 p-4">
                <article className="space-y-3" aria-label={item.title}>
                  <ItemFacts item={item} />
                  <h3 className="break-words text-lg font-semibold text-foreground">
                    <SmartLink href={item.incidentUrl} className="hover:underline">{item.title}</SmartLink>
                  </h3>
                  <Paragraph paragraph={what} />
                  <Paragraph paragraph={action} />
                  <ItemLinks item={item} />
                </article>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section id="trends" title="Trends">
        <Paragraph paragraph={content.trends} />
      </Section>

      <Section id="vulnerabilities" title="Vulnerabilities and supply-chain">
        <Paragraph paragraph={content.vulnerabilities.summary} />
        {content.vulnerabilities.items.length > 0 && (
          <ul className="space-y-3">
            {content.vulnerabilities.items.map((item) => (
              <li key={item.uid} className="min-w-0 space-y-1 border-l-2 border-border pl-3">
                <ItemFacts item={item} />
                <p className="break-words font-medium text-foreground">{item.title}</p>
                <ItemLinks item={item} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="opsec" title="Opsec tip">
        <Card className="space-y-2 p-4">
          <p className="leading-7 text-foreground/90">{content.opsecTip.text}</p>
          {content.opsecTip.guideTitle && (
            <SmartLink href={tipUrl} className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline">
              {content.opsecTip.guideTitle}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </SmartLink>
          )}
        </Card>
      </Section>

      {content.sources.length > 0 && (
        <Section id="sources" title="Sources">
          <ul className="flex flex-wrap gap-2">
            {content.sources.map((source) => (
              <li key={source} className="rounded-md border border-border px-2 py-1 text-sm text-muted-foreground">{source}</li>
            ))}
          </ul>
        </Section>
      )}

      <Card className="space-y-3 p-5">
        <h2 className="text-xl font-semibold text-foreground">Get the weekly deep-dive by email</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          One email each Monday at your local hour, with the same figures and sources as this page.
        </p>
        <Link
          to={weeklySubscribeHref()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Get the weekly deep-dive
        </Link>
      </Card>

      <nav aria-label="Other weeks" className="flex flex-wrap justify-between gap-3 text-sm">
        {page.previousWeekStart ? (
          <Link to={weeklyPagePath(page.previousWeekStart)} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {`Previous week: ${formatWeekDay(page.previousWeekStart)}`}
          </Link>
        ) : <span />}
        {page.nextWeekStart && (
          <Link to={weeklyPagePath(page.nextWeekStart)} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            {`Next week: ${formatWeekDay(page.nextWeekStart)}`}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </nav>
    </div>
  );
}

const WeeklyNewsletter = () => {
  const { weekStart: rawWeekStart } = useParams<{ weekStart: string }>();
  const weekStart = parseWeekStart(rawWeekStart);
  const [state, setState] = useState<LoadState>(weekStart ? { status: 'loading' } : { status: 'not-found' });

  useEffect(() => {
    if (!weekStart) {
      setState({ status: 'not-found' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    weeklyClient.rpc('get_weekly_newsletter', { p_week_start: weekStart }).then(
      ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: 'error' });
          return;
        }
        const page = parseWeeklyNewsletterResponse(data);
        setState(page ? { status: 'ready', page } : { status: 'not-found' });
      },
      () => {
        if (!cancelled) setState({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  const canonical = weekStart ? `${SITE_URL}${weeklyPagePath(weekStart)}` : undefined;
  const meta = state.status === 'ready'
    ? <MetaTags title={`${weeklyPageTitle(state.page.content)} | Digibastion`} description={weeklyDescription(state.page.content)} canonical={canonical} type="article" />
    : <MetaTags title="Weekly deep-dive | Digibastion" canonical={canonical} noindex={state.status !== 'loading'} />;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {meta}
      <Navbar />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        {state.status === 'loading' && (
          <p className="mx-auto max-w-3xl text-muted-foreground" aria-busy="true">Loading the weekly issue…</p>
        )}
        {state.status === 'not-found' && (
          <div className="mx-auto max-w-3xl">
            <NotFound message="There is no published weekly deep-dive for this date. Weekly issues start on a Monday." />
          </div>
        )}
        {state.status === 'error' && (
          <div className="mx-auto max-w-3xl space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Weekly deep-dive</h1>
            <p className="text-muted-foreground">We could not load this weekly issue. Please try again in a moment.</p>
          </div>
        )}
        {state.status === 'ready' && <WeeklyIssue page={state.page} />}
      </main>
      <Footer />
    </div>
  );
};

export default WeeklyNewsletter;
