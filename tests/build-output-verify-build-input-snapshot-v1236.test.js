import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/build-output-verify.mjs", import.meta.url), "utf8");

test("M1236 snapshots verifier build-input descriptors through the canonical validator", () => {
  assert.match(source, /snapshotBuildFingerprintInputs/);
  const fn = source.indexOf("function buildInputDescriptorMap(buildInfo)");
  const snapshot = source.indexOf("const inputs = snapshotBuildFingerprintInputs(buildInfo.inputs);", fn);
  const iterate = source.indexOf("for (const descriptor of inputs)", snapshot);
  assert.ok(fn >= 0 && snapshot > fn && iterate > snapshot, "descriptor snapshot must precede verifier mapping");
  assert.doesNotMatch(source.slice(fn, source.indexOf("function generatedSourceFingerprintPath", fn)), /for \(const descriptor of buildInfo\.inputs\)/);
  assert.match(source, /Duplicate build-info input descriptor/);
  assert.match(source, /map\.set\(descriptor\.path, descriptor\)/);
});
