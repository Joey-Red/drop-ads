import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/subscription-presentation.js", import.meta.url), "utf8");
const entry = fs.readFileSync(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");

test("configured filter lists identify built-in and external origin locally", () => {
  assert.match(entry, /import "\.\/subscription-presentation\.js";/);
  assert.match(source, /"External HTTPS list" : "Built-in list"/);
  assert.match(source, /row\.querySelector\("button\.remove"\)/);
  assert.match(source, /subscriptionPresentationObserver\?\.disconnect\(\)/);
});
