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
}

export const MetaTags = ({ 
  title = "Digibastion — Protect Your Crypto from Phishing, Hacks & Scams",
  description = "Free, open-source Web3 security platform. Get real-time threat alerts, security checklists, and OpSec assessments to protect your crypto from phishing, wallet drains, and scams.",
  image = "https://www.digibastion.com/og-image.png",
  type = "website",
  canonical,
  keywords = "web3 security, crypto security, blockchain security, defi security, wallet security, phishing protection",
  noindex = false
}: MetaTagsProps) => {
  const location = useLocation();
  const url = `https://www.digibastion.com${location.pathname}`;
  const actualCanonical = canonical || url;
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Helper to update or create meta tag
    const setMeta = (selector: string, content: string, attr = 'content') => {
      let tag = document.querySelector(selector);
      if (tag) {
        tag.setAttribute(attr, content);
      }
    };

    // Standard meta tags
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="keywords"]', keywords);
    setMeta('meta[name="robots"]', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    // Open Graph
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:image"]', image);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[property="og:type"]', type);

    // Twitter
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', image);
    setMeta('meta[name="twitter:url"]', url);

    // Canonical
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalTag) {
      canonicalTag.setAttribute('href', actualCanonical);
    }

  }, [title, description, image, type, url, actualCanonical, keywords, noindex]);

  return null;
};
