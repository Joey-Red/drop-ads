import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");

test("personal row mutations retain governing guidance and transaction feedback", () => {
  assert.match(source, /appendDescription\(remove, prefix === "block" \? "block-help" : "allow-help", prefix === "block" \? "block-error" : "allow-error"\)/);
  assert.match(source, /appendDescription\(action, "block-help", "community-help", "block-error"\)/);
  assert.match(source, /appendDescription\(action, "allow-help", "allow-error"\)/);
  assert.match(source, /action\.textContent = "Remove allow override"/);
});
