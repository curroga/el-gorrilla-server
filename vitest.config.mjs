import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.mjs"],
    setupFiles: ["./tests/setup.mjs"],
    // Starting an in-memory MongoDB can be slow on first run (binary download).
    hookTimeout: 60000,
    // Hide request logs (morgan) and console output unless a test fails.
    silent: "passed-only",
  },
});
