import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/verify-reproducible.mjs", import.meta.url), "utf8");

test("M1128 strips Node injection/configuration variables from reproducibility children", () => {
  for (const marker of [
    '"NODE_OPTIONS"',
    '"NODE_PATH"',
    '"NODE_REPL_EXTERNAL_MODULE"',
    '"NODE_ICU_DATA"',
    "export function reproducibilityChildEnv",
    "Object.create(null)",
    "BLOCKED_REPRODUCIBILITY_ENV.has(key)",
    'typeof value === "string"'
  ]) assert.ok(source.includes(marker), `missing M1128 marker ${marker}`);
});

test("M1128 spawned build/package passes use the sanitized environment", () => {
  const helper = source.indexOf("export function reproducibilityChildEnv");
  const runner = source.indexOf("async function runNodeTool", helper);
  const sanitize = source.indexOf("const env = reproducibilityChildEnv(process.env)", runner);
  const spawn = source.indexOf("spawn(process.execPath", runner);
  const envField = source.indexOf("env\n    });", spawn);
  assert.ok(helper >= 0 && runner > helper && sanitize > runner && spawn > sanitize && envField > spawn);
  assert.doesNotMatch(source.slice(runner, source.indexOf("export async function runVerifiedBuildPass", runner)), /env:\s*process\.env/);
});
