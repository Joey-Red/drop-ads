import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");

test("M806 cosmetic inputs and submit actions retain guidance plus live scope", () => {
  assert.match(source, /function appendDescription\(control, id\)/);
  assert.match(source, /installCosmeticScopePreview\([\s\S]*"#cosmetic-hide-form"[\s\S]*"cosmetic-hide-scope-status"[\s\S]*\["#cosmetic-hide-domain", "#cosmetic-hide-selector", "#cosmetic-hide-form button\[type=/);
  assert.match(source, /installCosmeticScopePreview\([\s\S]*"#cosmetic-allow-form"[\s\S]*"cosmetic-allow-scope-status"[\s\S]*\["#cosmetic-allow-domain", "#cosmetic-allow-selector", "#cosmetic-allow-form button\[type=/);
  assert.match(source, /for \(const selector of controlSelectors\) appendDescription\(document\.querySelector\(selector\), statusId\)/);
  assert.match(source, /ownListener\(domainInput, "input", update\)/);
});
