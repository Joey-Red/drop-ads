import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");

test("backup feedback stays operational and clears when selection changes", () => {
  assert.match(source, /\["#backup-error", \[\["#import-settings-file", "change"\]\]\]/);
  assert.match(source, /function isNativelyInvalid\(control\)/);
  assert.doesNotMatch(source, /\["#backup-error",\s*\["#import-settings-file"\]\]/);
  assert.doesNotMatch(source, /semanticErrorBindings|ownSemanticErrorState/);
  assert.doesNotMatch(source, /\.files\?\.?\[0\]\?\.name|file\.name/);
  assert.match(source, /control\.removeEventListener\(eventName, listener\)/);
});
