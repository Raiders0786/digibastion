import type { CSSProperties, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react';

export type EmailPreviewTab = 'alert' | 'daily' | 'weekly';

interface EmailPreviewProps {
  /** Tab shown first, e.g. the first email type the subscriber picked. */
  initialTab?: EmailPreviewTab;
  /** Text on the button that opens the preview. */
  triggerLabel?: string;
  triggerVariant?: ButtonProps['variant'];
  triggerClassName?: string;
}

// Static samples that follow the email copy rules: every item names its
// source, status words come from the source, losses read "~$X reported".
// Project names are invented so the sample is never mistaken for a real report.

interface SampleItem {
  severity: 'critical' | 'high' | 'medium';
  title: string;
  meta: string;
  summary: string;
  source: string;
  status?: 'Confirmed' | 'Unconfirmed';
}

const ALERT_SAMPLE: SampleItem = {
  severity: 'high',
  title: 'Example Bridge: access control exploit on Ethereum',
  meta: 'Ethereum · Access control · ~$4.2M reported',
  summary: 'An attacker reportedly called an unprotected withdrawal function on the bridge contract. The team has paused deposits.',
  source: 'QuillMonitor',
  status: 'Unconfirmed',
};

const DAILY_SECTIONS: { title: string; items: SampleItem[] }[] = [
  {
    title: 'Confirmed incidents',
    items: [{
      severity: 'critical',
      title: 'Sample Lending: price oracle manipulation on Arbitrum',
      meta: 'Arbitrum · Oracle manipulation · ~$12.5M reported',
      summary: 'A thin-liquidity collateral market was used to inflate a price feed and borrow against it.',
      source: 'SlowMist',
      status: 'Confirmed',
    }],
  },
  {
    title: 'Still unconfirmed',
    items: [ALERT_SAMPLE],
  },
  {
    title: 'Status changes',
    items: [{
      severity: 'medium',
      title: 'Demo Swap: loss revised from ~$900K to ~$1.3M reported',
      meta: 'BNB Chain · Revised',
      summary: 'The source updated the reported loss after the team published its post-mortem.',
      source: 'QuillMonitor',
    }],
  },
  {
    title: 'Vulnerabilities and supply chain',
    items: [{
      severity: 'high',
      title: 'Compromised npm release of a sample wallet SDK',
      meta: 'Supply chain · CVE pending',
      summary: 'One published version shipped code that read seed phrases. The maintainers removed it from the registry.',
      source: 'Maintainer advisory',
    }],
  },
];

const WEEKLY_STATS = [
  { label: 'Reported losses', value: '~$18.4M', note: 'vs ~$9.1M last week' },
  { label: 'Incidents', value: '7', note: '2 unconfirmed' },
  { label: 'Funds returned', value: '1', note: 'incident' },
];

const SEVERITY_COLORS: Record<SampleItem['severity'], string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
};

const shell: CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  backgroundColor: '#1f2937',
  borderRadius: '10px',
  overflow: 'hidden',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const EmailShell = ({ subject, heading, period, children }: { subject: string; heading: string; period: string; children: ReactNode }) => (
  <div style={{ backgroundColor: '#111827', padding: '16px' }}>
    <p className="mb-3 break-words text-xs text-slate-300">
      <span className="font-semibold text-slate-100">Subject:</span> {subject}
    </p>
    <div style={shell}>
      <div style={{ padding: '24px', background: '#4c1d95' }}>
        <p style={{ margin: '0 0 8px', color: '#ede9fe', fontSize: '12px', fontWeight: 700, letterSpacing: '1.2px' }}>DIGIBASTION · THREAT INTELLIGENCE</p>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '22px' }}>{heading}</h3>
        <p style={{ margin: '6px 0 0', color: '#ede9fe', fontSize: '13px' }}>{period}</p>
      </div>
      <div style={{ padding: '8px 24px 16px' }}>{children}</div>
      <div style={{ padding: '16px 24px', background: '#111827', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#a8b3c7', fontSize: '12px', lineHeight: '19px' }}>
          Unsubscribe &nbsp;·&nbsp; Manage preferences
        </p>
        <p style={{ margin: '6px 0 0', color: '#a8b3c7', fontSize: '12px' }}>Digibastion postal address</p>
      </div>
    </div>
  </div>
);

const SampleItemRow = ({ item }: { item: SampleItem }) => (
  <div style={{ padding: '14px 0', borderBottom: '1px solid #334155' }}>
    <p style={{ margin: '0 0 6px', fontSize: '11px', textTransform: 'uppercase', color: '#cbd5e1' }}>
      <span style={{ background: SEVERITY_COLORS[item.severity], color: '#ffffff', padding: '2px 8px', borderRadius: '4px', marginRight: '8px' }}>{item.severity}</span>
      {item.status && <span style={{ color: item.status === 'Unconfirmed' ? '#fbbf24' : '#4ade80', fontWeight: 700 }}>{item.status}</span>}
    </p>
    <p style={{ margin: 0, color: '#93c5fd', fontWeight: 700, fontSize: '16px', lineHeight: 1.4 }}>{item.title}</p>
    <p style={{ margin: '4px 0 0', color: '#a8b3c7', fontSize: '12px' }}>{item.meta}</p>
    <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>{item.summary}</p>
    <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '12px' }}>Source: {item.source}</p>
  </div>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <p style={{ margin: '16px 0 0', color: '#e5e7eb', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{children}</p>
);

const AlertSample = () => (
  <EmailShell
    subject="[Unconfirmed] High: Example Bridge access control exploit, ~$4.2M reported"
    heading="Security alert"
    period="Sent when a matching critical or high incident is added"
  >
    <SampleItemRow item={ALERT_SAMPLE} />
    <p style={{ margin: '12px 0 0', color: '#cbd5e1', fontSize: '13px', lineHeight: 1.5 }}>
      This report is unconfirmed by its source. You get one follow-up if it is retracted or upgraded to critical.
    </p>
  </EmailShell>
);

const DailySample = () => (
  <EmailShell
    subject="Daily brief, Oct 12: 1 incident, 1 unconfirmed, 1 status change, 1 vulnerability"
    heading="Daily brief"
    period="Items added in the previous 24 hours (UTC)"
  >
    {DAILY_SECTIONS.map((section) => (
      <div key={section.title}>
        <SectionTitle>{section.title}</SectionTitle>
        {section.items.map((item) => <SampleItemRow key={item.title} item={item} />)}
      </div>
    ))}
    <SectionTitle>One action today</SectionTitle>
    <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>
      Review the token approvals on your main wallet and revoke the ones you no longer use.
    </p>
  </EmailShell>
);

const WeeklySample = () => (
  <EmailShell
    subject="Weekly deep-dive, week of Oct 5: ~$18.4M reported across 7 incidents"
    heading="Weekly deep-dive"
    period="Web3 incidents added Oct 5 to Oct 11 (UTC)"
  >
    <div className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-3">
      {WEEKLY_STATS.map((stat) => (
        <div key={stat.label} style={{ background: '#111827', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#ffffff', fontSize: '20px', fontWeight: 700 }}>{stat.value}</p>
          <p style={{ margin: '2px 0 0', color: '#a8b3c7', fontSize: '11px', textTransform: 'uppercase' }}>{stat.label}</p>
          <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '11px' }}>{stat.note}</p>
        </div>
      ))}
    </div>
    <SectionTitle>Top incidents</SectionTitle>
    <SampleItemRow item={DAILY_SECTIONS[0].items[0]} />
    <p style={{ margin: '8px 0 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>
      What to do: lending users can check whether their collateral sits in low-liquidity markets; builders can compare oracle prices against a second feed.
    </p>
    <SectionTitle>Trends</SectionTitle>
    <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>
      Access control flaws accounted for 3 of the 7 incidents. Totals are computed from the source records, and unconfirmed reports are counted separately.
    </p>
    <SectionTitle>Opsec tip</SectionTitle>
    <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>
      Keep long-term funds in a wallet you never connect to new sites. Read the wallet guide on Digibastion.
    </p>
  </EmailShell>
);

export const EmailPreview = ({
  initialTab = 'alert',
  triggerLabel = 'Preview Email',
  triggerVariant = 'outline',
  triggerClassName,
}: EmailPreviewProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button type="button" variant={triggerVariant} size="sm" className={cn('gap-2', triggerClassName)}>
        <Eye className="w-4 h-4" aria-hidden="true" />
        {triggerLabel}
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
      <DialogHeader className="p-4 border-b">
        <DialogTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" aria-hidden="true" />
          Email Preview
        </DialogTitle>
        <DialogDescription>
          Sample content. Real emails list only the items that match your preferences.
        </DialogDescription>
      </DialogHeader>
      <Tabs defaultValue={initialTab} className="px-4 pb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alert">Alert</TabsTrigger>
          <TabsTrigger value="daily">Daily brief</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>
        <TabsContent value="alert"><AlertSample /></TabsContent>
        <TabsContent value="daily"><DailySample /></TabsContent>
        <TabsContent value="weekly"><WeeklySample /></TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
);
