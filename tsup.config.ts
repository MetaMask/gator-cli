import { defineConfig } from "tsup";
import path from "node:path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  esbuildOptions(options) {
    options.alias = {
      "@": path.resolve("src"),
    };
  },
});
