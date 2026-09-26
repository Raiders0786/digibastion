import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type IngestionRun = {
  pipeline: 'rss' | 'web3-incidents' | 'quillmonitor' | 'ai-summary' | 'critical-alerts' | 'digest-emails';
  attempted_at: string;
  completed_at: string;
  success: boolean;
  records_found?: number;
  records_inserted?: number;
  records_updated?: number;
  records_invalid?: number;
  duration_ms?: number;
  error_summary?: string;
  metadata?: Record<string, unknown>;
};

export async function recordIngestionRun(db: SupabaseClient, run: IngestionRun): Promise<void> {
  const { error } = await db.from('threat_intel_ingestion_runs').insert({
    ...run,
    records_found: run.records_found ?? 0,
    records_inserted: run.records_inserted ?? 0,
    records_updated: run.records_updated ?? 0,
    records_invalid: run.records_invalid ?? 0,
    error_summary: run.error_summary?.slice(0, 500),
    metadata: run.metadata ?? {},
  });
  if (error) console.warn(`[ingestion-health] ${run.pipeline}: ${error.message}`);
}