import { SecurityCategory } from "../../types/security";

export const mobileData: SecurityCategory = {
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
};
