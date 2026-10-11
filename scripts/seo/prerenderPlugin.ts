import path from 'node:path';
import type { Plugin } from 'vite';
import { runPrerender } from './prerenderCore.ts';

/**
 * After `vite build`, writes one HTML file per public route into dist/ so
 * crawlers and link previews that do not run JavaScript get the page's own
 * title, description, canonical, JSON-LD and readable text.
 *
 * Never fails the build unless PRERENDER_STRICT=1. PRERENDER=0 turns it off;
 * PRERENDER_DYNAMIC=0 skips the incident and weekly pages (no network).
 */
export function seoPrerender(): Plugin {
  let root = process.cwd();
  let outDir = path.resolve(root, 'dist');
  return {
    name: 'digibastion-seo-prerender',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      if (process.env.PRERENDER === '0') return;
      try {
        const summary = await runPrerender({ root, outDir, env: process.env, fetchImpl: fetch, log: console });
        console.log(`[seo] prerendered ${summary.staticPages} static, ${summary.incidents} incident, ${summary.weekly} weekly pages (${summary.layout})`);
      } catch (error) {
        if (process.env.PRERENDER_STRICT === '1') throw error;
        console.warn(`[seo] prerender skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  };
}
