import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isInstalled: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    registration: null,
  });

  useEffect(() => {
    const isPreviewHost = /(?:id-preview--|lovableproject\.com|localhost)/.test(window.location.hostname);
    const shouldRegister = 'serviceWorker' in navigator && import.meta.env.PROD && !isPreviewHost;

    let removeControllerListener: (() => void) | null = null;

    if (shouldRegister) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration.scope);
          setState((prev) => ({ ...prev, isInstalled: true, registration }));

          // Force an update check on each fresh load.
          registration.update().catch(() => {
            // Ignore update check failures silently.
          });

          const activateWaitingWorker = (worker: ServiceWorker | null) => {
            worker?.postMessage('skipWaiting');
          };

          // Activate already waiting updates immediately.
          activateWaitingWorker(registration.waiting);

          // Auto-activate incoming updates.
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  activateWaitingWorker(newWorker);
                }
              });
            }
          });

          const onControllerChange = () => {
            window.location.reload();
          };

          navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
          removeControllerListener = () => {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          };
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    }

    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      removeControllerListener?.();
    };
  }, []);

  return state;
};
