import { 
  Search, 
  BookOpen, 
  BarChart, 
  Scissors, 
  LineChart, 
  Network, 
  Settings, 
  Shield, 
  Database,
  AlertTriangle,
  Bell,
  MessageSquareLock,
  LayoutDashboard,
  Wallet,
  Lock,
  Lightbulb,
  Key
} from 'lucide-react';

export interface Tool {
  name: string;
  description: string;
  link: string;
  icon: typeof Search;
  importance: 'Essential' | 'Recommended' | 'Optional';
}

export interface ToolCategory {
  title: string;
  description: string;
  tools: Tool[];
}

export const toolCategories: ToolCategory[] = [
  {
    title: "On-Chain Analytics & Verification",
    description: "Essential tools for blockchain exploration and transaction verification",
    tools: [
      {
        name: "Etherscan.io",
        description: "Industry-standard Ethereum explorer for viewing transactions, verifying smart contracts, and checking wallet activity",
        link: "https://etherscan.io",
        icon: Search,
        importance: "Essential"
      },
      {
        name: "rolod0x.io",
        description: "Private, open-source address book working across chains for verifying addresses and maintaining trusted contacts",
        link: "https://rolod0x.io",
        icon: BookOpen,
        importance: "Recommended"
      },
      {
        name: "parsiq.net",
        description: "Blockchain monitoring tool tracking on-chain activity in real-time to spot suspicious transactions",
        link: "https://parsiq.net",
        icon: AlertTriangle,
        importance: "Recommended"
      },
      {
        name: "Revoke.cash",
        description: "Essential utility for checking and revoking unwanted token approvals to prevent unauthorized transactions",
        link: "https://revoke.cash",
        icon: Scissors,
        importance: "Essential"
      }
    ]
  },
  {
    title: "Visualization & Dashboard Tools",
    description: "Tools for analyzing and visualizing blockchain data patterns",
    tools: [
      {
        name: "Dune.xyz",
        description: "Powerful platform for creating custom dashboards and visualizing blockchain data for security trend analysis",
        link: "https://dune.com",
        icon: BarChart,
        importance: "Recommended"
      },
      {
        name: "Bloxy.info",
        description: "Smart contract analytics and transaction visualization tool for identifying anomalies",
        link: "https://bloxy.info",
        icon: LineChart,
        importance: "Optional"
      },
      {
        name: "Tenderly Dashboard",
        description: "Advanced tool for simulating transactions and monitoring smart contract performance",
        link: "https://tenderly.co",
        icon: Settings,
        importance: "Recommended"
      }
    ]
  },
  {
    title: "OSINT & Investigation Tools",
    description: "Tools for gathering and analyzing on-chain intelligence",
    tools: [
      {
        name: "SpiderFoot",
        description: "Open-source OSINT tool aggregating public data for investigating suspicious wallet addresses",
        link: "https://www.spiderfoot.net",
        icon: Network,
        importance: "Optional"
      },
      {
        name: "Metasleuth.io",
        description: "Specialized platform for analyzing phishing attacks and fraudulent on-chain activities",
        link: "https://metasleuth.io",
        icon: Search,
        importance: "Recommended"
      },
      {
        name: "any.run",
        description: "Interactive malware analysis service for analyzing suspicious files and URLs to detect potential threats",
        link: "https://any.run",
        icon: Search,
        importance: "Recommended"
      }
    ]
  },
  {
    title: "Security & Audit Tools",
    description: "Essential tools for maintaining wallet security and smart contract safety",
    tools: [
      {
        name: "Skynet.certik.com",
        description: "Security insights and audits for smart contracts, highlighting potential vulnerabilities",
        link: "https://skynet.certik.com",
        icon: Shield,
        importance: "Essential"
      },
      {
        name: "LedgerQL.com",
        description: "Query tool for analyzing transaction data on-chain and verifying transaction history",
        link: "https://ledgerql.com",
        icon: Database,
        importance: "Recommended"
      },
      {
        name: "Web3 Antivirus",
        description: "Specialized protection for cryptocurrency users, detecting malicious websites and potential phishing attacks in real-time",
        link: "https://web3antivirus.io",
        icon: Shield,
        importance: "Essential"
      },
      {
        name: "Blockaid",
        description: "Security tool that helps users verify transaction integrity before approval, protecting against scams and transaction manipulation",
        link: "https://www.blockaid.io",
        icon: Shield,
        importance: "Recommended"
      },
      {
        name: "Tweetsigner",
        description: "Tool for cryptographically signing tweets to verify authenticity in the Web3 ecosystem",
        link: "https://tweetsigner.com",
        icon: Lock,
        importance: "Optional"
      },
      {
        name: "DangerZone",
        description: "Open-source tool that helps users safely open risky documents by converting them to safer formats",
        link: "https://dangerzone.rocks",
        icon: AlertTriangle,
        importance: "Optional"
      }
    ]
  },
  {
    title: "Monitoring Tools",
    description: "Real-time monitoring and simulation tools for transaction safety",
    tools: [
      {
        name: "Forta",
        description: "Stop crypto hacks before they happen. Powered by the most advanced AI detection model, Forta Firewall integrates with protocols and rollups to prevent over 99% of hacks.",
        link: "https://www.forta.org/",
        icon: Shield,
        importance: "Essential"
      }
    ]
  },
  {
    title: "Secure Communication",
    description: "Tools for maintaining secure and private communications in Web3",
    tools: [
      {
        name: "XMTP",
        description: "End-to-end encrypted messaging network for secure Web3 communications, enhancing overall digital hygiene",
        link: "https://xmtp.org",
        icon: MessageSquareLock,
        importance: "Optional"
      }
    ]
  },
  {
    title: "Web3 Wallets & Asset Management",
    description: "Secure wallet solutions for managing digital assets and protocol permissions",
    tools: [
      {
        name: "Safe (formerly Gnosis Safe)",
        description: "A trusted multi-signature wallet for securely managing protocol permissions, DAO treasuries, and significant crypto assets",
        link: "https://safe.global",
        icon: Wallet,
        importance: "Essential"
      },
      {
        name: "Rabby Wallet",
        description: "A web3 wallet for Ethereum and EVM-compatible chains, featuring automatic network switching and built-in security checks",
        link: "https://rabby.io",
        icon: Wallet,
        importance: "Recommended"
      },
      {
        name: "MPCVault",
        description: "A multi-chain, non-custodial wallet leveraging multi-party computation (MPC) and multi-sig for enhanced security in web3 teams",
        link: "https://www.mpcvault.com",
        icon: Shield,
        importance: "Recommended"
      },
      {
        name: "Liminal",
        description: "A multi-sig and MPC wallet solution designed for enterprises, exchanges, and web3 projects to secure transactions",
        link: "https://docs.lmnl.app/docs/set-up-your-multisig-wallet",
        icon: Shield,
        importance: "Optional"
      },
      {
        name: "GridPlus Lattice1",
        description: "Advanced hardware wallet with a secure enclave for private keys, allowing users to sign transactions directly on the device",
        link: "https://gridplus.io/products/grid-lattice1",
        icon: Wallet,
        importance: "Essential"
      },
      {
        name: "AirGap",
        description: "Two-device approach to cryptocurrency security, offering an air-gapped solution for signing transactions offline",
        link: "https://airgap.it",
        icon: Lock,
        importance: "Recommended"
      }
    ]
  },
  {
    title: "Physical Security & Authentication",
    description: "Hardware solutions for enhancing account security and preventing unauthorized access",
    tools: [
      {
        name: "YubiKey",
        description: "Physical security key supporting multiple authentication protocols to protect cryptocurrency accounts with robust 2FA",
        link: "https://www.yubico.com",
        icon: Key,
        importance: "Essential"
      },
      {
        name: "Nitrokey",
        description: "Open-source hardware security keys and secure storage devices for enhanced authentication and encryption",
        link: "https://www.nitrokey.com",
        icon: Key,
        importance: "Recommended"
      }
    ]
  },
  {
    title: "Educational Resources",
    description: "Knowledge bases and tools to improve your security awareness and practices",
    tools: [
      {
        name: "Consumer Reports Security Planner",
        description: "Personalized security recommendations to help protect your digital life and cryptocurrency holdings",
        link: "https://securityplanner.consumerreports.org",
        icon: Lightbulb,
        importance: "Recommended"
      }
    ]
  }
];
