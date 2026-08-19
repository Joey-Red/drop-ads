import assert from "node:assert/strict";
import test from "node:test";
import { compileCosmeticSelectors, cosmeticStylesheet } from "../src/core/cosmetic-rules.js";

const bytes = (text) => new TextEncoder().encode(text).byteLength;
const hide = [{ selector: ".b" }, { selector: ".a" }];

test("zero cosmetic compile limits admit no selectors", () => {
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide, maxBytes: 0 }), []);
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide, maxSelectors: 0 }), []);
});

test("exact multi-selector stylesheet byte boundary is admitted", () => {
  const exact = bytes(cosmeticStylesheet([".a", ".b"]));
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide, maxBytes: exact }), [".a", ".b"]);
});

test("one byte below the multi-selector boundary deterministically keeps only the first fitting selector", () => {
  const exact = bytes(cosmeticStylesheet([".a", ".b"]));
  const selectors = compileCosmeticSelectors({ hostname: "example.com", hide, maxBytes: exact - 1 });
  assert.deepEqual(selectors, [".a"]);
  assert.ok(bytes(cosmeticStylesheet(selectors)) <= exact - 1);
});
