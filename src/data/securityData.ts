import { SecurityCategory } from "../types/security";

export const initialSecurityData: SecurityCategory[] = [
  {
    id: "authentication",
    title: "Authentication",
    description: "Secure your accounts with strong authentication methods",
    icon: "key",
    items: [
      {
        id: "auth-1",
        title: "Use password manager",
        description: "Implement a reliable password manager for all accounts",
        completed: false,
      },
      {
        id: "auth-2",
        title: "Enable 2FA everywhere",
        description: "Set up two-factor authentication on all important accounts",
        completed: false,
      },
      {
        id: "auth-3",
        title: "Strong unique passwords",
        description: "Use strong, unique passwords for each account",
        completed: false,
      },
      {
        id: "auth-4",
        title: "Biometric authentication",
        description: "Set up fingerprint or face recognition where available",
        completed: false,
      },
    ],
  },
  {
    id: "browsing",
    title: "Web Browsing",
    description: "Protect your online browsing activities",
    icon: "globe",
    items: [
      {
        id: "browsing-1",
        title: "Use secure browser",
        description: "Switch to a privacy-focused web browser",
        completed: false,
      },
      {
        id: "browsing-2",
        title: "Install privacy extensions",
        description: "Add essential privacy protection extensions",
        completed: false,
      },
      {
        id: "browsing-3",
        title: "Enable HTTPS everywhere",
        description: "Force HTTPS connections when browsing",
        completed: false,
      },
      {
        id: "browsing-4",
        title: "Clear browsing data",
        description: "Regularly clear cookies and browsing history",
        completed: false,
      },
    ],
  },
  {
    id: "email",
    title: "Email Security",
    description: "Secure your email communications",
    icon: "mail",
    items: [
      {
        id: "email-1",
        title: "Secure email provider",
        description: "Use a privacy-focused email service",
        completed: false,
      },
      {
        id: "email-2",
        title: "Email encryption",
        description: "Set up end-to-end encryption for sensitive emails",
        completed: false,
      },
      {
        id: "email-3",
        title: "Spam protection",
        description: "Configure strong spam filters",
        completed: false,
      },
      {
        id: "email-4",
        title: "Regular cleanup",
        description: "Delete unnecessary emails regularly",
        completed: false,
      },
    ],
  },
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
