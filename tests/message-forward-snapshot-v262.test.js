import test from "node:test";
import assert from "node:assert/strict";

import {
  createMessageGuardedApi,
  validateBackgroundRuntimeMessage
} from "../src/core/message-contract.js";

function install(group, listener) {
  let installed;
  const api = {
    runtime: {
      onMessage: {
        addListener(value) { installed = value; },
        removeListener() {}
      }
    }
  };
  createMessageGuardedApi(api, { group }).runtime.onMessage.addListener(listener);
  return () => installed;
}

test("public runtime validation return shape remains handled/type only", () => {
  assert.deepEqual(validateBackgroundRuntimeMessage({ type: "drop-ads:get-ui-state" }, "core"), {
    handled: true,
    type: "drop-ads:get-ui-state"
  });
});

test("guarded core listener receives detached top-level and nested network rule snapshots", () => {
  const originalRule = { kind: "domain", value: "ads.example", resourceTypes: ["image"] };
  const original = {
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: originalRule
  };
  let received;
  const getInstalled = install("core", (message) => {
    received = message;
    return true;
  });
  assert.equal(getInstalled()(original, {}, () => {}), true);
  assert.notEqual(received, original);
  assert.equal(Object.getPrototypeOf(received), null);
  assert.notEqual(received.rule, originalRule);
  assert.equal(Object.getPrototypeOf(received.rule), null);
  assert.notEqual(received.rule.resourceTypes, originalRule.resourceTypes);
  assert.deepEqual(received.rule.resourceTypes, ["image"]);

  original.field = "personalAllow";
  originalRule.value = "changed.example";
  originalRule.resourceTypes[0] = "script";
  assert.equal(received.field, "personalBlock");
  assert.equal(received.rule.value, "ads.example");
  assert.deepEqual(received.rule.resourceTypes, ["image"]);
});

test("guarded cosmetic and subscription listeners receive detached nested snapshots", () => {
  const cosmeticRule = { selector: ".ad", domains: ["example.com"] };
  let cosmeticReceived;
  const cosmeticInstalled = install("cosmetic", (message) => {
    cosmeticReceived = message;
    return false;
  });
  cosmeticInstalled()({
    type: "drop-ads:add-cosmetic-rule",
    field: "personalCosmeticHide",
    rule: cosmeticRule
  }, {}, () => {});
  assert.notEqual(cosmeticReceived.rule, cosmeticRule);
  assert.notEqual(cosmeticReceived.rule.domains, cosmeticRule.domains);

  const subscription = {
    id: "external-one",
    title: "External one",
    format: "hosts",
    sourceUrl: "https://example.com/hosts.txt",
    enabled: true,
    builtIn: false
  };
  let coreReceived;
  const coreInstalled = install("core", (message) => {
    coreReceived = message;
    return false;
  });
  coreInstalled()({ type: "drop-ads:add-subscription", subscription }, {}, () => {});
  assert.notEqual(coreReceived.subscription, subscription);
  assert.equal(Object.getPrototypeOf(coreReceived.subscription), null);
  subscription.title = "changed";
  assert.equal(coreReceived.subscription.title, "External one");
});

test("downstream listeners do not trigger normal gets on accepted messages", () => {
  let topGets = 0;
  let nestedGets = 0;
  const nested = new Proxy({ kind: "domain", value: "ads.example" }, {
    get(target, key, receiver) {
      nestedGets += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  const original = new Proxy({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: nested
  }, {
    get(target, key, receiver) {
      topGets += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  const getInstalled = install("core", (message) => {
    assert.equal(message.rule.value, "ads.example");
    return false;
  });
  getInstalled()(original, {}, () => {});
  assert.equal(topGets, 0);
  assert.equal(nestedGets, 0);
});
