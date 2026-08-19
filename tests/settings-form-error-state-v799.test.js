import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");
const entry = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("M799 Settings native validity feedback is centralized in the canonical helper", () => {
  assert.match(entry, /import "\.\/form-state-semantics\.js";/);
  assert.match(source, /const nativeErrorBindings = \[/);
  assert.match(source, /\["#block-error", \["#block-input"\]\]/);
  assert.match(source, /\["#allow-error", \["#allow-input"\]\]/);
  assert.match(source, /\["#subscription-error", \["#subscription-url"\]\]/);
  assert.match(source, /\["#cookie-exception-error", \["#cookie-exception-input"\]\]/);
  assert.match(source, /function isNativelyInvalid\(control\)/);
  assert.match(source, /function publishNativeErrorState\(control, errorNode\)/);
  assert.match(source, /const invalid = isNativelyInvalid\(control\)/);
  assert.match(source, /observer\.disconnect\(\)/);
  assert.match(source, /control\.removeEventListener\(eventName, listener\)/);
  assert.doesNotMatch(source, /semanticErrorBindings|ownSemanticErrorState/);
});
