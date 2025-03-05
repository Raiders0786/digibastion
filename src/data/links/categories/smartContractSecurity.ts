
import { SecurityCategory } from "../types";

export const smartContractSecurity: SecurityCategory = {
  "name": "Smart Contract Security",
  "description": "Tools, frameworks, and best practices for analyzing and securing smart contracts.",
  "tools": [
    {
      "title": "Slither",
      "url": "https://github.com/crytic/slither",
      "description": "A static analysis framework for Solidity that detects vulnerabilities and code smells.",
      "tags": ["solidity", "smart contract", "static analysis"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Mythril",
      "url": "https://github.com/ConsenSys/mythril",
      "description": "A security analysis tool for Ethereum smart contracts that detects vulnerabilities.",
      "tags": ["ethereum", "smart contract", "analysis"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Oyente",
      "url": "https://github.com/enzymefinance/oyente",
      "description": "One of the earliest smart contract analyzers to detect potential security issues in Solidity code.",
      "tags": ["solidity", "smart contract", "analysis"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Securify",
      "url": "https://securify.chainsecurity.com",
      "description": "An automated security scanner for smart contracts developed by ChainSecurity.",
      "tags": ["smart contract", "security", "automated"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Certora Prover",
      "url": "https://www.certora.com",
      "description": "A formal verification platform for smart contracts ensuring high assurance of security.",
      "tags": ["formal verification", "smart contract", "security"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Echidna Fuzzer",
      "url": "https://github.com/crytic/echidna",
      "description": "A property-based fuzzer for Ethereum smart contracts to detect edge-case vulnerabilities.",
      "tags": ["fuzzing", "smart contract", "ethereum"],
      "lastReviewed": "2025-02-26",
      "active": true
    }
  ]
};
