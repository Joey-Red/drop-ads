import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");

function sectionBetween(start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1);
  assert.notEqual(endIndex, -1);
  return source.slice(startIndex, endIndex);
}

test("native constraint validity is the only aria-invalid source", () => {
  assert.match(source, /function isNativelyInvalid\(control\)/);
  assert.match(source, /control\?\.willValidate === true && control\?\.validity\?\.valid === false/);
  assert.match(source, /function publishNativeErrorState\(control, errorNode\)/);
  assert.match(source, /ownListener\(control, "input", sync\)/);
  assert.match(source, /ownListener\(control, "change", sync\)/);
  assert.match(source, /ownListener\(control, "invalid", sync\)/);

  const nativeBindings = sectionBetween("const nativeErrorBindings = [", "const clearOnEditBindings = [");
  assert.match(nativeBindings, /\["#subscription-error", \["#subscription-url"\]\]/);
  assert.match(nativeBindings, /\["#cosmetic-hide-error", \["#cosmetic-hide-selector"\]\]/);
  assert.match(nativeBindings, /\["#cosmetic-allow-error", \["#cosmetic-allow-selector"\]\]/);
  assert.doesNotMatch(nativeBindings, /#subscription-format|#backup-error|#cosmetic-hide-domain|#cosmetic-allow-domain/);
  assert.doesNotMatch(source, /semanticErrorBindings|ownSemanticErrorState/);
});
