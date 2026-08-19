import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeSubscriptions, subscriptionSourceKey } from "../src/core/subscriptions.js";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public subscriptionSourceKey still validates and canonicalizes caller input", () => {
  assert.equal(subscriptionSourceKey({
    id: "external-key",
    title: "External key",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt#ignored"
  }), "hosts\u0000https://example.com/list.txt");
  assert.throws(() => subscriptionSourceKey({
    id: "external-key",
    title: "External key",
    format: "hosts",
    sourceUrl: "http://example.com/list.txt"
  }), /HTTPS/);
});

test("internal normalized subscription paths use canonical source keys without public re-normalization", () => {
  const source = read("src/core/subscriptions.js");
  assert.match(source, /function canonicalSubscriptionSourceKey\(subscription\)/);
  assert.match(source, /seenSources\.add\(canonicalSubscriptionSourceKey\(subscription\)\)/);
  assert.match(source, /decoded\.sourceKey !== canonicalSubscriptionSourceKey\(subscription\)/);

  const normalized = normalizeSubscriptions([{
    id: "external-key-two",
    title: "External key two",
    format: "hosts",
    sourceUrl: "https://example.com/two#ignored"
  }]);
  assert.equal(normalized.some((item) => item.sourceUrl === "https://example.com/two"), true);
});
