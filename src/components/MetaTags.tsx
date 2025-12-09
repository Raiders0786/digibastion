
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  canonical?: string;
}

export const MetaTags = ({ 
  title = "Digibastion — The Open-Source Web3 Security Platform | Secure the Stack",
  description = "Open-source Web3 security platform with threat intelligence, OpSec assessments, security scanners, and community-powered checklists. Supported by Ethereum Foundation ESP grant 2025.",
  image = "https://digibastion.com/og-image.png",
  type = "website",
  canonical
}: MetaTagsProps) => {
  const location = useLocation();
  const url = `https://digibastion.com${location.pathname}`;
  const actualCanonical = canonical || url;

  useEffect(() => {
    // Update meta tags
    document.title = title;
    
    // Update standard meta tags
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) descriptionTag.setAttribute("content", description);

    // Update OG meta tags
    const updateOGTag = (property: string, content: string) => {
      const tag = document.querySelector(`meta[property="og:${property}"]`);
      if (tag) tag.setAttribute("content", content);
    };

    updateOGTag("title", title);
    updateOGTag("description", description);
    updateOGTag("image", image);
    updateOGTag("url", url);
    updateOGTag("type", type);

    // Update Twitter meta tags
    const updateTwitterTag = (name: string, content: string) => {
      const tag = document.querySelector(`meta[name="twitter:${name}"]`);
      if (tag) tag.setAttribute("content", content);
    };

    updateTwitterTag("title", title);
    updateTwitterTag("description", description);
    updateTwitterTag("image", image);
    updateTwitterTag("url", url);

    // Update or create canonical link
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', actualCanonical);

  }, [title, description, image, type, url, actualCanonical]);

  return null;
};
