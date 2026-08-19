import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function reject(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`${label} is forbidden`);
}

const rules = read("src/core/cosmetic-rules.js");
const order = read("src/core/text-order.js");
const packageJson = read("package.json");

for (const [needle, label] of [
  ["compareCodeUnitText", "fixed code-unit cosmetic ordering"],
  ["Object.freeze({ selector", "frozen normalized cosmetic rule"],
  ["Object.freeze([...deduped.values()]", "frozen normalized cosmetic collection"],
  ["normalizedRuleMatchesHostname", "single-pass normalized hostname matching"],
  ["COSMETIC_STYLESHEET_SEPARATOR_BYTES", "stylesheet separator byte accounting"],
  ["COSMETIC_STYLESHEET_SUFFIX_BYTES", "stylesheet suffix byte accounting"],
  ["projectedBytes", "projected stylesheet byte admission"],
  ["accepted.has(selector)", "Set-based compiled selector membership"],
  ["const seen = new Set()", "direct stylesheet dedupe set"],
  ["seen.has(selector)", "direct stylesheet duplicate rejection"]
]) requireText(rules, needle, label);

for (const [needle, label] of [
  ["if (left < right) return -1", "code-unit lower branch"],
  ["if (left > right) return 1", "code-unit upper branch"]
]) requireText(order, needle, label);

reject(rules, /\.localeCompare\s*\(/, "locale-sensitive cosmetic ordering");
reject(rules, /target\.includes\s*\(/, "linear compiled-selector duplicate scan");

requireText(packageJson, '"cosmetic-hardening-audit": "node tools/cosmetic-hardening-audit.mjs"', "package cosmetic hardening audit script");
requireText(packageJson, "npm run cosmetic-hardening-audit", "npm check cosmetic hardening gate");

console.log("cosmetic-hardening-audit: deterministic bounded cosmetic policy boundaries verified");
