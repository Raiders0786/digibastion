import { SecurityCategory } from "../../types/security";

export const authenticationData: SecurityCategory = {
  id: "authentication",
  title: "Authentication",
  description: "Secure your accounts with strong authentication methods",
  icon: "key",
  longDescription: "Authentication is your first line of defense. Implementing strong authentication methods can prevent unauthorized access to your accounts and protect your digital identity.",
  items: [
    {
      id: "auth-1",
      title: "Use a Strong Password",
      description: "Generate long and complex passwords.",
      completed: false,
      level: "essential",
      details: "Create passwords with at least 12 characters, mixing letters, numbers, and symbols. Avoid common words to prevent brute-force and dictionary attacks.",
      links: [
        { text: "HowSecureIsMyPassword", url: "https://howsecureismypassword.net/" }
      ]
    },
    {
      id: "auth-2",
      title: "Don't Reuse Passwords",
      description: "Keep passwords unique across accounts.",
      completed: false,
      level: "essential",
      details: "Avoid using the same password for multiple sites. Unique passwords reduce the risk of compromise through credential stuffing."
    },
    {
      id: "auth-3",
      title: "Use a Secure Password Manager",
      description: "Store and generate passwords securely.",
      completed: false,
      level: "essential",
      details: "Implement a dedicated password manager to generate, store, and autofill strong, unique passwords. This minimizes manual tracking and reduces risk.",
      links: [
        { text: "Bitwarden", url: "https://bitwarden.com" },
        { text: "1Password", url: "https://1password.com" }
      ]
    },
    {
      id: "auth-4",
      title: "Avoid Sharing Passwords",
      description: "Keep your credentials to yourself.",
      completed: false,
      level: "essential",
      details: "Sharing passwords increases exposure. If sharing is necessary, use secure, built-in sharing features from your password manager."
    },
    {
      id: "auth-5",
      title: "Enable Two-Factor Authentication",
      description: "Secure logins with an extra verification step.",
      completed: false,
      level: "essential",
      details: "Activate 2FA using authenticator apps or hardware tokens to ensure that a stolen password alone won't grant account access.",
      links: [
        { text: "Time-Based OTP", url: "https://en.wikipedia.org/wiki/Time-based_One-time_Password" }
      ]
    },
    {
      id: "auth-6",
      title: "Keep Backup Codes Safe",
      description: "Secure your 2FA recovery codes separately.",
      completed: false,
      level: "essential",
      details: "Store backup codes offline or in an encrypted file to ensure they remain accessible if your primary 2FA method is lost."
    },
    {
      id: "auth-22",
      title: "Adopt Wallet-Based Authentication",
      description: "Leverage cryptographic wallet signatures for login.",
      completed: false,
      level: "essential",
      details: "Integrate wallet-based authentication using solutions like Privy or Fractal for a decentralized, password-less login. This method uses cryptographic signatures from your crypto wallet for secure identity verification.",
      links: [
        { text: "Privy", url: "https://www.privy.io/" },
        { text: "Fractal ID", url: "https://web.fractal.id/" }
      ]
    },
    {
      id: "auth-7",
      title: "Sign Up for Breach Alerts",
      description: "Monitor your emails for potential data breaches.",
      completed: false,
      level: "recommended",
      details: "Register with breach alert services to receive notifications if your email appears in new data leaks.",
      links: [
        { text: "Have I Been Pwned", url: "https://haveibeenpwned.com" }
      ]
    },
    {
      id: "auth-8",
      title: "Shield Your Password/PIN",
      description: "Conceal your credentials during entry.",
      completed: false,
      level: "recommended",
      details: "When entering sensitive information in public, cover your input to prevent shoulder surfing or visual capture."
    },
    {
      id: "auth-9",
      title: "Update Critical Passwords Periodically",
      description: "Refresh important passwords annually.",
      completed: false,
      level: "recommended",
      details: "Regularly update passwords for security-critical accounts to reduce risks from older breaches, but avoid overly frequent changes."
    },
    {
      id: "auth-10",
      title: "Don't Save Passwords in Browsers",
      description: "Avoid browser-based password storage.",
      completed: false,
      level: "recommended",
      details: "Rely on a dedicated password manager instead of using the browser's built-in password saving feature, which may lack proper encryption."
    },
    {
      id: "auth-11",
      title: "Avoid Logging In on Untrusted Devices",
      description: "Limit access on public or shared devices.",
      completed: false,
      level: "recommended",
      details: "Refrain from accessing critical accounts on devices that may be compromised by malware or keyloggers. Use private/incognito sessions if necessary."
    },
    {
      id: "auth-12",
      title: "Avoid Password Hints",
      description: "Do not use easily guessable hints.",
      completed: false,
      level: "recommended",
      details: "Password hints can reveal clues about your password. If hints are mandatory, use random or obfuscated responses."
    },
    {
      id: "auth-13",
      title: "Never Answer Security Questions Truthfully",
      description: "Provide fictitious answers to security questions.",
      completed: false,
      level: "optional",
      details: "Use fabricated answers for security questions to thwart social engineering and prevent attackers from easily retrieving your personal data."
    },
    {
      id: "auth-14",
      title: "Avoid 4-Digit PINs",
      description: "Use longer passcodes for better security.",
      completed: false,
      level: "optional",
      details: "A 4-digit PIN is easy to crack. Opt for a longer numeric or alphanumeric passcode to strengthen device and account security."
    },
    {
      id: "auth-15",
      title: "Avoid Using SMS for 2FA",
      description: "Prefer app-based or hardware 2FA methods.",
      completed: false,
      level: "optional",
      details: "SMS-based 2FA is vulnerable to SIM swapping and interception. Use authenticator apps or hardware tokens for better protection."
    },
    {
      id: "auth-16",
      title: "Separate OTP Generation from Password Manager",
      description: "Use a dedicated app for generating OTPs.",
      completed: false,
      level: "advanced",
      details: "Avoid relying on your password manager for both password storage and OTP generation to prevent a single point of failure."
    },
    {
      id: "auth-17",
      title: "Avoid Face Unlock",
      description: "Reconsider using facial recognition for authentication.",
      completed: false,
      level: "advanced",
      details: "Facial recognition can be spoofed with photos or videos. Prefer more secure methods like 2FA and complex passwords."
    },
    {
      id: "auth-18",
      title: "Watch Out for Keyloggers",
      description: "Inspect your devices for keylogging threats.",
      completed: false,
      level: "advanced",
      details: "Regularly check for hardware keyloggers and consider using virtual keyboards or autofill functions to minimize the risk of credential capture."
    },
    {
      id: "auth-19",
      title: "Consider a Hardware Security Token",
      description: "Add a physical layer to your 2FA strategy.",
      completed: false,
      level: "advanced",
      details: "Use U2F/FIDO2 security keys for direct, hardware-based authentication, ensuring secure and tamper-proof logins.",
      links: [
        { text: "SoloKey", url: "https://solokey.io" },
        { text: "NitroKey", url: "https://www.nitrokey.com" }
      ]
    },
    {
      id: "auth-20",
      title: "Consider an Offline Password Manager",
      description: "Manage your passwords offline for extra security.",
      completed: false,
      level: "advanced",
      details: "Offline password managers like KeePass keep your data on your local device, reducing exposure to online attacks.",
      links: [
        { text: "KeePass", url: "https://keepass.info" }
      ]
    },
    {
      id: "auth-21",
      title: "Consider Unique Usernames",
      description: "Use distinct identifiers for each service.",
      completed: false,
      level: "advanced",
      details: "Employ unique usernames or email aliases to prevent cross-account tracking and enhance overall security.",
      links: [
        { text: "Mail Alias Providers", url: "https://www.mail-utilities.com/" }
      ]
    }
  ],
};
