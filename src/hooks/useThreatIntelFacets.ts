import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ThreatIntelScope } from '@/types/news';
import {
  EMPTY_THREAT_INTEL_FACETS,
  parseThreatIntelFacets,
  type ThreatIntelFacets,
} from '@/lib/threatIntel/query';

/**
 * Chain and attack-type options for the Web3 incidents view: the most common
 * values in the last 90 days (threat_intel_facets). The list does not follow
 * the other filters, so picking a chain never hides the other chains. Other
 * views get no options because they do not show these filters.
 */
export function useThreatIntelFacets(scope: ThreatIntelScope): ThreatIntelFacets {
  const [facets, setFacets] = useState<ThreatIntelFacets>(EMPTY_THREAT_INTEL_FACETS);

  useEffect(() => {
    if (scope !== 'web3-incidents') {
      setFacets(EMPTY_THREAT_INTEL_FACETS);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await (supabase.rpc as unknown as (
          name: 'threat_intel_facets', args: { p_scope: ThreatIntelScope }
        ) => ReturnType<typeof supabase.rpc>)('threat_intel_facets', { p_scope: scope });
        if (cancelled) return;
        if (error) {
          console.warn('Unable to load threat-intel filter options:', error);
          setFacets(EMPTY_THREAT_INTEL_FACETS);
          return;
        }
        setFacets(parseThreatIntelFacets(data));
      } catch (facetsError) {
        if (cancelled) return;
        console.warn('Unable to load threat-intel filter options:', facetsError);
        setFacets(EMPTY_THREAT_INTEL_FACETS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  return facets;
}
