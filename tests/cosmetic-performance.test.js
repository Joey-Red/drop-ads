import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_COSMETIC_SELECTORS_PER_PAGE,
  MAX_COSMETIC_STYLESHEET_BYTES,
  compileTieredCosmeticSelectors,
  cosmeticStylesheet
} from "../src/core/cosmetic-rules.js";

test("large shared cosmetic policy is bounded by selector count and stylesheet bytes", () => {
  const sharedHide = Array.from({ length: 10_000 }, (_, index) => ({ selector: `.shared-ad-${String(index).padStart(5, "0")}` }));
  const selectors = compileTieredCosmeticSelectors({
    hostname: "example.com",
    sharedHide,
    personalHide: [{ selector: ".personal-priority" }]
  });

  assert.equal(selectors[0], ".personal-priority");
  assert.ok(selectors.length <= MAX_COSMETIC_SELECTORS_PER_PAGE);
  assert.ok(new TextEncoder().encode(cosmeticStylesheet(selectors)).byteLength <= MAX_COSMETIC_STYLESHEET_BYTES + 64);
  assert.equal(selectors.includes(".shared-ad-09999"), false);
});

test("personal allow still wins at the cap boundary and duplicates cost one slot", () => {
  const sharedHide = Array.from({ length: 3_000 }, (_, index) => ({ selector: `.item-${index}` }));
  const selectors = compileTieredCosmeticSelectors({
    hostname: "example.com",
    sharedHide: [...sharedHide, { selector: ".duplicate" }, { selector: ".duplicate" }],
    personalHide: [{ selector: ".duplicate" }, { selector: ".allowed" }],
    personalAllow: [{ selector: ".allowed" }]
  });
  assert.equal(selectors.filter((selector) => selector === ".duplicate").length, 1);
  assert.equal(selectors.includes(".allowed"), false);
  assert.ok(selectors.length <= MAX_COSMETIC_SELECTORS_PER_PAGE);
});
