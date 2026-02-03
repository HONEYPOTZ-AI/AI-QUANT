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
    // Note: POLYGON_API_KEY should ONLY be accessed from backend (Deno)
    // Frontend should call backend APIs, never expose API keys in frontend
    'import.meta.env.VITE_POLYGON_WARNING': JSON.stringify(
      'POLYGON_API_KEY must be accessed via backend only. Use window.ezsite.apis.run() to call backend functions.'
    )
  }
}));