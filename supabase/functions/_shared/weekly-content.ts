// Assembles the stored weekly issue: each paragraph is the model's text when
// it passes validateAndFill, otherwise the deterministic template. Every
// decision, with its reasons, goes into archive.validation so any complaint
// can be traced back to the input, the prompt and the raw output.
// Pure module: no Deno or URL imports, so vitest can import it.
import {
  compareItems,
  WEEKLY_UPDATES_CAP,
  type NewsletterItem,
  type WeeklyArchive,
  type WeeklyIssueContent,
  type WeeklyParagraph,
  type WeeklyTotals,
} from './newsletter-content.ts';
import { pickSecurityAction } from './security-actions.ts';
import { buildWeeklyGroundedInput, type WeeklyModelOutput } from './weekly-ai.ts';
import { weeklyPeriod } from './weekly-stats.ts';
import {
  itemPlaceholderValues,
  templateAction,
  templateTrends,
  templateVulnerabilities,
  templateWhat,
  trendsPlaceholderValues,
  vulnerabilityPlaceholderValues,
  WEEKLY_MAX_LENGTH,
} from './weekly-templates.ts';
import { STATIC_ALLOWED_TERMS, validateAndFill, type ValidationContext } from './weekly-validator.ts';

const MAX_RAW_OUTPUT = 50_000;

/**
 * The week's records outside the deep-dive (top incidents and
 * vulnerabilities), most important first, for archive.updates.
 */
export function selectWeeklyUpdates(records: NewsletterItem[], content: Pick<WeeklyIssueContent, 'top' | 'vulnerabilities'>): NewsletterItem[] {
  const seen = new Set([...content.top.map((entry) => entry.item.uid), ...content.vulnerabilities.items.map((entry) => entry.uid)]);
  const out: NewsletterItem[] = [];
  for (const entry of [...records].sort(compareItems)) {
    if (seen.has(entry.uid)) continue;
    seen.add(entry.uid);
    out.push(entry);
  }
  return out.slice(0, WEEKLY_UPDATES_CAP);
}

export interface AssembleWeeklyInput {
  weekStart: string;
  totals: WeeklyTotals;
  top: NewsletterItem[];
  vulnerabilities: NewsletterItem[];
  modelOutput: WeeklyModelOutput | null;
  aiEnabled: boolean;
  model: string | null;
  prompt: { system: string; user: string } | null;
  rawOutput: string | null;
  error: string | null;
  knownProjectNames: string[];
}

const present = (values: (string | null | undefined)[]): string[] =>
  values.filter((value): value is string => typeof value === 'string' && value.trim() !== '');

export function assembleWeeklyContent(o: AssembleWeeklyInput): WeeklyIssueContent {
  const period = weeklyPeriod(o.weekStart);
  if (!period) throw new Error('weekStart must be a Monday (YYYY-MM-DD)');

  const validation: WeeklyArchive['validation'] = [];
  const useModel = o.aiEnabled && o.modelOutput !== null;
  const missingReason = o.aiEnabled ? 'no_model_output' : 'ai_disabled';
  const inputProjectNames = present(o.top.map((entry) => entry.projectName));

  function paragraph(id: string, modelText: string | undefined, ctx: ValidationContext | null, template: string): WeeklyParagraph {
    if (!useModel || modelText === undefined || ctx === null) {
      validation.push({ paragraphId: id, accepted: false, reasons: [missingReason] });
      return { id, text: template, origin: 'template' };
    }
    const result = validateAndFill(modelText, ctx);
    validation.push({ paragraphId: id, accepted: result.ok, reasons: result.ok ? [] : result.reasons });
    return result.ok ? { id, text: result.text, origin: 'ai' } : { id, text: template, origin: 'template' };
  }

  const baseCtx = (overrides: Pick<ValidationContext, 'section' | 'values' | 'allowedTerms' | 'isUnconfirmed' | 'maxLength'>): ValidationContext => ({
    knownProjectNames: o.knownProjectNames,
    inputProjectNames,
    ...overrides,
  });

  const top = o.top.map((entry) => {
    const model = useModel ? o.modelOutput?.top.find((candidate) => candidate.uid === entry.uid) : undefined;
    const ctx = baseCtx({
      section: 'item',
      values: itemPlaceholderValues(entry),
      // An item paragraph may name only this item's own chain, attack type, source and project.
      allowedTerms: [...STATIC_ALLOWED_TERMS, ...present([entry.chain, entry.attackType, entry.sourceName, entry.projectName])],
      isUnconfirmed: entry.status === 'unconfirmed',
      maxLength: WEEKLY_MAX_LENGTH.item,
    });
    return {
      item: entry,
      what: paragraph(`top:${entry.uid}:what`, model?.what, ctx, templateWhat(entry)),
      action: paragraph(`top:${entry.uid}:action`, model?.action, ctx, templateAction(entry)),
    };
  });

  const trends = paragraph('trends', o.modelOutput?.trends, baseCtx({
    section: 'trends',
    values: trendsPlaceholderValues(o.totals),
    allowedTerms: [...STATIC_ALLOWED_TERMS, ...o.totals.byAttackType.map((entry) => entry.label), ...o.totals.byChain.map((entry) => entry.label)],
    isUnconfirmed: false,
    maxLength: WEEKLY_MAX_LENGTH.trends,
  }), templateTrends(o.totals));

  const vulnerabilitySummary = paragraph('vulnerabilities', o.modelOutput?.vulnerabilities, baseCtx({
    section: 'vulnerabilities',
    values: vulnerabilityPlaceholderValues(o.vulnerabilities),
    allowedTerms: [...STATIC_ALLOWED_TERMS, ...present(o.vulnerabilities.map((entry) => entry.sourceName))],
    isUnconfirmed: false,
    maxLength: WEEKLY_MAX_LENGTH.vulnerabilities,
  }), templateVulnerabilities(o.vulnerabilities));

  const opsecTip = pickSecurityAction({
    seed: o.weekStart,
    attackTypes: present([...o.top.map((entry) => entry.attackType), ...o.totals.byAttackType.map((entry) => entry.label)]),
    categories: present([...o.top, ...o.vulnerabilities].map((entry) => entry.category)),
  });

  const sources = [...new Set(present([...o.top, ...o.vulnerabilities].map((entry) => entry.sourceName?.trim())))];

  return {
    version: 1,
    kind: 'weekly',
    weekStart: period.weekStart,
    weekEnd: period.weekEnd,
    issueDate: period.issueDate,
    totals: o.totals,
    top,
    trends,
    vulnerabilities: { items: o.vulnerabilities, summary: vulnerabilitySummary },
    opsecTip,
    sources,
    archive: {
      aiEnabled: o.aiEnabled,
      model: o.model,
      input: buildWeeklyGroundedInput({ weekStart: o.weekStart, totals: o.totals, top: o.top, vulnerabilities: o.vulnerabilities }),
      prompt: o.prompt,
      rawOutput: o.rawOutput === null ? null : o.rawOutput.slice(0, MAX_RAW_OUTPUT),
      validation,
      error: o.error,
    },
  };
}
