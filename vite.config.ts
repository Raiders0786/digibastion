
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
  },
  plugins: [
    react(),
    // Add bundle analyzer in build mode
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
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
      output: {
        // Add code splitting for CSS
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          
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
    // Keep production implementation details out of public artifacts.
    sourcemap: mode !== 'production',
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
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
    open: false,
  },
}));
