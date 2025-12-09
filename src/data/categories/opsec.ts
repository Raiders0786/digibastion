
import { SecurityCategory } from "../../types/security";

export const opsecData: SecurityCategory = {
  id: "opsec",
  title: "Operational Security (OpSec)",
  description: "Protect your digital footprint and operations",
  icon: "shield-alert",
  longDescription: "Web3 environments require specialized security approaches that balance blockchain transparency with privacy, address immutability risks, manage self-custody responsibilities, secure decentralized operations, mitigate smart contract vulnerabilities, and navigate community-driven security challenges.",
  items: [
    // Web3 Transparency vs Privacy
    {
      id: "opsec-1",
      title: "Map your on-chain footprint",
      description: "Understand what information is publicly visible on blockchain",
      completed: false,
      level: "essential",
      details: "Use block explorers and analysis tools to understand your on-chain footprint. Transaction amounts, addresses, contract interactions, and timestamps are all publicly visible. This awareness is the foundation of Web3 OpSec.",
      links: [
        { text: "SEAL OpSec Framework", url: "https://frameworks.securityalliance.org/opsec/core-concepts/web3-considerations" },
        { text: "Etherscan", url: "https://etherscan.io/" }
      ]
    },
    {
      id: "opsec-2",
      title: "Use address separation",
      description: "Use different addresses for different transaction types",
      completed: false,
      level: "essential",
      details: "Develop strategies to maintain operational privacy by using different addresses for different transaction types or business functions. This prevents linking your identity across activities and limits exposure if one address is compromised."
    },
    {
      id: "opsec-3",
      title: "Consider privacy-enhancing technologies",
      description: "Use ZK protocols and privacy-focused solutions",
      completed: false,
      level: "advanced",
      details: "Consider privacy-focused layer 2 solutions for sensitive operations. Use ZK (Zero-Knowledge) protocols for privacy-preserving computations, privacy pools (when legally permissible), or privacy-focused blockchains for specific operations.",
      links: [
        { text: "zkSync", url: "https://zksync.io/" },
        { text: "Aztec Network", url: "https://aztec.network/" }
      ]
    },
    // Immutability and Finality
    {
      id: "opsec-4",
      title: "Implement transaction verification",
      description: "Verify all transactions before execution",
      completed: false,
      level: "essential",
      details: "Implement robust verification procedures before executing transactions. Include mandatory multi-person review for transactions above defined thresholds, automated checks for anomalous patterns, and hash verification of destination addresses. Blockchain transactions are irreversible."
    },
    {
      id: "opsec-5",
      title: "Use multi-signature for high-value transactions",
      description: "Require multiple approvals for treasury operations",
      completed: false,
      level: "essential",
      details: "Use 3-of-5 or 2-of-3 signature schemes for treasury operations. Ensure hardware wallets for each signer with physical separation. Implement time-locks (24-48 hours) for large transfers.",
      links: [
        { text: "Safe (Gnosis)", url: "https://safe.global/" }
      ]
    },
    {
      id: "opsec-6",
      title: "Deploy transaction simulation tools",
      description: "Verify transaction outcomes before execution",
      completed: false,
      level: "recommended",
      details: "Use platforms like Tenderly to simulate transactions in a fork of the chain before execution. Verify gas estimates and test with small amounts first when interacting with new contracts.",
      links: [
        { text: "Tenderly", url: "https://tenderly.co/" }
      ]
    },
    // Self-Custody Responsibility
    {
      id: "opsec-7",
      title: "Establish clear wallet security procedures",
      description: "Document air-gapped setups and seed phrase backups",
      completed: false,
      level: "essential",
      details: "Develop clear procedures for wallet security including air-gapped hardware wallet setups for cold storage, specific seed phrase backup procedures (metal backups, split storage), and clear rules for when hot vs. cold wallets should be used."
    },
    {
      id: "opsec-8",
      title: "Implement separation of duties",
      description: "Different roles for transaction approval stages",
      completed: false,
      level: "recommended",
      details: "Implement separation of duties for transaction approval with different roles for transaction initiation, verification, and execution. Rotate responsibilities to prevent single points of compromise. Consider HSMs for institutional-grade key management."
    },
    {
      id: "opsec-9",
      title: "Define tiered wallet architecture",
      description: "Set thresholds for different security requirements",
      completed: false,
      level: "recommended",
      details: "Define thresholds for different security requirements (e.g., <$10K, $10K-$100K, >$100K). Implement tiered wallet architecture with hot wallets for operations and cold storage for reserves. Establish secure methods for replenishing hot wallets."
    },
    // Decentralized Operations
    {
      id: "opsec-10",
      title: "Establish remote team security protocols",
      description: "Device security and secure home network guidelines",
      completed: false,
      level: "recommended",
      details: "Establish clear security protocols for remote team members including device security requirements (disk encryption, endpoint protection, auto-updates), secure home network guidelines (dedicated VLANs, strong WPA3 passwords), and policies for public WiFi usage (always-on VPN)."
    },
    {
      id: "opsec-11",
      title: "Use end-to-end encrypted communications",
      description: "Secure channels for sensitive discussions",
      completed: false,
      level: "essential",
      details: "Use end-to-end encrypted messaging (Signal, Matrix/Element with verified devices) for sensitive discussions. Enable ephemeral messaging for highly sensitive topics. Use PGP-encrypted emails for sensitive communications that need to be preserved.",
      links: [
        { text: "Signal", url: "https://signal.org/" },
        { text: "Element", url: "https://element.io/" }
      ]
    },
    {
      id: "opsec-12",
      title: "Implement hardware security keys",
      description: "Use Yubikeys or Passkeys as primary 2FA",
      completed: false,
      level: "essential",
      details: "Use hardware security keys (Yubikeys, Passkeys) as primary 2FA method. Use TOTP apps as backup (not SMS). Implement passwordless authentication where possible (WebAuthn/FIDO2). Conduct regular access reviews.",
      links: [
        { text: "Yubico", url: "https://www.yubico.com/" }
      ]
    },
    // Smart Contract Vulnerabilities
    {
      id: "opsec-13",
      title: "Conduct thorough security audits",
      description: "Multiple independent audits for critical contracts",
      completed: false,
      level: "essential",
      details: "Conduct multiple independent security audits for critical contracts. Ensure comprehensive test coverage (>95%) for all contract functions. Use symbolic execution and static analysis tools like Slither and Mythril.",
      links: [
        { text: "Slither", url: "https://github.com/crytic/slither" },
        { text: "Mythril", url: "https://github.com/ConsenSys/mythril" }
      ]
    },
    {
      id: "opsec-14",
      title: "Implement upgradability patterns",
      description: "Use proxy patterns with governance mechanisms",
      completed: false,
      level: "advanced",
      details: "Implement upgradability patterns where appropriate including proxy patterns with clear governance mechanisms, immutable core logic with upgradeable periphery, and emergency pause functionality with decentralized controls."
    },
    {
      id: "opsec-15",
      title: "Use formal verification",
      description: "Mathematical proofs for critical contract functions",
      completed: false,
      level: "advanced",
      details: "Use formal verification where possible with mathematical proofs of contract correctness for critical functions. Verify business logic and security properties using property-based testing frameworks like Echidna and Scribble.",
      links: [
        { text: "Echidna", url: "https://github.com/crytic/echidna" }
      ]
    },
    {
      id: "opsec-16",
      title: "Deploy circuit breakers and timelocks",
      description: "Time-delayed administration and value limits",
      completed: false,
      level: "recommended",
      details: "Implement time-delayed administration actions (48-72 hours) for critical functions. Deploy value-limit circuit breakers for suspicious transaction volumes. Set up decentralized monitoring and alerting systems."
    },
    // Community Dynamics
    {
      id: "opsec-17",
      title: "Develop community security guidelines",
      description: "Security policies for open-source contributors",
      completed: false,
      level: "recommended",
      details: "Develop clear security guidelines for community contributors including documented security policies in repositories, security templates for pull requests, and required security reviews for changes to sensitive components."
    },
    {
      id: "opsec-18",
      title: "Establish code review processes",
      description: "Multi-level review and bug bounty programs",
      completed: false,
      level: "recommended",
      details: "Establish review processes for community-submitted code with multi-level review requirements based on code criticality, automated security scanning in CI/CD, and bounty programs for vulnerability identification."
    },
    {
      id: "opsec-19",
      title: "Balance transparency with security",
      description: "Clear guidelines on information sharing",
      completed: false,
      level: "recommended",
      details: "Balance transparency with operational security needs including clear guidelines on what information should remain private, secure channels for reporting vulnerabilities, responsible disclosure policies, and public security incident post-mortems with appropriate redactions.",
      links: [
        { text: "The Red Guild Campaign", url: "https://blog.theredguild.org/against-all-odds-security-awareness-campaign-at-devconnect/" }
      ]
    },
    // Travel OpSec - Before Travel
    {
      id: "opsec-20",
      title: "Pre-travel device preparation",
      description: "Minimize sensitive data and enable encryption",
      completed: false,
      level: "recommended",
      details: "Remove or securely store any data, devices, or documents not essential for the trip. Enable full-disk encryption on all devices, update OS and firmware before departure. Back up devices and record serial numbers.",
      links: [
        { text: "SEAL Travel OpSec", url: "https://frameworks.securityalliance.org/opsec/travel/tldr/" }
      ]
    },
    {
      id: "opsec-21",
      title: "Secure 2FA for travel",
      description: "Backup codes and disable SMS-based authentication",
      completed: false,
      level: "essential",
      details: "Print or securely store backup 2FA codes. Disable SMS-based 2FA if possible and use eSIM or secondary numbers for authentication. Use password manager travel modes to hide sensitive vaults while away."
    },
    {
      id: "opsec-22",
      title: "Hardware wallet travel security",
      description: "Never travel with written seed phrases",
      completed: false,
      level: "essential",
      details: "Update and test hardware wallets before travel. Never travel with written seed phrases. Carry hardware wallets and 2FA tokens on your person; keep spares securely at home. Use strong phone passcodes and disable biometrics in risky scenarios."
    },
    {
      id: "opsec-23",
      title: "Research border crossing laws",
      description: "Understand local encryption and tech regulations",
      completed: false,
      level: "optional",
      details: "Research local laws on encryption and tech at your destination. Carry travel letters or use sanitized devices if needed for border crossings. Prepare an emergency plan for device loss or compromise."
    },
    // Travel OpSec - During Travel
    {
      id: "opsec-24",
      title: "Secure network usage while traveling",
      description: "Use cellular data or personal hotspots over public WiFi",
      completed: false,
      level: "essential",
      details: "Prefer cellular data or personal hotspots over public Wi-Fi. Disable automatic Wi-Fi connections. Use a trusted VPN and consider a portable router. Turn off Wi-Fi, Bluetooth, AirDrop when not in use."
    },
    {
      id: "opsec-25",
      title: "Avoid public USB charging",
      description: "Use your own charger or USB data blocker",
      completed: false,
      level: "essential",
      details: "Avoid public USB charging stations ('juice jacking'). Use your own charger or a USB data blocker. Keep devices on you or locked at all times. Use privacy screens and be mindful of shoulder surfing."
    },
    {
      id: "opsec-26",
      title: "Delay social media location posts",
      description: "Post location updates 1-2 days after leaving",
      completed: false,
      level: "recommended",
      details: "Be cognizant of what you are posting on social media in real time. Delay posting a location by 1-2 days to avoid anyone tracking your movements. Don't discuss sensitive information publicly."
    },
    // Travel OpSec - Post-Travel
    {
      id: "opsec-27",
      title: "Post-travel security review",
      description: "Change passwords and scan devices after returning",
      completed: false,
      level: "recommended",
      details: "Change passwords and verify 2FA on accounts accessed during travel. Scan devices for malware and unusual behavior. Inspect hardware wallets for tampering. Remove travel-specific SIMs and apps no longer needed."
    },
    // Core Security Fundamentals
    {
      id: "opsec-28",
      title: "Implement layered protection",
      description: "Multiple overlapping security controls",
      completed: false,
      level: "essential",
      details: "Implement multiple defensive mechanisms at each layer of your technology stack. Network layer (firewalls, segmentation), host layer (endpoint protection, secure configuration), application layer (input validation), and data layer (encryption, access controls)."
    },
    {
      id: "opsec-29",
      title: "Apply minimal access scopes",
      description: "Grant only necessary permissions",
      completed: false,
      level: "essential",
      details: "Implement a structured permission model that starts with zero access. Require explicit permission grants with documented justification. Use just-in-time access for administrative functions and automatic session termination after inactivity."
    },
    {
      id: "opsec-30",
      title: "Maintain system isolation",
      description: "Segment systems into isolated security zones",
      completed: false,
      level: "recommended",
      details: "Implement network segmentation based on security requirements. Create security zones with consistent trust levels. Maintain distinct development, testing, staging, and production environments with one-way data flows."
    },
    {
      id: "opsec-31",
      title: "Enable continuous visibility",
      description: "Active monitoring and security testing",
      completed: false,
      level: "recommended",
      details: "Implement multi-layered monitoring (system, security, compliance). Conduct vulnerability scanning weekly, penetration testing quarterly, and red team exercises annually. Create feedback loops from incidents to security controls."
    },
    // High-Risk Traveler Extras
    {
      id: "opsec-32",
      title: "Use burner devices for high-risk travel",
      description: "Minimal data devices that can be wiped post-trip",
      completed: false,
      level: "advanced",
      details: "Use burner or loaner devices with minimal data for high-risk travel. Assume they may be compromised and plan to wipe them post-trip. Power down and encrypt devices before border crossings."
    },
    {
      id: "opsec-33",
      title: "Enable Lockdown Mode",
      description: "Maximum security for high-risk situations",
      completed: false,
      level: "advanced",
      details: "Enable Lockdown Mode on Apple devices and use end-to-end encrypted messaging apps. Use Faraday bags and tamper-evident seals. Physically inspect devices before and after travel for signs of tampering.",
      links: [
        { text: "Apple Lockdown Mode", url: "https://support.apple.com/en-us/HT212650" }
      ]
    },
    {
      id: "opsec-34",
      title: "Increase multisig requirements while traveling",
      description: "Geographically split key custody during travel",
      completed: false,
      level: "advanced",
      details: "Increase multisig signer requirements while traveling. Geographically split key custody to prevent compromise. Use duress codes if supported by hardware wallets. Establish secure emergency check-ins with your team."
    }
  ]
};
