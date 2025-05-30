
import { SecurityCategory } from "../types";

export const cloudSecurity: SecurityCategory = {
  "name": "Cloud Security",
  "description": "Guidance and tools for securing cloud infrastructures and services across AWS, GCP, Azure and more.",
  "tools": [
    {
      "title": "Prowler",
      "url": "https://github.com/prowler-cloud/prowler",
      "description": "A comprehensive security tool to audit AWS environments against best practices.",
      "tags": ["aws", "cloud security", "audit"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Steampipe",
      "url": "https://steampipe.io",
      "description": "An open-source tool that allows you to query cloud infrastructure using SQL.",
      "tags": ["cloud", "query", "infrastructure"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Cloudsplaining",
      "url": "https://github.com/salesforce/cloudsplaining",
      "description": "A tool for auditing AWS IAM policies to detect over-privileged roles and risky configurations.",
      "tags": ["aws", "IAM", "audit"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "GCP Scanner",
      "url": "https://github.com/toniblyx/gcp_scanner",
      "description": "A security tool to analyze and secure Google Cloud Platform configurations.",
      "tags": ["gcp", "cloud security"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Heroku & Fly.io",
      "url": "https://www.heroku.com, https://fly.io",
      "description": "Managed cloud platforms that abstract away infrastructure security challenges.",
      "tags": ["managed services", "cloud security"],
      "lastReviewed": "2025-02-26",
      "active": true
    }
  ]
};
