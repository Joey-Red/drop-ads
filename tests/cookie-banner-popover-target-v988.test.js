import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-context-safety.js", import.meta.url), "utf8");

test("cookie-banner actions reject HTML popover-target semantics", () => {
  assert.match(source, /function popoverTargetSemanticsSafe\(element\)/);
  assert.match(source, /elementHasAttribute\(element, "popovertarget"\)/);
  assert.match(source, /elementHasAttribute\(element, "popovertargetaction"\)/);
  assert.match(source, /return target !== null && action !== null && !target && !action/);
  assert.match(source, /!popoverTargetSemanticsSafe\(element\)/);
});
