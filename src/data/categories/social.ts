
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
};
