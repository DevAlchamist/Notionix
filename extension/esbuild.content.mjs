import esbuild from "esbuild";

const common = {
  bundle: true,
  platform: "browser",
  target: "es2020",
  sourcemap: true,
  logLevel: "info",
};

await esbuild.build({
  ...common,
  entryPoints: {
    "content-chatgpt": "src/content-chatgpt.ts",
    "content-claude": "src/content-claude.ts",
    "content-gemini": "src/content-gemini.ts",
    "content-bing": "src/content-bing.ts",
  },
  outdir: "dist",
  format: "iife",
});

