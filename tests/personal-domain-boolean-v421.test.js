import test from "node:test";
import assert from "node:assert/strict";

import { setDomainFlag, setSiteDisabled } from "../src/core/personal-rules.js";

test("M421 direct domain flags require primitive booleans", () => {
  for (const value of ["true", "false", 0, 1, null, undefined, new Boolean(true), {}]) {
    assert.throws(() => setDomainFlag([], "example.com", value), /must be boolean/);
    assert.throws(() => setSiteDisabled([], "example.com", value), /must be boolean/);
  }
});

test("M421 boolean validation runs before collection or domain work", () => {
  const { proxy, revoke } = Proxy.revocable([], {});
  revoke();
  assert.throws(() => setDomainFlag(proxy, { toString() { throw new Error("must not coerce"); } }, "false"), /must be boolean/);
});

test("M421 true adds and false removes canonical domains", () => {
  assert.deepEqual(setDomainFlag([], "Example.COM", true), ["example.com"]);
  assert.deepEqual(setDomainFlag(["example.com"], "example.com", false), []);
  assert.deepEqual(setSiteDisabled([], "Example.COM", true), ["example.com"]);
});
