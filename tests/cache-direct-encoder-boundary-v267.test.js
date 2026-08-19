import test from "node:test";
import assert from "node:assert/strict";

import { encodeCosmeticPack, encodeRulePack } from "../src/core/cache-codec.js";

test("direct network encoder rejects sparse and accessor arrays before iteration", () => {
  const sparse = new Array(1);
  assert.throws(() => encodeRulePack(sparse), /dense|enumerable data entries/i);

  let calls = 0;
  const accessor = [];
  Object.defineProperty(accessor, "0", {
    enumerable: true,
    configurable: true,
    get() {
      calls += 1;
      return { kind: "domain", value: "ads.example" };
    }
  });
  accessor.length = 1;
  assert.throws(() => encodeRulePack(accessor), /enumerable data entries/i);
  assert.equal(calls, 0);
});

test("direct cosmetic encoder rejects extra array properties", () => {
  const rules = [{ selector: ".ad" }];
  rules.extra = true;
  assert.throws(() => encodeCosmeticPack(rules), /dense array indices/i);
});

test("direct encoders preserve canonical valid output", () => {
  assert.deepEqual(
    encodeRulePack([
      { kind: "domain", value: "Ads.Example" },
      { kind: "domain", value: "ads.example" }
    ]),
    { d: ["ads.example"] }
  );
  assert.deepEqual(encodeCosmeticPack([{ selector: ".ad" }]), [".ad"]);
});
