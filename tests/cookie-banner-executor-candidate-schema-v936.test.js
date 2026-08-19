import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner executor validates detached candidate snapshots only", () => {
  assert.match(source, /ownDataValue\(utils, "snapshotCandidate"\)/);
  assert.match(source, /typeof value === "function"/);
  assert.match(source, /function candidateSnapshotStillValid\(snapshot\)/);
  assert.match(source, /snapshot = Reflect\.apply\(snapshotCandidate, undefined, \[candidate\]\)/);
  assert.match(source, /snapshot && candidateSnapshotStillValid\(snapshot\)/);
  assert.match(source, /!snapshot \|\| !candidateSnapshotStillValid\(snapshot\)/);
  assert.match(source, /Reflect\.apply\(nativeClick, snapshot\.element, \[\]\)/);
  assert.doesNotMatch(source, /utils\.snapshotCandidate\(candidate\)/);
  assert.doesNotMatch(source, /Reflect\.apply\(nativeClick, candidate\.element/);
});
