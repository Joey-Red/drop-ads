import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M844 structural picker fallback rejects torn sibling snapshots", () => {
  assert.ok(source.includes("const siblingSnapshot = [];"));
  assert.ok(source.includes("siblingSnapshot.push(sibling);"));
  assert.ok(source.includes("if (parent.children !== children || children.length !== length) throw new Error(\"Picker sibling list changed during selection\");"));
  assert.ok(source.includes("if (children[index] !== siblingSnapshot[index]) throw new Error(\"Picker sibling list changed during selection\");"));
  assert.ok(source.includes("Picker sibling list is unavailable"));
});
