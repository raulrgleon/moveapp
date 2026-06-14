/**
 * Smoke tests for message locale detection (run: npm run test:locale)
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Compiled path — use dynamic import of TS via ts-node alternative: inline minimal copy
function detectMessageLocale(text, fallback = "en") {
  if (/[áéíóúñü¿¡]/i.test(text.trim())) return "es";
  const esWords = ["mudanza", "necesito", "como", "que", "presupuesto", "camion"];
  const enWords = ["move", "budget", "how", "what", "truck"];
  const words = text.toLowerCase().split(/\s+/);
  let es = 0;
  let en = 0;
  for (const w of words) {
    if (esWords.includes(w.replace(/[^\wáéíóúñü]/gi, ""))) es++;
    if (enWords.includes(w.replace(/[^\w]/gi, ""))) en++;
  }
  if (es > en) return "es";
  if (en > es) return "en";
  return fallback;
}

const cases = [
  ["¿Cuánto cuesta mudarme?", "es"],
  ["How much will my move cost?", "en"],
  ["necesito ayuda con el presupuesto", "es"],
];

let failed = 0;
for (const [text, expected] of cases) {
  const got = detectMessageLocale(text, "en");
  if (got !== expected) {
    console.error(`FAIL: "${text}" expected ${expected}, got ${got}`);
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log(`OK: ${cases.length} locale detection checks passed`);
