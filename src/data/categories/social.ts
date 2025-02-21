
import { SecurityCategory } from "../../types/security";

export const socialData: SecurityCategory = {
  id: "social",
  title: "Social Media Security",
  description: "Protect your social media accounts and personal privacy",
  icon: "share-2",
  items: [
    // Account Security
    {
      id: "social-1",
      title: "Use Unique and Complex Passwords",
      description: "Avoid reused or weak passwords",
      completed: false,
      level: "essential",
      details: "Create strong, unique passwords for each social media account to protect against credential stuffing and brute-force attacks. Consider using a password manager.",
      links: [
        { text: "Password Manager Guide", url: "https://www.privacyguides.org/basics/password-managers/" }
      ]
    },
    {
      id: "social-2",
      title: "Enable Two-Factor Authentication",
      description: "Add extra security layer to accounts",
      completed: false,
      level: "essential",
      details: "Enable two-factor authentication on all social media accounts using authenticator apps rather than SMS where possible.",
      links: [
        { text: "Authy", url: "https://authy.com/" },
        { text: "Google Authenticator", url: "https://googleauthenticator.net/" }
      ]
    },
    {
      id: "social-3",
      title: "Secure Associated Email Accounts",
      description: "Protect linked email accounts",
      completed: false,
      level: "essential",
      details: "Ensure email accounts linked to social profiles have strong passwords and 2FA enabled.",
    },
    // Privacy Settings
    {
      id: "social-4",
      title: "Regular Privacy Settings Review",
      description: "Check and update privacy controls",
      completed: false,
      level: "essential",
      details: "Regularly review and update privacy settings to control who can see your information, posts, and personal details.",
    },
    {
      id: "social-5",
      title: "Mindful Information Sharing",
      description: "Treat all posts as permanent",
      completed: false,
      level: "essential",
      details: "Assume every post, comment, or upload can be viewed by anyone and may be archived indefinitely. Think before posting.",
    },
    {
      id: "social-6",
      title: "Limit Personal Information",
      description: "Restrict sensitive data sharing",
      completed: false,
      level: "essential",
      details: "Avoid sharing sensitive details like date of birth, home address, or contact numbers that could aid targeted attacks.",
    },
    // Content & Media
    {
      id: "social-7",
      title: "Careful Content Sharing",
      description: "Review before posting",
      completed: false,
      level: "essential",
      details: "Consider that photos, videos, and updates might reveal more than intended, including background details.",
    },
    {
      id: "social-8",
      title: "Media Metadata Removal",
      description: "Strip EXIF data before sharing",
      completed: false,
      level: "recommended",
      details: "Remove EXIF data from images and videos to prevent unwanted geolocation and device information leakage.",
    },
    {
      id: "social-9",
      title: "Image Protection Tools",
      description: "Use image obfuscation",
      completed: false,
      level: "optional",
      details: "Consider using tools like Fawkes to protect images from facial recognition while maintaining visual appeal.",
    },
    // App Permissions
    {
      id: "social-10",
      title: "Minimize App Permissions",
      description: "Grant only necessary access",
      completed: false,
      level: "essential",
      details: "Only grant minimum required permissions to apps, avoiding unnecessary access to contacts, location, or call logs.",
    },
    {
      id: "social-11",
      title: "Review Connected Apps",
      description: "Audit third-party access",
      completed: false,
      level: "recommended",
      details: "Regularly review and remove unnecessary or untrusted third-party app connections.",
    },
    {
      id: "social-12",
      title: "Limit Social Login Usage",
      description: "Avoid cross-platform linking",
      completed: false,
      level: "recommended",
      details: "Minimize use of 'Sign in with Social Media' options to prevent cross-account data linkage.",
    },
    // Location Security
    {
      id: "social-13",
      title: "Disable Real-Time Location",
      description: "Prevent location tracking",
      completed: false,
      level: "essential",
      details: "Turn off geo-tagging on posts to prevent real-time location tracking by malicious actors.",
    },
    {
      id: "social-14",
      title: "Delayed Location Sharing",
      description: "Post locations after leaving",
      completed: false,
      level: "recommended",
      details: "Share location details only after leaving a venue to reduce physical stalking risks.",
    },
    // Account Monitoring
    {
      id: "social-15",
      title: "Monitor Account Activity",
      description: "Check for suspicious access",
      completed: false,
      level: "recommended",
      details: "Regularly review account for unfamiliar logins or activity. Update security if anomalies are found.",
    },
    {
      id: "social-16",
      title: "Phishing Awareness",
      description: "Watch for suspicious messages",
      completed: false,
      level: "essential",
      details: "Stay alert to suspicious messages or friend requests that may attempt to steal personal information.",
    },
    {
      id: "social-17",
      title: "Use Privacy Tools",
      description: "Enhance browsing security",
      completed: false,
      level: "recommended",
      details: "Use secure browsers, VPNs, and privacy extensions when accessing social platforms.",
    },
    // Advanced Protection
    {
      id: "social-18",
      title: "Consider Pseudonyms",
      description: "Use alternate identities",
      completed: false,
      level: "optional",
      details: "Consider using pseudonyms and alternate contact details for enhanced privacy.",
    },
    {
      id: "social-19",
      title: "Digital Hygiene Updates",
      description: "Stay informed on security",
      completed: false,
      level: "optional",
      details: "Keep up with emerging threats and security tools to maintain strong protection.",
    }
  ],
  longDescription: "Comprehensive security measures for social media accounts covering account security, privacy settings, content sharing, permissions, location privacy, and advanced protection strategies."
};
