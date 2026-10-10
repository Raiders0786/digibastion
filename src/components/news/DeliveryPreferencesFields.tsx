import { useMemo, useState } from 'react';
import { Clock, Link2, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatUtcOffset, getBrowserTimeZone, hourOptions, timezoneOptions } from '@/lib/digestSchedule';
import { MAX_SUBSCRIPTION_CHAINS, type SubscriptionFormState } from '@/lib/subscriptionPayload';
import { TELEGRAM_CHANNEL_URL } from '@/lib/threatIntel/officialLinks';
import type { ThreatIntelFacet } from '@/lib/threatIntel/query';

export type DeliveryPreferencesValue = Pick<
  SubscriptionFormState,
  'scope' | 'realtime' | 'daily' | 'weekly' | 'includePreliminary' | 'chains' | 'preferredHour' | 'timezone' | 'timezoneOffset'
>;

interface DeliveryPreferencesFieldsProps {
  value: DeliveryPreferencesValue;
  onChange: (patch: Partial<DeliveryPreferencesValue>) => void;
  /** Chain options from useThreatIntelFacets. */
  chainOptions: readonly ThreatIntelFacet[];
  idPrefix: string;
  /** Shows the "choose at least one" error under the email types. */
  channelError?: string | null;
  showTelegram?: boolean;
}

export const DELIVERY_CHANNELS = [
  { key: 'realtime', label: 'Real-time alerts', hint: 'Critical and high incidents as they are reported' },
  { key: 'daily', label: 'Daily brief', hint: 'One email a day at your chosen time' },
  { key: 'weekly', label: 'Weekly deep-dive (Mondays)', hint: 'Losses, trends and the top incidents of the week' },
] as const;

const IANA_PREFIX = 'iana:';

/** The email types, unconfirmed switch, chains and delivery time shared by every subscribe surface. */
export const DeliveryPreferencesFields = ({
  value,
  onChange,
  chainOptions,
  idPrefix,
  channelError,
  showTelegram = true,
}: DeliveryPreferencesFieldsProps) => {
  const [editingTimezone, setEditingTimezone] = useState(false);
  const detectedZone = useMemo(() => getBrowserTimeZone(), []);
  const showDelivery = value.daily || value.weekly;
  const chainChoices = useMemo(() => {
    const options = chainOptions.map((facet) => ({ value: facet.value, label: facet.label }));
    for (const chain of value.chains) {
      if (!options.some((option) => option.value === chain)) options.push({ value: chain, label: chain });
    }
    return options;
  }, [chainOptions, value.chains]);
  const zoneChoices = useMemo(
    () => [...new Set([value.timezone, detectedZone].filter((zone): zone is string => Boolean(zone)))],
    [value.timezone, detectedZone],
  );
  const timezoneLabel = value.timezone ?? formatUtcOffset(value.timezoneOffset);
  const errorId = `${idPrefix}-channels-error`;

  const toggleChain = (chain: string) => {
    if (value.chains.includes(chain)) onChange({ chains: value.chains.filter((entry) => entry !== chain) });
    else if (value.chains.length < MAX_SUBSCRIPTION_CHAINS) onChange({ chains: [...value.chains, chain] });
  };

  const selectZone = (choice: string) => {
    if (choice.startsWith(IANA_PREFIX)) onChange({ timezone: choice.slice(IANA_PREFIX.length) });
    else onChange({ timezone: null, timezoneOffset: Number(choice) });
  };

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3" aria-describedby={channelError ? errorId : undefined}>
        <legend className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4" aria-hidden="true" />
          Emails to receive *
        </legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {DELIVERY_CHANNELS.map((channel) => {
            const id = `${idPrefix}-${channel.key}`;
            return (
              <label
                key={channel.key}
                htmlFor={id}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors hover:bg-accent/50 ${value[channel.key] ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <Checkbox
                  id={id}
                  checked={value[channel.key]}
                  onCheckedChange={(checked) => onChange({ [channel.key]: checked === true })}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block font-medium">{channel.label}</span>
                  <span className="block text-xs text-muted-foreground">{channel.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
        {channelError && (
          <p id={errorId} role="alert" className="text-sm font-medium text-destructive">{channelError}</p>
        )}
        {showTelegram && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Prefer chat? The same alerts post to Telegram.</span>
            <Button asChild size="sm" variant="outline" className="h-8 gap-2">
              <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Join on Telegram
              </a>
            </Button>
          </div>
        )}
      </fieldset>

      <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
        <div className="min-w-0">
          <Label htmlFor={`${idPrefix}-preliminary`} className="font-medium">Include unconfirmed reports</Label>
          <p className="text-xs text-muted-foreground">
            Early reports the source has not confirmed yet. They are labelled unconfirmed in every email.
          </p>
        </div>
        <Switch
          id={`${idPrefix}-preliminary`}
          checked={value.includePreliminary}
          onCheckedChange={(checked) => onChange({ includePreliminary: checked })}
        />
      </div>

      {value.scope === 'web3-incidents' && chainChoices.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Chains (optional)
          </legend>
          <p className="text-xs text-muted-foreground">
            Only Web3 incidents on these chains. Leave empty for every chain. Up to {MAX_SUBSCRIPTION_CHAINS}.
          </p>
          <div className="flex flex-wrap gap-2">
            {chainChoices.map((chain) => {
              const selected = value.chains.includes(chain.value);
              return (
                <button
                  key={chain.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleChain(chain.value)}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    selected ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-transparent text-foreground hover:bg-accent'
                  }`}
                >
                  {chain.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {showDelivery && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Delivery time for the daily brief and weekly
          </Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-delivery-time`} className="text-xs text-muted-foreground">Time</Label>
              <Select value={String(value.preferredHour)} onValueChange={(hour) => onChange({ preferredHour: Number(hour) })}>
                <SelectTrigger id={`${idPrefix}-delivery-time`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((hour) => (
                    <SelectItem key={hour.value} value={String(hour.value)}>{hour.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-delivery-timezone`} className="text-xs text-muted-foreground">Timezone</Label>
              {editingTimezone ? (
                <Select
                  value={value.timezone ? `${IANA_PREFIX}${value.timezone}` : String(value.timezoneOffset)}
                  onValueChange={selectZone}
                >
                  <SelectTrigger id={`${idPrefix}-delivery-timezone`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {zoneChoices.map((zone) => (
                      <SelectItem key={zone} value={`${IANA_PREFIX}${zone}`}>{zone}</SelectItem>
                    ))}
                    {timezoneOptions.map((zone) => (
                      <SelectItem key={zone.value} value={String(zone.value)}>{zone.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex min-h-10 flex-wrap items-center gap-2 text-sm">
                  <span id={`${idPrefix}-delivery-timezone`} className="font-medium">{timezoneLabel}</span>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setEditingTimezone(true)}>
                    change
                  </Button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {value.weekly && !value.daily ? 'The weekly arrives on Mondays' : 'Emails arrive'} at {hourOptions.find((hour) => hour.value === value.preferredHour)?.label ?? `${value.preferredHour}:00`} {timezoneLabel}.
          </p>
        </div>
      )}
    </div>
  );
};
