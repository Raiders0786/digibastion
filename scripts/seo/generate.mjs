#!/usr/bin/env node
// Writes public/sitemap.xml, public/sitemap-index.xml, public/llms.txt and
// public/llms-full.txt from the route registry and the guide and checklist
// data. Run `npm run seo:generate` after changing a route, a guide or a
// checklist; src/seo/__tests__/generatedFilesInSync.test.ts fails until you do.
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Same settings as scripts/seo/prerenderCore.ts: no config file, so the
// prerender plugin is not loaded, and '@/' resolves to src/.
const server = await createServer({
  configFile: false,
  root,
  logLevel: 'error',
  resolve: { alias: { '@': path.resolve(root, 'src') } },
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const entry = await server.ssrLoadModule('/scripts/seo/ssrEntry.ts');
  const require = createRequire(path.join(root, 'package.json'));
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { StaticRouter } = require('react-router-dom');

  const deps = {
    articles: entry.articlesMeta,
    categories: entry.initialSecurityData,
    toolCount: entry.toolCategories.reduce((total, category) => total + category.tools.length, 0),
    guideHtml: (slug) => {
      const node = entry.getArticleContent(slug);
      return node ? renderToStaticMarkup(React.createElement(StaticRouter, { location: '/' }, node)) : null;
    },
  };

  const files = {
    'sitemap.xml': entry.buildStaticSitemapXml(deps),
    'sitemap-index.xml': entry.buildSitemapIndexXml(deps),
    'llms.txt': entry.buildLlmsTxt(deps),
    'llms-full.txt': entry.buildLlmsFullTxt(deps),
  };
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(root, 'public', name), content, 'utf8');
    console.log(`[seo] wrote public/${name} (${Buffer.byteLength(content)} bytes)`);
  }
} finally {
  await server.close();
}
