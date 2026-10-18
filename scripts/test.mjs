import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
await mkdir(".cache", { recursive: true });
await build({
  entryPoints: ["src/App.jsx"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: ".cache/App.mjs",
});
const result = spawnSync(
  process.execPath,
  ["--test", "tests/model.test.mjs", "tests/ui.test.mjs", "tests/production-client.test.mjs"],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
