import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageTransitionProps {
  children: ReactNode;
}

// Simplified desktop variants - just fade, no transform to avoid blur issues
const desktopVariants: Variants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

// Mobile variants - minimal transform to prevent rendering issues
const mobileVariants: Variants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

// Get simple variants based on device - avoid transforms that cause blur
const getVariants = (isMobile: boolean): Variants => {
  return isMobile ? mobileVariants : desktopVariants;
};

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const variants = getVariants(isMobile);

  // Force repaint after animation completes to fix blur on some mobile browsers
  useEffect(() => {
    if (!isAnimating) {
      // Trigger a repaint by toggling a style
      const timer = setTimeout(() => {
        document.body.style.opacity = '0.999';
        requestAnimationFrame(() => {
          document.body.style.opacity = '1';
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, location.pathname]);

  return (
    <AnimatePresence 
      mode="wait" 
      initial={false}
      onExitComplete={() => setIsAnimating(false)}
    >
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={() => setIsAnimating(false)}
        style={{
          // Avoid will-change on mobile as it can cause blur issues
          willChange: isMobile ? 'auto' : 'opacity',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
