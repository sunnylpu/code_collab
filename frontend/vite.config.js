import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Monaco editor and yjs must be explicitly included
    include: ["yjs", "@monaco-editor/react"],
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "monaco-vendor": ["@monaco-editor/react"],
          "yjs-vendor": ["yjs"],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Proxy API calls to backend in dev (avoids CORS)
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5050",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
