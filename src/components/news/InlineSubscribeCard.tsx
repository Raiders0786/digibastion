import { Link } from 'react-router-dom';
import { BellRing, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TELEGRAM_AND_EMAIL_SUMMARY } from '@/lib/threatIntel/channelCopy';
import { TELEGRAM_CHANNEL_URL } from '@/lib/threatIntel/officialLinks';

interface InlineSubscribeCardProps {
  /** Subscribe tab URL carrying the current filters. */
  subscribeHref: string;
  title?: string;
}

export function InlineSubscribeCard({ subscribeHref, title = 'Get alerts for incidents like these' }: InlineSubscribeCardProps) {
  return (
    <Card className="glass-card border-primary/30" data-testid="inline-subscribe-card">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{TELEGRAM_AND_EMAIL_SUMMARY}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" className="gap-2">
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
              <Send className="h-4 w-4" aria-hidden="true" />
              Telegram
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to={subscribeHref}>
              <BellRing className="h-4 w-4" aria-hidden="true" />
              Email alerts
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
