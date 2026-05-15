import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    importProtection: {
      client: {
        files: ["**/*.server.*"],
        specifiers: ["@tanstack/react-start/server"]
      }
    }
  }
});
