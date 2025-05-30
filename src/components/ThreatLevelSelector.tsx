
import React from 'react';
import { useSecurityState } from '../hooks/useSecurityState';
import { threatProfiles } from '../data/threatProfiles';
import { Shield, Code, EyeOff, Disc3, Building, Layers, Loader2 } from 'lucide-react';
import { ThreatLevel } from '../types/threatProfile';
import { toast } from 'sonner';

export const ThreatLevelSelector = () => {
  const { threatLevel, setThreatLevel, isLoading, changeCount } = useSecurityState();

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
    if (newThreatLevel === threatLevel || isLoading) return;
    
    const profile = threatProfiles.find(p => p.id === newThreatLevel);
    
    // Save the new threat level and show toast
    setThreatLevel(newThreatLevel);
    
    toast.success(`Switching to ${profile?.name} profile`, {
      description: "The page will refresh with your updated security items",
      duration: 1500,
    });
    
    // Set a short timeout to allow the toast to be shown before refresh
    setTimeout(() => {
      // Refresh the entire page after changing the threat level
      window.location.reload();
    }, 300);
  };

  return (
    <div className="mb-10 p-4 sm:p-6 bg-card rounded-lg border border-white/10 animate-fade-in relative" key={`threat-selector-${changeCount}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-card/90 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-foreground-secondary">Updating profile...</p>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Select Threat Profile</h2>
      <p className="text-sm text-foreground-secondary mb-4">
        Choose your security focus based on your specific needs and threat model
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {threatProfiles.map((profile) => (
          <button
            key={`${profile.id}-${changeCount}`}
            onClick={() => handleThreatLevelChange(profile.id as ThreatLevel)}
            className={`p-3 rounded-lg transition-all duration-300 flex flex-col items-center text-center ${getBackgroundStyle(profile.id)} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-pressed={profile.id === threatLevel}
            disabled={isLoading}
            aria-label={`Select ${profile.name} security profile`}
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
