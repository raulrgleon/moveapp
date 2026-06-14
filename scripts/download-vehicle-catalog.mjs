/**
 * Downloads NHTSA vehicle models for curated US makes × model years.
 * Run: npm run download-vehicles
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../src/lib/vehicles/data");
const OUT_FILE = path.join(OUT_DIR, "vehicle-catalog.json");

const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

/** Same list as us-vehicle-makes.ts */
const MAKES = [
  { makeId: 460, label: "Ford" },
  { makeId: 467, label: "Chevrolet" },
  { makeId: 448, label: "Toyota" },
  { makeId: 474, label: "Honda" },
  { makeId: 478, label: "Nissan" },
  { makeId: 496, label: "Ram" },
  { makeId: 483, label: "Jeep" },
  { makeId: 472, label: "GMC" },
  { makeId: 498, label: "Hyundai" },
  { makeId: 499, label: "Kia" },
  { makeId: 482, label: "Volkswagen" },
  { makeId: 523, label: "Subaru" },
  { makeId: 473, label: "Mazda" },
  { makeId: 476, label: "Dodge" },
  { makeId: 477, label: "Chrysler" },
  { makeId: 515, label: "Lexus" },
  { makeId: 452, label: "BMW" },
  { makeId: 449, label: "Mercedes-Benz" },
  { makeId: 582, label: "Audi" },
  { makeId: 441, label: "Tesla" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getYears() {
  const current = new Date().getFullYear() + 1;
  const years = [];
  for (let y = current; y >= 1990; y--) years.push(String(y));
  return years;
}

async function fetchModels(makeId, year) {
  const url = `${NHTSA_BASE}/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NHTSA ${res.status} make=${makeId} year=${year}`);
  const data = await res.json();
  const seen = new Set();
  const models = [];
  for (const row of data.Results ?? []) {
    const modelName = row.Model_Name;
    const modelId = Number(row.Model_ID ?? row.ModelId ?? 0);
    if (!modelName || seen.has(modelName)) continue;
    seen.add(modelName);
    models.push({ modelId, modelName });
  }
  models.sort((a, b) => a.modelName.localeCompare(b.modelName));
  return models;
}

async function main() {
  const years = getYears();
  const models = {};
  let done = 0;
  const total = MAKES.length * years.length;

  console.log(`Downloading ${total} make/year combinations…`);

  for (const make of MAKES) {
    for (const year of years) {
      const key = `${make.makeId}-${year}`;
      try {
        models[key] = await fetchModels(make.makeId, year);
      } catch (err) {
        console.warn(`  skip ${make.label} ${year}:`, err.message);
        models[key] = [];
      }
      done += 1;
      if (done % 50 === 0) {
        console.log(`  ${done}/${total} (${Math.round((done / total) * 100)}%)`);
      }
      await sleep(120);
    }
  }

  const catalog = {
    version: 1,
    generatedAt: new Date().toISOString(),
    makes: MAKES,
    years,
    models,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(catalog), "utf8");

  const sizeMb = (Buffer.byteLength(JSON.stringify(catalog)) / 1024 / 1024).toFixed(2);
  console.log(`Wrote ${OUT_FILE} (${sizeMb} MB, ${Object.keys(models).length} keys)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
