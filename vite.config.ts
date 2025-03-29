
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
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
    rollupOptions: {
      // Warn when files exceed recommended sizes
      maxParallelFileOps: 3,
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@/components/ui'],
        }
      }
    },
    // Add source maps for easier debugging
    sourcemap: true,
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
  }
}));
