import type { ThreatIntelScope } from '@/types/news';
import { RadioTower } from 'lucide-react';

interface ContentScopeSelectorProps {
  value: ThreatIntelScope;
  onChange: (value: ThreatIntelScope) => void;
  label?: string;
  showDescription?: boolean;
  idPrefix?: string;
}

const options: Array<{ value: ThreatIntelScope; label: string; description: string }> = [
  {
    value: 'all',
    label: 'All Intelligence',
    description: 'News, advisories, disclosures, and verified incidents.',
  },
  {
    value: 'web3-incidents',
    label: 'Web3 Incidents',
    description: 'Only confirmed Web3 exploits, hacks, and security incidents.',
  },
];

export function ContentScopeSelector({
  value,
  onChange,
  label = 'Content scope',
  showDescription = false,
  idPrefix = 'content-scope',
}: ContentScopeSelectorProps) {
  const labelId = `${idPrefix}-label`;

  return (
    <div className="space-y-2">
      {showDescription && <div id={labelId} className="text-sm font-medium">{label}</div>}
      <div
        role="group"
        aria-label={showDescription ? undefined : label}
        aria-labelledby={showDescription ? labelId : undefined}
        className="inline-flex w-full rounded-lg border border-border bg-muted/30 p-1 sm:w-auto"
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              aria-describedby={showDescription && selected ? `${idPrefix}-${option.value}-description` : undefined}
              onClick={() => onChange(option.value)}
              className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-none ${
                selected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {option.value === 'web3-incidents' && <RadioTower className="h-4 w-4" aria-hidden="true" />}
              {option.label}
            </button>
          );
        })}
      </div>
      {showDescription && (
        <p
          id={`${idPrefix}-${value}-description`}
          className="text-xs text-muted-foreground"
        >
          {options.find((option) => option.value === value)?.description}
        </p>
      )}
    </div>
  );
}
