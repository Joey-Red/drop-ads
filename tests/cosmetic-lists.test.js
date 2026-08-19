import test from "node:test";
import assert from "node:assert/strict";
import { isLocalOrPrivatePageHostname, normalizeRemoteCosmeticRule, parseThirdPartyCosmetics } from "../src/core/cosmetic-lists.js";

test("third-party cosmetics parse global, scoped, negated, and exception rules", () => {
  const parsed = parseThirdPartyCosmetics(`
! comment
##.global-ad
example.com,news.example##.sponsor
example.com,~shop.example.com##.banner
example.com#@#.needed
`);
  assert.deepEqual(parsed.hide, [
    { selector: ".banner", domains: ["example.com"], excludedDomains: ["shop.example.com"] },
    { selector: ".global-ad" },
    { selector: ".sponsor", domains: ["example.com", "news.example"] }
  ]);
  assert.deepEqual(parsed.allow, [{ selector: ".needed", domains: ["example.com"] }]);
  assert.equal(parsed.unsupportedCount, 0);
});

test("procedural and unsafe cosmetic syntax stays unsupported", () => {
  const parsed = parseThirdPartyCosmetics(`
example.com#?#div:has(.ad)
example.com#$#body { color:red }
example.com##.safe
localhost##.never-shared
192.168.1.1##.never-shared
`);
  assert.deepEqual(parsed.hide, [{ selector: ".safe", domains: ["example.com"] }]);
  assert.equal(parsed.unsupportedCount, 4);
});

test("remote generic cosmetic rules are valid data but local/private page targeting is classified", () => {
  assert.deepEqual(normalizeRemoteCosmeticRule({ selector: ".generic" }), { selector: ".generic" });
  for (const host of ["localhost", "router.local", "home.arpa", "127.0.0.1", "10.0.0.2", "192.168.1.2", "[::1]", "fc00::1", "fe80::1"]) {
    assert.equal(isLocalOrPrivatePageHostname(host), true, host);
  }
  assert.equal(isLocalOrPrivatePageHostname("example.com"), false);
});
