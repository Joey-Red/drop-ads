import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M836 revalidates reviewed attribute values before using candidates", () => {
  assert.match(source, /function stableAttributeSelectors\(element\)/);
  assert.match(source, /const rawSnapshot = \[\]/);
  assert.match(source, /rawSnapshot\.push\(raw\)/);
  assert.match(source, /element\.getAttribute !== getAttribute/);
  assert.match(source, /Reflect\.apply\(getAttribute, element, \[SAFE_ATTRIBUTE_NAMES\[index\]\]\)/);
  assert.match(source, /raw !== rawSnapshot\[index\]/);
});
