import Items from "@wfcd/items";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../data");

const items = new Items({
  category: ["Warframes", "Primary", "Secondary", "Melee"],
});

const urls: Record<string, string> = {};

items.forEach((v) => {
  if (v.name && v.imageName) {
    urls[v.name] = v.imageName;
  }

  if (v.category === "Warframes" && v.name.endsWith(" Prime")) {
    const normalName = v.name.replace(" Prime", "");

    if (v.imageName) {
      urls[normalName] = v.imageName;
    }
  }
});

// Manual aliases for names that differ between DE usage reports and WFCD items.
const IMAGE_ALIASES: Record<string, string> = {
  "MK1-Bo": "Bo",
  "MK1-Furax": "Furax",
  "MK1-Braton": "Braton",
  "MK1-Paris": "Paris",
  "MK1-Strun": "Strun",
  "MK1-Furis": "Furis",
  "MK1-Kunai": "Kunai",
  "Dark Split-Sword (Dual Swords)": "Dark Split-Sword",
  "Dark Split-Sword (Heavy Blade)": "Dark Split-Sword",
  "Vinquibus (Melee)": "Vinquibus",
  "Vinquibus (Primary)": "Vinquibus",
  "AX-52": "Ax-52",
  "EFV-5 Jupiter": "Efv-5 Jupiter",
  "EFV-8 Mars": "Efv-8 Mars",
  Zaw: "Kronsh",
};

for (const [alias, target] of Object.entries(IMAGE_ALIASES)) {
  if (!urls[alias] && urls[target]) {
    urls[alias] = urls[target];
  }
}

// Ensure data directory exists
mkdirSync(dataDir, { recursive: true });

const outputPath = resolve(dataDir, "urls.json");
writeFileSync(outputPath, JSON.stringify(urls, null, 2));
console.log("urls.json written to `/data` directory");
