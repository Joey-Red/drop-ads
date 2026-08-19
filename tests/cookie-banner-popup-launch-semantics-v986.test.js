import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-context-safety.js", import.meta.url), "utf8");

test("cookie-banner actions refuse aria-haspopup popup-launch semantics", () => {
  assert.match(source, /function popupLaunchSemanticsSafe\(element\)/);
  assert.match(source, /elementHasAttribute\(element, "aria-haspopup"\)/);
  assert.match(source, /elementAttribute\(element, "aria-haspopup"\)/);
  assert.match(source, /\.trim\(\)\.toLowerCase\(\) === "false"/);
  assert.match(source, /!popupLaunchSemanticsSafe\(element\)/);
});
