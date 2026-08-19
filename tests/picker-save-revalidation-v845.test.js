import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const guard = fs.readFileSync(new URL("../src/content/picker-save-guard.js", import.meta.url), "utf8");
const picker = fs.readFileSync(new URL("../src/content/picker.js", import.meta.url), "utf8");

test("picker revalidates the exact connected target immediately before save", () => {
  assert.match(guard, /selectorUniquelyIdentifies\(selector, target, documentRef\)/);
  assert.match(guard, /Picker selection changed; choose the element again/);
  const verifyIndex = picker.indexOf("saveGuard.verifyCandidate(candidate, target, document);");
  const mutationIndex = picker.indexOf('type: "drop-ads:add-cosmetic-rule"');
  assert.ok(verifyIndex >= 0, "save-time verification is required");
  assert.ok(mutationIndex > verifyIndex, "verification must precede cosmetic mutation");
});
