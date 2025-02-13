
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
      title: "Enable 2FA",
      description: "Set up two-factor authentication for email access",
      completed: false,
      level: "essential",
      details: "Enable two-factor authentication on your email account using an authenticator app for maximum security.",
      links: [
        { text: "Google 2FA Setup", url: "https://myaccount.google.com/signinoptions/two-step-verification" }
      ]
    },
    {
      id: "email-2",
      title: "Secure email provider",
      description: "Use a privacy-focused email service",
      completed: false,
      level: "recommended",
      details: "Consider using privacy-focused email providers that offer end-to-end encryption.",
      links: [
        { text: "ProtonMail", url: "https://proton.me/mail" },
        { text: "Tutanota", url: "https://tutanota.com" }
      ]
    },
    {
      id: "email-3",
      title: "Email encryption",
      description: "Set up end-to-end encryption for sensitive emails",
      completed: false,
      level: "optional",
      details: "Use PGP encryption for sensitive email communications. Many modern email clients support this feature."
    },
    {
      id: "email-4",
      title: "Spam protection",
      description: "Configure strong spam filters",
      completed: false,
      level: "essential",
      details: "Enable and configure spam filters to protect against phishing attempts and malicious emails."
    },
    {
      id: "email-5",
      title: "Recovery options",
      description: "Set up account recovery methods",
      completed: false,
      level: "recommended",
      details: "Configure multiple recovery options including backup email and phone number. Store recovery codes safely."
    }
  ],
};
