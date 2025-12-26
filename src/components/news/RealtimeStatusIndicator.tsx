import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeStatusIndicatorProps {
  className?: string;
}

export const RealtimeStatusIndicator = ({ className }: RealtimeStatusIndicatorProps) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const channel = supabase
      .channel('status-check')
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
          setStatus('disconnected');
        } else {
          setStatus('connecting');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statusConfig = {
    connecting: {
      label: 'Connecting...',
      icon: Radio,
      color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      pulse: true,
    },
    connected: {
      label: 'Live Feed Active',
      icon: Wifi,
      color: 'bg-green-500/20 text-green-500 border-green-500/30',
      pulse: true,
    },
    disconnected: {
      label: 'Disconnected',
      icon: WifiOff,
      color: 'bg-red-500/20 text-red-500 border-red-500/30',
      pulse: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            'cursor-default flex items-center gap-1.5 text-xs',
            config.color,
            className
          )}
        >
          <span className="relative flex h-2 w-2">
            {config.pulse && (
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                status === 'connected' ? 'bg-green-400' : 'bg-yellow-400'
              )} />
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              status === 'connected' ? 'bg-green-500' : 
              status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            )} />
          </span>
          <Icon className="w-3 h-3" />
          <span className="hidden sm:inline">{status === 'connected' ? 'Live' : config.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {status === 'connected' 
            ? 'Real-time alerts are active. You\'ll be notified of critical threats instantly.'
            : status === 'connecting'
            ? 'Connecting to the threat intelligence feed...'
            : 'Disconnected from real-time feed. Refresh to reconnect.'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
