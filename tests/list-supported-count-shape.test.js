import test from "node:test";
import assert from "node:assert/strict";
import { assertRemoteSupportedRuleCount } from "../src/core/list-limits.js";

const EMPTY_COSMETIC = { hide: [], allow: [], unsupportedCount: 0 };

function parsed(block = [], allow = []) {
  return { block, allow, unsupportedCount: 0 };
}

test("supported-rule count rejects accessor fields without getter execution", () => {
  let getterCalls = 0;
  const network = { allow: [], unsupportedCount: 0 };
  Object.defineProperty(network, "block", {
    enumerable: true,
    configurable: true,
    get() {
      getterCalls += 1;
      return [];
    }
  });

  assert.throws(() => assertRemoteSupportedRuleCount(network, EMPTY_COSMETIC, 10), /data field/);
  assert.equal(getterCalls, 0);
});

test("supported-rule count rejects unknown fields and custom prototypes", () => {
  assert.throws(
    () => assertRemoteSupportedRuleCount({ ...parsed(), history: [] }, EMPTY_COSMETIC, 10),
    /unsupported field/
  );
  const cosmetic = Object.create({ inherited: true });
  cosmetic.hide = [];
  cosmetic.allow = [];
  assert.throws(() => assertRemoteSupportedRuleCount(parsed(), cosmetic, 10), /plain object/);
});

test("supported-rule count rejects holey and extra-property collections", () => {
  const holey = new Array(1);
  assert.throws(() => assertRemoteSupportedRuleCount(parsed(holey), EMPTY_COSMETIC, 10), /enumerable data entries|dense array/);

  const extra = [];
  extra.extra = true;
  assert.throws(() => assertRemoteSupportedRuleCount(parsed(extra), EMPTY_COSMETIC, 10), /dense array indices/);
});

test("unsupportedCount must be a non-negative safe integer", () => {
  assert.throws(
    () => assertRemoteSupportedRuleCount({ block: [], allow: [], unsupportedCount: -1 }, EMPTY_COSMETIC, 10),
    /non-negative safe integer/
  );
  assert.throws(
    () => assertRemoteSupportedRuleCount(parsed(), { hide: [], allow: [], unsupportedCount: 1.5 }, 10),
    /non-negative safe integer/
  );
});

test("supported-rule count accepts exact total and rejects one-over", () => {
  const network = parsed(Array(4).fill({}), Array(3).fill({}));
  const cosmetic = { hide: Array(2).fill({}), allow: Array(1).fill({}), unsupportedCount: 0 };
  assert.equal(assertRemoteSupportedRuleCount(network, cosmetic, 10), 10);

  cosmetic.allow = Array(2).fill({});
  assert.throws(() => assertRemoteSupportedRuleCount(network, cosmetic, 10), /too many supported rules/);
});
