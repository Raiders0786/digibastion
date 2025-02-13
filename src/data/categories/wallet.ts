
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
      details: "Use a hardware wallet like Ledger or Trezor to store significant amounts of cryptocurrency. Hardware wallets provide the highest level of security by keeping your private keys offline.",
      links: [
        { text: "Ledger", url: "https://www.ledger.com/" },
        { text: "Trezor", url: "https://trezor.io/" }
      ]
    },
    {
      id: "wallet-2",
      title: "Backup seed phrase",
      description: "Securely store your seed phrase offline",
      completed: false,
      level: "essential",
      details: "Store your seed phrase offline in a secure location. Consider using a metal backup solution to protect against fire and water damage. Never store your seed phrase digitally or take photos of it."
    },
    {
      id: "wallet-3",
      title: "Use multiple wallets",
      description: "Separate hot and cold storage wallets",
      completed: false,
      level: "recommended",
      details: "Keep most of your funds in cold storage (hardware wallet) and only small amounts for daily transactions in hot wallets (software/mobile). This limits potential losses if your hot wallet is compromised."
    },
    {
      id: "wallet-4",
      title: "Enable transaction signing",
      description: "Require password/biometrics for transactions",
      completed: false,
      level: "essential",
      details: "Enable additional security measures like password or biometric authentication for all transactions to prevent unauthorized transfers."
    },
    {
      id: "wallet-5",
      title: "Regular security audit",
      description: "Periodically review wallet security settings",
      completed: false,
      level: "recommended",
      details: "Regularly check your wallet's security settings, connected apps, and permissions. Remove any unused connections and update your wallet software."
    },
    {
      id: "wallet-6",
      title: "Test recovery process",
      description: "Practice wallet recovery with small amounts",
      completed: false,
      level: "optional",
      details: "Periodically practice recovering your wallet with a small amount to ensure you can restore access if needed. This helps verify your backup process works correctly."
    },
    {
      id: "wallet-7",
      title: "Use watch-only wallets",
      description: "Monitor holdings without exposing private keys",
      completed: false,
      level: "optional",
      details: "Set up watch-only wallets to monitor your holdings without risking your private keys. This is especially useful for checking balances without accessing your cold storage."
    }
  ],
};
