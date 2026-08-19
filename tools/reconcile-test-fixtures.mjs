import "./reconcile-test-stabilization.mjs";

import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const testsDirectory = resolve(root, "tests");
const apply = process.argv.includes("--apply");
const changedFiles = [];
let insertedCookieBannerFields = 0;
let insertedCosmeticFields = 0;
let completedRuntimeApis = 0;

const RUNTIME_FIXTURE_FILES = new Set([
  "runtime-core-listener-lifecycle.test.js",
  "runtime-core-listener-teardown-v417.test.js",
  "runtime-core-teardown-v417.test.js",
  "runtime-core-listener-teardown-v422.test.js",
  "runtime-external-subscription-admission-v458.test.js",
  "runtime-external-subscription-admission-v445.test.js",
  "runtime-external-subscription-boundary-v418.test.js",
  "runtime-external-subscription-side-effects-v427.test.js",
  "runtime-initialize-options-v223.test.js",
  "runtime-listener-lifecycle-v423.test.js",
  "runtime-logger-collaborator-v418.test.js",
  "runtime-options-shape.test.js",
  "runtime-options-snapshot-v442.test.js",
  "runtime-response-error-bound-v426.test.js"
]);

function migrateStateFactory(source) {
  if (!source.includes('from "../src/core/settings-backup.js"') || !source.includes("createSettingsBackup")) return source;
  return source.replace(
    /function state(\([^)]*\))\s*\{\s*return\s*\{([\s\S]*?)\n\s*\};\s*\}/,
    (full, args, body) => {
      let nextBody = body;
      if (!/\bcookieBannerMode\s*:/.test(nextBody)) {
        nextBody = nextBody.replace(
          /(\n\s*cookieMode\s*:\s*[^,\n]+,)/,
          '$1\n    cookieBannerMode: "reject",\n    cookieBannerDisabledSites: [],'
        );
        insertedCookieBannerFields += 1;
      } else if (!/\bcookieBannerDisabledSites\s*:/.test(nextBody)) {
        nextBody = nextBody.replace(
          /(\n\s*cookieBannerMode\s*:\s*[^,\n]+,)/,
          '$1\n    cookieBannerDisabledSites: [],'
        );
        insertedCookieBannerFields += 1;
      }
      if (!/\bpersonalCosmeticHide\s*:/.test(nextBody)) {
        nextBody = nextBody.replace(
          /(\n\s*personalAllow\s*:\s*[^,\n]+,)/,
          '$1\n    personalCosmeticHide: [],\n    personalCosmeticAllow: [],'
        );
        insertedCosmeticFields += 1;
      } else if (!/\bpersonalCosmeticAllow\s*:/.test(nextBody)) {
        nextBody = nextBody.replace(
          /(\n\s*personalCosmeticHide\s*:\s*[^,\n]+,)/,
          '$1\n    personalCosmeticAllow: [],'
        );
        insertedCosmeticFields += 1;
      }
      return `function state${args} {\n  return {${nextBody}\n  };\n}`;
    }
  );
}

function ensureRuntimeFixtureImport(source) {
  if (source.includes('from "./helpers/background-api-fixture.js"')) return source;
  const marker = 'import { createBackgroundRuntime } from "../src/core/runtime.js";';
  if (!source.includes(marker)) return source;
  return source.replace(marker, `${marker}\nimport { completeBackgroundApiFixture } from "./helpers/background-api-fixture.js";`);
}

function migrateRuntimeFixture(name, source) {
  if (!RUNTIME_FIXTURE_FILES.has(name)) return source;
  let next = ensureRuntimeFixtureImport(source);
  const before = next;
  next = next.replace(/createBackgroundRuntime\(\{ api \}\)/g, "createBackgroundRuntime({ api: completeBackgroundApiFixture(api) })");
  next = next.replace(/createBackgroundRuntime\(\{ api,/g, "createBackgroundRuntime({ api: completeBackgroundApiFixture(api),");
  next = next.replace(/api:\s*minimalApi\(\)/g, "api: completeBackgroundApiFixture(minimalApi())");
  next = next.replace(/api:\s*runtimeApi\(\)/g, "api: completeBackgroundApiFixture(runtimeApi())");
  if (next !== before) completedRuntimeApis += 1;
  return next;
}

const entries = (await readdir(testsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.js"))
  .map((entry) => entry.name)
  .sort();

for (const name of entries) {
  const path = resolve(testsDirectory, name);
  const source = await readFile(path, "utf8");
  let next = migrateStateFactory(source);
  next = migrateRuntimeFixture(name, next);
  if (next === source) continue;
  changedFiles.push(name);
  if (apply) await writeFile(path, next, "utf8");
}

console.log(`${apply ? "Applied" : "Would apply"} fixture migration to ${changedFiles.length} file(s).`);
console.log(`cookie-banner fixture insertions: ${insertedCookieBannerFields}`);
console.log(`cosmetic fixture insertions: ${insertedCosmeticFields}`);
console.log(`runtime API fixture completions: ${completedRuntimeApis}`);
if (changedFiles.length) {
  console.log("files:");
  for (const name of changedFiles) console.log(`- ${name}`);
}
if (!apply && changedFiles.length) console.log("Dry run only. Re-run with --apply to write the reviewed fixture changes.");
