import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");
const entry = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");

test("cosmetic required selectors mirror native validity without treating runtime text as invalidity", () => {
  assert.match(html, /<script type="module" src="ui-semantics\.js"><\/script>/);
  assert.match(entry, /import "\.\/form-state-semantics\.js";/);
  assert.match(source, /\["#cosmetic-hide-error", \["#cosmetic-hide-selector"\]\]/);
  assert.match(source, /\["#cosmetic-allow-error", \["#cosmetic-allow-selector"\]\]/);
  assert.match(source, /function isNativelyInvalid\(control\)/);
  assert.match(source, /control\?\.validity\?\.valid === false/);
  assert.match(source, /function publishNativeErrorState\(control, errorNode\)/);
  assert.match(source, /control\.setAttribute\("aria-invalid", "true"\)/);
  assert.match(source, /control\.setAttribute\("aria-errormessage", errorNode\.id\)/);
  assert.doesNotMatch(source, /\["#cosmetic-hide-error", \["#cosmetic-hide-domain", "#cosmetic-hide-selector"\]\]/);
  assert.doesNotMatch(source, /\["#cosmetic-allow-error", \["#cosmetic-allow-domain", "#cosmetic-allow-selector"\]\]/);
});
