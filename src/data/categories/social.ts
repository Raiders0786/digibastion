
import { SecurityCategory } from "../../types/security";

export const socialData: SecurityCategory = {
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
      details: "Enable two-factor authentication on all social media accounts using authenticator apps rather than SMS where possible.",
      links: [
        { text: "Authy", url: "https://authy.com/" },
        { text: "Google Authenticator", url: "https://googleauthenticator.net/" }
      ]
    },
    {
      id: "social-2",
      title: "Use unique passwords",
      description: "Create different strong passwords for each account",
      completed: false,
      level: "essential",
      details: "Use unique, complex passwords for each social media account. Consider using a password manager to generate and store them securely."
    },
    {
      id: "social-3",
      title: "Review privacy settings",
      description: "Check and adjust your privacy settings regularly",
      completed: false,
      level: "recommended",
      details: "Regularly review and update privacy settings to control who can see your posts, personal information, and contact details."
    },
    {
      id: "social-4",
      title: "Monitor active sessions",
      description: "Regularly check and remove unknown active sessions",
      completed: false,
      level: "recommended",
      details: "Review active sessions and log out from unknown devices or locations. Enable notifications for new login attempts."
    },
    {
      id: "social-5",
      title: "Limit third-party apps",
      description: "Review and remove unnecessary connected apps",
      completed: false,
      level: "optional",
      details: "Regularly review and remove third-party apps that have access to your social media accounts."
    }
  ],
};
