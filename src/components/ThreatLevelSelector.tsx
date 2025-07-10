
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
    <div className="mb-10 feature-card relative" key={`threat-selector-${changeCount}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-card/90 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-foreground-secondary">Updating profile...</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Choose Your Security Profile</h2>
          <p className="text-foreground-secondary max-w-2xl mx-auto">
            Select the threat profile that best matches your security needs and risk level
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {threatProfiles.map((profile) => (
            <button
              key={`${profile.id}-${changeCount}`}
              onClick={() => handleThreatLevelChange(profile.id as ThreatLevel)}
              className={`group p-4 rounded-xl transition-all duration-300 flex flex-col items-center text-center min-h-[120px] justify-center ${getBackgroundStyle(profile.id)} ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
              aria-pressed={profile.id === threatLevel}
              disabled={isLoading}
              aria-label={`Select ${profile.name} security profile`}
            >
              <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300">
                {getIcon(profile.id)}
              </div>
              <h3 className="text-sm font-semibold mb-1">{profile.name}</h3>
              <p className="text-xs opacity-80 leading-tight">{profile.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
