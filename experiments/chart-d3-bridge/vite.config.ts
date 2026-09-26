import { defineConfig } from "vite";

export default defineConfig({
  build: { rollupOptions: { input: "experiments/chart-d3-bridge/index.html" } },
  optimizeDeps: { include: ["d3-selection", "d3-transition", "d3-zoom"] },
});
