var _a;
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
var repoName = (_a = process.env.GITHUB_REPOSITORY) === null || _a === void 0 ? void 0 : _a.split("/")[1];
// TODO: If you build this project locally for a GitHub Pages preview and the root path is wrong,
// replace "/" with your actual repository subpath, for example "/my-repo/".
export default defineConfig({
    base: repoName ? "/".concat(repoName, "/") : "/",
    plugins: [react()],
    build: {
        outDir: "dist",
    },
    test: {
        environment: "node",
    },
});
