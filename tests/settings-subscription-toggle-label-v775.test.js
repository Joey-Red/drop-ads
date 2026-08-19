import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("dynamic subscription toggles include their subscription title", () => {
  assert.match(source, /function labelSubscriptionToggles\(\)/);
  assert.match(source, /Enabled — \$\{title\}/);
  assert.match(source, /new globalThis\.MutationObserver\(labelSubscriptionToggles\)/);
  assert.match(source, /subscriptionObserver\?\.disconnect\(\)/);
});
