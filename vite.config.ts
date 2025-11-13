import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Detect if we're running tests
// Vitest sets VITEST environment variable
const isTest = !!process.env.VITEST;

export default defineConfig({
  plugins: [
    tailwindcss(),
    // Only apply React Router plugin when not in test mode
    // This prevents the plugin from trying to transform route files during tests
    ...(isTest ? [] : [reactRouter()]),
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
  },
});
