import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import pwaBuild from "./pwa/build-plugin.mjs";

export default defineConfig({
  plugins: [vue(), pwaBuild()],
  server: {
    port: 3000, // Porta para o servidor de desenvolvimento
  },
  build: {
    outDir: "dist", // Diretório de saída para a build
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
