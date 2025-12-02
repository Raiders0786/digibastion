import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Shield, AlertTriangle, 
  Globe, Skull, Target, Activity, Zap
} from 'lucide-react';

// Real 2024 statistics data
const yearlyLossesData = [
  { year: '2020', losses: 0.52, incidents: 122 },
  { year: '2021', losses: 3.2, incidents: 245 },
  { year: '2022', losses: 3.8, incidents: 308 },
  { year: '2023', losses: 1.7, incidents: 286 },
  { year: '2024', losses: 2.9, incidents: 303 },
  { year: '2025', losses: 1.8, incidents: 178 }, // YTD
];

const attackVectorData = [
  { name: 'Access Control', value: 1700, percentage: 75, color: '#ef4444' },
  { name: 'Phishing', value: 1050, percentage: 15, color: '#f97316' },
  { name: 'Private Key', value: 855, percentage: 6, color: '#eab308' },
  { name: 'Smart Contract', value: 380, percentage: 4, color: '#22c55e' },
];

const chainTargetsData = [
  { chain: 'Ethereum', incidents: 403, losses: 748 },
  { chain: 'Bitcoin', incidents: 89, losses: 543 },
  { chain: 'BSC', incidents: 156, losses: 234 },
  { chain: 'Solana', incidents: 134, losses: 189 },
  { chain: 'Arbitrum', incidents: 67, losses: 156 },
  { chain: 'Polygon', incidents: 45, losses: 89 },
];

const monthlyTrendsData = [
  { month: 'Jan', losses: 189, incidents: 24 },
  { month: 'Feb', losses: 290, incidents: 31 },
  { month: 'Mar', losses: 145, incidents: 22 },
  { month: 'Apr', losses: 234, incidents: 28 },
  { month: 'May', losses: 456, incidents: 35 },
  { month: 'Jun', losses: 178, incidents: 26 },
  { month: 'Jul', losses: 389, incidents: 32 },
  { month: 'Aug', losses: 267, incidents: 29 },
  { month: 'Sep', losses: 312, incidents: 38 },
  { month: 'Oct', losses: 234, incidents: 27 },
  { month: 'Nov', losses: 189, incidents: 23 },
  { month: 'Dec', losses: 29, incidents: 8 },
];

const northKoreaStats = {
  totalStolen: 1.34,
  incidents: 47,
  percentageOfTotal: 53,
  primaryGroups: ['Lazarus Group', 'TraderTraitor', 'Jade Sleet', 'APT38'],
  topTactics: ['LinkedIn Social Engineering', 'Fake Job Offers', 'Malicious npm Packages', 'Supply Chain Attacks']
};

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export const ThreatStatsDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <DollarSign className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">$2.9B</div>
                <div className="text-xs text-muted-foreground">2024 Total Losses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">303</div>
                <div className="text-xs text-muted-foreground">Incidents (2024)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">331%</div>
                <div className="text-xs text-muted-foreground">Phishing Increase</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingDown className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">7.4%</div>
                <div className="text-xs text-muted-foreground">Recovery Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Vector Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Attack Vector Distribution (2024)
            </CardTitle>
            <CardDescription>Breakdown of attack types by total losses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attackVectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {attackVectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value}M`, 'Losses']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {attackVectorData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              2024 Monthly Losses Trend
            </CardTitle>
            <CardDescription>Losses in millions USD by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendsData}>
                  <defs>
                    <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value}M`, 'Losses']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="losses" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#lossGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* North Korea Section */}
      <Card className="glass-card border-red-500/30 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Skull className="w-5 h-5 text-red-500" />
            North Korean Cyber Operations (2024)
          </CardTitle>
          <CardDescription>
            DPRK state-sponsored actors responsible for over 50% of crypto theft
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold text-red-400">${northKoreaStats.totalStolen}B</div>
              <div className="text-sm text-muted-foreground">Total Stolen</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold text-red-400">{northKoreaStats.incidents}</div>
              <div className="text-sm text-muted-foreground">Incidents</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold text-red-400">{northKoreaStats.percentageOfTotal}%</div>
              <div className="text-sm text-muted-foreground">Of Total Theft</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold text-red-400">4</div>
              <div className="text-sm text-muted-foreground">Active Groups</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Primary Threat Groups
              </h4>
              <div className="flex flex-wrap gap-2">
                {northKoreaStats.primaryGroups.map((group) => (
                  <Badge key={group} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                    {group}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Key Attack Tactics
              </h4>
              <div className="flex flex-wrap gap-2">
                {northKoreaStats.topTactics.map((tactic) => (
                  <Badge key={tactic} variant="secondary" className="text-xs">
                    {tactic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yearly Comparison */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Historical Loss Trends
            </CardTitle>
            <CardDescription>Total crypto losses by year (in billions USD)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyLossesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'losses' ? `$${value}B` : value, 
                      name === 'losses' ? 'Losses' : 'Incidents'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chain Targets */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Most Targeted Chains (2024)
            </CardTitle>
            <CardDescription>Incidents and losses by blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chainTargetsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="chain" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'losses' ? `$${value}M` : value, 
                      name === 'losses' ? 'Losses' : 'Incidents'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="incidents" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="losses" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">2024-2025 Key Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <h4 className="font-medium text-red-400 mb-2">Access Control Dominance</h4>
              <p className="text-sm text-muted-foreground">
                75-81% of all losses stem from access control failures, not smart contract bugs
              </p>
            </div>
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h4 className="font-medium text-orange-400 mb-2">CeFi vs DeFi Shift</h4>
              <p className="text-sm text-muted-foreground">
                Centralized exchanges now more targeted than DeFi protocols
              </p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="font-medium text-yellow-400 mb-2">Supply Chain Rise</h4>
              <p className="text-sm text-muted-foreground">
                XZ Utils-style attacks now targeting Web3 libraries and npm packages
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h4 className="font-medium text-purple-400 mb-2">Multisig Bypass</h4>
              <p className="text-sm text-muted-foreground">
                Advanced attacks bypass even hardware wallet + multisig setups
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-medium text-blue-400 mb-2">AI-Enhanced Scams</h4>
              <p className="text-sm text-muted-foreground">
                "Pig butchering" scams now using AI for extended manipulation campaigns
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-medium text-green-400 mb-2">December Improvement</h4>
              <p className="text-sm text-muted-foreground">
                December 2024 saw lowest monthly losses ($28.6M) showing improved security posture
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
