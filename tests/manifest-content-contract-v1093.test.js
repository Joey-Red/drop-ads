import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CANONICAL_CONTENT_SCRIPTS, CANONICAL_CONTENT_SCRIPT_FILES } from "../tools/manifest-content-contract.mjs";

const audit = fs.readFileSync(new URL("../tools/manifest-audit.mjs", import.meta.url), "utf8");
const chromium = JSON.parse(fs.readFileSync(new URL("../manifests/chromium.json", import.meta.url), "utf8"));
const firefox = JSON.parse(fs.readFileSync(new URL("../manifests/firefox.json", import.meta.url), "utf8"));

test("M1093 canonical content contract is immutable and exact", () => {
  assert.ok(Object.isFrozen(CANONICAL_CONTENT_SCRIPTS));
  assert.equal(CANONICAL_CONTENT_SCRIPTS.length, 2);
  for (const group of CANONICAL_CONTENT_SCRIPTS) {
    assert.ok(Object.isFrozen(group));
    assert.ok(Object.isFrozen(group.matches));
    assert.ok(Object.isFrozen(group.js));
  }
  assert.deepEqual(chromium.content_scripts, CANONICAL_CONTENT_SCRIPTS);
  assert.deepEqual(firefox.content_scripts, CANONICAL_CONTENT_SCRIPTS);
  assert.deepEqual(CANONICAL_CONTENT_SCRIPT_FILES, CANONICAL_CONTENT_SCRIPTS.flatMap((entry) => entry.js));
});

test("M1093 manifest audit consumes the shared contract", () => {
  assert.match(audit, /from "\.\/manifest-content-contract\.mjs"/);
  assert.match(audit, /CANONICAL_CONTENT_SCRIPTS/);
});
