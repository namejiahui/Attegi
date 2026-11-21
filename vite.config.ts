import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";
import { fileRoutes } from "filesystem-routing/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    solid({
      start: {
        middleware: "./src/middleware.ts",
        nodeServer: true,
      },
      ssr: true,
      serverFunctions: true,
      extensions: [".jsx", ".tsx"],
    }),
    fileRoutes({ httpMethods: true }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
