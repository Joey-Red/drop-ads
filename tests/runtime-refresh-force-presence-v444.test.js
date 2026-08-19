import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

test("M444 refresh-list message validates every explicitly present force value", () => {
  assert.match(source, /case "drop-ads:refresh-lists":[\s\S]*?if \(Object\.hasOwn\(message, "force"\)\) assertBoolean\(message\.force, "force"\);/);
  assert.doesNotMatch(source, /if \(message\.force != null\) assertBoolean\(message\.force, "force"\);/);
});

test("M444 omission remains valid through the optional exact message field", () => {
  assert.match(source, /assertExactKeys\(message, \["type"\], \["force"\]\)/);
});
