import { ArrowUpRight, Github, Heart, MessageSquare, Radar, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const footerGroups = [
  {
    title: 'Use Digibastion',
    links: [
      { label: 'OpSec assessment', to: '/quiz' },
      { label: 'Security checklists', to: '/#checklists' },
      { label: 'Threat intelligence', to: '/threat-intel' },
      { label: 'Security guides', to: '/articles' },
      { label: 'Tools and resources', to: '/tools' },
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
      { label: 'Open-source license', to: '/license' },
      { label: 'Contribute on GitHub', href: 'https://github.com/Raiders0786/digibastion' },
      { label: 'Suggest an idea', href: 'https://github.com/Raiders0786/digibastion/issues' },
      { label: 'Public roadmap', href: 'https://github.com/Raiders0786/digibastion/blob/main/ROADMAP.md' },
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
              Practical security for people, crypto users, builders, and teams — from first assessment to ongoing threat and domain monitoring.
            </p>
            <a href="https://vantage.digibastion.com" target="_blank" rel="noopener noreferrer" className="mt-5 flex max-w-sm items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3 transition-colors hover:border-primary/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15"><Radar className="h-4 w-4 text-primary" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">Vantage by Digibastion</span><span className="block truncate text-xs text-muted-foreground">Domain security intelligence</span></span>
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
              Open source under the MIT License. Supported in 2025 by the Ethereum Foundation Ecosystem Support Program.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a href="https://t.me/digibastion_chat" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"><MessageSquare className="h-3.5 w-3.5" /> Community</a>
              <a href="https://giveth.io/project/digibastion:-dns-opsec-supply-chain-security" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"><Heart className="h-3.5 w-3.5" /> Giveth</a>
              <a href="https://github.com/Raiders0786/digibastion" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"><Github className="h-3.5 w-3.5" /> GitHub</a>
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
