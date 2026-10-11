import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("@cloudflare/kumo") || id.includes("@base-ui/react")) {
            return;
          }
          if (id.includes("node_modules")) {
            if (id.includes("@tanstack/react-query") || id.includes("@tanstack/react-router")) {
              return "tanstack-vendor";
            }
            if (id.includes("hugeicons-react") || id.includes("@phosphor-icons/react") || id.includes("lucide-react")) {
              return "icons";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
              return "react-vendor";
            }
            return "vendor";
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.tsx"],
    exclude: ["src/**/*.test.ts", "node_modules", "dist"]
  }
} as any);