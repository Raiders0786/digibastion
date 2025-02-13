
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
      details: "Enable full device encryption to protect all data stored on your device from unauthorized access if lost or stolen."
    },
    {
      id: "mobile-2",
      title: "Use strong PIN/password",
      description: "Set up a strong device password with minimum 6 characters",
      completed: false,
      level: "essential",
      details: "Use a complex PIN or password that combines numbers, letters, and special characters. Avoid using easily guessable patterns or sequences."
    },
    {
      id: "mobile-3",
      title: "Enable biometric authentication",
      description: "Set up fingerprint or face recognition for device access",
      completed: false,
      level: "recommended",
      details: "Configure biometric authentication as an additional security layer, but remember it should not be your only authentication method."
    },
    {
      id: "mobile-4",
      title: "Install security updates",
      description: "Keep your device updated with latest security patches",
      completed: false,
      level: "essential",
      details: "Enable automatic security updates to ensure your device is protected against the latest known vulnerabilities."
    },
    {
      id: "mobile-5",
      title: "App permissions review",
      description: "Regularly review and manage app permissions",
      completed: false,
      level: "recommended",
      details: "Periodically review app permissions and revoke unnecessary access to sensitive features like camera, location, or contacts."
    },
    {
      id: "mobile-6",
      title: "Security app installation",
      description: "Install mobile security/antivirus app",
      completed: false,
      level: "optional",
      details: "Consider installing a reputable mobile security app for additional protection against malware and phishing attempts."
    }
  ],
};
