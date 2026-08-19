import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const contract = fs.readFileSync(new URL("../tools/release-tool-contract.mjs", import.meta.url), "utf8");
const manifest = fs.readFileSync(new URL("../tools/release-manifest.mjs", import.meta.url), "utf8");

const required = [
  "tools/artifact-audit.mjs",
  "tools/build-output-verify.mjs",
  "tools/deterministic-zip.mjs",
  "tools/package.mjs",
  "tools/release-manifest-io.mjs",
  "tools/release-manifest.mjs",
  "tools/release-output-io.mjs",
  "tools/verify-release.mjs",
  "tools/verify-reproducible.mjs",
  "tools/zip-verify.mjs"
];

test("M1113 centralizes the exact release tool provenance set", () => {
  for (const path of required) assert.ok(contract.includes(`\"${path}\"`), `missing ${path}`);
  assert.match(contract, /Object\.freeze\(\[/);
  assert.match(manifest, /import \{ RELEASE_TOOL_PATHS \} from "\.\/release-tool-contract\.mjs"/);
  assert.match(manifest, /export const PACKAGING_TOOL_PATHS = RELEASE_TOOL_PATHS/);
});

test("M1113 provenance contract has no network or user-observation surface", () => {
  assert.doesNotMatch(contract, /fetch\(|XMLHttpRequest|WebSocket|navigator|localStorage|sessionStorage|telemetry|analytics/i);
});
