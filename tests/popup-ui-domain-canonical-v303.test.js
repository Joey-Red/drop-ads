import test from "node:test";
import assert from "node:assert/strict";
import { snapshotPopupUiState } from "../src/core/popup-boundary.js";

function snapshot(disabledSites, cookieAllowSites, sessionDisabledSites, cookieBannerDisabledSites = []) {
  return snapshotPopupUiState({
    state: {
      enabled: true,
      cookieMode: "third-party",
      cookieBannerMode: "reject",
      disabledSites,
      cookieAllowSites,
      cookieBannerDisabledSites
    },
    session: { disabledSites: sessionDisabledSites }
  });
}

test("popup UI state accepts canonical sorted duplicate-free domains", () => {
  const value = snapshot(
    ["a.example", "b.example"],
    ["cookies.example"],
    ["pause.example"],
    ["banner-off.example"]
  );
  assert.deepEqual(value.state.disabledSites, ["a.example", "b.example"]);
  assert.deepEqual(value.state.cookieAllowSites, ["cookies.example"]);
  assert.deepEqual(value.state.cookieBannerDisabledSites, ["banner-off.example"]);
  assert.deepEqual(value.session.disabledSites, ["pause.example"]);
  assert.equal(Object.isFrozen(value.state.disabledSites), true);
  assert.equal(Object.isFrozen(value.state.cookieBannerDisabledSites), true);
  assert.equal(Object.isFrozen(value.session.disabledSites), true);
});

test("popup UI state rejects noncanonical or invalid domain strings", () => {
  assert.throws(() => snapshot(["Example.COM"], [], []), /canonical domains/);
  assert.throws(() => snapshot([], ["not a domain"], []), /canonical domains/);
  assert.throws(() => snapshot([], [], ["Pause.Example"]), /canonical domains/);
  assert.throws(() => snapshot([], [], [], ["Banner.Example"]), /canonical domains/);
});

test("popup UI state rejects duplicate and out-of-order domain collections", () => {
  assert.throws(() => snapshot(["a.example", "a.example"], [], []), /sorted and duplicate-free/);
  assert.throws(() => snapshot(["b.example", "a.example"], [], []), /sorted and duplicate-free/);
  assert.throws(() => snapshot([], ["z.example", "a.example"], []), /sorted and duplicate-free/);
  assert.throws(() => snapshot([], [], ["z.example", "a.example"]), /sorted and duplicate-free/);
  assert.throws(() => snapshot([], [], [], ["z.example", "a.example"]), /sorted and duplicate-free/);
});
