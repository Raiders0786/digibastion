
import { SecurityCategory } from "../../types/security";

export const messagingData: SecurityCategory = {
  id: "messaging",
  title: "Messaging Security",
  description: "Secure communication practices for protecting your conversations",
  icon: "message-square",
  items: [
    {
      id: "communication-plan",
      title: "Agree on a Communication Plan",
      description: "In certain situations, it may be worth making a communication plan. This should include primary and backup methods of securely getting in hold with each other.",
      completed: false,
      level: "optional",
      details: "Create and maintain a secure communication plan with backup options",
      ignored: false
    },
    {
      id: "avoid-sms",
      title: "Avoid SMS",
      description: "SMS may be convenient, but it's not secure. It is susceptible to threats such as interception, sim swapping, manipulation, and malware.",
      completed: false,
      level: "optional",
      details: "Use more secure messaging alternatives instead of SMS",
      ignored: false
    },
    {
      id: "security-settings",
      title: "Check Security Settings",
      description: "Enable security settings, including contact verification, security notifications, and encryption. Disable optional non-security features such as read receipt, last online, and typing notification.",
      completed: false,
      level: "essential",
      details: "Review and configure all security-related settings in messaging apps",
      ignored: false
    },
    {
      id: "jurisdiction",
      title: "Consider Jurisdiction",
      description: "The jurisdictions where the organisation is based, and data is hosted should also be taken into account.",
      completed: false,
      level: "recommended",
      details: "Understand the legal implications of messaging service locations",
      ignored: false
    },
    {
      id: "decentralized-platform",
      title: "Consider a Decentralized Platform",
      description: "If all data flows through a central provider, you have to trust them with your data and meta-data. You cannot verify that the system running is authentic without back doors.",
      completed: false,
      level: "recommended",
      details: "Evaluate decentralized messaging platforms for enhanced privacy",
      ignored: false
    },
    {
      id: "safe-environment",
      title: "Create a Safe Environment for Communication",
      description: "There are several stages where your digital communications could be monitored or intercepted. This includes: your or your participants' device, your ISP, national gateway or government logging, the messaging provider, the servers.",
      completed: false,
      level: "essential",
      details: "Ensure secure communication environment across all stages",
      ignored: false
    },
    {
      id: "defang-urls",
      title: "Defang URLs",
      description: "Sending links via various services can unintentionally expose your personal information. This is because, when a thumbnail or preview is generated- it happens on the client-side.",
      completed: false,
      level: "optional",
      details: "Modify URLs to prevent automatic preview generation",
      ignored: false
    },
    {
      id: "disable-cloud",
      title: "Disable Cloud Services",
      description: "Some mobile messaging apps offer a web or desktop companion. This not only increases attack surface but it has been linked to several critical security issues, and should therefore be avoided, if possible.",
      completed: false,
      level: "essential",
      details: "Avoid using cloud-based messaging features when possible",
      ignored: false
    },
    {
      id: "ephemeral-messages",
      title: "Enable Ephemeral Messages",
      description: "Self-destructing messages is a feature that causes your messages to automatically delete after a set amount of time. This means that if your device is lost, stolen, or seized, an adversary will only have access to the most recent communications.",
      completed: false,
      level: "optional",
      details: "Use self-destructing messages when appropriate",
      ignored: false
    },
    {
      id: "forward-secrecy",
      title: "Ensure Forward Secrecy is Supported",
      description: "Opt for a platform that implements forward secrecy. This is where your app generates a new encryption key for every message.",
      completed: false,
      level: "recommended",
      details: "Use messaging platforms with forward secrecy support",
      ignored: false
    },
    {
      id: "recipient-security",
      title: "Ensure your Recipients Environment is Secure",
      description: "Your conversation can only be as secure as the weakest link. Often the easiest way to infiltrate a communications channel is to target the individual or node with the least protection.",
      completed: false,
      level: "essential",
      details: "Verify recipient security measures",
      ignored: false
    },
    {
      id: "end-to-end-encryption",
      title: "Only Use Fully End-to-End Encrypted Messengers",
      description: "End-to-end encryption is a system of communication where messages are encrypted on your device and not decrypted until they reach the intended recipient. This ensures that any actor who intercepts traffic cannot read the message contents, nor can anybody with access to the central servers where data is stored.",
      completed: false,
      level: "essential",
      details: "Use only messaging apps with end-to-end encryption",
      ignored: false
    }
  ],
  longDescription: "Secure messaging is crucial for protecting your private communications. This category covers best practices for choosing and using messaging apps securely."
};
