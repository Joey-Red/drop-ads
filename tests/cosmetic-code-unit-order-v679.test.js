import assert from "node:assert/strict";
import test from "node:test";
import { compareCodeUnitText } from "../src/core/text-order.js";
import { normalizeCosmeticRules } from "../src/core/cosmetic-rules.js";

test("core text ordering is fixed code-unit ordering", () => {
  assert.equal(compareCodeUnitText("A", "a"), -1);
  assert.equal(compareCodeUnitText("a", "A"), 1);
  assert.equal(compareCodeUnitText("same", "same"), 0);
  assert.throws(() => compareCodeUnitText({}, "a"), /requires strings/);
});

test("cosmetic canonical ordering is independent of localeCompare", () => {
  const original = String.prototype.localeCompare;
  String.prototype.localeCompare = function () { throw new Error("localeCompare must not be consulted"); };
  try {
    const rules = normalizeCosmeticRules([
      { selector: ".z" },
      { selector: ".A" },
      { selector: ".a" }
    ]);
    assert.deepEqual(rules.map((rule) => rule.selector), [".A", ".a", ".z"]);
  } finally {
    String.prototype.localeCompare = original;
  }
});
