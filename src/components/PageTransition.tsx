import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageTransitionProps {
  children: ReactNode;
}

// Desktop page variants - subtle fade
const desktopVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// Mobile page variants - smooth slide with scale
const mobileVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth feel
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Shared element animation for specific routes
const getRouteAnimation = (pathname: string, isMobile: boolean): Variants => {
  // Quiz-related routes get special treatment
  if (pathname.includes('/quiz') || pathname.includes('/leaderboard')) {
    return {
      initial: {
        opacity: 0,
        scale: isMobile ? 0.95 : 0.98,
        y: isMobile ? 30 : 10,
      },
      enter: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: isMobile ? 0.4 : 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
      exit: {
        opacity: 0,
        scale: isMobile ? 0.95 : 0.98,
        y: isMobile ? -30 : -10,
        transition: {
          duration: 0.2,
          ease: 'easeIn',
        },
      },
    };
  }
  
  // Threat intel / alerts get urgent slide animation
  if (pathname.includes('/threat-intel') || pathname.includes('/news')) {
    return {
      initial: {
        opacity: 0,
        x: isMobile ? 30 : 15,
      },
      enter: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
      exit: {
        opacity: 0,
        x: isMobile ? -30 : -15,
        transition: {
          duration: 0.2,
          ease: 'easeIn',
        },
      },
    };
  }
  
  return isMobile ? mobileVariants : desktopVariants;
};

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const variants = getRouteAnimation(location.pathname, isMobile);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
