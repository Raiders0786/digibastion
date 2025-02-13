
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
        details: "Use browsers focused on privacy and security like Brave or Firefox.",
        links: [
          { text: "Brave Browser", url: "https://brave.com" },
          { text: "Firefox", url: "https://www.mozilla.org/firefox" }
        ]
      },
      {
        id: "browsing-2",
        title: "Install privacy extensions",
        description: "Add essential privacy protection extensions",
        completed: false,
        level: "recommended",
        details: "Install privacy-enhancing extensions like uBlock Origin and Privacy Badger.",
        links: [
          { text: "uBlock Origin", url: "https://ublockorigin.com/" },
          { text: "Privacy Badger", url: "https://privacybadger.org/" }
        ]
      },
      {
        id: "browsing-3",
        title: "Enable HTTPS everywhere",
        description: "Force HTTPS connections when browsing",
        completed: false,
        level: "essential",
        details: "Ensure your browser enforces HTTPS connections to protect your data in transit."
      },
      {
        id: "browsing-4",
        title: "Clear browsing data",
        description: "Regularly clear cookies and browsing history",
        completed: false,
        level: "recommended",
        details: "Regularly clear your browsing history, cache, and cookies to protect your privacy."
      },
      {
        id: "browsing-5",
        title: "Use private browsing",
        description: "Enable private browsing mode for sensitive activities",
        completed: false,
        level: "optional",
        details: "Use private/incognito mode when accessing sensitive websites or on shared devices."
      }
    ],
};
