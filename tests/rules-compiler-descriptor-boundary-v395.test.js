import test from "node:test";
import assert from "node:assert/strict";

import { compileCookieRules, compileManagedRules, compileRules } from "../src/core/rules.js";

function descriptorProxy(target, onGet) {
  return new Proxy(target, {
    get(targetValue, key, receiver) {
      onGet(key);
      return Reflect.get(targetValue, key, receiver);
    },
    getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor,
    getPrototypeOf: Reflect.getPrototypeOf,
    ownKeys: Reflect.ownKeys
  });
}

test("M395 compiler options use descriptor reads instead of normal getters", () => {
  let normalGets = 0;
  const compileOptions = descriptorProxy({ excludedInitiatorDomains: ["example.com"] }, () => { normalGets += 1; });
  const rules = compileRules([{ kind: "domain", value: "ads.example" }], "communityBlock", compileOptions);
  assert.equal(rules.length, 1);
  assert.equal(normalGets, 0);

  const managedOptions = descriptorProxy({ maxDynamicRules: 5000 }, () => { normalGets += 1; });
  const state = {
    cookieMode: "off",
    disabledSites: [],
    cookieAllowSites: [],
    communityBlock: [],
    communityAllow: [],
    personalBlock: [],
    personalAllow: []
  };
  assert.deepEqual(compileManagedRules(state, managedOptions), []);
  assert.equal(normalGets, 0);
});

test("M395 policy-state admission contains revoked proxies and accessors", () => {
  const { proxy, revoke } = Proxy.revocable({ cookieMode: "off" }, {});
  revoke();
  assert.throws(() => compileCookieRules(proxy), /invalid|plain object/i);

  let getterCalls = 0;
  const state = {};
  Object.defineProperty(state, "cookieMode", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "all";
    }
  });
  assert.throws(() => compileCookieRules(state), /own enumerable data field/i);
  assert.equal(getterCalls, 0);
});
