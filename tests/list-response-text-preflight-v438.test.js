import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M438 fallback text rejects obvious over-limit strings before UTF-8 encoding", () => {
  const textRead = source.indexOf("const text = await bodyCollaborators.text();");
  const charPreflight = source.indexOf("if (text.length > byteLimit) throw new Error(\"Remote list is too large\");", textRead);
  const utf8Gate = source.indexOf("if (new TextEncoder().encode(text).byteLength > byteLimit) throw new Error(\"Remote list is too large\");", textRead);

  assert.notEqual(textRead, -1);
  assert.ok(charPreflight > textRead, "character preflight must follow the fallback text result");
  assert.ok(utf8Gate > charPreflight, "UTF-8 allocation must happen only after the cheap character preflight");
});

test("M438 keeps the active byteLimit authoritative for both fallback gates", () => {
  assert.match(source, /const byteLimit = assertResponseByteLimit\(maxBytes\);/);
  assert.match(source, /text\.length > byteLimit/);
  assert.match(source, /TextEncoder\(\)\.encode\(text\)\.byteLength > byteLimit/);
});
