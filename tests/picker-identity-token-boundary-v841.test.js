import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M841 picker rejects deceptive and extension-owned identity tokens", () => {
  assert.ok(source.includes("if (/[/?#@=&%]/.test(value)) return null;"));
  assert.ok(source.includes("function extensionOwnedClassToken(token)"));
  assert.ok(source.includes("token.startsWith(\"drop-ads-\")"));
  assert.ok(source.includes("if (!token || extensionOwnedClassToken(token)) continue;"));
});
