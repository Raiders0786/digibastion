// The build-time prerender behind scripts/seo/prerenderPlugin.ts. It loads
// the route registry through a throwaway Vite SSR server (so '@/' imports and
// TSX work), renders each public route's head and body into dist/, and turns
// dist/index.html into the neutral fallback shell.
//
// Failure rules: a missing template, a bad guide or an unreachable Supabase
// never fails the build. Dynamic pages (incidents, weekly issues) are skipped
// with one warning when the data cannot be fetched in time.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createServer } from 'vite';
import type { PrerenderBody, RouteMeta } from '../../src/seo/routeTypes.ts';

export type PrerenderLayout = 'file' | 'dir' | 'both';

export interface PrerenderLogger {
  log: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
}

export interface PrerenderOptions {
  root: string;
  outDir: string;
  env: Record<string, string | undefined>;
  fetchImpl: typeof fetch;
  log: PrerenderLogger;
}

export interface PrerenderSummary {
  staticPages: number;
  incidents: number;
  weekly: number;
  layout: PrerenderLayout;
}

interface GuideMeta { slug: string; title: string; description: string; category: string; publishedAt: string; modifiedAt: string; author: string; tags: string[] }
interface CategoryMeta { id: string; title: string; description: string; items: { title: string; description?: string }[] }
interface WeeklyPage { content: { weekStart: string; issueDate: string }; generatedAt: string | null }

/** The parts of scripts/seo/ssrEntry.ts the prerender uses. */
export interface SsrEntry {
  articlesMeta: GuideMeta[];
  initialSecurityData: CategoryMeta[];
  toolCategories: { tools: unknown[] }[];
  getArticleContent: (slug: string) => unknown;
  DEFAULT_SUPABASE_URL: string;
  DEFAULT_SUPABASE_PUBLISHABLE_KEY: string;
  STATIC_ROUTES: Record<string, RouteMeta>;
  SITE_FALLBACK_META: RouteMeta;
  toolsRouteMeta: (count: number) => RouteMeta;
  categoryRouteMeta: (c: CategoryMeta, index?: number, all?: readonly CategoryMeta[]) => RouteMeta;
  guideRouteMeta: (a: GuideMeta, html?: string, all?: readonly GuideMeta[]) => RouteMeta;
  weeklyRouteMeta: (content: WeeklyPage['content'], generatedAt: string) => RouteMeta;
  incidentSeoInputFromArticle: (article: unknown) => unknown;
  incidentRouteMeta: (input: unknown) => RouteMeta;
  renderHead: (meta: RouteMeta) => string;
  renderBody: (body: PrerenderBody) => string;
  injectIntoTemplate: (template: string, head: string, body: string) => string;
  outputPathsFor: (path: string, layout: PrerenderLayout) => string[];
  fetchDynamic: (options: {
    baseUrl: string; anonKey: string; incidentLimit: number; weeklyLimit: number; timeoutMs: number;
    fetchImpl: typeof fetch; log: { warn: (message: string) => void; info: (message: string) => void };
  }) => Promise<{ incidents: unknown[]; weekly: WeeklyPage[] }>;
}

const MARKERS = ['<!--seo:head-->', '<!--/seo:head-->', '<!--seo:body-->'];
const DYNAMIC_DEADLINE_MS = 30_000;
const REQUEST_TIMEOUT_MS = 8_000;
const WEEKLY_LIMIT = 26;
const DEFAULT_INCIDENT_LIMIT = 500;

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

function parseLayout(value: string | undefined, log: PrerenderLogger): PrerenderLayout {
  if (!value) return 'file';
  if (value === 'file' || value === 'dir' || value === 'both') return value;
  log.warn(`[seo] unknown PRERENDER_LAYOUT "${value}"; using "file"`);
  return 'file';
}

/** Starts a Vite SSR server that cannot load vite.config.ts (so this plugin never recurses). */
export async function startSsrServer(root: string) {
  return createServer({
    configFile: false,
    root,
    logLevel: 'error',
    resolve: { alias: { '@': path.resolve(root, 'src') } },
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
}

/** Renders a guide body with Node's own React. StaticRouter (not MemoryRouter) avoids a layout-effect warning per guide. */
export function guideHtmlRenderer(root: string, entry: Pick<SsrEntry, 'getArticleContent'>, log: Pick<PrerenderLogger, 'warn'>) {
  const require = createRequire(path.join(root, 'package.json'));
  const React = require('react') as { createElement: (...args: unknown[]) => unknown };
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string };
  const { StaticRouter } = require('react-router-dom') as { StaticRouter: unknown };
  return (slug: string): string | null => {
    try {
      const node = entry.getArticleContent(slug);
      return node ? renderToStaticMarkup(React.createElement(StaticRouter, { location: '/' }, node)) : null;
    } catch (error) {
      log.warn(`[seo] guide ${slug} body skipped: ${message(error)}`);
      return null;
    }
  };
}

async function withDeadline<T>(work: Promise<T>, ms: number, fallback: T, onTimeout: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      onTimeout();
      resolve(fallback);
    }, ms);
  });
  try {
    return await Promise.race([work, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

export async function runPrerender({ root, outDir, env, fetchImpl, log }: PrerenderOptions): Promise<PrerenderSummary> {
  const layout = parseLayout(env.PRERENDER_LAYOUT, log);
  const summary: PrerenderSummary = { staticPages: 0, incidents: 0, weekly: 0, layout };
  const templatePath = path.join(outDir, 'index.html');

  let template: string;
  try {
    template = await readFile(templatePath, 'utf8');
  } catch {
    log.warn(`[seo] ${templatePath} not found; prerender skipped`);
    return summary;
  }
  if (!MARKERS.every((marker) => template.includes(marker))) {
    log.warn('[seo] dist/index.html has no seo markers; prerender skipped');
    return summary;
  }

  const server = await startSsrServer(root);
  try {
    const entry = (await server.ssrLoadModule('/scripts/seo/ssrEntry.ts')) as unknown as SsrEntry;
    const guideHtml = guideHtmlRenderer(root, entry, log);
    const outRoot = path.resolve(outDir);

    const write = async (meta: RouteMeta): Promise<boolean> => {
      if (meta.robots !== 'index' || !meta.canonical) return false;
      let files: string[];
      try {
        files = entry.outputPathsFor(meta.path, layout);
      } catch (error) {
        log.warn(`[seo] skipped ${meta.path}: ${message(error)}`);
        return false;
      }
      const html = entry.injectIntoTemplate(template, entry.renderHead(meta), entry.renderBody(meta.body));
      for (const file of files) {
        const target = path.resolve(outRoot, file);
        // Belt and braces after outputPathsFor: never write outside dist/.
        if (!target.startsWith(`${outRoot}${path.sep}`)) throw new Error(`refusing to write outside ${outRoot}: ${file}`);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, html, 'utf8');
      }
      return files.length > 0;
    };

    const toolCount = entry.toolCategories.reduce((total, category) => total + category.tools.length, 0);
    const staticPages: RouteMeta[] = [
      ...Object.values(entry.STATIC_ROUTES).filter((meta) => meta.path !== '/'),
      entry.toolsRouteMeta(toolCount),
      ...entry.initialSecurityData.map((category, index, all) => entry.categoryRouteMeta(category, index, all)),
    ];
    for (const guide of entry.articlesMeta) {
      const html = guideHtml(guide.slug);
      // A guide without a body renders "not found" in the app; do not publish a page for it.
      if (html) staticPages.push(entry.guideRouteMeta(guide, html, entry.articlesMeta));
    }
    for (const meta of staticPages) if (await write(meta)) summary.staticPages += 1;

    if (env.PRERENDER_DYNAMIC !== '0') {
      const empty = { incidents: [] as unknown[], weekly: [] as WeeklyPage[] };
      const dynamic = await withDeadline(
        entry.fetchDynamic({
          baseUrl: env.VITE_SUPABASE_URL?.trim() || entry.DEFAULT_SUPABASE_URL,
          anonKey: env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || entry.DEFAULT_SUPABASE_PUBLISHABLE_KEY,
          incidentLimit: Number(env.PRERENDER_INCIDENT_LIMIT) || DEFAULT_INCIDENT_LIMIT,
          weeklyLimit: WEEKLY_LIMIT,
          timeoutMs: REQUEST_TIMEOUT_MS,
          fetchImpl,
          log,
        }),
        DYNAMIC_DEADLINE_MS,
        empty,
        () => log.warn(`[seo] dynamic pages skipped: no answer within ${DYNAMIC_DEADLINE_MS / 1000} s`),
      );
      for (const article of dynamic.incidents) {
        try {
          if (await write(entry.incidentRouteMeta(entry.incidentSeoInputFromArticle(article)))) summary.incidents += 1;
        } catch (error) {
          log.warn(`[seo] incident page skipped: ${message(error)}`);
        }
      }
      for (const page of dynamic.weekly) {
        try {
          if (await write(entry.weeklyRouteMeta(page.content, page.generatedAt ?? page.content.issueDate))) summary.weekly += 1;
        } catch (error) {
          log.warn(`[seo] weekly page skipped: ${message(error)}`);
        }
      }
    }

    // Last, so every page above was built from the untouched template.
    const fallback = entry.SITE_FALLBACK_META;
    await writeFile(templatePath, entry.injectIntoTemplate(template, entry.renderHead(fallback), entry.renderBody(fallback.body)), 'utf8');
    return summary;
  } finally {
    await server.close();
  }
}
