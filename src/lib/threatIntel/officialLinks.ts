/** Official Digibastion channels and the outside services Threat Intel pages link to. */

export const SITE_URL = 'https://www.digibastion.com';
export const TELEGRAM_CHANNEL_URL = 'https://t.me/digibastion';
export const TELEGRAM_CHANNEL_HANDLE = '@digibastion';
export const TELEGRAM_COMMUNITY_URL = 'https://t.me/digibastion_chat';
export const ALERTS_SENDER_EMAIL = 'alerts@digibastion.com';
/** Reply-to address used by the alert and digest emails. */
export const CORRECTIONS_EMAIL = 'support@digibastion.com';
export const METHODOLOGY_PATH = '/threat-intel/methodology';

export const QUILLMONITOR_DATABASE_URL = 'https://www.quillaudits.com/web3-hacks-database';
export const WEB3_IS_GOING_GREAT_URL = 'https://www.web3isgoinggreat.com/';

export const REVOKE_CASH_URL = 'https://revoke.cash';
export const CHAINABUSE_URL = 'https://www.chainabuse.com';
export const SEAL_911_URL = 'https://securityalliance.org/seal-911';
export const NVD_URL = 'https://nvd.nist.gov';
export const CISA_KEV_URL = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog';

const CVE_ID = /^CVE-\d{4}-\d{4,}$/i;

/** NVD record for a well-formed CVE id, otherwise the NVD home page. */
export function nvdCveUrl(cveId?: string | null): string {
  const id = cveId?.trim() ?? '';
  return CVE_ID.test(id) ? `${NVD_URL}/vuln/detail/${id.toUpperCase()}` : NVD_URL;
}

/** Link to the subscribe tab with categories and scope pre-selected. */
export function buildSubscribeHref(
  { categories = [], scope }: { categories?: readonly string[]; scope?: 'all' | 'web3-incidents' } = {},
): string {
  const params = new URLSearchParams({ tab: 'subscribe' });
  if (categories.length > 0) params.set('categories', categories.join(','));
  if (scope) params.set('scope', scope);
  return `/threat-intel?${params.toString()}`;
}
