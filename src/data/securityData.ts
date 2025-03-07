
import { SecurityCategory } from "../types/security";
import { authenticationData } from "./categories/authentication";
import { browsingData } from "./categories/browsing";
import { emailData } from "./categories/email";
import { mobileData } from "./categories/mobile";
import { socialData } from "./categories/social";
import { walletData } from "./categories/wallet";
import { osData } from "./categories/os";
import { defiData } from "./categories/defi";
import { developersData } from "./categories/developers";
import { jobsData } from "./categories/jobs";

// Reordering categories to prioritize Web3 categories
export const initialSecurityData: SecurityCategory[] = [
  walletData,            // Web3 - Crypto Wallet (highest priority)
  defiData,              // Web3 - DeFi Security
  authenticationData,    // Web3/Web2 - Authentication (with wallet methods)
  osData,                // Web3/Web2 - OS Security (higher priority for Web3)
  emailData,             // Web3/Web2 - Email (moved higher for Web3 relevance)
  browsingData,          // Web3/Web2 - Browsing (with Web3 browser focus)
  mobileData,            // Web3/Web2 - Mobile (updated with Web3 focus)
  developersData,        // Web3 - Developer Security
  jobsData,              // Web3 - Job Security
  socialData,            // Web2 - Social
];
