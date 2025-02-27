export interface SecurityTool {
  title: string;
  url: string;
  description: string;
  tags: string[];
  lastReviewed: string;
  active: boolean;
}

export interface SecurityCategory {
  name: string;
  description: string;
  tools: SecurityTool[];
}

export interface SecurityResourcesData {
  metadataVersion: string;
  lastUpdated: string;
  categories: SecurityCategory[];
}

export const securityResources: SecurityResourcesData = {
  metadataVersion: "1.2",
  lastUpdated: "2025-02-26",
  categories: [
    {
      "name": "Application Security",
      "description": "Resources and tools to secure code, third-party dependencies, continuous integration pipelines, and language-specific vulnerabilities.",
      "tools": [
        {
          "title": "GitHub Security & Analysis Settings",
          "url": "https://github.com/settings/security",
          "description": "Enable all optional security and analysis settings on your repositories for better vulnerability detection.",
          "tags": ["github", "CI/CD", "security settings"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Super-Linter",
          "url": "https://github.com/github/super-linter",
          "description": "An all-in-one linter for GitHub Actions to enforce coding standards and detect vulnerabilities.",
          "tags": ["linter", "CI/CD", "code quality"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Semgrep",
          "url": "https://semgrep.dev",
          "description": "A static analysis tool that finds bugs and enforces code standards with customizable rules.",
          "tags": ["static analysis", "code scanning", "security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "CodeQL",
          "url": "https://codeql.github.com",
          "description": "An advanced code analysis engine that lets you query code as data to detect security issues.",
          "tags": ["code analysis", "security", "query"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Data Theorem Web/Mobile Secure",
          "url": "https://www.datatheorem.com",
          "description": "Tools for scanning web and mobile applications to identify vulnerabilities.",
          "tags": ["web security", "mobile security", "vulnerability scanning"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Language-Specific Scanners & Linters",
          "url": "https://github.com/tldrsec/awesome-secure-defaults",
          "description": "A curated list of secure defaults and language-specific tools such as ASAN, scan-build, cppcheck for C++, SonarSource, phpstan, psalm for PHP, Bandit and pip-audit for Python, Brakeman for Ruby, slither for Solidity, and more.",
          "tags": ["language security", "linters", "scanners"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Testing Handbook by Trail of Bits",
          "url": "https://github.com/trailofbits",
          "description": "Guidance on secure coding practices and security testing strategies.",
          "tags": ["testing", "secure coding", "guidelines"],
          "lastReviewed": "2025-02-26",
          "active": true
        }
      ]
    },
    {
      "name": "Cloud Security",
      "description": "Guidance and tools for securing cloud infrastructures and services across AWS, GCP, Azure and more.",
      "tools": [
        {
          "title": "Prowler",
          "url": "https://github.com/prowler-cloud/prowler",
          "description": "A comprehensive security tool to audit AWS environments against best practices.",
          "tags": ["aws", "cloud security", "audit"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Steampipe",
          "url": "https://steampipe.io",
          "description": "An open-source tool that allows you to query cloud infrastructure using SQL.",
          "tags": ["cloud", "query", "infrastructure"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Cloudsplaining",
          "url": "https://github.com/salesforce/cloudsplaining",
          "description": "A tool for auditing AWS IAM policies to detect over-privileged roles and risky configurations.",
          "tags": ["aws", "IAM", "audit"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "GCP Scanner",
          "url": "https://github.com/toniblyx/gcp_scanner",
          "description": "A security tool to analyze and secure Google Cloud Platform configurations.",
          "tags": ["gcp", "cloud security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Heroku & Fly.io",
          "url": "https://www.heroku.com, https://fly.io",
          "description": "Managed cloud platforms that abstract away infrastructure security challenges.",
          "tags": ["managed services", "cloud security"],
          "lastReviewed": "2025-02-26",
          "active": true
        }
      ]
    },
    {
      "name": "Personal Security",
      "description": "Tools and guides for protecting personal devices, online accounts, and mitigating risks associated with day-to-day digital activities.",
      "tools": [
        {
          "title": "Google Advanced Protection Program",
          "url": "https://landing.google.com/advancedprotection/",
          "description": "Enhances your Google account security with stricter 2FA and recovery options.",
          "tags": ["google", "2FA", "personal security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Apple ID 2FA & Find My iPhone",
          "url": "https://support.apple.com/en-us/HT204915",
          "description": "Enable 2FA and remote tracking/wipe on Apple devices to protect personal data.",
          "tags": ["apple", "2FA", "mobile security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Password Managers (1Password)",
          "url": "https://1password.com",
          "description": "Securely store and manage your passwords using industry-standard password manager.",
          "tags": ["password manager", "personal security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "KeePass Password Manager",
          "url": "https://keepass.info",
          "description": "Open-source password manager to securely store credentials and sensitive information.",
          "tags": ["password manager", "personal security", "open-source"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "uBlock Origin & Ghostery",
          "url": "https://ublockorigin.com, https://www.ghostery.com",
          "description": "Browser extensions for blocking ads, trackers, and enhancing privacy while browsing.",
          "tags": ["browser extension", "privacy", "ad blocker"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Security Checkup for Online Services",
          "url": "https://myaccount.google.com/security-checkup",
          "description": "Regularly review your online account security and recovery options.",
          "tags": ["account security", "checkup", "personal security"],
          "lastReviewed": "2025-02-26",
          "active": true
        }
      ]
    },
    {
      "name": "Corporate & IT Security",
      "description": "Guidelines, policies, and tools for securing corporate networks, endpoint devices, and enterprise services.",
      "tools": [
        {
          "title": "G Suite Security Dashboard & Checklist",
          "url": "https://support.google.com/a/answer/60762",
          "description": "Tools and guidelines for securing your G Suite environment.",
          "tags": ["g suite", "enterprise", "security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Office 365 Security Recommendations",
          "url": "https://www.microsoft.com/security/blog/2020/04/28/microsoft-security-guidance-for-office-365/",
          "description": "Security best practices for securing Microsoft Office 365 and preventing ransomware.",
          "tags": ["office 365", "microsoft", "enterprise security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Endpoint Detection & Response (EDR) Solutions",
          "url": "https://www.crowdstrike.com",
          "description": "Advanced EDR solutions to monitor and secure endpoint devices.",
          "tags": ["EDR", "endpoint security", "IT security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Red Canary EDR",
          "url": "https://www.redcanary.com",
          "description": "Managed detection and response service for enhanced endpoint security.",
          "tags": ["EDR", "endpoint security", "IT security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Network Discovery Tools (Asset Note, Rumble)",
          "url": "https://assetnote.io, https://rumble.run",
          "description": "Tools to perform internal and external network infrastructure audits.",
          "tags": ["network security", "asset discovery", "IT security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "SOC2 & Compliance Guidance",
          "url": "https://www.schellman.com, https://www.a-lign.com",
          "description": "Resources and testing services to prepare for compliance audits like SOC2.",
          "tags": ["compliance", "SOC2", "corporate security"],
          "lastReviewed": "2025-02-26",
          "active": true
        }
      ]
    },
    {
      "name": "Cryptocurrency & Wallet Security",
      "description": "Best practices, tools, and guides for managing crypto wallets, safeguarding private keys, and ensuring secure transactions.",
      "tools": [
        {
          "title": "MetaMask",
          "url": "https://metamask.io",
          "description": "A widely used web wallet for interacting with decentralized applications.",
          "tags": ["wallet", "crypto", "web3"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Argent Mobile Wallet",
          "url": "https://www.argent.xyz",
          "description": "A secure mobile wallet with enhanced account recovery and transaction approval features.",
          "tags": ["wallet", "crypto", "mobile"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Revoke.cash",
          "url": "https://revoke.cash",
          "description": "A tool to monitor and revoke unnecessary token approvals on your crypto accounts.",
          "tags": ["token approvals", "security", "crypto"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Trezor Hardware Wallet",
          "url": "https://trezor.io",
          "description": "A leading hardware wallet that offers secure offline storage for cryptocurrencies.",
          "tags": ["hardware wallet", "crypto", "cold storage"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "GridPlus Lattice1",
          "url": "https://gridplus.io/lattice1",
          "description": "An advanced hardware wallet for managing multiple crypto assets securely, featuring SafeCards for backups.",
          "tags": ["hardware wallet", "crypto", "cold storage"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "WalletScrutiny",
          "url": "https://walletscrutiny.com",
          "description": "A resource for in-depth reviews of crypto wallets and their security features.",
          "tags": ["reviews", "crypto", "wallet security"],
          "lastReviewed": "2025-02-26",
          "active": true
        }
      ]
    },
    {
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
    },
    {
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
    },
    {
      "name": "On-Chain Monitoring",
      "description": "Tools and platforms for monitoring on-chain activity, detecting anomalies, and ensuring smart contract integrity.",
      "tools": [
        {
          "title": "Tenderly",
          "url": "https://tenderly.co",
          "description": "A platform for real-time monitoring, alerting, and debugging of Ethereum smart contracts.",
          "tags": ["monitoring", "ethereum", "smart contract"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Dune Analytics",
          "url": "https://dune.com",
          "description": "An analytics platform to query and visualize blockchain data for on-chain monitoring.",
          "tags": ["analytics", "blockchain", "on-chain"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Etherscan Alerts",
          "url": "https://etherscan.io",
          "description": "Set up custom alerts and monitoring for Ethereum addresses and contract activity via Etherscan.",
          "tags": ["monitoring", "ethereum", "alerts"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Zapper",
          "url": "https://zapper.fi",
          "description": "A dashboard for monitoring DeFi portfolios and on-chain transactions across multiple protocols.",
          "tags": ["defi", "monitoring", "dashboard"],
          "lastReviewed": "2025-02-26",
          "active": true
        }
      ]
    },
    {
      "name": "Web3 Ecosystem Best Practices & Guides",
      "description": "Ecosystem-specific guides, checklists, and resources covering operational security, privacy, and best practices in Web3.",
      "tools": [
        {
          "title": "The Ultimate Web3 Security Checklist",
          "url": "https://digibastion.com",
          "description": "A self-driven checklist for enhancing digital security, privacy, and operational practices in the Web3 space.",
          "tags": ["web3", "checklist", "opsec"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Officer's Blog",
          "url": "https://officercia.mirror.xyz",
          "description": "A blog that covers a wide range of topics including Web3 security, crypto best practices, and operational security insights.",
          "tags": ["blog", "crypto", "security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Digital Guardian Security Blog",
          "url": "https://digitalguardian.com/blog",
          "description": "Regular updates and articles on protecting digital assets and staying ahead of cybersecurity threats.",
          "tags": ["blog", "cybersecurity", "privacy"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "Ledger Academy",
          "url": "https://www.ledger.com/academy",
          "description": "In-depth guides and educational content focused on cryptocurrency security and best practices.",
          "tags": ["academy", "crypto", "security"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "PrivacyTools.io Blog",
          "url": "https://www.privacytools.io/blog",
          "description": "Insights and tips on digital privacy, security tools, and maintaining a secure online presence.",
          "tags": ["privacy", "blog", "digital protection"],
          "lastReviewed": "2025-02-26",
          "active": true
        },
        {
          "title": "The Business of Crypto – OpSec in Crypto",
          "url": "https://medium.com/the-business-of-crypto",
          "description": "Articles and deep dives into the intersection of operational security and cryptocurrency.",
          "tags": ["medium", "crypto", "opsec"],
          "lastReviewed": "2025-02-26",
          "active": true
        }
      ]
    }
  ]
};

export const getAllTags = (): string[] => {
  const tagsSet = new Set<string>();
  securityResources.categories.forEach(category => {
    category.tools.forEach(tool => {
      tool.tags.forEach(tag => tagsSet.add(tag));
    });
  });
  return Array.from(tagsSet).sort();
};
