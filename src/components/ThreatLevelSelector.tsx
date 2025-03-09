
import React from 'react';
import { useSecurityState } from '../hooks/useSecurityState';
import { threatProfiles } from '../data/threatProfiles';
import { Shield, Code, EyeOff, Disc3, Building, Layers } from 'lucide-react';
import { ThreatLevel } from '../types/threatProfile';
import { toast } from 'sonner';

export const ThreatLevelSelector = () => {
  const { threatLevel, setThreatLevel } = useSecurityState();

  const getIcon = (id: string) => {
    switch (id) {
      case 'all': return <Layers className="w-5 h-5" />;
      case 'basic': return <Shield className="w-5 h-5" />;
      case 'developer': return <Code className="w-5 h-5" />;
      case 'privacy': return <EyeOff className="w-5 h-5" />;
      case 'highValue': return <Disc3 className="w-5 h-5" />;
      case 'institution': return <Building className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getBackgroundStyle = (profileId: string) => {
    const isActive = profileId === threatLevel;
    const profile = threatProfiles.find(p => p.id === profileId);
    
    if (isActive) {
      return `bg-gradient-to-r ${profile?.color} text-white shadow-lg scale-105`;
    }
    
    return 'bg-card hover:bg-card/80 border border-white/10 hover:scale-[1.02] transition-transform duration-200';
  };

  const handleThreatLevelChange = (newThreatLevel: ThreatLevel) => {
    if (newThreatLevel === threatLevel) return;
    
    const profile = threatProfiles.find(p => p.id === newThreatLevel);
    setThreatLevel(newThreatLevel);
    
    toast.success(`Switched to ${profile?.name} profile`, {
      description: "Your security items have been updated",
      duration: 3000,
    });
  };

  return (
    <div className="mb-10 p-4 sm:p-6 bg-card rounded-lg border border-white/10 animate-fade-in">
      <h2 className="text-lg font-semibold mb-3">Select Threat Profile</h2>
      <p className="text-sm text-foreground-secondary mb-4">
        Choose your security focus based on your specific needs and threat model
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {threatProfiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleThreatLevelChange(profile.id as ThreatLevel)}
            className={`p-3 rounded-lg transition-all duration-300 flex flex-col items-center text-center ${getBackgroundStyle(profile.id)}`}
            aria-pressed={profile.id === threatLevel}
          >
            <div className="mb-2">
              {getIcon(profile.id)}
            </div>
            <h3 className="text-sm font-medium">{profile.name}</h3>
            <p className="text-xs mt-1 opacity-80 line-clamp-2">{profile.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
