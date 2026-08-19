import test from "node:test";
import assert from "node:assert/strict";
import { snapshotPopupUiState } from "../src/core/popup-boundary.js";

function validState() {
  return {
    enabled: true,
    cookieMode: "third-party",
    cookieBannerMode: "reject",
    disabledSites: ["disabled.example"],
    cookieAllowSites: ["cookies.example"],
    cookieBannerDisabledSites: ["banner-off.example"]
  };
}

test("popup UI snapshot returns a detached minimal view", () => {
  const root = Object.assign(Object.create(null), {
    state: Object.assign(Object.create(null), validState()),
    session: Object.assign(Object.create(null), { disabledSites: ["paused.example"] })
  });
  const snapshot = snapshotPopupUiState(root);
  assert.deepEqual(snapshot.state, {
    enabled: true,
    cookieMode: "third-party",
    cookieBannerMode: "reject",
    disabledSites: ["disabled.example"],
    cookieAllowSites: ["cookies.example"],
    cookieBannerDisabledSites: ["banner-off.example"]
  });
  assert.deepEqual(snapshot.session, { disabledSites: ["paused.example"] });
  root.state.disabledSites[0] = "changed.example";
  assert.equal(snapshot.state.disabledSites[0], "disabled.example");
});

test("popup UI snapshot rejects root and nested accessors without executing them", () => {
  let reads = 0;
  const root = { session: { disabledSites: [] } };
  Object.defineProperty(root, "state", { enumerable: true, get() { reads += 1; return validState(); } });
  assert.throws(() => snapshotPopupUiState(root));
  assert.equal(reads, 0);

  const state = validState();
  delete state.enabled;
  Object.defineProperty(state, "enabled", { enumerable: true, get() { reads += 1; return true; } });
  assert.throws(() => snapshotPopupUiState({ state, session: { disabledSites: [] } }));
  assert.equal(reads, 0);
});

test("popup UI snapshot rejects malformed consumed scalars and domain arrays", () => {
  assert.throws(() => snapshotPopupUiState({ state: { ...validState(), enabled: 1 }, session: { disabledSites: [] } }));
  assert.throws(() => snapshotPopupUiState({ state: { ...validState(), cookieMode: "sometimes" }, session: { disabledSites: [] } }));
  assert.throws(() => snapshotPopupUiState({ state: { ...validState(), cookieBannerMode: "sometimes" }, session: { disabledSites: [] } }));
  assert.throws(() => snapshotPopupUiState({ state: { ...validState(), disabledSites: [7] }, session: { disabledSites: [] } }));
  assert.throws(() => snapshotPopupUiState({ state: { ...validState(), cookieBannerDisabledSites: [7] }, session: { disabledSites: [] } }));
  assert.throws(() => snapshotPopupUiState({ state: validState(), session: { disabledSites: [7] } }));
});

test("popup UI snapshot rejects unknown root fields and custom prototypes", () => {
  assert.throws(() => snapshotPopupUiState({ state: validState(), session: { disabledSites: [] }, pageUrl: "https://example.com" }));
  const state = Object.assign(Object.create({}), validState());
  assert.throws(() => snapshotPopupUiState({ state, session: { disabledSites: [] } }));
});
