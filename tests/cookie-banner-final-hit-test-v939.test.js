import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("cookie-banner executor re-runs exact hit testing immediately before native click", () => {
  const activation = source.slice(source.indexOf("function activateRejectionCandidate"));
  assert.match(activation, /!snapshot \|\| !candidateSnapshotStillValid\(snapshot\)/);
  assert.match(activation, /if \(!hitTestOwnsAction\(snapshot\.element\)\) return false;/);
  assert.match(activation, /Reflect\.apply\(nativeClick, snapshot\.element, \[\]\)/);
  assert.ok(
    activation.indexOf("hitTestOwnsAction(snapshot.element)") < activation.indexOf("Reflect.apply(nativeClick"),
    "final hit test must happen before click"
  );
});
