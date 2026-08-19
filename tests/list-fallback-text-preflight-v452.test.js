import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M452 non-streaming fallback rejects obvious over-limit strings before TextEncoder allocation", () => {
  const fallback = source.indexOf("const text = await bodyCollaborators.text();");
  const charGate = source.indexOf("if (text.length > byteLimit) throw new Error(\"Remote list is too large\");", fallback);
  const byteGate = source.indexOf("new TextEncoder().encode(text).byteLength > byteLimit", fallback);
  assert.ok(fallback >= 0);
  assert.ok(charGate > fallback);
  assert.ok(byteGate > charGate);
});

test("M452 exact UTF-8 byte gate remains authoritative after code-unit preflight", () => {
  assert.match(source, /if \(text\.length > byteLimit\) throw new Error\("Remote list is too large"\);/);
  assert.match(source, /if \(new TextEncoder\(\)\.encode\(text\)\.byteLength > byteLimit\) throw new Error\("Remote list is too large"\);/);
});
