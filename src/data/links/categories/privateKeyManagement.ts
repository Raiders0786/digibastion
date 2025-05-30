
import { SecurityCategory } from "../types";

export const privateKeyManagement: SecurityCategory = {
  "name": "Private Key Management",
  "description": "Best practices, tools, and guides to securely manage and store private keys, seed phrases, and other critical credentials.",
  "tools": [
    {
      "title": "1Password",
      "url": "https://1password.com",
      "description": "A robust password manager that helps secure private keys and sensitive information.",
      "tags": ["password manager", "private key", "security"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "KeePass",
      "url": "https://keepass.info",
      "description": "An open-source password manager ideal for storing and managing private keys securely.",
      "tags": ["open-source", "password manager", "private key"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Paper Wallet Best Practices",
      "url": "https://bitcoin.org/en/developer-guide#paper-wallets",
      "description": "Guidelines for creating and securely storing paper wallets for offline private key storage.",
      "tags": ["paper wallet", "cold storage", "private key"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "GridPlus SafeCards",
      "url": "https://gridplus.io/lattice1",
      "description": "SafeCards are used with the GridPlus Lattice1 to securely backup and manage private keys without exposing seed phrases.",
      "tags": ["hardware wallet", "private key", "backup"],
      "lastReviewed": "2025-02-26",
      "active": true
    }
  ]
};
