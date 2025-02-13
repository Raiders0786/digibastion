
import { ArticleCollection } from './types';
import { socialEngineeringArticle } from './security/socialEngineering';
import { gettingStartedArticle } from './security/gettingStarted';
import { privacyAndOpsecArticle } from './security/privacyAndOpsec';
import { walletSecurityArticle } from './security/walletSecurity';
import { web3SecurityArticle } from './security/web3Security';
import { operationalSecurityArticle } from './security/operationalSecurity';

export const articles: ArticleCollection = {
  "social-engineering-web3": socialEngineeringArticle,
  "getting-started-web3-security": gettingStartedArticle,
  "privacy-security-web3-opsec": privacyAndOpsecArticle,
  "advanced-wallet-security": walletSecurityArticle,
  "web3-wallet-security-guide": web3SecurityArticle,
  "web3-nft-operational-security": operationalSecurityArticle
};

export default articles;
