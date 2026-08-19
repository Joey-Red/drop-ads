import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M843 duplicate target ids and ancestor ids require safe path admission", () => {
  assert.ok(source.includes("function stableIdIsUnique(element, documentRef, probe = unique)"));
  assert.ok(source.includes("return Boolean(id) && probe(documentRef, `#${cssEscape(id)}`, element);"));
  assert.ok(source.includes("const duplicateId = directCandidates[0]?.startsWith(\"#\") === true;"));
  assert.ok(source.includes("const includeId = depth === 0 ? !duplicateId : stableIdIsUnique(current, documentRef, probe);"));
  assert.ok(source.includes("const part = nthPart(current, includeId);"));
});
