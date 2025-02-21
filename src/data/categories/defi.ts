
import { SecurityCategory } from "../../types/security";

export const defiData: SecurityCategory = {
  id: "defi",
  title: "DeFi Security",
  description: "Secure your DeFi interactions and investments",
  icon: "wallet-2",
  items: [
    {
      id: "defi-1",
      title: "Hardware Wallet Integration",
      description: "Secure high-value DeFi positions",
      completed: false,
      level: "essential",
      details: "Use hardware wallets for storing and managing large DeFi positions. Never keep significant amounts in hot wallets.",
      links: [
        { text: "Hardware Wallet Guide", url: "https://www.ledger.com/academy/security/the-safest-way-to-use-hardware-wallets" }
      ]
    },
    {
      id: "defi-2",
      title: "Smart Contract Audits",
      description: "Verify protocol security",
      completed: false,
      level: "essential",
      details: "Always verify smart contract audits before interacting with DeFi protocols. Check multiple audit reports and community feedback.",
    },
    {
      id: "defi-3",
      title: "Smart Contract Addresses Verification",
      description: "Verify contract transparency",
      completed: false,
      level: "essential",
      details: "Ensure all smart contract addresses are publicly available and verified on blockchain explorers for transparency.",
    },
    {
      id: "defi-4",
      title: "Team Identity Verification",
      description: "Verify team transparency",
      completed: false,
      level: "essential",
      details: "Verify the identity of the protocol team members and their track record in the space.",
    },
    {
      id: "defi-5",
      title: "Code Repository Review",
      description: "Check code transparency",
      completed: false,
      level: "essential",
      details: "Verify that the protocol has a public software repository with well-documented code and active maintenance.",
    },
    {
      id: "defi-6",
      title: "Contract Documentation Review",
      description: "Verify code documentation",
      completed: false,
      level: "essential",
      details: "Check for comprehensive documentation of deployed contracts and system architecture.",
    },
    {
      id: "defi-7",
      title: "Test Coverage Verification",
      description: "Verify testing robustness",
      completed: false,
      level: "essential",
      details: "Ensure the protocol has high test coverage and regular testing procedures in place.",
    },
    {
      id: "defi-8",
      title: "Administrative Controls Check",
      description: "Verify governance controls",
      completed: false,
      level: "essential",
      details: "Understand the protocol's upgradeability mechanisms and administrative control structure.",
    },
    {
      id: "defi-9",
      title: "Bug Bounty Program Check",
      description: "Verify security incentives",
      completed: false,
      level: "recommended",
      details: "Check if the protocol has an attractive bug bounty program to incentivize security researchers.",
    },
    {
      id: "defi-10",
      title: "Protocol Monitoring",
      description: "Check ongoing security",
      completed: false,
      level: "recommended",
      details: "Verify that the protocol has continuous monitoring systems in place for both backend and frontend.",
    },
    {
      id: "defi-11",
      title: "Admin Roles Verification",
      description: "Verify admin structure",
      completed: false,
      level: "essential",
      details: "Review the roles, capabilities, and identities of administrative addresses and multisig signers.",
    },
    {
      id: "defi-12",
      title: "Documentation Quality Check",
      description: "Verify documentation clarity",
      completed: false,
      level: "recommended",
      details: "Ensure protocol documentation is well-organized, clear, and maintains traceability between docs and implementation.",
    },
    {
      id: "defi-13",
      title: "Formal Verification Check",
      description: "Verify mathematical proofs",
      completed: false,
      level: "optional",
      details: "Check if the protocol has undergone formal verification of critical components.",
    },
    {
      id: "defi-14",
      title: "Developer Response Time",
      description: "Verify team responsiveness",
      completed: false,
      level: "recommended",
      details: "Assess the development team's responsiveness to security reports and community concerns.",
    }
  ],
  longDescription: "Comprehensive security measures for DeFi protocols including code transparency, documentation, testing, auditing, and administrative controls."
};
