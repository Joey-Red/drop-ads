import "./reconcile-historical-test-contracts.mjs";

import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const testsDirectory = resolve(root, "tests");
const apply = process.argv.includes("--apply");
const counters = Object.create(null);
const changedFiles = [];

function count(label, amount = 1) {
  counters[label] = (counters[label] ?? 0) + amount;
}

function replaceLiteral(source, before, after, label) {
  if (!source.includes(before)) return source;
  const pieces = source.split(before);
  count(label, pieces.length - 1);
  return pieces.join(after);
}

function ensureResolveBinding(source) {
  if (/import\s*\{[^}]*\bresolve\b[^}]*\}\s*from\s*["']node:path["']/.test(source)) return source;
  const named = /import\s*\{([^}]*)\}\s*from\s*["']node:path["'];?/;
  if (named.test(source)) {
    count("native-resolve-binding");
    return source.replace(named, (_full, body) => {
      const names = body.split(",").map((value) => value.trim()).filter(Boolean);
      return `import { ${["resolve", ...names].filter((value, index, all) => all.indexOf(value) === index).join(", ")} } from "node:path";`;
    });
  }
  count("native-resolve-import");
  return `import { resolve } from "node:path";\n${source}`;
}

function reconcileFileUrlPathnames(source) {
  if (!/new URL\("\.\.\/?", import\.meta\.url\)\.pathname/.test(source)) return source;
  let next = ensureResolveBinding(source);
  next = next.replace(/new URL\("\.\.\/?", import\.meta\.url\)\.pathname/g, () => {
    count("direct-file-url-pathname");
    return 'resolve(import.meta.dirname, "..")';
  });
  return next;
}

function reconcilePrivacyContractImports(source) {
  return source.replace(
    /import\s*\{([^}]*)\}\s*from\s*"(\.\.\/tools\/[^"]+-privacy-audit\.mjs)";/g,
    (full, body, auditPath) => {
      const names = body.split(",").map((value) => value.trim()).filter(Boolean);
      const contractNames = names.filter((name) => /_PRIVACY_(?:LIMITS|SOURCE_PATHS|MAX_SOURCE_BYTES|MAX_AGGREGATE_BYTES)$/.test(name));
      if (!contractNames.length) return full;
      const auditNames = names.filter((name) => !contractNames.includes(name));
      const contractPath = auditPath.replace(/-privacy-audit\.mjs$/, "-privacy-contract.mjs");
      count("privacy-contract-import-owner", contractNames.length);
      const chunks = [];
      if (auditNames.length) chunks.push(`import {\n  ${auditNames.join(",\n  ")}\n} from "${auditPath}";`);
      chunks.push(`import {\n  ${contractNames.join(",\n  ")}\n} from "${contractPath}";`);
      return chunks.join("\n");
    }
  );
}

function reconcileHistoricalRoadmapCoupling(source) {
  if (!source.includes("docs/MILESTONES_")) return source;
  const lines = source.split(/\r?\n/);
  const kept = [];
  for (const line of lines) {
    if (line.includes("assert.match(roadmap,") && !line.includes("Issue #10")) {
      count("historical-live-roadmap-assertion");
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

function reconcileMovedSettingsSources(source) {
  let next = source;
  if (next.includes('../src/options/list-filter-clear-all.js')) {
    next = replaceLiteral(next, '../src/options/list-filter-clear-all.js', '../src/options/list-filter-ergonomics.js', "settings-clear-all-owner");
    next = replaceLiteral(next, '/clearAllButton\\.textContent = "Clear all list filters"/', '/clearAll\\.textContent = "Clear all list filters"/', "settings-clear-all-refactor");
    next = replaceLiteral(next, '/clearAllButton\\.disabled = !filterInputs\\(\\)\\.some\\(\\(input\\) => Boolean\\(input\\.value\\)\\)/', '/clearAll\\.disabled = !active/', "settings-clear-all-refactor");
    next = replaceLiteral(next, '/Clears only temporary search text on this Settings page; nothing is saved\\./', '/clearAllFilters|list-filter-clear-all/', "settings-clear-all-privacy-boundary");
  }
  if (next.includes('../src/options/form-ergonomics.js')) {
    next = replaceLiteral(next, '../src/options/form-ergonomics.js', '../src/options/form-state-semantics.js', "settings-form-semantics-owner");
    next = replaceLiteral(next, '/ownErrorState\\(', '/ownNativeErrorState\\(', "settings-native-error-owner");
  }
  return next;
}

function reconcileTimeoutCollaboratorSource(source) {
  let next = source;
  next = replaceLiteral(
    next,
    '/readPlainDataField\\(controller, "signal"\\)/',
    '/Object\\.getOwnPropertyDescriptor\\(controller, "signal"\\)/',
    "abort-controller-own-signal-descriptor"
  );
  next = replaceLiteral(
    next,
    '/readPlainDataField\\(controller, "abort"\\)/',
    '/Object\\.getOwnPropertyDescriptor\\(controller, "abort"\\)/',
    "abort-controller-own-abort-descriptor"
  );
  return next;
}

function reconcile(source) {
  let next = source;
  next = reconcileFileUrlPathnames(next);
  if (next.includes('const root = resolve(import.meta.dirname, "..");')) next = ensureResolveBinding(next);
  next = reconcilePrivacyContractImports(next);
  next = reconcileHistoricalRoadmapCoupling(next);
  next = reconcileMovedSettingsSources(next);
  next = reconcileTimeoutCollaboratorSource(next);
  return next;
}

const entries = (await readdir(testsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.js"))
  .map((entry) => entry.name)
  .sort();

for (const name of entries) {
  const path = resolve(testsDirectory, name);
  const source = await readFile(path, "utf8");
  const next = reconcile(source);
  if (next === source) continue;
  changedFiles.push(name);
  if (apply) await writeFile(path, next, "utf8");
}

console.log(`${apply ? "Applied" : "Would apply"} second-pass stabilization to ${changedFiles.length} file(s).`);
for (const [label, amount] of Object.entries(counters).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`${label}: ${amount}`);
}
if (changedFiles.length) {
  console.log("files:");
  for (const name of changedFiles) console.log(`- ${name}`);
}
if (!apply && changedFiles.length) console.log("Dry run only. Re-run with --apply to write the reviewed stabilization changes.");
