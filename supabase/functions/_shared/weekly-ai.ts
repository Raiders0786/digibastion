// The weekly deep-dive's model call: grounded input, the prompt, the Lovable
// AI gateway request and a strict parser for the reply. The model only writes
// prose with placeholders; weekly-validator.ts decides what is kept.
// Pure module: no Deno or URL imports (fetch is injected), so vitest can import it.
import type { NewsletterItem, WeeklyTotals } from './newsletter-content.ts';
import { itemPlaceholderValues, trendsPlaceholderValues, vulnerabilityPlaceholderValues, WEEKLY_MAX_LENGTH } from './weekly-templates.ts';
import { WEEKLY_PLACEHOLDERS } from './weekly-validator.ts';

export const DEFAULT_WEEKLY_MODEL = 'google/gemini-2.5-pro';
/**
 * Gateway model ids the weekly may use (WEEKLY_AI_MODEL). Checked against the
 * ids this project already calls; confirm the list in Lovable before adding
 * one, because an unknown id fails every run and falls back to templates.
 */
export const ALLOWED_WEEKLY_MODELS: readonly string[] = [
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-3-pro-preview',
  'openai/gpt-5',
  'openai/gpt-5-mini',
];
export const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
export const WEEKLY_AI_TIMEOUT_MS = 60_000;
const MAX_MODEL_TEXT = 2_000;
const MAX_SUMMARY = 400;

type TopInput = Pick<NewsletterItem, 'uid' | 'projectName' | 'chain' | 'attackType' | 'status' | 'sourceName' | 'incidentDate' | 'summary' | 'fundsReturned'> & {
  /** Placeholders that have a value for this item; the others must not be used. */
  placeholders: string[];
};

export interface WeeklyGroundedInput {
  weekStart: string;
  totals: WeeklyTotals;
  top: TopInput[];
  vulnerabilities: Pick<NewsletterItem, 'uid' | 'title' | 'sourceName' | 'cveId' | 'summary'>[];
  placeholders: { trends: string[]; vulnerabilities: string[] };
}

export interface WeeklyModelOutput { top: { uid: string; what: string; action: string }[]; trends: string; vulnerabilities: string }

const URL_TEXT = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:com|io|xyz|org|net|finance|fi|app|dev|co|gov|cash|exchange|network|gg|ai)\b\S*/gi;

/** Source text without links, so the prompt never carries a URL the model could repeat. */
function scrub(value: string | null, max = MAX_SUMMARY): string | null {
  if (value === null) return null;
  const text = value.replace(URL_TEXT, '(link removed)').replace(/\s+/g, ' ').trim().slice(0, max);
  return text || null;
}

const available = (values: Record<string, string | null>) =>
  Object.entries(values).filter(([, value]) => value !== null && value !== '').map(([name]) => name);

export function buildWeeklyGroundedInput(o: { weekStart: string; totals: WeeklyTotals; top: NewsletterItem[]; vulnerabilities: NewsletterItem[] }): WeeklyGroundedInput {
  return {
    weekStart: o.weekStart,
    totals: o.totals,
    top: o.top.map((entry) => ({
      uid: entry.uid,
      projectName: entry.projectName,
      chain: entry.chain,
      attackType: entry.attackType,
      status: entry.status,
      sourceName: entry.sourceName,
      incidentDate: entry.incidentDate,
      summary: scrub(entry.summary) ?? '',
      fundsReturned: entry.fundsReturned,
      placeholders: available(itemPlaceholderValues(entry)),
    })),
    vulnerabilities: o.vulnerabilities.map((entry) => ({
      uid: entry.uid,
      title: scrub(entry.title, 300) ?? '',
      sourceName: entry.sourceName,
      cveId: entry.cveId,
      summary: scrub(entry.summary) ?? '',
    })),
    placeholders: {
      trends: available(trendsPlaceholderValues(o.totals)),
      vulnerabilities: available(vulnerabilityPlaceholderValues(o.vulnerabilities)),
    },
  };
}

const list = (names: readonly string[]) => names.map((name) => `{${name}}`).join(' ');

export function buildWeeklyPrompt(input: WeeklyGroundedInput): { system: string; user: string } {
  const system = [
    'You write short paragraphs for a weekly Web3 security email. Call write_weekly with JSON only.',
    '',
    'Rules:',
    `- Write every name, number, amount, chain, attack type, status, source and date as a placeholder, never as text. Item placeholders: ${list(WEEKLY_PLACEHOLDERS.item)}. Trends placeholders: ${list(WEEKLY_PLACEHOLDERS.trends)}. Vulnerabilities placeholders: ${list(WEEKLY_PLACEHOLDERS.vulnerabilities)}.`,
    '- Use only the placeholders listed in "placeholders" for that item or section. The others have no value.',
    '- Add no facts, names, figures, dates or links that are not in the input. Do not guess causes, attackers or amounts.',
    '- If an item has status "unconfirmed", both of its paragraphs must say "unconfirmed" or "reported", and must never call it confirmed or verified.',
    '- Plain sentences only: no markdown, lists, headings, quotes, emoji or links. Keep a calm, factual tone with no hype words. Never write "verified by".',
    `- "what" (what happened) and "action" (what users and builders should do) are one or two sentences each, at most ${WEEKLY_MAX_LENGTH.item} characters. "trends" is at most ${WEEKLY_MAX_LENGTH.trends} characters and "vulnerabilities" at most ${WEEKLY_MAX_LENGTH.vulnerabilities}.`,
    '- Return exactly one "top" entry for each input uid, with the same uid, and no others.',
  ].join('\n');
  const user = `Data for the week (JSON):\n${JSON.stringify(input)}`;
  return { system, user };
}

export const WEEKLY_TOOL = {
  type: 'function',
  function: {
    name: 'write_weekly',
    description: 'Return the weekly paragraphs with placeholders.',
    parameters: {
      type: 'object',
      properties: {
        top: {
          type: 'array',
          items: {
            type: 'object',
            properties: { uid: { type: 'string' }, what: { type: 'string' }, action: { type: 'string' } },
            required: ['uid', 'what', 'action'],
            additionalProperties: false,
          },
        },
        trends: { type: 'string' },
        vulnerabilities: { type: 'string' },
      },
      required: ['top', 'trends', 'vulnerabilities'],
      additionalProperties: false,
    },
  },
} as const;

/** The parsed reply, or null when it is malformed or does not cover exactly the expected uids. */
export function parseWeeklyModelOutput(raw: string, expectedUids: string[]): WeeklyModelOutput | null {
  if (typeof raw !== 'string') return null;
  const body = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const o = parsed as Record<string, unknown>;
  if (typeof o.trends !== 'string' || typeof o.vulnerabilities !== 'string' || !Array.isArray(o.top)) return null;

  const top: WeeklyModelOutput['top'] = [];
  for (const entry of o.top) {
    if (!entry || typeof entry !== 'object') return null;
    const e = entry as Record<string, unknown>;
    if (typeof e.uid !== 'string' || typeof e.what !== 'string' || typeof e.action !== 'string') return null;
    top.push({ uid: e.uid, what: e.what.slice(0, MAX_MODEL_TEXT), action: e.action.slice(0, MAX_MODEL_TEXT) });
  }
  const uids = top.map((entry) => entry.uid);
  const expected = new Set(expectedUids);
  if (new Set(uids).size !== uids.length || uids.length !== expected.size || uids.some((uid) => !expected.has(uid))) return null;

  return { top, trends: o.trends.slice(0, MAX_MODEL_TEXT), vulnerabilities: o.vulnerabilities.slice(0, MAX_MODEL_TEXT) };
}

export function resolveWeeklyModel(value: string | null | undefined): string {
  const model = (value ?? '').trim();
  return ALLOWED_WEEKLY_MODELS.includes(model) ? model : DEFAULT_WEEKLY_MODEL;
}

export type WeeklyCompletion = { ok: true; raw: string } | { ok: false; error: string };

/** One gateway call. Errors are short codes; the key and response bodies never appear in them. */
export async function requestWeeklyCompletion(o: {
  fetchImpl: typeof fetch;
  apiKey: string;
  model: string;
  prompt: { system: string; user: string };
  timeoutMs?: number;
}): Promise<WeeklyCompletion> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), o.timeoutMs ?? WEEKLY_AI_TIMEOUT_MS);
  try {
    const response = await o.fetchImpl(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${o.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: o.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: o.prompt.system },
          { role: 'user', content: o.prompt.user },
        ],
        tools: [WEEKLY_TOOL],
        tool_choice: { type: 'function', function: { name: WEEKLY_TOOL.function.name } },
      }),
      signal: controller.signal,
    });
    if (response.status === 402) return { ok: false, error: 'ai_payment_required' };
    if (response.status === 429) return { ok: false, error: 'ai_rate_limited' };
    if (!response.ok) return { ok: false, error: `ai_http_${response.status}` };
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { ok: false, error: 'ai_bad_response' };
    }
    const message = (data as { choices?: { message?: { content?: unknown; tool_calls?: { function?: { arguments?: unknown } }[] } }[] })
      ?.choices?.[0]?.message;
    const args = message?.tool_calls?.[0]?.function?.arguments;
    const raw = typeof args === 'string' && args.trim() ? args : typeof message?.content === 'string' && message.content.trim() ? message.content : null;
    return raw ? { ok: true, raw } : { ok: false, error: 'ai_empty_output' };
  } catch (error) {
    const aborted = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError');
    return { ok: false, error: aborted ? 'ai_timeout' : 'ai_network_error' };
  } finally {
    clearTimeout(timer);
  }
}
