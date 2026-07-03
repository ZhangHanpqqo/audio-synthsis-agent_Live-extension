import * as esbuild from "esbuild";
import * as fs from "node:fs";

async function build(): Promise<void> {
  const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const production = process.argv.includes("--production");

  await esbuild.build({
    entryPoints: ["src/extension.ts"],
    outfile: manifest.entry,
    bundle: true,
    format: "cjs",
    platform: "node",
    target: ["node24"],
    sourcesContent: false,
    logLevel: "info",
    minify: production,
    sourcemap: !production,
    loader: { ".html": "text" },
  });
}

void build();
