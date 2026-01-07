import fs from "fs";
import path from "path";

const target = process.argv[2];
if (!target) {
  throw new Error("Target required: chromium | firefox");
}

const outDir = `build/${target}`;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

fs.cpSync("src", outDir, { recursive: true });
fs.copyFileSync(
  `manifests/manifest.${target}.json`,
  path.join(outDir, "manifest.json")
);

console.log(`Built for ${target}`);
