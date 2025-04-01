
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Add compression for dev server
    cors: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Add bundle analyzer in build mode
    mode === 'production' && visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure all files in the public directory are served at the root
  publicDir: "public",
  build: {
    // Improve build error reporting for contributors
    reportCompressedSize: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Warn when files exceed recommended sizes
      maxParallelFileOps: 3,
      output: {
        // Optimize code splitting
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@/components/ui/index.ts'],
          vendor: [
            '@tanstack/react-query',
            'lucide-react', 
            'recharts',
            'sonner',
          ],
        },
        // Add code splitting for CSS
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
      }
    },
    // Add source maps for easier debugging
    sourcemap: true,
    // Modern build target for better performance
    target: 'es2020',
    // Minify output
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: mode === 'production',
      },
    },
  },
  // Customize error overlay for better contributor experience
  css: {
    devSourcemap: true,
  },
  // Configure the preview option for better local testing
  preview: {
    port: 8081,
    strictPort: true,
    open: true,
    cors: true,
  },
  // Add esbuild options
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
}));
