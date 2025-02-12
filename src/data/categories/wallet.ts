import { SecurityCategory } from "../../types/security";

export const walletData: SecurityCategory = {
  id: "wallet",
  title: "Crypto Wallet Security",
  description: "Secure your cryptocurrency assets",
  icon: "wallet",
  items: [
    {
      id: "wallet-1",
      title: "Use hardware wallet",
      description: "Store significant amounts in a hardware wallet",
      completed: false,
      level: "essential",
      details: "Use a hardware wallet to store significant amounts of cryptocurrency for added security."
    },
    {
      id: "wallet-2",
      title: "Backup seed phrase",
      description: "Securely store your seed phrase offline",
      completed: false,
      level: "essential",
      details: "Store your seed phrase offline in a secure location to prevent unauthorized access."
    },
    {
      id: "wallet-3",
      title: "Enable transaction signing",
      description: "Require password/biometrics for transactions",
      completed: false,
      level: "essential",
      details: "Require a password or biometric authentication for all transactions to prevent unauthorized access."
    },
    {
      id: "wallet-4",
      title: "Use multiple wallets",
      description: "Separate hot and cold storage wallets",
      completed: false,
      level: "essential",
      details: "Separate hot and cold storage wallets to prevent unauthorized access to your cryptocurrency."
    }
  ],
};
