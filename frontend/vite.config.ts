import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          vendor: ["axios", "lucide-react", "clsx"]
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
