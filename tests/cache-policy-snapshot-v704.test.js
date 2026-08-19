import test from "node:test";
import assert from "node:assert/strict";
import { decodeCosmeticPack, decodeRulePack } from "../src/core/cache-codec.js";

test("decoded network policy arrays and nested rule data are immutable", () => {
  const decoded = decodeRulePack({
    r: [["d", "ads.example.com", ["image", "script"]]],
    d: ["tracker.example.com"]
  });

  assert.equal(Object.isFrozen(decoded), true);
  assert.equal(decoded.every((rule) => Object.isFrozen(rule)), true);
  const scoped = decoded.find((rule) => rule.resourceTypes);
  assert.ok(scoped);
  assert.equal(Object.isFrozen(scoped.resourceTypes), true);
  assert.throws(() => decoded.push({}), TypeError);
  assert.throws(() => scoped.resourceTypes.pop(), TypeError);
});

test("decoded cosmetic policy and invalid empty policy arrays are immutable", () => {
  const cosmetics = decodeCosmeticPack([
    [".sponsor", ["example.com"], []],
    ".global"
  ]);
  assert.equal(Object.isFrozen(cosmetics), true);
  assert.equal(cosmetics.every((rule) => Object.isFrozen(rule)), true);
  assert.throws(() => cosmetics.pop(), TypeError);

  const invalidNetwork = decodeRulePack({ nope: [] });
  const invalidCosmetic = decodeCosmeticPack({ nope: true });
  assert.equal(Object.isFrozen(invalidNetwork), true);
  assert.equal(Object.isFrozen(invalidCosmetic), true);
  assert.deepEqual(invalidNetwork, []);
  assert.deepEqual(invalidCosmetic, []);
});
