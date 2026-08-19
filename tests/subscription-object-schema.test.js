import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_SUBSCRIPTIONS,
  normalizeSubscription,
  normalizeSubscriptions
} from "../src/core/subscriptions.js";

test("subscription objects normalize through the exact canonical schema", () => {
  const normalized = normalizeSubscription({
    id: "external-test",
    title: " External Test ",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt#fragment",
    enabled: false,
    builtIn: false
  });
  assert.deepEqual(normalized, {
    id: "external-test",
    title: "External Test",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt",
    enabled: false,
    builtIn: false
  });

  for (const builtIn of BUILT_IN_SUBSCRIPTIONS) assert.doesNotThrow(() => normalizeSubscription(builtIn));
});

test("subscription objects reject unknown privacy-style fields", () => {
  assert.throws(() => normalizeSubscription({
    id: "external-test",
    title: "External Test",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt",
    pageHistory: ["https://private.example/"]
  }), /unsupported field: pageHistory/);
});

test("subscription schema rejects accessors without invoking them", () => {
  let calls = 0;
  const subscription = {
    id: "external-test",
    title: "External Test",
    format: "hosts"
  };
  Object.defineProperty(subscription, "sourceUrl", {
    enumerable: true,
    get() {
      calls += 1;
      return "https://example.com/list.txt";
    }
  });
  assert.throws(() => normalizeSubscription(subscription), /sourceUrl must be a data field/);
  assert.equal(calls, 0);
});

test("subscription schema rejects symbols, hidden fields, arrays, and custom prototypes", () => {
  const symbolSubscription = {
    id: "external-test",
    title: "External Test",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt"
  };
  symbolSubscription[Symbol("history")] = [];
  assert.throws(() => normalizeSubscription(symbolSubscription), /unsupported symbol field/);

  const hiddenSubscription = {
    id: "external-test",
    title: "External Test",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt"
  };
  Object.defineProperty(hiddenSubscription, "enabled", { enumerable: false, value: true });
  assert.throws(() => normalizeSubscription(hiddenSubscription), /enabled must be an enumerable data field/);

  assert.throws(() => normalizeSubscription([]), /plain object/);

  const inherited = Object.create({ pageHistory: [] });
  Object.assign(inherited, {
    id: "external-test",
    title: "External Test",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt"
  });
  assert.throws(() => normalizeSubscription(inherited), /plain object/);
});

test("persisted subscription migration discards malformed exact-schema entries without weakening built-ins", () => {
  const subscriptions = normalizeSubscriptions([{
    id: "external-test",
    title: "External Test",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt",
    requestHistory: []
  }]);
  assert.deepEqual(subscriptions.map((subscription) => subscription.id), BUILT_IN_SUBSCRIPTIONS.map((subscription) => subscription.id));
});
