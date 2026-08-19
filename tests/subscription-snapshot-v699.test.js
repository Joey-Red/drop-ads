import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_COMMUNITY_SUBSCRIPTION,
  normalizeSubscription,
  normalizeSubscriptions
} from "../src/core/subscriptions.js";

test("normalizeSubscription returns an immutable detached canonical snapshot", () => {
  const input = {
    id: "external-one",
    title: "  External One  ",
    format: "hosts",
    sourceUrl: "https://example.com/hosts#fragment",
    enabled: false
  };
  const normalized = normalizeSubscription(input);
  input.title = "changed later";
  input.enabled = true;

  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(normalized.title, "External One");
  assert.equal(normalized.sourceUrl, "https://example.com/hosts");
  assert.equal(normalized.enabled, false);
  assert.throws(() => { normalized.enabled = true; }, TypeError);
});

test("normalizeSubscriptions freezes the collection and every canonical entry", () => {
  const normalized = normalizeSubscriptions([
    { ...DEFAULT_COMMUNITY_SUBSCRIPTION, enabled: false },
    {
      id: "external-two",
      title: "External Two",
      format: "hosts",
      sourceUrl: "https://example.com/two",
      enabled: true
    }
  ]);

  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(normalized.every((subscription) => Object.isFrozen(subscription)), true);
  assert.equal(normalized.find((subscription) => subscription.id === DEFAULT_COMMUNITY_SUBSCRIPTION.id).enabled, false);
  assert.throws(() => normalized.push({}), TypeError);
});
