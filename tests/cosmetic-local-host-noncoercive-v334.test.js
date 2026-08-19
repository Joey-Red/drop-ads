import assert from "node:assert/strict";
import { isLocalOrPrivatePageHostname } from "../src/core/cosmetic-lists.js";

for (const host of [
  "localhost",
  "x.localhost",
  "printer.local",
  "home.arpa",
  "router.home.arpa",
  "10.0.0.1",
  "127.0.0.1",
  "100.64.0.1",
  "169.254.1.1",
  "172.16.0.1",
  "192.168.1.1",
  "198.18.0.1",
  "224.0.0.1",
  "::1",
  "fc00::1",
  "fd12::1",
  "fe80::1",
  "ff02::1"
]) assert.equal(isLocalOrPrivatePageHostname(host), true, host);

for (const host of ["example.com", "1.1.1.1", "8.8.8.8", "2001:4860:4860::8888"])
  assert.equal(isLocalOrPrivatePageHostname(host), false, host);

let coercions = 0;
const hostile = {
  toString() { coercions += 1; return "example.com"; },
  valueOf() { coercions += 1; return "example.com"; },
  [Symbol.toPrimitive]() { coercions += 1; return "example.com"; }
};
assert.equal(isLocalOrPrivatePageHostname(hostile), true);
assert.equal(coercions, 0);
assert.equal(isLocalOrPrivatePageHostname(123), true);
assert.equal(isLocalOrPrivatePageHostname(null), true);
assert.equal(isLocalOrPrivatePageHostname(undefined), true);

const { proxy, revoke } = Proxy.revocable({}, {});
revoke();
assert.doesNotThrow(() => isLocalOrPrivatePageHostname(proxy));
assert.equal(isLocalOrPrivatePageHostname(proxy), true);

console.log("cosmetic local/private hostname non-coercive repository coverage present");
