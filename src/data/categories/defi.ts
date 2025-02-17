
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
      title: "Risk Management",
      description: "Implement proper risk strategies",
      completed: false,
      level: "recommended",
      details: "Set up proper risk management including position sizes, stop-losses, and diversification across different protocols.",
    },
    {
      id: "defi-4",
      title: "Protocol Research",
      description: "Due diligence on DeFi platforms",
      completed: false,
      level: "essential",
      details: "Research protocols thoroughly, including team background, TVL history, and security measures.",
    },
    {
      id: "defi-5",
      title: "Emergency Procedures",
      description: "Plan for security incidents",
      completed: false,
      level: "recommended",
      details: "Have clear procedures for emergency situations like exploits or compromised wallets.",
    }
  ],
  longDescription: "Secure your DeFi investments and interactions through proper security measures and risk management strategies."
};
