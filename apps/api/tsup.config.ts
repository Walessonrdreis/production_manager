import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  format: ["cjs"],          // Render/Node rodando com require()
  target: "node20",
  sourcemap: true,
  clean: true,
  dts: false,
  splitting: false,
  treeshake: true
});
``