import test from "node:test";
import assert from "node:assert/strict";
import { setDomainFlag, setSiteDisabled } from "../src/core/personal-rules.js";

for (const invalid of ["true", "false", 0, 1, null, undefined, new Boolean(true), {}, []]) {
  test(`M421 rejects non-boolean personal domain flag: ${String(invalid)}`, () => {
    assert.throws(() => setDomainFlag([], "example.com", invalid), /must be boolean/);
    assert.throws(() => setSiteDisabled([], "example.com", invalid), /must be boolean/);
  });
}

test("M421 validates the boolean before domain normalization or collection work", () => {
  let domainConversions = 0;
  const domain = {
    toString() { domainConversions += 1; return "example.com"; }
  };
  const collection = new Proxy([], {
    getPrototypeOf() { throw new Error("collection inspected"); }
  });

  assert.throws(() => setDomainFlag(collection, domain, "true"), /must be boolean/);
  assert.equal(domainConversions, 0);
});

test("M421 preserves primitive true add and false remove semantics", () => {
  assert.deepEqual(setDomainFlag([], "Example.COM", true), ["example.com"]);
  assert.deepEqual(setDomainFlag(["example.com"], "example.com", false), []);
  assert.deepEqual(setSiteDisabled([], "Example.COM", true), ["example.com"]);
  assert.deepEqual(setSiteDisabled(["example.com"], "example.com", false), []);
});
