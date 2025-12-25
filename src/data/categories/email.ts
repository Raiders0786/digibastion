
import { SecurityCategory } from "../../types/security";

export const emailData: SecurityCategory = {
  id: "email",
  title: "Email Security",
  description: "Secure your email communications for Web2 and Web3",
  icon: "mail",
  longDescription: "Email is a critical account for both traditional web users and Web3 participants. Properly securing your email is essential for protecting your digital identity, crypto accounts, and recovery options.",
  items: [
    {
      id: "email-22",
      title: "Explore Decentralized Email Solutions",
      description: "Consider blockchain-based alternatives for email.",
      completed: false,
      level: "recommended",
      details: "Decentralized email platforms like Mailchain offer enhanced privacy by removing centralized control and leveraging blockchain for secure, verifiable communications.",
      links: [
        { "text": "Mailchain", "url": "https://mailchain.com" }
      ]
    },
    {
      id: "email-1",
      title: "Use Multiple Email Addresses",
      description: "Separate critical communications from casual mail.",
      completed: false,
      level: "essential",
      details: "Maintain distinct email addresses for sensitive accounts and for newsletters or subscriptions to compartmentalize risk and simplify recovery if one account is compromised."
    },
    {
      id: "email-3",
      title: "Secure Your Email Account",
      description: "Protect your inbox with strong credentials.",
      completed: false,
      level: "essential",
      details: "Use long, unique passwords and enable two-factor authentication (2FA) to prevent unauthorized access, as your email is the gateway to many other accounts."
    },
    {
      id: "email-2",
      title: "Keep Your Primary Email Private",
      description: "Avoid public exposure of your main email address.",
      completed: false,
      level: "essential",
      details: "Do not share your primary email on public forums, websites, or social media to reduce phishing attempts and unwanted targeting."
    },
    {
      id: "email-4",
      title: "Disable Remote Content Loading",
      description: "Prevent automatic downloads in emails.",
      completed: false,
      level: "essential",
      details: "Turn off the automatic loading of remote content (images, stylesheets) to protect your IP address and prevent tracking."
    },
    {
      id: "email-8",
      title: "Switch to a Secure Email Provider",
      description: "Opt for privacy-focused email services.",
      completed: false,
      level: "recommended",
      details: "Consider providers that offer end-to-end encryption and robust privacy features such as ProtonMail, Tutanota, or Forward Email.",
      links: [
        { "text": "ProtonMail", "url": "https://protonmail.com" },
        { "text": "Tutanota", "url": "https://tutanota.com" },
        { "text": "Forward Email", "url": "https://forwardemail.net" }
      ]
    },
    {
      id: "email-7",
      title: "Don't Transmit Sensitive Data via Email",
      description: "Avoid sending confidential information unencrypted.",
      completed: false,
      level: "essential",
      details: "Since emails can be intercepted, use end-to-end encryption or secure messaging apps for sharing sensitive information."
    },
    {
      id: "email-6",
      title: "Avoid Third-Party App Access",
      description: "Limit external app permissions to your email.",
      completed: false,
      level: "recommended",
      details: "Refrain from granting full access to your inbox to third-party apps or plug-ins to minimize exposure of your sensitive data."
    },
    {
      id: "email-5",
      title: "Prefer Plaintext Emails",
      description: "Opt for plaintext for better privacy.",
      completed: false,
      level: "optional",
      details: "Plaintext emails reduce risks of tracking and remote code execution that are common with HTML emails.",
      links: [
        { "text": "UsePlaintext.email", "url": "https://useplaintext.email" }
      ]
    },
    {
      id: "email-10",
      title: "Leverage Email Aliasing",
      description: "Use unique aliases for different services.",
      completed: false,
      level: "recommended",
      details: "Generate unique aliases (or use anonymous forwarding) for each service you sign up for, so that any leak can be quickly identified and contained. Popular services include addy.io (unlimited aliases), SimpleLogin (open-source, Proton-owned), and Proton Mail's built-in aliases.",
      links: [
        { "text": "addy.io", "url": "https://addy.io" },
        { "text": "SimpleLogin", "url": "https://simplelogin.io" },
        { "text": "Proton Mail Aliases", "url": "https://proton.me/support/addresses-and-aliases" }
      ]
    },
    {
      id: "email-11",
      title: "Employ Email Subaddressing",
      description: "Use '+' tagging to manage incoming mail.",
      completed: false,
      level: "optional",
      details: "Subaddressing lets you append tags to your email (e.g., yourname+shopping@example.com) so you can track how your email is being used.",
      links: [
        { "text": "Subaddressing Info", "url": "https://en.wikipedia.org/wiki/Email_address#Subaddressing" }
      ]
    },
    {
      id: "email-9",
      title: "Utilize a USB Smart Key",
      description: "Store your encryption keys offline.",
      completed: false,
      level: "advanced",
      details: "Enhance OpenPGP security by using a USB smart key to sign or decrypt messages without exposing your private key.",
      links: [
        { "text": "YubiKey", "url": "https://www.yubico.com" }
      ]
    },
    {
      id: "email-12",
      title: "Adopt a Custom Domain",
      description: "Use your own domain for email addresses.",
      completed: false,
      level: "advanced",
      details: "Hosting your email on a custom domain gives you greater control, portability, and reduces reliance on major providers.",
      links: [
        { "text": "Forward Email", "url": "https://forwardemail.net" }
      ]
    },
    {
      id: "email-13",
      title: "Backup Your Emails Locally",
      description: "Sync your emails using a client for redundancy.",
      completed: false,
      level: "recommended",
      details: "Use email clients like Thunderbird to back up your messages via IMAP, ensuring you have access even during outages.",
      links: [
        { "text": "Thunderbird", "url": "https://www.thunderbird.net" }
      ]
    },
    {
      id: "email-14",
      title: "Be Cautious with Email Signatures",
      description: "Avoid including excessive personal data.",
      completed: false,
      level: "recommended",
      details: "Keep your email signatures minimal to prevent harvesting of your contact details and personal information."
    },
    {
      id: "email-15",
      title: "Use Auto-Replies Sparingly",
      description: "Limit automatic responses to protect information.",
      completed: false,
      level: "optional",
      details: "Configure auto-replies carefully to avoid divulging sensitive details that could be exploited by attackers."
    },
    {
      id: "email-16",
      title: "Select Secure Mail Protocols",
      description: "Avoid outdated and insecure email protocols.",
      completed: false,
      level: "advanced",
      details: "Ensure you are using secure protocols like IMAPv4, POPv3, and SMTP with TLS to protect your email data in transit.",
      links: [
        { "text": "TLS Overview", "url": "https://en.wikipedia.org/wiki/Transport_Layer_Security" }
      ]
    },
    {
      id: "email-17",
      title: "Avoid Self-Hosting Unless Expert",
      description: "Self-hosting email is risky without advanced skills.",
      completed: false,
      level: "advanced",
      details: "Unless you have strong networking expertise, it's safer to use a reputable secure email provider rather than managing your own mail server."
    },
    {
      id: "email-18",
      title: "Always Use TLS Ports",
      description: "Enforce encrypted connections for email.",
      completed: false,
      level: "advanced",
      details: "Make sure that POP3, IMAP, and SMTP are configured to use SSL/TLS, ensuring your emails are encrypted during transmission.",
      links: [
        { "text": "TLS Details", "url": "https://en.wikipedia.org/wiki/Transport_Layer_Security" }
      ]
    },
    {
      id: "email-19",
      title: "Ensure DNS Redundancy",
      description: "Maintain multiple MX records for reliability.",
      completed: false,
      level: "advanced",
      details: "If self-hosting your email, use at least two MX records to ensure continuous availability in case the primary fails."
    },
    {
      id: "email-20",
      title: "Mitigate DDoS and Brute Force Attacks",
      description: "Limit connections on your mail server.",
      completed: false,
      level: "advanced",
      details: "For self-hosted setups, restrict the number and rate of connections to reduce the risk of bot-driven attacks."
    },
    {
      id: "email-21",
      title: "Maintain an IP Blacklist",
      description: "Regularly update blacklists for your mail server.",
      completed: false,
      level: "advanced",
      details: "Keep an updated local IP blacklist and use real-time block lists to filter out malicious senders and spam URLs."
    }
  ],
};
