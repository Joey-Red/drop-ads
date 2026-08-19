import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M438 rejects obviously oversized fallback text before UTF-8 allocation", () => {
  const typeCheck = source.indexOf('if (typeof text !== "string") throw new Error("Remote list body must be text")');
  const charCheck = source.indexOf('if (text.length > byteLimit) throw new Error("Remote list is too large")');
  const byteCheck = source.indexOf('if (new TextEncoder().encode(text).byteLength > byteLimit) throw new Error("Remote list is too large")');
  assert.ok(typeCheck >= 0, "fallback string type check must exist");
  assert.ok(charCheck > typeCheck, "code-unit preflight must follow the string type check");
  assert.ok(byteCheck > charCheck, "exact UTF-8 byte check must run only after the code-unit preflight");
});

test("M438 uses the active caller byte limit for both fallback gates", () => {
  assert.match(source, /text\.length > byteLimit/);
  assert.match(source, /TextEncoder\(\)\.encode\(text\)\.byteLength > byteLimit/);
});
