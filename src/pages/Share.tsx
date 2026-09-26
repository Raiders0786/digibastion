import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, Github, Radar, Share2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { openExternalUrl } from '@/utils/safeUrl';

const shareOptions = [
  {
    id: 'personal',
    icon: ShieldCheck,
    title: 'For a friend securing their accounts',
    text: 'This free Digibastion checkup turns wallet, account and device security into practical next steps.',
    url: 'https://www.digibastion.com/quiz',
  },
  {
    id: 'alerts',
    icon: Share2,
    title: 'For a team following active threats',
    text: 'Digibastion collects sourced Web3 security incidents and offers alert subscriptions in one place.',
    url: 'https://www.digibastion.com/threat-intel',
  },
  {
    id: 'vantage',
    icon: Radar,
    title: 'For a team responsible for domains',
    text: 'Vantage by Digibastion connects DNS, TLS, email, frontend and Web3 trust evidence to an ownership workflow.',
    url: 'https://vantage.digibastion.com/',
  },
];

const Share = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyOption = async (id: string, text: string, url: string) => {
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopiedId(id);
      toast.success('Share text copied');
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Clipboard access is unavailable. You can copy the page URL from your browser.');
    }
  };

  const nativeShare = async (title: string, text: string, url: string) => {
    if (!navigator.share) {
      await copyOption('native', text, url);
      return;
    }

    try {
      await navigator.share({ title, text, url });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Sharing did not complete. Try copying the message instead.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Share Digibastion — Practical Web3 Security Resources"
        description="Share a relevant Digibastion security checkup, threat-intelligence feed, or Vantage domain-security resource with your community or team."
        type="website"
      />
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">Share something useful</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">Send the right resource, not a generic pitch.</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Choose the message that fits the person receiving it. Edit the text in your own voice before posting—context is more useful than promotion.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              const isCopied = copiedId === option.id;
              return (
                <Card key={option.id} className="p-6 flex flex-col">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold">{option.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground flex-1">{option.text}</p>
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => copyOption(option.id, option.text, option.url)}>
                      {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button onClick={() => nativeShare(option.title, option.text, option.url)}>
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <section className="mt-14 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-bold">Help improve the resource before you share it.</h2>
                <p className="mt-3 text-muted-foreground leading-7">
                  Found outdated guidance, a missing incident source or an interaction that could be clearer? Open an issue or propose the correction directly.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                <Button asChild>
                  <a href="https://github.com/Raiders0786/digibastion/issues" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" /> Open an issue
                  </a>
                </Button>
                <Button asChild variant="outline"><Link to="/contact">Send an idea</Link></Button>
              </div>
            </div>
          </section>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => openExternalUrl('https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.digibastion.com')}
            >
              Share the homepage on LinkedIn <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => openExternalUrl('https://www.reddit.com/submit?url=https%3A%2F%2Fwww.digibastion.com&title=Digibastion%20security%20resources')}
            >
              Share the homepage on Reddit <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Share;
