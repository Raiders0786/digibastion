import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import {
  ALERTS_SENDER_EMAIL,
  CHAINABUSE_URL,
  CISA_KEV_URL,
  CORRECTIONS_EMAIL,
  NVD_URL,
  QUILLMONITOR_DATABASE_URL,
  REVOKE_CASH_URL,
  SEAL_911_URL,
  SITE_URL,
  TELEGRAM_CHANNEL_URL,
  TELEGRAM_COMMUNITY_URL,
  WEB3_IS_GOING_GREAT_URL,
} from '@/lib/threatIntel/officialLinks';
import { SLOWMIST_ATTRIBUTION_URL } from '@/utils/newsIncident';

const ExternalAnchor = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
    {children}
  </a>
);

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28 space-y-4">
    <h2 id={`${id}-heading`} className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
    {children}
  </section>
);

const severityRubric = [
  { level: 'Critical', rule: 'Reported loss of $50M or more.' },
  { level: 'High', rule: 'Reported loss from $10M up to $50M.' },
  { level: 'Medium', rule: 'Reported loss from $1M up to $10M.' },
  {
    level: 'High',
    rule: 'Loss under $1M or not disclosed, when the attack is a private-key compromise, an access-control flaw, oracle manipulation, reentrancy or a flash-loan attack.',
  },
  { level: 'Medium', rule: 'Any other disclosed loss under $1M.' },
  { level: 'Low', rule: 'No loss disclosed and none of the attack types above.' },
];

const references = [
  { name: 'CISA Known Exploited Vulnerabilities catalog', href: CISA_KEV_URL, use: 'Which CVEs attackers are exploiting now.' },
  { name: 'NVD', href: NVD_URL, use: 'CVE records and severity scores.' },
  { name: 'OWASP Smart Contract Top 10', href: 'https://owasp.org/www-project-smart-contract-top-10/', use: 'Names for smart-contract attack types.' },
  { name: 'SEAL 911', href: SEAL_911_URL, use: 'Emergency help for teams under active attack.' },
  { name: 'Chainabuse', href: CHAINABUSE_URL, use: 'Check or report a scam address.' },
  { name: 'Revoke.cash', href: REVOKE_CASH_URL, use: 'Review and revoke token approvals.' },
  { name: 'Chainalysis: crypto hacking and stolen funds', href: 'https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/', use: 'Yearly loss figures.' },
  { name: 'TRM Labs 2026 Crypto Crime Report', href: 'https://www.trmlabs.com/reports-and-whitepapers/2026-crypto-crime-report', use: 'Yearly loss figures.' },
  { name: 'Immunefi research', href: 'https://immunefi.com/blog/research/', use: 'Quarterly loss reports.' },
  { name: 'ScamSniffer', href: 'https://drops.scamsniffer.io/', use: 'Wallet drainer and phishing trends.' },
];

const ThreatIntelMethodology = () => {
  const location = useLocation();

  // React Router does not scroll to #hash targets on its own.
  useEffect(() => {
    const id = location.hash.replace(/^#/, '');
    if (!id) return;
    document.getElementById(id)?.scrollIntoView?.({ block: 'start' });
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Threat Intel Methodology: Sources, Severity and Corrections | Digibastion"
        description="Where Digibastion's security incident records come from, how severity is set, what confirmed and unconfirmed mean, how duplicates are merged and how to report a mistake."
        keywords="threat intelligence methodology, crypto incident sources, QuillMonitor, severity rubric, confirmed incidents"
      />
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl space-y-12">
          <header className="space-y-4">
            <Link to="/threat-intel" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Threat Intel
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How we track security incidents</h1>
            <p className="leading-7 text-muted-foreground">
              Digibastion collects security incidents and news from the sources below, merges reports of the same incident into one record, and shows the status each source gives. We do not investigate or verify incidents ourselves, so every record links back to where it came from.
            </p>
          </header>

          <Section id="sources" title="Sources">
            <ul className="space-y-4">
              <li>
                <Card className="p-4">
                  <p className="font-semibold text-foreground">
                    <ExternalAnchor href={QUILLMONITOR_DATABASE_URL}>QuillMonitor</ExternalAnchor>
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    The QuillAudits partner API for Web3 hacks and exploits. We check it every 30 minutes. Each record carries QuillMonitor&apos;s own verification status.
                  </p>
                </Card>
              </li>
              <li>
                <Card className="p-4">
                  <p className="font-semibold text-foreground">
                    <ExternalAnchor href={SLOWMIST_ATTRIBUTION_URL}>SlowMist Hacked</ExternalAnchor>
                  </p>
                  <p className="mt-1 text-sm font-medium text-amber-300">Pending permission</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    SlowMist&apos;s public incident list. We are waiting for SlowMist to confirm that we may reuse its records.
                  </p>
                </Card>
              </li>
              <li>
                <Card className="p-4">
                  <p className="font-semibold text-foreground">
                    <ExternalAnchor href={WEB3_IS_GOING_GREAT_URL}>Web3 Is Going Just Great</ExternalAnchor>
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Molly White&apos;s timeline of crypto hacks, scams and failures. We read new entries from the site.
                  </p>
                </Card>
              </li>
              <li>
                <Card className="p-4">
                  <p className="font-semibold text-foreground">Security news feeds (RSS)</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Sources include The Hacker News, BleepingComputer, SecurityWeek, CISA Alerts, Dark Reading and Krebs on Security.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Administrators add and retire feeds over time, so the current list can differ. A classifier keeps items about incidents, vulnerabilities and attacks, and hides the rest.
                  </p>
                </Card>
              </li>
            </ul>
          </Section>

          <Section id="severity" title="Severity">
            <p className="leading-7 text-muted-foreground">
              Web3 incidents are rated by reported loss. Some attack types are rated High even when the loss is small. The rules are checked in this order, and the first match wins:
            </p>
            <dl className="divide-y divide-border rounded-lg border border-border">
              {severityRubric.map((row) => (
                <div key={row.rule} className="grid gap-1 p-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
                  <dt className="font-semibold text-foreground">{row.level}</dt>
                  <dd className="text-sm leading-6 text-muted-foreground">{row.rule}</dd>
                </div>
              ))}
            </dl>
            <p className="leading-7 text-muted-foreground">
              Security news items get their severity from words in the headline and the matched keywords. For example, &quot;zero-day&quot;, &quot;actively exploited&quot; and &quot;remote code execution&quot; make an item Critical. Treat it as a rough guide, not a CVSS score. Severity describes the size of an incident, not how much it affects you.
            </p>
          </Section>

          <Section id="verification" title="Confirmed and unconfirmed">
            <p className="leading-7 text-muted-foreground">
              <strong className="text-foreground">Unconfirmed</strong> means the source has reported the incident but has not verified it. The details, the date and the loss figure may change, and some reports are withdrawn.
            </p>
            <p className="leading-7 text-muted-foreground">
              <strong className="text-foreground">Confirmed</strong> means the source has marked the incident as verified. Digibastion shows that status as the source gives it. Items with neither label come from sources that do not publish a verification status.
            </p>
            <p className="leading-7 text-muted-foreground">
              Loss figures follow the same idea. &quot;~$3.8M reported&quot; is a figure nobody has confirmed yet, &quot;$3.8M&quot; is confirmed, and &quot;(revised)&quot; means the source changed it after the first report.
            </p>
          </Section>

          <Section id="duplicates" title="How duplicates are merged">
            <p className="leading-7 text-muted-foreground">
              Several trackers often report the same incident. We treat two reports as one incident when the project name matches and either the incident dates are the same day, or they are within two days of each other and the reports agree on the loss amount, the attack method or a reference link. A loss of zero does not count as a match.
            </p>
            <p className="leading-7 text-muted-foreground">
              Each incident keeps one record, and every report we merged into it is listed as a source on that record. When sources disagree, QuillMonitor comes first, then the other incident trackers, then SlowMist.
            </p>
          </Section>

          <Section id="dates" title="Dates">
            <p className="leading-7 text-muted-foreground">
              Each incident shows two dates: when it happened, as the source reports it, and when we added it. When a source gives no usable date, the record says the date is unknown rather than guessing.
            </p>
          </Section>

          <Section id="corrections" title="Corrections">
            <p className="leading-7 text-muted-foreground">
              If something is wrong, email{' '}
              <a href={`mailto:${CORRECTIONS_EMAIL}`} className="font-medium text-primary underline-offset-2 hover:underline">{CORRECTIONS_EMAIL}</a>{' '}
              with the incident link, what is wrong, and a public source for the correct information. We fix our own errors. When the error comes from a source, we tell that source and update the record when they correct it.
            </p>
          </Section>

          <Section id="official-channels" title="Official channels">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Website</dt>
                <dd><ExternalAnchor href={SITE_URL}>www.digibastion.com</ExternalAnchor></dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Telegram alerts channel (@digibastion)</dt>
                <dd><ExternalAnchor href={TELEGRAM_CHANNEL_URL}>t.me/digibastion</ExternalAnchor></dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Telegram community chat</dt>
                <dd><ExternalAnchor href={TELEGRAM_COMMUNITY_URL}>t.me/digibastion_chat</ExternalAnchor></dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email alerts are sent from</dt>
                <dd className="font-medium text-foreground">{ALERTS_SENDER_EMAIL}</dd>
              </div>
            </dl>
            <Card className="flex gap-3 border-amber-500/30 bg-amber-500/5 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
              <p className="text-sm leading-6 text-foreground/80">
                Digibastion will never ask you to connect a wallet, sign a transaction, share a seed phrase or private key, or send funds. Any account or message that asks for these is not us, even if it uses our name or logo.
              </p>
            </Card>
          </Section>

          <Section id="references" title="References">
            <p className="leading-7 text-muted-foreground">Outside sources we link from incident pages and use for context:</p>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {references.map((reference) => (
                <li key={reference.href} className="p-3">
                  <a
                    href={reference.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {reference.name}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <p className="text-sm text-muted-foreground">{reference.use}</p>
                </li>
              ))}
            </ul>
          </Section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ThreatIntelMethodology;
