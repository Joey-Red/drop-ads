import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("M975 refuses nested interactive descendants in page actions", () => {
  assert.match(source, /function interactiveDescendantUnsafe\(element\)/);
  assert.match(source, /function actionTreeExcludesInteractiveDescendants\(element\)/);
  assert.match(source, /role === "button" \|\| role === "link"/);
  assert.match(source, /visited > MAX_ACTION_ELEMENT_NODES \|\| interactiveDescendantUnsafe\(node\)/);
  assert.match(source, /!actionTreeExcludesInteractiveDescendants\(element\)/);
});

test("M975 retains no interaction history", () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|analytics|telemetry/i);
});
