const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

/** Return a normalized web URL, or null for active/invalid schemes. */
export const safeExternalUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    return HTTP_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

export const openExternalUrl = (value: unknown): boolean => {
  const url = safeExternalUrl(value);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};
