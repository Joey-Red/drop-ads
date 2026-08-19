import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { encodeCosmeticPack, encodeRulePack } from "../src/core/cache-codec.js";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("cache canonical ordering does not consult String.prototype.localeCompare", () => {
  const original = Object.getOwnPropertyDescriptor(String.prototype, "localeCompare");
  Object.defineProperty(String.prototype, "localeCompare", {
    configurable: true,
    writable: true,
    value() { throw new Error("localeCompare must not be used"); }
  });
  try {
    assert.deepEqual(encodeCosmeticPack([
      { selector: ".z" },
      { selector: ".A" },
      { selector: ".a" }
    ]), [".A", ".a", ".z"]);

    const packed = encodeRulePack([
      { kind: "pattern", value: "||z.example^" },
      { kind: "pattern", value: "||A.example^" },
      { kind: "pattern", value: "||a.example^" }
    ]);
    assert.deepEqual(packed.p, ["||A.example^", "||a.example^", "||z.example^"]);
  } finally {
    Object.defineProperty(String.prototype, "localeCompare", original);
  }
});

test("cache codec uses the shared fixed code-unit comparator for network and cosmetic keys", () => {
  const source = read("src/core/cache-codec.js");
  assert.match(source, /import \{ compareCodeUnitText \} from "\.\/text-order\.js"/);
  assert.match(source, /compareCodeUnitText\(ruleKey\(a\), ruleKey\(b\)\)/);
  assert.match(source, /compareCodeUnitText\(cosmeticRuleKey\(a\), cosmeticRuleKey\(b\)\)/);
  assert.doesNotMatch(source, /localeCompare/);
});
