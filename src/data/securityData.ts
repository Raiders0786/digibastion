
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

export const initialSecurityData: SecurityCategory[] = [
  authenticationData,
  browsingData,
  emailData,
  mobileData,
  socialData,
  walletData,
  osData,
  defiData,
  developersData,
  jobsData,
];
