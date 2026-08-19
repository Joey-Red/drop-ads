import assert from "node:assert/strict";
import test from "node:test";
import { compileTieredCosmeticSelectors } from "../src/core/cosmetic-rules.js";

const rule = (selector) => ({ selector });

test("personal allow wins over every cosmetic hide tier", () => {
  const selectors = compileTieredCosmeticSelectors({
    hostname: "example.com",
    personalAllow: [rule(".all")],
    personalHide: [rule(".all")],
    sharedAllow: [rule(".all")],
    sharedHide: [rule(".all")]
  });
  assert.deepEqual(selectors, []);
});

test("personal hide wins over shared allow and shared hide", () => {
  const selectors = compileTieredCosmeticSelectors({
    hostname: "example.com",
    personalHide: [rule(".collision")],
    sharedAllow: [rule(".collision")],
    sharedHide: [rule(".collision")]
  });
  assert.deepEqual(selectors, [".collision"]);
});

test("shared allow wins over shared hide while independent selectors remain deterministically ordered", () => {
  const selectors = compileTieredCosmeticSelectors({
    hostname: "example.com",
    personalHide: [rule(".personal-z"), rule(".personal-a")],
    sharedAllow: [rule(".shared-allowed")],
    sharedHide: [rule(".shared-z"), rule(".shared-allowed"), rule(".shared-a")]
  });
  assert.deepEqual(selectors, [".personal-a", ".personal-z", ".shared-a", ".shared-z"]);
});
