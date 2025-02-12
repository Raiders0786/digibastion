import { SecurityCategory } from "../types/security";

export const initialSecurityData: SecurityCategory[] = [
  {
    id: "authentication",
    title: "Authentication",
    description: "Secure your accounts with strong authentication methods",
    icon: "key",
    longDescription: "Authentication is your first line of defense. Implementing strong authentication methods can prevent unauthorized access to your accounts.",
    items: [
      {
        id: "auth-1",
        title: "Use password manager",
        description: "Implement a reliable password manager for all accounts",
        completed: false,
        level: "essential",
        details: "A password manager helps you create and store strong, unique passwords for all your accounts. Consider options like 1Password, Bitwarden, or KeePassXC.",
        links: [
          { text: "Bitwarden", url: "https://bitwarden.com" },
          { text: "1Password", url: "https://1password.com" }
        ]
      },
      {
        id: "auth-2",
        title: "Enable 2FA everywhere",
        description: "Set up two-factor authentication on all important accounts",
        completed: false,
        level: "essential",
        details: "Use authenticator apps instead of SMS where possible. Good options include Authy or Google Authenticator."
      },
      {
        id: "auth-3",
        title: "Strong unique passwords",
        description: "Use strong, unique passwords for each account",
        completed: false,
        level: "essential",
        details: "Each password should be at least 12 characters long, containing numbers, symbols, and mixed case letters."
      },
      {
        id: "auth-4",
        title: "Biometric authentication",
        description: "Set up fingerprint or face recognition where available",
        completed: false,
        level: "recommended",
        details: "Use biometric authentication as an additional security layer, but not as your only authentication method."
      }
    ],
  },
  {
    id: "browsing",
    title: "Web Browsing",
    description: "Protect your online browsing activities",
    icon: "globe",
    longDescription: "Your web browser is your window to the internet. Securing it is crucial for protecting your privacy and security online.",
    items: [
      {
        id: "browsing-1",
        title: "Use secure browser",
        description: "Switch to a privacy-focused web browser",
        completed: false,
        level: "essential",
        details: "Consider using browsers like Brave, Firefox, or Librewolf that prioritize privacy."
      },
      {
        id: "browsing-2",
        title: "Install privacy extensions",
        description: "Add essential privacy protection extensions",
        completed: false,
        level: "recommended",
        details: "Essential extensions include uBlock Origin, Privacy Badger, and HTTPS Everywhere."
      },
      {
        id: "browsing-3",
        title: "Enable HTTPS everywhere",
        description: "Force HTTPS connections when browsing",
        completed: false,
        level: "essential",
        details: "Always use HTTPS to encrypt your web traffic. Modern browsers typically enforce this by default."
      },
      {
        id: "browsing-4",
        title: "Clear browsing data",
        description: "Regularly clear cookies and browsing history",
        completed: false,
        level: "optional",
        details: "Set up your browser to automatically clear data when you close it, or do it manually regularly."
      }
    ],
  },
  {
    id: "email",
    title: "Email Security",
    description: "Secure your email communications",
    icon: "mail",
    longDescription: "Email is one of your most important digital accounts. Securing it properly is crucial for protecting your identity and other accounts.",
    items: [
      {
        id: "email-1",
        title: "Secure email provider",
        description: "Use a privacy-focused email service",
        completed: false,
        level: "recommended",
        details: "Consider providers like ProtonMail or Tutanota for enhanced privacy and security.",
        links: [
          { text: "ProtonMail", url: "https://proton.me/mail" },
          { text: "Tutanota", url: "https://tutanota.com" }
        ]
      },
      {
        id: "email-2",
        title: "Email encryption",
        description: "Set up end-to-end encryption for sensitive emails",
        completed: false,
        level: "optional",
        details: "Learn to use PGP encryption for sensitive email communications."
      },
      {
        id: "email-3",
        title: "Spam protection",
        description: "Configure strong spam filters",
        completed: false,
        level: "essential",
        details: "Use built-in spam filters and be cautious with unknown senders."
      },
      {
        id: "email-4",
        title: "Regular cleanup",
        description: "Delete unnecessary emails regularly",
        completed: false,
        level: "optional",
        details: "Regularly archive or delete old emails to minimize data exposure risk."
      }
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
        level: "essential",
        details: "Encrypt your device's storage to prevent unauthorized access."
      },
      {
        id: "mobile-2",
        title: "Use strong PIN/password",
        description: "Set up a strong device password with minimum 6 characters",
        completed: false,
        level: "essential",
        details: "Use a combination of letters, numbers, and symbols for added security."
      },
      {
        id: "mobile-3",
        title: "Enable biometric authentication",
        description: "Set up fingerprint or face recognition for device access",
        completed: false,
        level: "recommended",
        details: "Use biometric authentication as an additional security layer."
      },
      {
        id: "mobile-4",
        title: "Install security updates",
        description: "Keep your device updated with latest security patches",
        completed: false,
        level: "essential",
        details: "Regularly update your device's operating system and apps to protect against vulnerabilities."
      }
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
        level: "essential",
        details: "Use authenticator apps or SMS-based 2FA for added security."
      },
      {
        id: "social-2",
        title: "Use unique passwords",
        description: "Create different strong passwords for each account",
        completed: false,
        level: "essential",
        details: "Use a unique password for each social media account to prevent unauthorized access."
      },
      {
        id: "social-3",
        title: "Review privacy settings",
        description: "Check and adjust your privacy settings regularly",
        completed: false,
        level: "essential",
        details: "Regularly review and adjust your privacy settings to protect your personal information."
      },
      {
        id: "social-4",
        title: "Monitor active sessions",
        description: "Regularly check and remove unknown active sessions",
        completed: false,
        level: "optional",
        details: "Regularly check for and remove any unknown active sessions to prevent unauthorized access."
      }
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
        level: "essential",
        details: "Use a hardware wallet to store significant amounts of cryptocurrency for added security."
      },
      {
        id: "wallet-2",
        title: "Backup seed phrase",
        description: "Securely store your seed phrase offline",
        completed: false,
        level: "essential",
        details: "Store your seed phrase offline in a secure location to prevent unauthorized access."
      },
      {
        id: "wallet-3",
        title: "Enable transaction signing",
        description: "Require password/biometrics for transactions",
        completed: false,
        level: "essential",
        details: "Require a password or biometric authentication for all transactions to prevent unauthorized access."
      },
      {
        id: "wallet-4",
        title: "Use multiple wallets",
        description: "Separate hot and cold storage wallets",
        completed: false,
        level: "essential",
        details: "Separate hot and cold storage wallets to prevent unauthorized access to your cryptocurrency."
      }
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
        level: "essential",
        details: "Configure and enable your system's firewall to protect against unauthorized access."
      },
      {
        id: "os-2",
        title: "Use antivirus software",
        description: "Install and maintain updated antivirus protection",
        completed: false,
        level: "essential",
        details: "Install and maintain updated antivirus software to protect against malware and other threats."
      },
      {
        id: "os-3",
        title: "Enable disk encryption",
        description: "Encrypt your system drive",
        completed: false,
        level: "essential",
        details: "Encrypt your system drive to protect against unauthorized access."
      },
      {
        id: "os-4",
        title: "Regular system updates",
        description: "Keep your OS and software up to date",
        completed: false,
        level: "essential",
        details: "Keep your operating system and software up to date to protect against vulnerabilities."
      }
    ],
  },
];
