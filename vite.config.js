import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "/src": path.resolve(__dirname, "src"),
      "@": path.resolve(__dirname, "src")
    }
  },
  server: {
    port: 4173
  },
  build: {
    chunkSizeWarningLimit: 16000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("echarts")) return "vendor-echarts";
          if (id.includes("xlsx")) return "vendor-xlsx";
          if (id.includes("jspdf")) return "vendor-pdf";
          if (id.includes("i18next")) return "vendor-i18n";
          if (id.includes("bootstrap") || id.includes("react-bootstrap")) return "vendor-ui";
          return undefined;
        }
      }
    }
  }
});
