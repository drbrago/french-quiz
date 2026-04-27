import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];

// TODO: If you build this project locally for a GitHub Pages preview and the root path is wrong,
// replace "/" with your actual repository subpath, for example "/my-repo/".
export default defineConfig({
  base: repoName ? `/${repoName}/` : "/",
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  test: {
    environment: "node",
  },
});
