import { SecurityCategory } from "../../types/security";

export const browsingData: SecurityCategory = {
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
  };
