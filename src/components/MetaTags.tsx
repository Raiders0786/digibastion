import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const EMPTY_TAGS: string[] = [];

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  canonical?: string;
  keywords?: string;
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

export const MetaTags = ({ 
  title = "Digibastion — Protect Your Crypto from Phishing, Hacks & Scams",
  description = "Free, community-built Web3 security platform. Get real-time threat alerts, security checklists, and OpSec assessments to protect your crypto from phishing, wallet drains, and scams.",
  image = "https://www.digibastion.com/og-image.png",
  type = "website",
  canonical,
  keywords = "web3 security, crypto security, blockchain security, defi security, wallet security, phishing protection",
  noindex = false,
  publishedTime,
  modifiedTime,
  author,
  imageAlt = "Digibastion security guide",
  imageWidth = 1920,
  imageHeight = 1060,
  section,
  tags = EMPTY_TAGS,
}: MetaTagsProps) => {
  const location = useLocation();
  const path = location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '');
  const url = `https://www.digibastion.com${path}`;
  const actualCanonical = canonical || url;
  useEffect(() => {
    // Update document title
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

    // Standard meta tags
    setMeta('name', 'title', title);
    setMeta('name', 'description', description);
    setMeta('name', 'keywords', keywords);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');

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

    document.querySelectorAll('meta[property="article:tag"][data-digibastion-managed="true"]')
      .forEach((tag) => tag.remove());
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

    // Canonical
    let canonicalTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = actualCanonical;

  }, [title, description, image, type, actualCanonical, keywords, noindex, publishedTime, modifiedTime, author, imageAlt, imageWidth, imageHeight, section, tags]);

  return null;
};
