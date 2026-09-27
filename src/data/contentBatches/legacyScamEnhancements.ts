import type { ArticleMeta } from '../articlesData';

export const legacyScamEnhancements: Record<string, Partial<ArticleMeta>> = {
  'soft-rug-vs-hard-rug': {
    modifiedAt: '2026-09-27',
    readTime: '12 min read',
    status: 'published',
    summary: 'A hard rug uses abrupt liquidity removal or privileged contract powers; a soft rug more gradually extracts value through insider selling, treasury misuse, misleading promotion, or abandonment. Both require evidence beyond a falling price. Evaluate control, disclosures, on-chain conduct, and realistic exit liquidity together.',
    keyTakeaways: [
      'Hard rugs are abrupt extractions; soft rugs are slower exits or value drains, but the labels are informal and price decline alone proves neither.',
      'Map privileged roles, upgrade paths, liquidity ownership, vesting, treasury wallets, and concentrated holders before taking exposure.',
      'Audits, named teams, renounced ownership, and liquidity locks reduce only specific risks and never guarantee honest conduct or a viable market.',
    ],
    sources: [
      { title: 'Crypto Assets and Cyber Enforcement Actions', publisher: 'U.S. Securities and Exchange Commission', url: 'https://www.sec.gov/enforcement-litigation/crypto-assets-cyber-enforcement-actions' },
      { title: 'Digital Asset and Commodity Fraud', publisher: 'Commodity Futures Trading Commission', url: 'https://www.cftc.gov/LearnAndProtect/DigitalAssetRisks/index.htm' },
    ],
  },
  'twitter-crypto-impersonation': {
    modifiedAt: '2026-09-27',
    readTime: '11 min read',
    status: 'published',
    summary: 'Crypto impersonators on X copy or compromise trusted accounts, then use urgent giveaways, support stories, migrations, and claims to lead users into payments or harmful wallet requests. A badge, follower count, display name, or reply position does not establish identity.',
    keyTakeaways: [
      'Verify the exact handle and destination through an independently found official website and a second established channel.',
      'Treat unsolicited support, deposit-doubling promises, recovery offers, seed-phrase requests, and unexplained wallet prompts as hostile.',
      'After interaction, preserve the post and domain, secure affected accounts, review wallet permissions, and report through official channels.',
    ],
    sources: [
      { title: 'Platform Manipulation and Spam Policy', publisher: 'X Help Center', url: 'https://help.x.com/en/rules-and-policies/platform-manipulation' },
      { title: 'How to Recognize and Avoid Phishing Scams', publisher: 'Federal Trade Commission', url: 'https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams' },
    ],
  },
  'setapprovalforall-risks': {
    modifiedAt: '2026-09-27',
    readTime: '11 min read',
    status: 'published',
    summary: 'setApprovalForAll is a standard NFT permission that authorizes one operator to manage every asset held by an address within a particular ERC-721 or ERC-1155 collection. Marketplaces may need it, but a malicious operator can transfer covered NFTs without another approval.',
    keyTakeaways: [
      'Confirm the collection contract and operator address before granting collection-wide NFT authority.',
      'Disconnecting a site does not cancel an on-chain approval; revoke unused operators through a trusted interface on the correct chain.',
      'Keep valuable NFTs in a vault wallet that does not browse, claim unsolicited drops, or interact with experimental applications.',
    ],
    sources: [
      { title: 'EIP-721: Non-Fungible Token Standard', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-721' },
      { title: 'EIP-1155: Multi Token Standard', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-1155' },
    ],
  },
  'locked-liquidity-explained': {
    modifiedAt: '2026-09-27',
    readTime: '11 min read',
    status: 'published',
    summary: 'A liquidity lock restricts withdrawal of a specified liquidity position until its release conditions are met. It does not validate token code, insider allocations, upgrade authority, market depth, the paired asset, or what happens when the lock expires.',
    keyTakeaways: [
      'Verify the locker contract, pool, position, amount, beneficiary, and unlock rules on-chain instead of trusting a badge or screenshot.',
      'Compare locked liquidity with all liquidity and assess token privileges, supply concentration, vesting, alternate pools, and realistic exit capacity.',
      'Even a long or complete lock addresses one withdrawal path and cannot guarantee the project, market, governance, or treasury is safe.',
    ],
    sources: [
      { title: 'Digital Asset Risks', publisher: 'Commodity Futures Trading Commission', url: 'https://www.cftc.gov/LearnAndProtect/DigitalAssetRisks/index.htm' },
      { title: 'Crypto Assets', publisher: 'Investor.gov', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/crypto-assets' },
    ],
  },
  'honeypot-tokens-detection': {
    modifiedAt: '2026-09-27',
    readTime: '12 min read',
    status: 'published',
    summary: 'A honeypot token permits buying but blocks or economically punishes ordinary selling with transfer logic, blacklists, mutable fees, limits, or privileged exemptions. A tiny successful buy or scanner badge does not prove that a later sale will work.',
    keyTakeaways: [
      'Verify the exact token, chain, pool, implementation, and privileged roles; a token name and symbol are easy to copy.',
      'Review ordinary buyers’ successful sells and current contract state, while treating simulations and automated scanners as limited evidence.',
      'Do not repeatedly increase slippage or approve new spenders after a failed sale; preserve evidence, revoke risky allowances, and report the promotion.',
    ],
    sources: [
      { title: 'How to Identify Scam Tokens', publisher: 'ethereum.org', url: 'https://ethereum.org/guides/how-to-id-scam-tokens/' },
      { title: 'FBI Warns of Cryptocurrency Token Impersonation Scam', publisher: 'Federal Bureau of Investigation', url: 'https://www.fbi.gov/contact-us/field-offices/denver/news/fbi-warns-of-cryptocurrency-token-impersonation-scam' },
    ],
  },
  'crypto-job-scams': {
    modifiedAt: '2026-09-27',
    readTime: '12 min read',
    status: 'published',
    summary: 'Fake crypto recruiters and employers use malicious assessments, repositories, meeting software, fake checks, equipment payments, and money-moving tasks to steal credentials, assets, or access to company systems. Confirm the role independently and open untrusted work only in an isolated environment without secrets.',
    keyTakeaways: [
      'Verify the role and recruiter through the employer’s independently located careers page and published contact details.',
      'Treat assessment code, packages, documents, and meeting clients as hostile; isolate them from wallets, browser sessions, developer keys, and production systems.',
      'Never pay to obtain a job or use a personal account to forward employer funds, and report suspected device compromise immediately.',
    ],
    sources: [
      { title: 'Scammers Defraud Individuals via Work-From-Home Scams', publisher: 'FBI Internet Crime Complaint Center', url: 'https://www.ic3.gov/PSA/2024/PSA240604' },
      { title: 'Job Scams', publisher: 'Federal Trade Commission', url: 'https://consumer.ftc.gov/articles/job-scams' },
    ],
  },
  'discord-crypto-scams': {
    modifiedAt: '2026-09-27',
    readTime: '11 min read',
    status: 'published',
    summary: 'Discord crypto fraud can originate from a cloned moderator, compromised administrator, malicious bot, webhook, or fake server. Messages inside a real community are not automatically trustworthy, particularly urgent mints, migrations, claims, and private support conversations.',
    keyTakeaways: [
      'Assume moderators will not request seed phrases, remote access, payments, login QR codes, or unexplained wallet permissions.',
      'Cross-check announcements through the independently verified project website and another established channel before following a link.',
      'If targeted, preserve IDs and messages, secure Discord and email, review wallet approvals, and alert real staff through a separate channel.',
    ],
    sources: [
      { title: 'Common Scams and What to Look Out For', publisher: 'Discord Safety', url: 'https://discord.com/safety/common-scams-what-to-look-out-for' },
      { title: 'Recognize and Report Phishing', publisher: 'Cybersecurity and Infrastructure Security Agency', url: 'https://www.cisa.gov/secure-our-world/recognize-and-report-phishing' },
    ],
  },
  'rug-pull-warning-signs': {
    modifiedAt: '2026-09-27',
    readTime: '13 min read',
    status: 'published',
    summary: 'Rug-pull risk rises when a small group can remove liquidity, mint or sell concentrated supply, upgrade contracts, change fees, block transfers, or spend treasury funds without meaningful checks. Marketing cues alone are weak; inspect technical and economic control together.',
    keyTakeaways: [
      'Map deployer, owner, proxy administrator, treasury, liquidity, vesting, governance, and major-holder control before committing funds.',
      'Audit reports and liquidity locks have narrow scopes and do not guarantee sound economics, honest operators, safe upgrades, or sufficient exit liquidity.',
      'Preserve evidence and report quickly after suspected fraud, but do not trust hurried migration links or services that guarantee recovery.',
    ],
    sources: [
      { title: 'Crypto Investment Scams', publisher: 'Investor.gov', url: 'https://www.investor.gov/protect-your-investments/fraud/types-fraud/crypto-investment-scams' },
      { title: 'Digital Asset and Commodity Fraud', publisher: 'Commodity Futures Trading Commission', url: 'https://www.cftc.gov/LearnAndProtect/DigitalAssetRisks/index.htm' },
    ],
  },
  'social-engineering-web3': {
    modifiedAt: '2026-09-27',
    readTime: '12 min read',
    status: 'published',
    summary: 'Web3 social engineering manipulates people into disclosing secrets, installing software, sending assets, or authorizing harmful transactions. Urgency, authority, fear, scarcity, and social proof work even on experienced users, so custody decisions need repeatable independent verification.',
    keyTakeaways: [
      'No support agent, employer, officer, founder, friend, or romantic contact needs a wallet recovery phrase or private key.',
      'Verify identity through a pre-existing independent channel and decode every destination, asset, value, permission, and expiry before signing.',
      'Separate vault wallets from daily activity and require a second reviewer plus a cooling-off period for high-value or unusual actions.',
    ],
    sources: [
      { title: 'Recognize and Report Phishing', publisher: 'Cybersecurity and Infrastructure Security Agency', url: 'https://www.cisa.gov/secure-our-world/recognize-and-report-phishing' },
      { title: 'What to Know About Cryptocurrency and Scams', publisher: 'Federal Trade Commission', url: 'https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams' },
    ],
  },
  'nft-scam-red-flags': {
    modifiedAt: '2026-09-27',
    readTime: '12 min read',
    status: 'published',
    summary: 'NFT scams rely on counterfeit contracts, copied art, manipulated trading, unverifiable creators, mutable metadata, broad approvals, and urgent mint stories. Collection names, images, marketplace badges, floor prices, volume, and member counts are not proof of provenance or value.',
    keyTakeaways: [
      'Confirm the exact chain and collection contract from a creator-controlled source, then inspect deployment, distribution, metadata, and privileged controls.',
      'A mint should not silently authorize transfer of NFTs or tokens unrelated to the purchase; reject unexplained operator approvals and signatures.',
      'Use a separate mint wallet and keep high-value NFTs in a vault that never interacts with unsolicited links or experimental applications.',
    ],
    sources: [
      { title: 'EIP-721: Non-Fungible Token Standard', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-721' },
      { title: 'What to Know About NFTs and Scams', publisher: 'Federal Trade Commission', url: 'https://consumer.ftc.gov/consumer-alerts/2022/08/what-know-about-non-fungible-tokens-nfts-and-scams' },
    ],
  },
  'ice-phishing-explained': {
    modifiedAt: '2026-09-27',
    readTime: '12 min read',
    status: 'published',
    summary: 'Ice phishing steals authority rather than the wallet key: a deceptive approval, operator permission, permit, order, or typed signature lets an attacker move assets later. Gasless messages and site disconnection can still leave usable authorization behind.',
    keyTakeaways: [
      'Inspect the spender or operator, asset, amount, chain, verifying contract, action, nonce, and expiry before any transaction or message signature.',
      'Use narrow permissions, separate vault assets from daily interactions, and reject prompts that a trusted interface cannot decode clearly.',
      'After suspected authorization, preserve the request and revoke affected permissions quickly, while recognizing revocation may not cancel every signature or transfer.',
    ],
    sources: [
      { title: 'EIP-20: Token Standard', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-20' },
      { title: 'EIP-712: Typed Structured Data Hashing and Signing', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-712' },
    ],
  },
  'romance-scams-crypto': {
    modifiedAt: '2026-09-27',
    readTime: '13 min read',
    status: 'published',
    summary: 'Crypto romance scams build emotional trust before directing a target to a controlled investment platform that displays fabricated returns. Small withdrawals may establish confidence; later withdrawals trigger invented tax, insurance, verification, or release fees.',
    keyTakeaways: [
      'Do not invest because an online romantic contact recommends a platform, offers coaching, or presents smooth guaranteed returns.',
      'Never send more money to release a balance; stop, preserve messages and transactions, and contact financial providers and authorities promptly.',
      'Support affected people without blame and distrust anyone who promises recovery or demands an advance fee.',
    ],
    sources: [
      { title: 'What to Know About Romance Scams', publisher: 'Federal Trade Commission', url: 'https://consumer.ftc.gov/articles/what-know-about-romance-scams' },
      { title: 'Cryptocurrency Investment Fraud', publisher: 'Federal Bureau of Investigation', url: 'https://www.fbi.gov/how-we-can-help-you/victim-services/national-crimes-and-victim-resources/cryptocurrency-investment-fraud' },
    ],
  },
  'fake-airdrop-scams': {
    modifiedAt: '2026-09-27',
    readTime: '11 min read',
    status: 'published',
    summary: 'Fake airdrops use unsolicited tokens, impersonated announcements, advertisements, direct messages, and counterfeit claim sites to obtain deposits, credentials, approvals, or signatures. A token appearing in a wallet is neither proof of eligibility nor proof of value.',
    keyTakeaways: [
      'Find the distribution from an independently verified project domain and confirm the chain, token, claim contract, eligibility, and deadline.',
      'Never enter a recovery phrase or pay a deposit, tax, matching transfer, or activation fee to receive an airdrop.',
      'Use a separate low-value claim wallet and reject permissions or signatures whose decoded effect exceeds receipt of the stated token.',
    ],
    sources: [
      { title: 'Ethereum Security and Scam Prevention', publisher: 'ethereum.org', url: 'https://ethereum.org/security/' },
      { title: 'What to Know About Cryptocurrency and Scams', publisher: 'Federal Trade Commission', url: 'https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams' },
    ],
  },
};
