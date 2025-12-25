import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, RotateCcw, Zap, Lock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { initialSecurityData } from '@/data/securityData';
import { loadCompletionState, saveCompletionState } from '@/utils/storageUtils';

type PresetType = 'high-security' | 'essential-only' | 'reset';

interface PresetOption {
  id: PresetType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  levels: ('essential' | 'recommended' | 'optional' | 'advanced')[];
}

const presets: PresetOption[] = [
  {
    id: 'high-security',
    name: 'Maximum Protection',
    description: 'Auto-complete all advanced & recommended security items for maximum protection',
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'from-red-500 to-orange-500',
    levels: ['essential', 'recommended', 'advanced']
  },
  {
    id: 'essential-only',
    name: 'Essential Security',
    description: 'Mark only essential security items as complete - the baseline everyone needs',
    icon: <Shield className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
    levels: ['essential']
  },
  {
    id: 'reset',
    name: 'Reset Progress',
    description: 'Clear all progress and start fresh with a clean slate',
    icon: <RotateCcw className="w-5 h-5" />,
    color: 'from-gray-500 to-gray-600',
    levels: []
  }
];

export const SecurityPresets: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const getItemCountForPreset = (preset: PresetOption): number => {
    if (preset.id === 'reset') return 0;
    
    let count = 0;
    initialSecurityData.forEach(category => {
      category.items.forEach(item => {
        if (preset.levels.includes(item.level)) {
          count++;
        }
      });
    });
    return count;
  };

  const applyPreset = async (presetId: PresetType) => {
    setIsApplying(true);
    
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    try {
      // Get current completion state
      const currentState = loadCompletionState();
      let newState: { [key: string]: boolean } = {};

      if (presetId === 'reset') {
        // Clear all completions
        newState = {};
      } else {
        // Keep existing completions and add new ones based on preset
        newState = { ...currentState };
        
        initialSecurityData.forEach(category => {
          category.items.forEach(item => {
            if (preset.levels.includes(item.level)) {
              newState[item.id] = true;
            }
          });
        });
      }

      // Save the new state
      saveCompletionState(newState);

      // Show success toast
      const itemCount = getItemCountForPreset(preset);
      
      if (presetId === 'reset') {
        toast.success('Progress Reset', {
          description: 'All security items have been unchecked. Starting fresh!',
          duration: 2000,
        });
      } else {
        toast.success(`${preset.name} Applied`, {
          description: `${itemCount} security items marked as complete`,
          duration: 2000,
        });
      }

      // Close dialog and reload page to apply changes
      setIsOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Error applying preset:', error);
      toast.error('Error applying preset', {
        description: 'Please try again',
      });
    } finally {
      setIsApplying(false);
      setSelectedPreset(null);
    }
  };

  const handlePresetClick = (preset: PresetOption) => {
    setSelectedPreset(preset.id);
  };

  const confirmApplyPreset = () => {
    if (selectedPreset) {
      applyPreset(selectedPreset);
    }
  };

  return (
    <div className="mb-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
          >
            <Zap className="w-4 h-4 text-primary" />
            Quick Security Presets
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Security Presets
            </DialogTitle>
            <DialogDescription>
              Apply a security preset to quickly configure your protection level. 
              This will update your checklist progress.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {presets.map((preset) => {
              const itemCount = getItemCountForPreset(preset);
              const isSelected = selectedPreset === preset.id;
              
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset)}
                  disabled={isApplying}
                  className={`
                    relative p-4 rounded-lg border text-left transition-all duration-200
                    ${isSelected 
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                      : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                    }
                    ${isApplying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-lg bg-gradient-to-r ${preset.color} text-white
                    `}>
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{preset.name}</h4>
                        {preset.id === 'high-security' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {preset.description}
                      </p>
                      {preset.id !== 'reset' && (
                        <p className="text-xs text-primary mt-2">
                          {itemCount} items will be marked complete
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Presets add to your existing progress. Items you've already completed 
              will remain checked. Only the "Reset Progress" option clears all progress.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedPreset(null);
                setIsOpen(false);
              }}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmApplyPreset}
              disabled={!selectedPreset || isApplying}
              className={selectedPreset === 'reset' 
                ? 'bg-destructive hover:bg-destructive/90' 
                : 'btn-primary'
              }
            >
              {isApplying ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Applying...
                </>
              ) : selectedPreset === 'reset' ? (
                'Reset All Progress'
              ) : (
                'Apply Preset'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
