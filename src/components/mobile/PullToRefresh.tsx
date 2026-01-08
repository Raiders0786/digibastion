import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  threshold?: number;
}

export const PullToRefresh = ({ 
  children, 
  onRefresh, 
  isRefreshing = false,
  threshold = 80 
}: PullToRefreshProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const y = useMotionValue(0);
  
  const indicatorOpacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);
  const rotation = useTransform(y, [0, threshold], [0, 180]);

  if (!isMobile) {
    return <>{children}</>;
  }

  const handlePanStart = () => {
    if (containerRef.current?.scrollTop === 0) {
      setIsPulling(true);
    }
  };

  const handlePan = (_: any, info: PanInfo) => {
    if (!isPulling || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setIsPulling(false);
      y.set(0);
      return;
    }

    const pullDistance = Math.max(0, info.offset.y);
    const dampedDistance = pullDistance * 0.5; // Damping effect
    y.set(Math.min(dampedDistance, threshold * 1.5));
    setPullProgress(Math.min(pullDistance / threshold, 1));
  };

  const handlePanEnd = async () => {
    if (!isPulling || isRefreshing) return;
    
    if (pullProgress >= 1) {
      // Trigger haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
      
      await onRefresh();
    }
    
    setIsPulling(false);
    setPullProgress(0);
    y.set(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity, scale: indicatorScale }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center h-16 z-10 pointer-events-none"
      >
        <motion.div
          style={{ rotate: isRefreshing ? 0 : rotation }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            pullProgress >= 1 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        ref={containerRef}
        style={{ y }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};
