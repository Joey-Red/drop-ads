import fs from "node:fs";
import { QUALIFICATION_SCENARIOS } from "./qualification-scenarios.mjs";

const path = "docs/QUALIFICATION_OBSERVATION_TEMPLATE.md";
const source = fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function requireText(needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

for (const [needle, label] of [
  ["Git commit: copied from the validated qualification record", "candidate commit binding"],
  ["Source fingerprint: copied from the validated qualification record", "source fingerprint binding"],
  ["Chromium ZIP SHA-256 and bytes", "Chromium package identity"],
  ["Firefox XPI SHA-256 and bytes", "Firefox package identity"],
  ["schema-v3 `artifacts/qualification-observation.json` seed", "v3 observation seed"],
  ["independent Chromium and Firefox `{ status: \"UNOBSERVED\", notes: \"\" }` result", "browser-isolated seed semantics"],
  ["Legacy schema-v2 observation artifacts are not active qualification evidence", "legacy v2 rejection"],
  ["cannot be safely auto-migrated", "legacy shared-note migration prohibition"],
  ["Use only `PASS`, `FAIL`, or `N/A` after a real observation", "scenario status semantics"],
  ["Leave the generated `UNOBSERVED` value in place until that browser actually exercises the scenario", "UNOBSERVED lifecycle"],
  ["A scenario note belongs only to the selected browser result", "browser-local scenario notes"],
  ["`UNOBSERVED` cannot be supplied with `--notes`", "unobserved note rejection"],
  ["`npm run qualification-observation-record-audit` passes for the current schema-v3 observation record", "v3 observation audit prerequisite"],
  ["npm run qualify:next -- chromium", "next-step helper"],
  ["`npm run qualify:status`", "status helper"],
  ["Do not recompute, normalize, shorten, or hand-edit those identity values", "candidate identity no-recompute rule"],
  ["If any identity value differs from `artifacts/qualification-record.json`, the observations are invalid", "candidate identity mismatch invalidation"],
  ["Do **not** record hostname, username, cwd/absolute paths, timestamps, environment dumps", "machine/user data prohibition"],
  ["browsing/request history", "history prohibition"],
  ["per-site/lifetime statistics", "statistics prohibition"],
  ["No telemetry, analytics, browsing/request history, retained statistics database", "final privacy invariant"]
]) requireText(needle, label);

const tableIds = [...source.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((match) => match[1]);
if (tableIds.length !== QUALIFICATION_SCENARIOS.length) throw new Error("qualification observation scenario table length differs from canonical catalog");
for (let index = 0; index < QUALIFICATION_SCENARIOS.length; index += 1) {
  if (tableIds[index] !== QUALIFICATION_SCENARIOS[index]) throw new Error("qualification observation scenario table differs from canonical catalog");
}
if (new Set(tableIds).size !== tableIds.length) throw new Error("qualification observation scenario table contains duplicate ids");

for (const pattern of [
  /^- Timestamp:/mi,
  /^- Hostname:/mi,
  /^- Username:/mi,
  /^- CWD:/mi,
  /^- Absolute path:/mi,
  /Scenario notes are shared by the Chromium\/Firefox result pair/i
]) {
  if (pattern.test(source)) throw new Error("qualification observation template contains obsolete or privacy-sensitive fields");
}

console.log("qualification-observation-audit: exact-head schema-v3 browser-isolated scenario template verified");
