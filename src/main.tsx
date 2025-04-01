
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
      import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
        getCLS(console.log);
        getFID(console.log);
        getLCP(console.log);
      });
    }
    
    // Mark the app as fully loaded for screen readers
    const appRoot = document.getElementById('root');
    if (appRoot) {
      appRoot.setAttribute('aria-busy', 'false');
    }
  }, 0);
});
