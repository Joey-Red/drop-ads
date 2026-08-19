import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");
const ui = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("primary Settings validity state is owned by the canonical helper", () => {
  assert.match(ui, /import "\.\/form-state-semantics\.js";/);
  assert.match(source, /\["#block-error", \["#block-input"\]\]/);
  assert.match(source, /\["#allow-error", \["#allow-input"\]\]/);
  assert.match(source, /\["#cookie-exception-error", \["#cookie-exception-input"\]\]/);
  assert.match(source, /function isNativelyInvalid\(control\)/);
  assert.match(source, /control\.setAttribute\("aria-invalid", "true"\)/);
  assert.match(source, /control\.setAttribute\("aria-errormessage", errorNode\.id\)/);
  assert.match(source, /observer\.disconnect\(\)/);
});
