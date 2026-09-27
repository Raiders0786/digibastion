// Keep retired guide URLs pointed at the closest published replacement so old
// bookmarks and search equity resolve to useful, indexable content.
export const retiredArticleRedirects: Readonly<Record<string, string>> = {
  'web3-wallet-security-guide': '/articles/getting-started-web3-security',
  'defi-security-best-practices': '/articles/defi-smart-contract-audit-checklist',
  'nft-security-guide': '/articles/nft-marketplace-security',
};
