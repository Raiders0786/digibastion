
import { SecurityCategory } from "../types/security";

export const initialSecurityData: SecurityCategory[] = [
  {
    id: "mobile",
    title: "Mobile Security",
    description: "Essential security measures for your mobile devices",
    icon: "smartphone",
    items: [
      {
        id: "mobile-1",
        title: "Enable device encryption",
        description: "Protect your data by enabling full device encryption",
        completed: false,
      },
      {
        id: "mobile-2",
        title: "Use strong PIN/password",
        description: "Set up a strong device password with minimum 6 characters",
        completed: false,
      },
      {
        id: "mobile-3",
        title: "Enable biometric authentication",
        description: "Set up fingerprint or face recognition for device access",
        completed: false,
      },
      {
        id: "mobile-4",
        title: "Install security updates",
        description: "Keep your device updated with latest security patches",
        completed: false,
      },
    ],
  },
  {
    id: "social",
    title: "Social Media Security",
    description: "Protect your social media accounts from unauthorized access",
    icon: "share-2",
    items: [
      {
        id: "social-1",
        title: "Enable 2FA on all accounts",
        description: "Set up two-factor authentication for additional security",
        completed: false,
      },
      {
        id: "social-2",
        title: "Use unique passwords",
        description: "Create different strong passwords for each account",
        completed: false,
      },
      {
        id: "social-3",
        title: "Review privacy settings",
        description: "Check and adjust your privacy settings regularly",
        completed: false,
      },
      {
        id: "social-4",
        title: "Monitor active sessions",
        description: "Regularly check and remove unknown active sessions",
        completed: false,
      },
    ],
  },
  {
    id: "wallet",
    title: "Crypto Wallet Security",
    description: "Secure your cryptocurrency assets",
    icon: "wallet",
    items: [
      {
        id: "wallet-1",
        title: "Use hardware wallet",
        description: "Store significant amounts in a hardware wallet",
        completed: false,
      },
      {
        id: "wallet-2",
        title: "Backup seed phrase",
        description: "Securely store your seed phrase offline",
        completed: false,
      },
      {
        id: "wallet-3",
        title: "Enable transaction signing",
        description: "Require password/biometrics for transactions",
        completed: false,
      },
      {
        id: "wallet-4",
        title: "Use multiple wallets",
        description: "Separate hot and cold storage wallets",
        completed: false,
      },
    ],
  },
  {
    id: "os",
    title: "OS Hardening",
    description: "Strengthen your operating system security",
    icon: "laptop",
    items: [
      {
        id: "os-1",
        title: "Enable firewall",
        description: "Configure and enable system firewall",
        completed: false,
      },
      {
        id: "os-2",
        title: "Use antivirus software",
        description: "Install and maintain updated antivirus protection",
        completed: false,
      },
      {
        id: "os-3",
        title: "Enable disk encryption",
        description: "Encrypt your system drive",
        completed: false,
      },
      {
        id: "os-4",
        title: "Regular system updates",
        description: "Keep your OS and software up to date",
        completed: false,
      },
    ],
  },
];
