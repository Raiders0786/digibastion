import { ReactNode } from 'react';
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

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    try {
      // Swipe left (next tab)
      if ((offset < -threshold || velocity < -500) && currentIndex < tabCount - 1) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }

        onSwipe('left');

        // Ensure visible state after tab swap
        controls.set({ x: 0, opacity: 1 });
      }
      // Swipe right (previous tab)
      else if ((offset > threshold || velocity > 500) && currentIndex > 0) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }

        onSwipe('right');

        // Ensure visible state after tab swap
        controls.set({ x: 0, opacity: 1 });
      } else {
        // Snap back
        await controls.start({
          x: 0,
          opacity: 1,
          transition: { type: 'spring', stiffness: 400, damping: 30 },
        });
      }
    } catch {
      // Keep content visible even if animation fails
      controls.set({ x: 0, opacity: 1 });
    }
  };

  return (
    <motion.div
      initial={{ x: 0, opacity: 1 }}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      dragMomentum={false}
      dragDirectionLock
      dragPropagation={false}
      onDragEnd={handleDragEnd}
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
              i === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
