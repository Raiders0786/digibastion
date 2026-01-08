import { ReactNode, useRef } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeableTabsProps {
  children: ReactNode;
  currentIndex: number;
  tabCount: number;
  onSwipe: (direction: 'left' | 'right') => void;
  className?: string;
}

export const SwipeableTabs = ({
  children,
  currentIndex,
  tabCount,
  onSwipe,
  className = '',
}: SwipeableTabsProps) => {
  const controls = useAnimation();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  const handlePanEnd = async (_: any, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Swipe left (next tab)
    if ((offset < -threshold || velocity < -500) && currentIndex < tabCount - 1) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      await controls.start({
        x: -30,
        opacity: 0.5,
        transition: { duration: 0.1 }
      });
      
      onSwipe('left');
      
      await controls.start({
        x: 0,
        opacity: 1,
        transition: { duration: 0.2 }
      });
    }
    // Swipe right (previous tab)
    else if ((offset > threshold || velocity > 500) && currentIndex > 0) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      await controls.start({
        x: 30,
        opacity: 0.5,
        transition: { duration: 0.1 }
      });
      
      onSwipe('right');
      
      await controls.start({
        x: 0,
        opacity: 1,
        transition: { duration: 0.2 }
      });
    } else {
      // Snap back
      controls.start({
        x: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 400, damping: 30 }
      });
    }
  };

  return (
    <motion.div
      ref={containerRef}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onPanEnd={handlePanEnd}
      className={`touch-pan-y ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
      
      {/* Swipe indicators */}
      <div className="flex justify-center gap-1.5 mt-4 md:hidden">
        {Array.from({ length: tabCount }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex 
                ? 'w-6 bg-primary' 
                : 'w-1.5 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
