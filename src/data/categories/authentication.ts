
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
      description: "Implement password manager",
      completed: false,
      level: "essential",
      details: "Use a password manager to generate and store strong, unique passwords for all your accounts.",
      links: [
        { text: "Bitwarden", url: "https://bitwarden.com" },
        { text: "1Password", url: "https://1password.com" }
      ]
    },
    {
      id: "auth-2",
      title: "Enable 2FA everywhere",
      description: "Set up two-factor authentication",
      completed: false,
      level: "essential",
      details: "Enable 2FA using authenticator apps instead of SMS where possible. Consider hardware security keys for critical accounts."
    },
    {
      id: "auth-3",
      title: "Strong unique passwords",
      description: "Use strong passwords",
      completed: false,
      level: "essential",
      details: "Create passwords that are at least 12 characters long with a mix of numbers, symbols, and mixed case letters."
    },
    {
      id: "auth-4",
      title: "Biometric authentication",
      description: "Set up biometric authentication",
      completed: false,
      level: "recommended",
      details: "Use biometric authentication as an additional security layer, but not as your only authentication method."
    },
    {
      id: "auth-5",
      title: "Password rotation",
      description: "Update critical passwords",
      completed: false,
      level: "optional",
      details: "Change passwords for critical accounts periodically, especially if there's any suspicion of compromise."
    },
    {
      id: "auth-6",
      title: "Recovery methods",
      description: "Set up account recovery",
      completed: false,
      level: "recommended",
      details: "Configure backup authentication methods and store recovery codes securely offline."
    }
  ],
};
