
import { SecurityCategory } from "../types/security";
import { authenticationData } from "./categories/authentication";
import { browsingData } from "./categories/browsing";
import { emailData } from "./categories/email";
import { mobileData } from "./categories/mobile";
import { socialData } from "./categories/social";
import { walletData } from "./categories/wallet";
import { osData } from "./categories/os";

export const initialSecurityData: SecurityCategory[] = [
  authenticationData,
  browsingData,
  emailData,
  mobileData,
  socialData,
  walletData,
  osData,
];
