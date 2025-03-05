
import { SecurityCategory } from "../types";

export const corporateSecurity: SecurityCategory = {
  "name": "Corporate & IT Security",
  "description": "Guidelines, policies, and tools for securing corporate networks, endpoint devices, and enterprise services.",
  "tools": [
    {
      "title": "G Suite Security Dashboard & Checklist",
      "url": "https://support.google.com/a/answer/60762",
      "description": "Tools and guidelines for securing your G Suite environment.",
      "tags": ["g suite", "enterprise", "security"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Office 365 Security Recommendations",
      "url": "https://www.microsoft.com/security/blog/2020/04/28/microsoft-security-guidance-for-office-365/",
      "description": "Security best practices for securing Microsoft Office 365 and preventing ransomware.",
      "tags": ["office 365", "microsoft", "enterprise security"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Endpoint Detection & Response (EDR) Solutions",
      "url": "https://www.crowdstrike.com",
      "description": "Advanced EDR solutions to monitor and secure endpoint devices.",
      "tags": ["EDR", "endpoint security", "IT security"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Red Canary EDR",
      "url": "https://www.redcanary.com",
      "description": "Managed detection and response service for enhanced endpoint security.",
      "tags": ["EDR", "endpoint security", "IT security"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Network Discovery Tools (Asset Note, Rumble)",
      "url": "https://assetnote.io, https://rumble.run",
      "description": "Tools to perform internal and external network infrastructure audits.",
      "tags": ["network security", "asset discovery", "IT security"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "SOC2 & Compliance Guidance",
      "url": "https://www.schellman.com, https://www.a-lign.com",
      "description": "Resources and testing services to prepare for compliance audits like SOC2.",
      "tags": ["compliance", "SOC2", "corporate security"],
      "lastReviewed": "2025-02-26",
      "active": true
    }
  ]
};
