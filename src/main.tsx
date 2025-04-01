
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Performance measurement
const startTime = performance.now();

// Initialize app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Log performance metrics
window.addEventListener('load', () => {
  setTimeout(() => {
    const endTime = performance.now();
    console.log(`App initialization time: ${Math.round(endTime - startTime)}ms`);
    
    // Report Core Web Vitals if available
    if ('web-vitals' in window) {
      // Updated import to use named imports according to the current web-vitals API
      import('web-vitals').then((webVitals) => {
        webVitals.onCLS(console.log);
        webVitals.onFID(console.log);
        webVitals.onLCP(console.log);
      });
    }
    
    // Mark the app as fully loaded for screen readers
    const appRoot = document.getElementById('root');
    if (appRoot) {
      appRoot.setAttribute('aria-busy', 'false');
    }
  }, 0);
});
