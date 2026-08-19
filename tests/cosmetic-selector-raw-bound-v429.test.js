import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_COSMETIC_SELECTOR_INPUT_CHARS,
  MAX_COSMETIC_SELECTOR_LENGTH,
  normalizeCosmeticRule
} from "../src/core/cosmetic-rules.js";

test("M429 raw cosmetic selector input is bounded before trim work", () => {
  assert.equal(MAX_COSMETIC_SELECTOR_INPUT_CHARS, MAX_COSMETIC_SELECTOR_LENGTH * 2);
  assert.throws(
    () => normalizeCosmeticRule({ selector: " ".repeat(MAX_COSMETIC_SELECTOR_INPUT_CHARS + 1) }),
    new RegExp(`input exceeds ${MAX_COSMETIC_SELECTOR_INPUT_CHARS} characters`)
  );
});

test("M429 surrounding whitespace remains compatible below the raw ceiling", () => {
  assert.deepEqual(normalizeCosmeticRule({ selector: "  #sponsor  " }), { selector: "#sponsor" });
});

test("M429 exact canonical selector length remains accepted with bounded whitespace", () => {
  const exact = `#${"a".repeat(MAX_COSMETIC_SELECTOR_LENGTH - 1)}`;
  const normalized = normalizeCosmeticRule({ selector: ` ${exact} ` });
  assert.equal(normalized.selector, exact);
  assert.equal(normalized.selector.length, MAX_COSMETIC_SELECTOR_LENGTH);
});
