import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M840 picker identity snapshots fail closed if reviewed DOM identity changes mid-capture", () => {
  assert.ok(source.includes("const rawSnapshot = [];"));
  assert.ok(source.includes("if (element.getAttribute !== getAttribute) return [];"));
  assert.ok(source.includes("if (raw !== rawSnapshot[index]) return [];"));
  assert.ok(source.includes("if (element.classList !== classList || classList.length !== length) return [];"));
  assert.ok(source.includes("if (classList[index] !== rawSnapshot[index]) return [];"));
});
