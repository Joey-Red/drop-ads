import test from "node:test";
import assert from "node:assert/strict";
import { compileManagedRules, compileRules } from "../src/core/rules.js";

test("M422 compileRules reads excludedInitiatorDomains without invoking accessors", () => {
  let getterCalls = 0;
  const options = {};
  Object.defineProperty(options, "excludedInitiatorDomains", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return [];
    }
  });

  assert.throws(() => compileRules([], "communityBlock", options));
  assert.equal(getterCalls, 0);
});

test("M422 compileManagedRules reads maxDynamicRules without invoking accessors", () => {
  let getterCalls = 0;
  const options = {};
  Object.defineProperty(options, "maxDynamicRules", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return 5000;
    }
  });

  assert.throws(() => compileManagedRules({}, options));
  assert.equal(getterCalls, 0);
});

test("M422 managed policy state contains revoked Proxy admission failures", () => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  assert.throws(() => compileManagedRules(proxy), /Managed policy state is invalid/);
});
