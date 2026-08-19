import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M452 fallback text length is preflighted before UTF-8 allocation", () => {
  const fallbackStart = source.indexOf("if (!reader) {");
  const returnIndex = source.indexOf("return text;", fallbackStart);
  assert.ok(fallbackStart >= 0 && returnIndex > fallbackStart);
  const fallback = source.slice(fallbackStart, returnIndex);
  const charGate = fallback.indexOf("if (text.length > byteLimit)");
  const byteGate = fallback.indexOf("new TextEncoder().encode(text).byteLength");
  assert.ok(charGate >= 0, "fallback must reject code-unit length over byteLimit");
  assert.ok(byteGate > charGate, "UTF-8 allocation must occur only after the code-unit preflight");
});

test("M452 exact byte gate remains authoritative for multibyte fallback text", () => {
  assert.match(source, /if \(new TextEncoder\(\)\.encode\(text\)\.byteLength > byteLimit\) throw new Error\("Remote list is too large"\);/);
  assert.match(source, /const byteLimit = assertResponseByteLimit\(maxBytes\);/);
});
