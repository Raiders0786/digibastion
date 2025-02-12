import { SecurityCategory } from "../../types/security";

export const authenticationData: SecurityCategory = {
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
};
