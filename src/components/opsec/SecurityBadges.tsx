
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Lock, Shield, Wallet, Eye, Globe, Smartphone, Mail, Code, Briefcase, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useSecurityState } from '@/hooks/useSecurityState';

interface SecurityBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requirement: string;
  unlocked: boolean;
  progress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-400 to-orange-500'
};

const rarityBorders = {
  common: 'border-gray-400/30',
  rare: 'border-blue-400/30',
  epic: 'border-purple-400/30',
  legendary: 'border-amber-400/30 animate-pulse'
};

export const SecurityBadges = () => {
  const { categories, getCategoryScore, getOverallScore } = useSecurityState();
  const overallScore = getOverallScore();

  const badges: SecurityBadge[] = [
    {
      id: 'first-step',
      name: 'First Step',
      description: 'Complete your first security item',
      icon: <CheckCircle2 className="w-5 h-5" />,
      requirement: 'Complete 1 item',
      unlocked: categories.some(c => c.items.some(i => i.completed)),
      progress: categories.some(c => c.items.some(i => i.completed)) ? 100 : 0,
      rarity: 'common'
    },
    {
      id: 'security-novice',
      name: 'Security Novice',
      description: 'Reach 25% overall security score',
      icon: <Shield className="w-5 h-5" />,
      requirement: '25% overall score',
      unlocked: overallScore >= 25,
      progress: Math.min((overallScore / 25) * 100, 100),
      rarity: 'common'
    },
    {
      id: 'wallet-guardian',
      name: 'Wallet Guardian',
      description: 'Complete 50% of wallet security items',
      icon: <Wallet className="w-5 h-5" />,
      requirement: '50% wallet security',
      unlocked: getCategoryScore(categories.find(c => c.id === 'wallet')!) >= 50,
      progress: getCategoryScore(categories.find(c => c.id === 'wallet')!) || 0,
      rarity: 'rare'
    },
    {
      id: 'auth-master',
      name: 'Auth Master',
      description: 'Complete 75% of authentication items',
      icon: <Lock className="w-5 h-5" />,
      requirement: '75% authentication',
      unlocked: getCategoryScore(categories.find(c => c.id === 'authentication')!) >= 75,
      progress: getCategoryScore(categories.find(c => c.id === 'authentication')!) || 0,
      rarity: 'rare'
    },
    {
      id: 'privacy-advocate',
      name: 'Privacy Advocate',
      description: 'Complete 50% of social media security',
      icon: <Eye className="w-5 h-5" />,
      requirement: '50% social security',
      unlocked: getCategoryScore(categories.find(c => c.id === 'social')!) >= 50,
      progress: getCategoryScore(categories.find(c => c.id === 'social')!) || 0,
      rarity: 'rare'
    },
    {
      id: 'defi-defender',
      name: 'DeFi Defender',
      description: 'Complete 75% of DeFi security items',
      icon: <Globe className="w-5 h-5" />,
      requirement: '75% DeFi security',
      unlocked: getCategoryScore(categories.find(c => c.id === 'defi')!) >= 75,
      progress: getCategoryScore(categories.find(c => c.id === 'defi')!) || 0,
      rarity: 'epic'
    },
    {
      id: 'opsec-operator',
      name: 'OpSec Operator',
      description: 'Complete 50% of OpSec items',
      icon: <ShieldAlert className="w-5 h-5" />,
      requirement: '50% OpSec completion',
      unlocked: getCategoryScore(categories.find(c => c.id === 'opsec')!) >= 50,
      progress: getCategoryScore(categories.find(c => c.id === 'opsec')!) || 0,
      rarity: 'epic'
    },
    {
      id: 'dev-sec-ops',
      name: 'DevSecOps Pro',
      description: 'Complete 75% of developer security',
      icon: <Code className="w-5 h-5" />,
      requirement: '75% developer security',
      unlocked: getCategoryScore(categories.find(c => c.id === 'developers')!) >= 75,
      progress: getCategoryScore(categories.find(c => c.id === 'developers')!) || 0,
      rarity: 'epic'
    },
    {
      id: 'security-elite',
      name: 'Security Elite',
      description: 'Reach 75% overall security score',
      icon: <Award className="w-5 h-5" />,
      requirement: '75% overall score',
      unlocked: overallScore >= 75,
      progress: Math.min((overallScore / 75) * 100, 100),
      rarity: 'legendary'
    },
    {
      id: 'satoshi-level',
      name: 'Satoshi Level',
      description: 'Reach 95% overall security score',
      icon: <Award className="w-5 h-5" />,
      requirement: '95% overall score',
      unlocked: overallScore >= 95,
      progress: Math.min((overallScore / 95) * 100, 100),
      rarity: 'legendary'
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-lg">Security Achievements</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {unlockedCount}/{badges.length} Unlocked
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`relative p-3 rounded-xl border transition-all duration-300 ${
                badge.unlocked 
                  ? `${rarityBorders[badge.rarity]} bg-gradient-to-br ${rarityColors[badge.rarity]} bg-opacity-10` 
                  : 'border-border bg-muted/30 opacity-50'
              }`}
            >
              <div className="text-center space-y-2">
                <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${
                  badge.unlocked 
                    ? `bg-gradient-to-br ${rarityColors[badge.rarity]} text-white` 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {badge.icon}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${badge.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {badge.name}
                  </p>
                  <p className="text-[10px] text-foreground-secondary line-clamp-2">
                    {badge.description}
                  </p>
                </div>
                {!badge.unlocked && (
                  <div className="space-y-1">
                    <Progress value={badge.progress} className="h-1" />
                    <p className="text-[10px] text-foreground-secondary">{Math.round(badge.progress)}%</p>
                  </div>
                )}
                {badge.unlocked && (
                  <Badge variant="outline" className={`text-[10px] capitalize ${rarityBorders[badge.rarity]}`}>
                    {badge.rarity}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
