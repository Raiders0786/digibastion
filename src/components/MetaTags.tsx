import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canonicalizeUrl } from '../../supabase/functions/_shared/site-urls';
import { SITE_FALLBACK_META } from '@/seo/routeMeta';
import type { MetaTagsProps, RobotsDirective } from '@/seo/routeTypes';

export type { MetaTagsProps };

const EMPTY_TAGS: string[] = [];

const ROBOTS_CONTENT: Record<RobotsDirective, string> = {
  index: 'index, follow, max-image-preview:large, max-snippet:-1',
  'noindex,follow': 'noindex, follow',
  'noindex,nofollow': 'noindex, nofollow',
};

/**
 * Keeps the document head in step with the current page. Every tag is updated
 * in place, so the prerendered head and this component never leave two copies
 * of the same tag. Defaults come from the route registry's fallback shell.
 */
export const MetaTags = ({
  title = SITE_FALLBACK_META.title,
  description = SITE_FALLBACK_META.description,
  image = SITE_FALLBACK_META.image,
  type = SITE_FALLBACK_META.type,
  canonical,
  robots,
  noindex = false,
  publishedTime,
  modifiedTime,
  author,
  imageAlt = SITE_FALLBACK_META.imageAlt,
  imageWidth = 1920,
  imageHeight = 1060,
  section,
  tags = EMPTY_TAGS,
}: MetaTagsProps) => {
  const location = useLocation();
  // Query strings (UTM tags included) and fragments never reach the canonical.
  const actualCanonical = (canonical ? canonicalizeUrl(canonical) : null)
    ?? canonicalizeUrl(location.pathname)
    ?? 'https://www.digibastion.com/';
  const robotsContent = ROBOTS_CONTENT[robots ?? (noindex ? 'noindex,nofollow' : 'index')];

  useEffect(() => {
    document.title = title;

    const setMeta = (attribute: 'name' | 'property', key: string, content?: string) => {
      const selector = `meta[${attribute}="${key}"]`;
      let tag = document.querySelector<HTMLMetaElement>(selector);

      if (!content) {
        tag?.remove();
        return;
      }

      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
      }

      tag.content = content;
    };

    // Standard meta tags. Search engines ignore "title" and "keywords"; drop any left over.
    setMeta('name', 'title', undefined);
    setMeta('name', 'keywords', undefined);
    setMeta('name', 'description', description);
    setMeta('name', 'robots', robotsContent);

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:image:alt', imageAlt);
    setMeta('property', 'og:image:width', String(imageWidth));
    setMeta('property', 'og:image:height', String(imageHeight));
    setMeta('property', 'og:url', actualCanonical);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', 'Digibastion');
    setMeta('property', 'og:locale', 'en_US');
    setMeta('property', 'article:published_time', publishedTime);
    setMeta('property', 'article:modified_time', modifiedTime);
    setMeta('property', 'article:author', author);
    setMeta('property', 'article:section', section);

    // Prerendered and earlier article:tag values are replaced, never appended to.
    document.querySelectorAll('meta[property="article:tag"]').forEach((tag) => tag.remove());
    if (type === 'article') {
      tags.forEach((value) => {
        const tag = document.createElement('meta');
        tag.setAttribute('property', 'article:tag');
        tag.setAttribute('content', value);
        tag.setAttribute('data-digibastion-managed', 'true');
        document.head.appendChild(tag);
      });
    }

    // Twitter
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    setMeta('name', 'twitter:image:alt', imageAlt);
    setMeta('name', 'twitter:url', actualCanonical);

    // Exactly one canonical: update the prerendered one if it exists.
    const canonicalTags = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
    canonicalTags.slice(1).forEach((tag) => tag.remove());
    let canonicalTag = canonicalTags[0];
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = actualCanonical;
  }, [title, description, image, type, actualCanonical, robotsContent, publishedTime, modifiedTime, author, imageAlt, imageWidth, imageHeight, section, tags]);

  return null;
};
