
import { SecurityCategory } from "../../types/security";

export const defiData: SecurityCategory = {
  id: "defi",
  title: "DeFi Security",
  description: "Secure your DeFi interactions and investments",
  icon: "wallet-2",
  items: [
    {
      id: "defi-1",
      title: "Use Hardware Wallets for Large Holdings",
      description: "Secure high-value DeFi positions with cold storage",
      completed: false,
      level: "essential",
      details: "Keep the majority of your funds in hardware wallets and only move what's needed for active trading or yield farming to hot wallets.",
      links: [
        { text: "Hardware Wallet Guide", url: "https://www.ledger.com/academy/hardwarewallet/best-practices-when-using-a-hardware-wallet" }
      ]
    },
    {
      id: "defi-2",
      title: "Smart Contract Audits Verification",
      description: "Verify protocol security audits before investing",
      completed: false,
      level: "essential",
      details: "Always check if the DeFi protocol has been audited by reputable firms and review their audit reports before depositing funds.",
      links: [
        { text: "DeFi Audit Database", url: "https://consensys.io/diligence/audits" }
      ]
    },
    {
      id: "defi-3",
      title: "Use DeFi Security Tools",
      description: "Implement additional security tools for DeFi",
      completed: false,
      level: "recommended",
      details: "Utilize tools like Tenderly, DeFi Saver, or similar platforms to monitor and protect your DeFi positions.",
      links: [
        { text: "Security Tools Guide", url: "https://defisafety.com/" }
      ]
    },
    {
      id: "defi-4",
      title: "Implement Risk Management",
      description: "Set up proper risk management strategies",
      completed: false,
      level: "recommended",
      details: "Diversify holdings across different protocols, set stop-losses, and never invest more than you can afford to lose.",
    },
    {
      id: "defi-5",
      title: "Monitor Protocol TVL and Statistics",
      description: "Keep track of protocol health metrics",
      completed: false,
      level: "optional",
      details: "Regularly check protocol TVL, user statistics, and other key metrics to assess platform health and security.",
      links: [
        { text: "DeFi Stats", url: "https://defillama.com/" }
      ]
    }
  ],
  longDescription: "Secure your DeFi investments and interactions through proper security measures and risk management strategies."
};
