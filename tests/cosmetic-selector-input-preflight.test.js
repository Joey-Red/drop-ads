import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_COSMETIC_SELECTOR_INPUT_CHARS,
  MAX_COSMETIC_SELECTOR_LENGTH,
  normalizeCosmeticRule
} from "../src/core/cosmetic-rules.js";

test("raw cosmetic selector work is bounded before trim", () => {
  assert.equal(MAX_COSMETIC_SELECTOR_INPUT_CHARS, MAX_COSMETIC_SELECTOR_LENGTH * 2);
  assert.throws(
    () => normalizeCosmeticRule({ selector: " ".repeat(MAX_COSMETIC_SELECTOR_INPUT_CHARS + 1) }),
    new RegExp(`Cosmetic selector input exceeds ${MAX_COSMETIC_SELECTOR_INPUT_CHARS} characters`)
  );
});

test("ordinary surrounding whitespace remains compatible inside the raw ceiling", () => {
  assert.deepEqual(normalizeCosmeticRule({ selector: "   .ad-slot   " }), { selector: ".ad-slot" });
});

test("canonical selector ceiling remains authoritative after trimming", () => {
  const selector = "a".repeat(MAX_COSMETIC_SELECTOR_LENGTH + 1);
  assert.ok(selector.length <= MAX_COSMETIC_SELECTOR_INPUT_CHARS);
  assert.throws(
    () => normalizeCosmeticRule({ selector }),
    new RegExp(`Cosmetic selector exceeds ${MAX_COSMETIC_SELECTOR_LENGTH} characters`)
  );
});
