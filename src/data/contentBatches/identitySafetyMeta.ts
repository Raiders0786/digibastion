import type { ArticleMeta } from '../articlesData';

export const passkeysCryptoAccountsMeta = {
  slug: 'passkeys-vs-authenticator-apps-security-keys-crypto',
  title: 'Passkeys vs Authenticator Apps and Security Keys for Crypto Accounts',
  description:
    'Choose stronger sign-in protection for crypto exchanges by comparing passkeys, TOTP authenticator apps, and hardware security keys—including phishing resistance and recovery trade-offs.',
  category: 'Account Security',
  readTime: '12 min read',
  publishedAt: '2026-09-27',
  modifiedAt: '2026-09-27',
  author: 'Digibastion Security Team',
  tags: ['passkeys', 'authenticator apps', 'security keys', 'crypto exchange security', 'phishing resistance'],
  difficulty: 'beginner',
  status: 'published',
  summary:
    'For a crypto exchange or other custodial account, use a passkey or hardware security key when the service implements it well. Unlike a typed one-time code, FIDO authentication binds the response to the real site. Keep an independent recovery route and remember that account MFA does not protect a self-custody seed phrase.',
  keyTakeaways: [
    'Passkeys and FIDO security keys can resist phishing because authentication is bound to the legitimate site; manually entered TOTP codes are not phishing-resistant.',
    'A passkey may sync across devices, while a hardware security key commonly keeps a device-bound credential; the better choice depends on recovery needs and risk.',
    'Register a second independent authenticator, secure the account that syncs passkeys, and never treat exchange MFA as protection for a wallet seed phrase.',
  ],
  sources: [
    {
      title: 'NIST SP 800-63B-4: Authentication and Authenticator Management',
      publisher: 'National Institute of Standards and Technology',
      url: 'https://pages.nist.gov/800-63-4/sp800-63b/authenticators/',
    },
    {
      title: 'FIDO Passkeys: Passwordless Authentication',
      publisher: 'FIDO Alliance',
      url: 'https://fidoalliance.org/passkeys/',
    },
  ],
} satisfies ArticleMeta;

export const addressPoisoningMeta = {
  slug: 'crypto-address-poisoning-token-impersonation',
  title: 'Crypto Address Poisoning and Token Impersonation: How to Verify Before Sending',
  description:
    'Learn how address-poisoning transactions and lookalike tokens exploit wallet history, truncated addresses, names, and symbols—and use a safer verification workflow.',
  category: 'Scam Prevention',
  readTime: '11 min read',
  publishedAt: '2026-09-27',
  modifiedAt: '2026-09-27',
  author: 'Digibastion Security Team',
  tags: ['address poisoning', 'token impersonation', 'scam tokens', 'wallet security', 'transaction verification'],
  difficulty: 'intermediate',
  status: 'published',
  summary:
    'Address poisoning places an attacker-controlled lookalike address in a wallet’s visible history so the user may copy it later. Token impersonation adds a familiar name or symbol, but the token contract address—not its branding—identifies the asset. Verify recipients and contracts through trusted, independent sources before signing.',
  keyTakeaways: [
    'Do not copy a recipient from recent activity: an attacker can manufacture a transaction involving a visually similar address.',
    'Compare the complete destination through a trusted address book or independent channel, not only the first and last characters shown by a wallet.',
    'Token names and symbols can be duplicated; verify the network and contract address using the project’s official records.',
  ],
  sources: [
    {
      title: 'FBI Warns of Cryptocurrency Token Impersonation Scam',
      publisher: 'Federal Bureau of Investigation',
      url: 'https://www.fbi.gov/contact-us/field-offices/denver/news/fbi-warns-of-cryptocurrency-token-impersonation-scam',
    },
    {
      title: 'How to identify scam tokens',
      publisher: 'ethereum.org',
      url: 'https://ethereum.org/guides/how-to-id-scam-tokens/',
    },
    {
      title: 'Ethereum security and scam prevention',
      publisher: 'ethereum.org',
      url: 'https://ethereum.org/security/',
    },
  ],
} satisfies ArticleMeta;

export const cryptoScamRecoveryMeta = {
  slug: 'cryptocurrency-scam-recovery-steps-recovery-scams',
  title: 'Cryptocurrency Scam Recovery: What to Do and How to Avoid Recovery Scams',
  description:
    'A calm, evidence-first response after cryptocurrency fraud: stop further payments, secure accounts, preserve transaction details, report quickly, and reject fake recovery services.',
  category: 'Incident Response',
  readTime: '12 min read',
  publishedAt: '2026-09-27',
  modifiedAt: '2026-09-27',
  author: 'Digibastion Security Team',
  tags: ['crypto scam recovery', 'recovery scam', 'cryptocurrency fraud', 'IC3 report', 'incident response'],
  difficulty: 'beginner',
  status: 'published',
  summary:
    'After cryptocurrency fraud, stop sending money, preserve the transaction trail, contact involved financial providers through official channels, and report promptly. Recovery is uncertain. Anyone guaranteeing retrieval, demanding an advance fee, or claiming law-enforcement powers should be treated as a likely follow-on scam.',
  keyTakeaways: [
    'Do not pay another tax, unlock charge, verification deposit, or recovery fee; additional payment usually increases the loss.',
    'Preserve wallet addresses, transaction hashes, amounts, dates, domains, account identifiers, and communications before blocking contacts or losing access.',
    'Report promptly through official financial-provider and law-enforcement channels, but distrust unsolicited recovery offers and guaranteed outcomes.',
  ],
  sources: [
    {
      title: 'Cryptocurrency Investment Fraud',
      publisher: 'Federal Bureau of Investigation',
      url: 'https://www.fbi.gov/how-we-can-help-you/victim-services/national-crimes-and-victim-resources/cryptocurrency-investment-fraud',
    },
    {
      title: 'Increase in Companies Falsely Claiming an Ability to Recover Funds Lost in Cryptocurrency Investment Scams',
      publisher: 'FBI Internet Crime Complaint Center',
      url: 'https://www.ic3.gov/PSA/2023/PSA230811',
    },
    {
      title: 'Cryptocurrency: Information to Report',
      publisher: 'FBI Internet Crime Complaint Center',
      url: 'https://www.ic3.gov/CrimeInfo/Cryptocurrency',
    },
  ],
} satisfies ArticleMeta;

export const identitySafetyArticlesMeta: ArticleMeta[] = [
  passkeysCryptoAccountsMeta,
  addressPoisoningMeta,
  cryptoScamRecoveryMeta,
];
