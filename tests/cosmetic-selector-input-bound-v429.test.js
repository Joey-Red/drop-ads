import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_COSMETIC_SELECTOR_INPUT_CHARS,
  MAX_COSMETIC_SELECTOR_LENGTH,
  normalizeCosmeticRule
} from "../src/core/cosmetic-rules.js";

test("M429 raw cosmetic selector input is bounded before trimming", () => {
  assert.equal(MAX_COSMETIC_SELECTOR_INPUT_CHARS, MAX_COSMETIC_SELECTOR_LENGTH * 2);
  assert.throws(
    () => normalizeCosmeticRule({ selector: " ".repeat(MAX_COSMETIC_SELECTOR_INPUT_CHARS + 1) }),
    new RegExp(`exceeds ${MAX_COSMETIC_SELECTOR_INPUT_CHARS} characters`)
  );
});

test("M429 surrounding whitespace remains compatible inside the raw ceiling", () => {
  const rule = normalizeCosmeticRule({ selector: "   #ad-slot   " });
  assert.equal(rule.selector, "#ad-slot");
});

test("M429 canonical 512-character selector limit remains authoritative", () => {
  const selector = "a".repeat(MAX_COSMETIC_SELECTOR_LENGTH + 1);
  assert.ok(selector.length <= MAX_COSMETIC_SELECTOR_INPUT_CHARS);
  assert.throws(() => normalizeCosmeticRule({ selector }), /Cosmetic selector exceeds/);
});
