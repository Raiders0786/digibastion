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
  Wallet
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
        link: "https://dune.xyz",
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
      }
    ]
  },
  {
    title: "Monitoring Tools",
    description: "Real-time monitoring and simulation tools for transaction safety",
    tools: [
      {
        name: "Tenderly",
        description: "Real-time monitoring and simulation of smart contract interactions, helping detect anomalous behavior before transaction execution",
        link: "https://tenderly.co",
        icon: LayoutDashboard,
        importance: "Essential"
      },
      {
        name: "Blocknative",
        description: "Transaction monitoring and real-time notifications to track wallet activity and spot unauthorized transactions early",
        link: "https://blocknative.com",
        icon: Bell,
        importance: "Recommended"
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
        link: "https://www.liminal.market",
        icon: Shield,
        importance: "Optional"
      }
    ]
  }
];
