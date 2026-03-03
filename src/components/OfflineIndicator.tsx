import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

export const OfflineIndicator = () => {
  const { isOnline } = useServiceWorker();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-warning text-warning-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be limited.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
