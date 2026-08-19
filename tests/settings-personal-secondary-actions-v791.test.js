import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");

test("personal block secondary actions are explicit and described", () => {
  assert.match(source, /action\.textContent = "Prepare submission"/);
  assert.match(source, /Prepare community submission for \$\{labelText\}/);
  assert.match(source, /appendDescription\(action, "block-help", "community-help", "block-error"\)/);
  assert.match(source, /action\.textContent = "Remove allow override"/);
  assert.match(source, /Remove allow override for \$\{labelText\}/);
  assert.match(source, /appendDescription\(action, "allow-help", "allow-error"\)/);
});
