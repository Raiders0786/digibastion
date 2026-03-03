import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
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

          // Detect incoming updates.
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState((prev) => ({ ...prev, hasUpdate: true }));
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

  const skipWaiting = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage('skipWaiting');
    }
  };

  return {
    ...state,
    skipWaiting,
  };
};
