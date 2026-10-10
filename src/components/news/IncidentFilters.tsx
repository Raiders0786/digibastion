import type { ThreatIntelScope } from '@/types/news';
import {
  sourceFiltersForScope,
  type SourceFilter,
  type ThreatIntelFacet,
  type ThreatIntelFacets,
  type VerificationFilter,
} from '@/lib/threatIntel/query';

export interface IncidentFilterState {
  verification: VerificationFilter;
  chains: string[];
  attackTypes: string[];
  sources: SourceFilter[];
}

export interface IncidentFiltersProps {
  scope: ThreatIntelScope;
  filters: IncidentFilterState;
  facets: ThreatIntelFacets;
  onVerificationChange: (value: VerificationFilter) => void;
  onChainToggle: (value: string) => void;
  onAttackTypeToggle: (value: string) => void;
  onSourceToggle: (value: SourceFilter) => void;
  /** Keeps heading ids unique when the toolbar and the mobile sheet both render this. */
  idPrefix: string;
}

const VERIFICATION_OPTIONS: { value: VerificationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'unconfirmed', label: 'Unconfirmed' },
];

const SOURCE_FILTER_LABELS: Record<SourceFilter, string> = {
  quillmonitor: 'QuillMonitor',
  'web3-incidents': 'Web3 Is Going Just Great',
  slowmist: 'SlowMist Hacked',
  rss: 'News publishers',
};

const chipClass = (selected: boolean) => `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
  selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
}`;

/** Facet options plus any selected value the top-15 list does not include (for example from a shared link). */
function withSelected(options: readonly ThreatIntelFacet[], selected: readonly string[]): ThreatIntelFacet[] {
  const missing = selected
    .filter((value) => !options.some((option) => option.value === value))
    .map((value) => ({ value, label: value, count: 0 }));
  return [...options, ...missing];
}

interface ChipGroupProps {
  id: string;
  title: string;
  /** Short note under the heading, linked with aria-describedby. */
  help?: string;
  options: ThreatIntelFacet[];
  selected: readonly string[];
  onToggle: (value: string) => void;
}

function ChipGroup({ id, title, help, options, selected, onToggle }: ChipGroupProps) {
  if (options.length === 0) return null;
  const helpId = `${id}-help`;
  return (
    <div role="group" aria-labelledby={id} aria-describedby={help ? helpId : undefined}>
      <h4 id={id} className={`${help ? 'mb-1' : 'mb-2'} text-sm font-medium`}>{title}</h4>
      {help && <p id={helpId} className="mb-2 text-xs text-muted-foreground">{help}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              title={option.count > 0 ? `${option.count} in the last 90 days` : undefined}
              className={chipClass(isSelected)}
              onClick={() => onToggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Status, chain, attack-type and source filters. Status, chain and attack type show in the Web3 incidents view only. */
export function IncidentFilters({
  scope,
  filters,
  facets,
  onVerificationChange,
  onChainToggle,
  onAttackTypeToggle,
  onSourceToggle,
  idPrefix,
}: IncidentFiltersProps) {
  const incidentView = scope === 'web3-incidents';
  const sourceOptions: ThreatIntelFacet[] = sourceFiltersForScope(scope).map((source) => ({
    value: source,
    label: SOURCE_FILTER_LABELS[source],
    count: 0,
  }));

  return (
    <div className="space-y-4">
      {incidentView && (
        <div>
          <h4 id={`${idPrefix}-status`} className="mb-1 text-sm font-medium">Status</h4>
          <p id={`${idPrefix}-status-help`} className="mb-2 text-xs text-muted-foreground">
            As reported by QuillMonitor. Other sources do not report a status.
          </p>
          <div
            role="group"
            aria-labelledby={`${idPrefix}-status`}
            aria-describedby={`${idPrefix}-status-help`}
            className="inline-flex rounded-lg border border-border bg-muted/30 p-1"
          >
            {VERIFICATION_OPTIONS.map((option) => {
              const selected = filters.verification === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onVerificationChange(option.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    selected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {incidentView && (
        <ChipGroup
          id={`${idPrefix}-chain`}
          title="Chain"
          help="Chain comes from QuillMonitor and older QuillAudits records. Other trackers don't report it, so picking a chain hides their incidents."
          options={withSelected(facets.chains, filters.chains)}
          selected={filters.chains}
          onToggle={onChainToggle}
        />
      )}

      {incidentView && (
        <ChipGroup
          id={`${idPrefix}-attack`}
          title="Attack type"
          options={withSelected(facets.attackTypes, filters.attackTypes)}
          selected={filters.attackTypes}
          onToggle={onAttackTypeToggle}
        />
      )}

      <ChipGroup
        id={`${idPrefix}-source`}
        title="Source"
        options={sourceOptions}
        selected={filters.sources}
        onToggle={(value) => onSourceToggle(value as SourceFilter)}
      />
    </div>
  );
}
