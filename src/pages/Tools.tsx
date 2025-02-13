
import { Navbar } from '../components/Navbar';
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
  ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Tools = () => {
  const categories = [
    {
      title: "On-Chain Analytics & Verification",
      description: "Essential tools for blockchain exploration and transaction verification",
      tools: [
        {
          name: "Etherscan.io",
          description: "Industry-standard Ethereum explorer for viewing transactions, verifying smart contracts, and checking wallet activity",
          link: "https://etherscan.io",
          icon: <Search className="w-5 h-5" />,
          importance: "Essential"
        },
        {
          name: "rolod0x.io",
          description: "Private, open-source address book working across chains for verifying addresses and maintaining trusted contacts",
          link: "https://rolod0x.io",
          icon: <BookOpen className="w-5 h-5" />,
          importance: "Recommended"
        },
        {
          name: "parsiq.net",
          description: "Blockchain monitoring tool tracking on-chain activity in real-time to spot suspicious transactions",
          link: "https://parsiq.net",
          icon: <AlertTriangle className="w-5 h-5" />,
          importance: "Recommended"
        },
        {
          name: "Revoke.cash",
          description: "Essential utility for checking and revoking unwanted token approvals to prevent unauthorized transactions",
          link: "https://revoke.cash",
          icon: <Scissors className="w-5 h-5" />,
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
          icon: <BarChart className="w-5 h-5" />,
          importance: "Recommended"
        },
        {
          name: "Bloxy.info",
          description: "Smart contract analytics and transaction visualization tool for identifying anomalies",
          link: "https://bloxy.info",
          icon: <LineChart className="w-5 h-5" />,
          importance: "Optional"
        },
        {
          name: "Tenderly Dashboard",
          description: "Advanced tool for simulating transactions and monitoring smart contract performance",
          link: "https://tenderly.co",
          icon: <Settings className="w-5 h-5" />,
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
          icon: <Network className="w-5 h-5" />,
          importance: "Optional"
        },
        {
          name: "Metasleuth.io",
          description: "Specialized platform for analyzing phishing attacks and fraudulent on-chain activities",
          link: "https://metasleuth.io",
          icon: <Search className="w-5 h-5" />,
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
          icon: <Shield className="w-5 h-5" />,
          importance: "Essential"
        },
        {
          name: "LedgerQL.com",
          description: "Query tool for analyzing transaction data on-chain and verifying transaction history",
          link: "https://ledgerql.com",
          icon: <Database className="w-5 h-5" />,
          importance: "Recommended"
        }
      ]
    }
  ];

  const getImportanceBadgeColor = (importance: string) => {
    switch (importance.toLowerCase()) {
      case 'essential':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'recommended':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'optional':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Web3 Security Tools</h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              A curated collection of essential tools for Web3 security and analysis, gathered from various online resources 
              and community contributions to help secure your digital assets.
            </p>
          </div>

          <div className="grid gap-12 animate-slide-up">
            {categories.map((category, index) => (
              <section key={index} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">{category.title}</h2>
                  <p className="text-foreground-secondary">{category.description}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool, toolIndex) => (
                    <Card 
                      key={toolIndex} 
                      className="p-6 hover:shadow-lg transition-shadow relative overflow-hidden"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {tool.icon}
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground">{tool.name}</h3>
                            <Badge 
                              variant="outline" 
                              className={`${getImportanceBadgeColor(tool.importance)} text-xs`}
                            >
                              {tool.importance}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground-secondary">{tool.description}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-4"
                            onClick={() => window.open(tool.link, '_blank')}
                          >
                            Visit Tool
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                {index < categories.length - 1 && <Separator className="my-8" />}
              </section>
            ))}
          </div>

          <div className="mt-16 text-center text-sm text-foreground-secondary">
            <p>
              These tools have been collected from various online resources and community contributions. 
              Credits are due to all the original creators and contributors who have made efforts in 
              developing and maintaining these valuable security tools.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tools;
