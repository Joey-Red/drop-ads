import test from "node:test";
import assert from "node:assert/strict";

import { normalizeRule } from "../src/core/rules.js";

test("normalizeRule rejects accessors without executing them", () => {
  let calls = 0;
  const rule = { value: "ads.example" };
  Object.defineProperty(rule, "kind", {
    enumerable: true,
    get() {
      calls += 1;
      return "domain";
    }
  });
  assert.throws(() => normalizeRule(rule), /data field/i);
  assert.equal(calls, 0);
});

test("normalizeRule does not use normal Proxy property reads", () => {
  let reads = 0;
  const target = { kind: "domain", value: "Ads.Example" };
  const rule = new Proxy(target, {
    get(object, key, receiver) {
      reads += 1;
      return Reflect.get(object, key, receiver);
    }
  });
  assert.deepEqual(normalizeRule(rule), { kind: "domain", value: "ads.example" });
  assert.equal(reads, 0);
});

test("normalizeRule requires kind and value data fields", () => {
  assert.throws(() => normalizeRule({ value: "ads.example" }), /Rule\.kind/);
  assert.throws(() => normalizeRule({ kind: "domain" }), /Rule\.value/);
});

test("normalizeRule accepts null-prototype data and detaches resourceTypes", () => {
  const resourceTypes = ["script", "image"];
  const rule = Object.assign(Object.create(null), {
    kind: "domain",
    value: "Ads.Example",
    resourceTypes
  });
  const normalized = normalizeRule(rule);
  resourceTypes[0] = "media";
  assert.deepEqual(normalized, {
    kind: "domain",
    value: "ads.example",
    resourceTypes: ["image", "script"]
  });
});
