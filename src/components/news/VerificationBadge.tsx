import { ShieldAlert, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { VerificationDisplay } from '@/lib/threatIntel/incidentDisplay';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  verification: VerificationDisplay;
  /** Explanation shown in the tooltip and read by screen readers. */
  help: string;
  className?: string;
}

const STYLES: Record<VerificationDisplay, { label: string; className: string; icon: LucideIcon }> = {
  confirmed: {
    label: 'Confirmed',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    icon: ShieldCheck,
  },
  unconfirmed: {
    label: 'Unconfirmed',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    icon: ShieldAlert,
  },
};

export function VerificationBadge({ verification, help, className }: VerificationBadgeProps) {
  const style = STYLES[verification];
  const Icon = style.icon;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              style.className,
              className,
            )}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {style.label}
            {help && <span className="sr-only">. {help}</span>}
          </button>
        </TooltipTrigger>
        {help && <TooltipContent className="max-w-xs text-xs leading-5">{help}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}
