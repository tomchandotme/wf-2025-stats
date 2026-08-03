import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

/**
 * Copies full yearly JSON into data/raw/ and writes ALL-only client payloads
 * to public/data/ (strips unused platform segments like NI/PC/PS/XB).
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const rawDir = resolve(root, "data/raw");
const publicDir = resolve(root, "public/data");

const YEARS = [2022, 2023, 2024, 2025] as const;

mkdirSync(rawDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

for (const year of YEARS) {
  const fileName = `WarframeUsageData${year}.json`;
  const publicPath = resolve(publicDir, fileName);
  const rawPath = resolve(rawDir, fileName);

  // Prefer an existing raw archive; otherwise snapshot current public file.
  let sourcePath = publicPath;
  try {
    readFileSync(rawPath);
    sourcePath = rawPath;
  } catch {
    copyFileSync(publicPath, rawPath);
    sourcePath = rawPath;
    console.log(`archived ${fileName} -> data/raw/`);
  }

  const data = JSON.parse(readFileSync(sourcePath, "utf8")) as {
    ALL?: unknown;
  };
  if (!data.ALL || typeof data.ALL !== "object") {
    throw new Error(`${fileName} is missing ALL segment`);
  }

  writeFileSync(publicPath, JSON.stringify({ ALL: data.ALL }));
  console.log(`wrote ALL-only ${fileName}`);
}
