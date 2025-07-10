
import { SecurityCategory } from "../../types/security";

export const mobileData: SecurityCategory = {
  id: "mobile",
  title: "Mobile Security",
  description: "Essential security measures for mobile devices in the Web3 era",
  icon: "smartphone",
  longDescription: "Mobile devices are often the primary gateway to Web3 applications and crypto wallets. Securing them is critical for protecting your digital assets and personal information in the decentralized ecosystem.",
  items: [
    // Web3-specific items (prioritized)
    {
      id: "mob-24",
      title: "Use a Secure Mobile dApp Wallet & Browser",
      description: "Access decentralized apps safely on mobile.",
      completed: false,
      level: "recommended",
      details: "For Web3 interactions, use a mobile dApp browser with integrated crypto wallet support (e.g., MetaMask Mobile or Status) to securely isolate blockchain transactions from your everyday activities.",
      links: [
        { "text": "MetaMask Mobile", "url": "https://metamask.io/download/" },
        { "text": "Status", "url": "https://status.im" }
      ]
    },
    
    // Essential security items
    {
      id: "mob-1",
      title: "Encrypt Your Device",
      description: "Enable full-disk encryption to secure your data.",
      completed: false,
      level: "essential",
      details: "Activate device encryption (e.g., FileVault on iOS, Android encryption) to ensure that your data remains protected if your phone is lost or stolen."
    },
    {
      id: "mob-2",
      title: "Turn Off Unused Connectivity Features",
      description: "Disable Wi-Fi, Bluetooth, NFC, etc., when not in use.",
      completed: false,
      level: "essential",
      details: "Switch off connectivity features to reduce exposure to unauthorized connections and potential attacks."
    },
    {
      id: "mob-3",
      title: "Keep App Count to a Minimum",
      description: "Remove unused applications from your device.",
      completed: false,
      level: "essential",
      details: "Uninstall apps you don't use regularly to minimize background data collection and reduce security risks."
    },
    {
      id: "mob-4",
      title: "Manage App Permissions",
      description: "Review and limit what data apps can access.",
      completed: false,
      level: "essential",
      details: "Only grant permissions that are necessary. For Android, consider using temporary permissions with apps like Bouncer.",
      links: [
        { "text": "Bouncer", "url": "https://play.google.com/store/apps/details?id=com.samruston.permissionreminder" }
      ]
    },
    {
      id: "mob-5",
      title: "Install Apps Only from Official Sources",
      description: "Use trusted app stores for downloads.",
      completed: false,
      level: "essential",
      details: "Download apps exclusively from the Apple App Store or Google Play Store to avoid malicious software."
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
      id: "mob-7",
      title: "Set Up a Mobile Carrier PIN",
      description: "Secure your SIM with a carrier PIN.",
      completed: false,
      level: "essential",
      details: "Configure a PIN with your mobile provider to protect against SIM hijacking and unauthorized number transfers."
    },
    
    // Optional security items
    {
      id: "mob-6",
      title: "Be Cautious with Public Charging",
      description: "Avoid 'juice jacking' risks at public charging stations.",
      completed: false,
      level: "optional",
      details: "Use your own charger or a power bank to minimize the risk of malware being installed via compromised USB ports."
    },
    {
      id: "mob-8",
      title: "Opt-out of Caller ID Listings",
      description: "Keep your phone number more private.",
      completed: false,
      level: "optional",
      details: "Unlist your number from caller ID apps to reduce exposure of your personal contact information."
    },
    {
      id: "mob-9",
      title: "Use Offline Maps",
      description: "Leverage offline navigation to limit location data leakage.",
      completed: false,
      level: "optional",
      details: "Consider using offline maps apps like OsmAnd or Organic Maps to navigate without sending constant location updates.",
      links: [
        { "text": "OsmAnd", "url": "https://osmand.net" }
      ]
    },
    {
      id: "mob-10",
      title: "Opt-out of Personalized Ads",
      description: "Reduce targeted advertising and data collection.",
      completed: false,
      level: "optional",
      details: "Disable personalized ads in your device settings to limit the amount of data advertisers can collect."
    },
    {
      id: "mob-11",
      title: "Enable Data Erasure After Multiple Failed Logins",
      description: "Automatically wipe your device after too many failed attempts.",
      completed: false,
      level: "optional",
      details: "Set your phone to erase data after a predefined number of incorrect login attempts to prevent brute-force attacks."
    },
    {
      id: "mob-12",
      title: "Monitor App Trackers",
      description: "Identify and review trackers in your apps.",
      completed: false,
      level: "optional",
      details: "Use services like Exodus Privacy to analyze installed apps and see which trackers are embedded.",
      links: [
        { "text": "Exodus Privacy", "url": "https://exodus-privacy.eu.org" }
      ]
    },
    {
      id: "mob-13",
      title: "Use a Mobile Firewall",
      description: "Monitor and block unwanted app traffic.",
      completed: false,
      level: "optional",
      details: "Install a firewall app to control which apps can send or receive data, helping to protect your privacy."
    },
    {
      id: "mob-14",
      title: "Reduce Background Activity",
      description: "Limit apps running in the background.",
      completed: false,
      level: "optional",
      details: "On Android, use tools like SuperFreeze to suspend background processes and conserve resources.",
      links: [
        { "text": "SuperFreeze", "url": "https://play.google.com/store/apps/details?id=com.brokenbones.superfreeze" }
      ]
    },
    {
      id: "mob-15",
      title: "Sandbox Mobile Apps",
      description: "Isolate apps to protect your data.",
      completed: false,
      level: "optional",
      details: "Utilize sandboxing solutions like Island to create isolated environments for apps, reducing their access to sensitive information.",
      links: [
        { "text": "Shelter", "url": "https://gitea.angry.im/PeterCxy/Shelter" }
      ]
    },
    {
      id: "mob-17",
      title: "Avoid Custom Virtual Keyboards",
      description: "Stick with the device's stock keyboard.",
      completed: false,
      level: "optional",
      details: "Use your built-in keyboard to avoid third-party apps that may log your keystrokes or collect sensitive data."
    },
    {
      id: "mob-18",
      title: "Restart Your Device Regularly",
      description: "Clear caches and temporary data with periodic reboots.",
      completed: false,
      level: "optional",
      details: "Restart your phone at least once a week to clear cached app states and maintain smoother performance."
    },
    {
      id: "mob-19",
      title: "Avoid SMS for Sensitive Communications",
      description: "Use encrypted messaging instead of SMS.",
      completed: false,
      level: "optional",
      details: "Replace SMS with secure messaging apps like Signal for receiving 2FA codes and personal communications.",
      links: [
        { "text": "Signal", "url": "https://signal.org" }
      ]
    },
    {
      id: "mob-20",
      title: "Keep Your Number Private",
      description: "Utilize virtual numbers to protect your identity.",
      completed: false,
      level: "optional",
      details: "Use apps like MySudo to generate and manage virtual phone numbers, compartmentalizing your contact information.",
      links: [
        { "text": "MySudo", "url": "https://www.mysudo.com" }
      ]
    },
    {
      id: "mob-21",
      title: "Watch Out for Stalkerware",
      description: "Detect and remove spyware installed by others.",
      completed: false,
      level: "optional",
      details: "Be vigilant for stalkerware and, if suspected, perform a factory reset to remove any unauthorized monitoring apps."
    },
    {
      id: "mob-22",
      title: "Favor the Browser Over Dedicated Apps",
      description: "Use secure browsers to access services.",
      completed: false,
      level: "optional",
      details: "Where possible, access websites via a secure mobile browser rather than installing dedicated apps, which can collect more data."
    },
    {
      id: "mobile-6",
      title: "Security app installation",
      description: "Install mobile security/antivirus app",
      completed: false,
      level: "optional",
      details: "Consider installing a reputable mobile security app for additional protection against malware and phishing attempts."
    },
    
    // Advanced security items
    {
      id: "mob-16",
      title: "Route Mobile Traffic via Tor",
      description: "Use Tor to anonymize your mobile network traffic.",
      completed: false,
      level: "advanced",
      details: "Deploy Orbot to set up a system-wide Tor connection on your device, protecting you from surveillance and insecure public Wi-Fi.",
      links: [
        { "text": "Orbot", "url": "https://www.torproject.org/download/" }
      ]
    },
    {
      id: "mob-23",
      title: "Consider a Custom ROM (Android)",
      description: "Switch to a privacy-focused OS for better control.",
      completed: false,
      level: "advanced",
      details: "For Android users concerned about data collection, consider installing a custom ROM like GrapheneOS to enhance privacy.",
      links: [
        { "text": "GrapheneOS", "url": "https://grapheneos.org" }
      ]
    }
  ],
};
