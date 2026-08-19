import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("fallback response text rejects obvious over-limit strings before UTF-8 allocation", () => {
  const stringCheck = source.indexOf('if (typeof text !== "string") throw new Error("Remote list body must be text")');
  const charCheck = source.indexOf('if (text.length > byteLimit) throw new Error("Remote list is too large")', stringCheck);
  const byteCheck = source.indexOf('new TextEncoder().encode(text).byteLength > byteLimit', stringCheck);
  assert.ok(stringCheck >= 0);
  assert.ok(charCheck > stringCheck);
  assert.ok(byteCheck > charCheck);
});

test("exact UTF-8 byte accounting remains authoritative after character preflight", () => {
  assert.match(source, /if \(new TextEncoder\(\)\.encode\(text\)\.byteLength > byteLimit\) throw new Error\("Remote list is too large"\)/);
});
