import { Calendar, Search, SlidersHorizontal } from 'lucide-react';
import { ContentScopeSelector } from '@/components/news/ContentScopeSelector';
import { IncidentFilters, type IncidentFilterState } from '@/components/news/IncidentFilters';
import { NewsFilters } from '@/components/news/NewsFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import type { SourceFilter, ThreatIntelFacets, VerificationFilter } from '@/lib/threatIntel/query';

export type FeedDateFilter = 'all' | '7d' | '30d' | '90d';
export type FeedSort = 'date' | 'severity';

export interface FeedToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  scope: ThreatIntelScope;
  onScopeChange: (value: ThreatIntelScope) => void;
  dateFilter: FeedDateFilter;
  onDateFilterChange: (value: FeedDateFilter) => void;
  sortBy: FeedSort;
  onSortChange: (value: FeedSort) => void;
  selectedCategories: NewsCategory[];
  selectedSeverities: SeverityLevel[];
  onCategoryToggle: (category: NewsCategory) => void;
  onSeverityToggle: (severity: SeverityLevel) => void;
  onClearFilters: () => void;
  /** Status, chain, attack type and source (task C7). */
  incidentFilters: IncidentFilterState;
  /** Chain and attack-type options (useThreatIntelFacets). */
  facets: ThreatIntelFacets;
  onVerificationChange: (value: VerificationFilter) => void;
  onChainToggle: (value: string) => void;
  onAttackTypeToggle: (value: string) => void;
  onSourceToggle: (value: SourceFilter) => void;
}

/** Filters that live behind the mobile "Filters (n)" button. Search and scope stay visible. */
export function countActiveFilters({
  selectedCategories,
  selectedSeverities,
  dateFilter,
  sortBy,
  incidentFilters,
}: Pick<FeedToolbarProps, 'selectedCategories' | 'selectedSeverities' | 'dateFilter' | 'sortBy'>
  & Partial<Pick<FeedToolbarProps, 'incidentFilters'>>): number {
  return selectedCategories.length
    + selectedSeverities.length
    + (dateFilter === 'all' ? 0 : 1)
    + (sortBy === 'date' ? 0 : 1)
    + (incidentFilters && incidentFilters.verification !== 'all' ? 1 : 0)
    + (incidentFilters?.chains.length ?? 0)
    + (incidentFilters?.attackTypes.length ?? 0)
    + (incidentFilters?.sources.length ?? 0);
}

function DateSelect({ value, onChange }: { value: FeedDateFilter; onChange: (value: FeedDateFilter) => void }) {
  return (
    <Select value={value} onValueChange={(next: FeedDateFilter) => onChange(next)}>
      <SelectTrigger className="w-full md:w-32" aria-label="Date range">
        <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
        <SelectValue placeholder="Date" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Time</SelectItem>
        <SelectItem value="7d">Last 7 Days</SelectItem>
        <SelectItem value="30d">Last 30 Days</SelectItem>
        <SelectItem value="90d">Last 90 Days</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SortSelect({ value, onChange }: { value: FeedSort; onChange: (value: FeedSort) => void }) {
  return (
    <Select value={value} onValueChange={(next: FeedSort) => onChange(next)}>
      <SelectTrigger className="w-full md:w-32" aria-label="Sort order">
        <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="date">Latest First</SelectItem>
        <SelectItem value="severity">By Severity</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function FeedToolbar(props: FeedToolbarProps) {
  const {
    searchQuery,
    onSearchChange,
    scope,
    onScopeChange,
    dateFilter,
    onDateFilterChange,
    sortBy,
    onSortChange,
    selectedCategories,
    selectedSeverities,
    onCategoryToggle,
    onSeverityToggle,
    onClearFilters,
    incidentFilters,
    facets,
    onVerificationChange,
    onChainToggle,
    onAttackTypeToggle,
    onSourceToggle,
  } = props;
  const activeCount = countActiveFilters(props);
  const incidentFilterProps = {
    scope,
    filters: incidentFilters,
    facets,
    onVerificationChange,
    onChainToggle,
    onAttackTypeToggle,
    onSourceToggle,
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
          <div className="flex gap-2 md:flex-1">
            <div className="relative flex-1">
              <label htmlFor="threat-intel-search" className="sr-only">Search threat intelligence</label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="threat-intel-search"
                type="search"
                placeholder="Search articles, technologies, tags..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-10"
              />
            </div>

            {/* Below md, date, sort, the incident filters, category and severity live in a bottom sheet. */}
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" className="shrink-0 gap-2 md:hidden">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filters ({activeCount})
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Filter feed</SheetTitle>
                  <SheetDescription>Choose which reports the feed shows and in what order.</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <DateSelect value={dateFilter} onChange={onDateFilterChange} />
                    <SortSelect value={sortBy} onChange={onSortChange} />
                  </div>
                  <IncidentFilters {...incidentFilterProps} idPrefix="sheet-filter" />
                  <NewsFilters
                    selectedCategories={selectedCategories}
                    selectedSeverities={selectedSeverities}
                    onCategoryToggle={onCategoryToggle}
                    onSeverityToggle={onSeverityToggle}
                    onClearFilters={onClearFilters}
                    showClear={activeCount > 0}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
            <ContentScopeSelector
              value={scope}
              onChange={onScopeChange}
              label="Choose intelligence scope"
              idPrefix="feed-scope"
            />
            <div className="hidden gap-2 md:flex">
              <DateSelect value={dateFilter} onChange={onDateFilterChange} />
              <SortSelect value={sortBy} onChange={onSortChange} />
            </div>
          </div>
        </div>

        {/* From md up, the incident filters sit under the search row. Below md they are in the sheet. */}
        <div className="mt-3 hidden border-t border-border pt-3 md:block">
          <IncidentFilters {...incidentFilterProps} idPrefix="toolbar-filter" />
        </div>
      </CardContent>
    </Card>
  );
}
