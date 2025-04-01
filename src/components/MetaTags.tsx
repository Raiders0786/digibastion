
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
  title = "Digibastion - Digital Security Checklist & Resources",
  description = "Enhance your digital security with our comprehensive checklist, tools, and resources. Learn best practices for online safety, privacy, crypto, and Web3 security.",
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
