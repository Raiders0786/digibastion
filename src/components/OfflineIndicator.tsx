import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { Button } from '@/components/ui/button';

export const OfflineIndicator = () => {
  const { isOnline, hasUpdate, skipWaiting } = useServiceWorker();

  return (
    <>
      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <WifiOff className="w-4 h-4" />
            <span>You're offline. Some features may be limited.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update available banner */}
      <AnimatePresence>
        {hasUpdate && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 left-4 right-4 z-[100] bg-primary text-primary-foreground py-3 px-4 rounded-xl shadow-xl flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">New version available!</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={skipWaiting}
              className="shrink-0"
            >
              Update
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
