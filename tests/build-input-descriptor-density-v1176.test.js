import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { snapshotBuildFingerprintInputs } from "../tools/build-input-descriptor-safety.mjs";

const helper = fs.readFileSync(new URL("../tools/build-input-descriptor-safety.mjs", import.meta.url), "utf8");
const sha256 = "0".repeat(64);

test("M1176 keeps dense descriptor arrays valid", () => {
  const snapshot = snapshotBuildFingerprintInputs([
    { path: "src/a.js", bytes: 1, sha256 },
    { path: "src/b.js", bytes: 2, sha256 }
  ]);
  assert.equal(snapshot.length, 2);
});

test("M1176 uses one key Set for linear hole checks and still rejects sparse arrays", () => {
  const sparse = new Array(2);
  sparse[1] = { path: "src/b.js", bytes: 1, sha256 };
  assert.throws(() => snapshotBuildFingerprintInputs(sparse), /dense data array|holes/);
  assert.match(helper, /const keySet = new Set\(keys\)/);
  assert.match(helper, /keySet\.has\("length"\)/);
  assert.match(helper, /keySet\.has\(key\)/);
  assert.doesNotMatch(helper, /keys\.includes/);
});
