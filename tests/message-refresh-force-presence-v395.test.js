import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

test("M395 optional refresh force distinguishes omission from explicit invalid values", () => {
  assert.match(source, /case "drop-ads:refresh-lists":\s*assertExactKeys\(message, \["type"\], \["force"\]\);\s*if \(Object\.hasOwn\(message, "force"\)\) assertBoolean\(message\.force, "force"\);/s);
  assert.doesNotMatch(source, /message\.force != null/);
});
