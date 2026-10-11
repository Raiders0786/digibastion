import { Copy, Linkedin, MoreHorizontal, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X_HANDLE } from '@/seo/siteFacts';
import { openExternalUrl } from '@/utils/safeUrl';
import {
  buildTrackedUrl,
  shareTargets,
  stripTracking,
  type UtmCampaign,
  type UtmSource,
} from '../../../supabase/functions/_shared/share-links';
import { canonicalizeUrl } from '../../../supabase/functions/_shared/site-urls';

type ShareCampaign = Extract<UtmCampaign, 'share_incident' | 'share_weekly'>;
type Platform = 'x' | 'telegram' | 'linkedin';

export interface ShareBarProps {
  /** The page's canonical URL. Any tags on it are dropped. */
  url: string;
  title: string;
  /** Prefilled text, at most 200 characters (see shareTextForIncident / shareTextForWeekly). */
  text: string;
  campaign: ShareCampaign;
  /** X, Copy link and More only. */
  compact?: boolean;
  className?: string;
}

/** Our page with no query or fragment; other hosts keep everything but their utm_* tags. */
const cleanUrl = (url: string) => canonicalizeUrl(url) ?? stripTracking(url);

async function copyToClipboard(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  } catch {
    toast.error('Copy the address from your browser');
  }
}

const PLATFORMS: { id: Platform; label: string; aria: string }[] = [
  { id: 'x', label: 'Post on X', aria: 'Share on X' },
  { id: 'telegram', label: 'Telegram', aria: 'Share on Telegram' },
  { id: 'linkedin', label: 'LinkedIn', aria: 'Share on LinkedIn' },
];

function PlatformIcon({ id }: { id: Platform }) {
  if (id === 'telegram') return <Send className="h-4 w-4" aria-hidden="true" />;
  if (id === 'linkedin') return <Linkedin className="h-4 w-4" aria-hidden="true" />;
  return <span aria-hidden="true" className="text-sm font-bold leading-none">𝕏</span>;
}

/** A single "Copy link" button that copies the clean URL. */
export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('gap-1.5', className)}
      aria-label="Copy link"
      onClick={() => { void copyToClipboard(cleanUrl(url)); }}
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
      Copy link
    </Button>
  );
}

/**
 * Share buttons for incident and weekly pages. Platform buttons share a URL
 * tagged with the platform as utm_source; Copy link copies the clean URL.
 */
export function ShareBar({ url, title, text, campaign, compact = false, className }: ShareBarProps) {
  const canonical = cleanUrl(url);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const platforms = compact ? PLATFORMS.filter((platform) => platform.id === 'x') : PLATFORMS;

  const tagged = (source: UtmSource, medium: 'social' | 'share') => buildTrackedUrl(canonical, { source, medium, campaign });

  const openPlatform = (platform: Platform) => {
    const targets = shareTargets({ url: tagged(platform, 'social'), text, title, via: X_HANDLE });
    openExternalUrl(targets[platform]);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url: tagged('share', 'share') });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (error instanceof Error && error.name === 'AbortError') return;
      toast.error('Sharing did not complete. Try Copy link instead.');
    }
  };

  return (
    <nav aria-label="Share" className={cn('flex flex-wrap items-center gap-2', className)}>
      {platforms.map((platform) => (
        <Button
          key={platform.id}
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-label={platform.aria}
          onClick={() => openPlatform(platform.id)}
        >
          <PlatformIcon id={platform.id} />
          {compact ? null : platform.label}
        </Button>
      ))}
      <CopyLinkButton url={canonical} />
      {canNativeShare && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-label="More sharing options"
          onClick={() => { void nativeShare(); }}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          More
        </Button>
      )}
    </nav>
  );
}
