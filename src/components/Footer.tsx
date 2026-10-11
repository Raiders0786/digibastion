import { ArrowUpRight, Github, Heart, MessageSquare, Radar, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { METHODOLOGY_PATH, TELEGRAM_CHANNEL_URL, TELEGRAM_COMMUNITY_URL } from '@/lib/threatIntel/officialLinks';
import { GITHUB_ISSUES_URL, GITHUB_REPO_URL, GITHUB_ROADMAP_URL, VANTAGE_URL } from '@/seo/siteFacts';
import { FEED_URLS } from '../../supabase/functions/_shared/site-urls';

type FooterLink = { label: string; to: string } | { label: string; href: string };

const footerGroups: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Use Digibastion',
    links: [
      { label: 'Threat Intel', to: '/threat-intel' },
      { label: 'How we track incidents', to: METHODOLOGY_PATH },
      { label: 'Weekly reports', to: '/threat-intel/weekly' },
      { label: 'Telegram alerts', href: TELEGRAM_CHANNEL_URL },
      { label: 'RSS feed', href: FEED_URLS.rss },
      { label: 'OpSec self-check', to: '/quiz' },
      { label: 'Security checklists', to: '/#checklists' },
      { label: 'Security guides', to: '/articles' },
      { label: 'Security tools', to: '/tools' },
    ],
  },
  {
    title: 'Work with us',
    links: [
      { label: 'Security services', to: '/services' },
      { label: 'OpSec consulting', to: '/services/opsec-consulting' },
      { label: 'Full-stack review', to: '/services/full-stack-review' },
      { label: 'Contact', to: '/contact' },
      { label: 'Support the project', to: '/support' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'About', to: '/about' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Privacy', to: '/privacy' },
      { label: 'License and terms', to: '/license' },
      { label: 'Contribute on GitHub', href: GITHUB_REPO_URL },
      { label: 'Suggest an idea', href: GITHUB_ISSUES_URL },
      { label: 'Public roadmap', href: GITHUB_ROADMAP_URL },
    ],
  },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/60 bg-card/30 pb-20 sm:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div className="max-w-md">
            <Link to="/" className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Shield className="h-5 w-5 text-primary" /></span>
              <span><span className="block text-lg font-semibold leading-none text-foreground">Digibastion</span><span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Security you can act on</span></span>
            </Link>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Free Web3 security help: a crypto hack tracker with email and Telegram alerts, security checklists, an OpSec self-check and practical guides.
            </p>
            <a href={VANTAGE_URL} target="_blank" rel="noopener noreferrer" className="mt-5 flex max-w-sm items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3 transition-colors hover:border-primary/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15"><Radar className="h-4 w-4 text-primary" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">Vantage by Digibastion</span><span className="block truncate text-xs text-muted-foreground">Domain security checks for teams (beta)</span></span>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">{group.title}</h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      {'href' in item ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">{item.label}<ArrowUpRight className="h-3 w-3" /></a>
                      ) : (
                        <Link to={item.to} className="text-sm text-muted-foreground transition-colors hover:text-primary">{item.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-xs leading-5 text-muted-foreground">
              Source-available under MIT text plus the Commons Clause. Supported in 2025 by the Ethereum Foundation Ecosystem Support Program.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a href={TELEGRAM_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"><MessageSquare className="h-3.5 w-3.5" /> Community chat</a>
              <a href="https://giveth.io/project/digibastion:-dns-opsec-supply-chain-security" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"><Heart className="h-3.5 w-3.5" /> Giveth</a>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"><Github className="h-3.5 w-3.5" /> GitHub</a>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {currentYear} Digibastion.</span>
            <span>Verify advice against your own risk model. No checklist replaces professional review.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
