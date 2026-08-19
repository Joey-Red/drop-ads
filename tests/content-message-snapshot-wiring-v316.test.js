import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/context-cleanup.js", import.meta.url), "utf8");

test("context cleanup uses detached message snapshots", () => {
  assert.equal(source.includes('messageContract.snapshot(message, "drop-ads:cleanup-context-target")'), true);
  assert.equal(source.includes("cleanupRememberedTarget(snapshot)"), true);
});
