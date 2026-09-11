import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["games/_kit/**/*.test.ts", "games/**/*.test.ts"],
  },
});
