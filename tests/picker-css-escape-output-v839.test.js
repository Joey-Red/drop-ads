import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M839 bounds escaped selector output while it is assembled", () => {
  assert.ok(source.includes("const escaped = safeAscii ? char : `\\\\${code.toString(16)} `;"));
  assert.ok(source.includes("if (result.length + escaped.length > MAX_SELECTOR_LENGTH) throw new Error(`CSS escape output exceeds ${MAX_SELECTOR_LENGTH} characters`);"));
  assert.ok(source.includes("result += escaped;"));
});
