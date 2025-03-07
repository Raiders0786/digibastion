
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
  walletData,        // Web3 - Crypto Wallet (highest priority)
  defiData,          // Web3 - DeFi Security
  authenticationData, // Web3/Web2 - Authentication (with wallet methods)
  developersData,    // Web3 - Developer Security
  osData,            // Web3/Web2 - OS Security
  jobsData,          // Web3 - Job Security
  browsingData,      // Web2 - Browsing
  emailData,         // Web2 - Email
  mobileData,        // Web2 - Mobile
  socialData,        // Web2 - Social
];
