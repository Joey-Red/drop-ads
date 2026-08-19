import test from "node:test";
import assert from "node:assert/strict";
import { setDomainFlag, setSiteDisabled } from "../src/core/personal-rules.js";

test("M420 direct personal-domain mutation flags require primitive booleans", () => {
  for (const invalid of [null, undefined, "true", "false", 0, 1, new Boolean(true), {}, []]) {
    assert.throws(() => setDomainFlag([], "example.com", invalid), /must be boolean/);
    assert.throws(() => setSiteDisabled([], "example.com", invalid), /must be boolean/);
  }
});

test("M420 boolean validation precedes domain conversion or normalization work", () => {
  let conversions = 0;
  const hostileDomain = {
    toString() {
      conversions += 1;
      return "example.com";
    }
  };
  assert.throws(() => setDomainFlag([], hostileDomain, "true"), /must be boolean/);
  assert.throws(() => setSiteDisabled([], hostileDomain, 1), /must be boolean/);
  assert.equal(conversions, 0);
});

test("M420 valid direct booleans preserve canonical add and remove behavior", () => {
  assert.deepEqual(setDomainFlag([], "Example.COM", true), ["example.com"]);
  assert.deepEqual(setDomainFlag(["example.com"], "example.com", false), []);
  assert.deepEqual(setSiteDisabled([], "Example.COM", true), ["example.com"]);
  assert.deepEqual(setSiteDisabled(["example.com"], "example.com", false), []);
});
