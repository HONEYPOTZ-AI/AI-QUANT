import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
  react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  define: {
    // Security: API keys are NEVER exposed to frontend
    // All API calls must go through backend using window.ezsite.apis.run()
    'import.meta.env.VITE_API_SECURITY_NOTICE': JSON.stringify(
      '⚠️ Security: All API keys are securely stored on backend. Use window.ezsite.apis.run() for API calls.'
    )
  }
}));