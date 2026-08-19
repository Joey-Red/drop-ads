import assert from "node:assert/strict";
import test from "node:test";
import { cosmeticStylesheet } from "../src/core/cosmetic-rules.js";

test("direct stylesheet generation deduplicates canonical selectors in first-occurrence order", () => {
  assert.equal(
    cosmeticStylesheet([" .b ", ".a", ".b", ".a"]),
    ".b,\n.a { display: none !important; }\n"
  );
});

test("direct stylesheet dedupe happens after selector normalization", () => {
  assert.equal(
    cosmeticStylesheet(["\t.foo\t", ".foo"]),
    ".foo { display: none !important; }\n"
  );
});
