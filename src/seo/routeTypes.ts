// Shapes shared by the route registry, the prerender, MetaTags and the Worker.
// Pure module: relative imports only, no React, no window.

export type RobotsDirective = 'index' | 'noindex,follow' | 'noindex,nofollow';

export interface PrerenderLink {
  href: string;
  label: string;
}

export interface PrerenderBody {
  /** Excludes the current page. */
  breadcrumbs: PrerenderLink[];
  h1: string;
  /** Answer-first paragraph. */
  intro: string;
  items?: string[];
  /** Trusted HTML rendered from our own React content (guide bodies). Never user or provider text. */
  html?: string;
  links: PrerenderLink[];
}

export interface RouteMeta {
  /** Canonical path. */
  path: string;
  /** At most 70 characters. */
  title: string;
  /** At most 160 characters. */
  description: string;
  /** Absolute URL. */
  image: string;
  imageAlt: string;
  /** Defaults to 1920 x 1060, the size of the og-*.png files in public/. */
  imageWidth?: number;
  imageHeight?: number;
  type: 'website' | 'article';
  robots: RobotsDirective;
  /** null only for the SPA fallback shell. */
  canonical: string | null;
  publishedTime?: string;
  modifiedTime?: string;
  /** YYYY-MM-DD for the static sitemap. */
  lastmod?: string;
  section?: string;
  tags?: string[];
  jsonLd: object[];
  body: PrerenderBody;
}

/** Props MetaTags accepts. Defined here so pure modules can build them without importing React. */
export interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  canonical?: string;
  robots?: RobotsDirective;
  /** Legacy shorthand for robots="noindex,nofollow". */
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  section?: string;
  tags?: string[];
}
