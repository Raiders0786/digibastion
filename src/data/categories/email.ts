
import { SecurityCategory } from "../../types/security";

export const emailData: SecurityCategory = {
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
};
