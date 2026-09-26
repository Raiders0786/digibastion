import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
}: MetaTagsProps) => {
  const location = useLocation();
  const url = `https://www.digibastion.com${location.pathname}`;
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
    setMeta('property', 'og:url', actualCanonical);
    setMeta('property', 'og:type', type);
    setMeta('property', 'article:published_time', publishedTime);
    setMeta('property', 'article:modified_time', modifiedTime);
    setMeta('property', 'article:author', author);

    // Twitter
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    setMeta('name', 'twitter:image:alt', imageAlt);
    setMeta('name', 'twitter:url', actualCanonical);

    // Canonical
    const canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalTag) {
      canonicalTag.setAttribute('href', actualCanonical);
    }

  }, [title, description, image, type, actualCanonical, keywords, noindex, publishedTime, modifiedTime, author, imageAlt]);

  return null;
};
