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
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1': {
        target: 'http://localhost:8073',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
