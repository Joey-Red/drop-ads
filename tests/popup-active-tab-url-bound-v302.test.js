import test from "node:test";
import assert from "node:assert/strict";
import { MAX_POPUP_ACTIVE_TAB_URL_CHARS, snapshotPopupActiveTab } from "../src/core/popup-boundary.js";

const exact = "x".repeat(MAX_POPUP_ACTIVE_TAB_URL_CHARS);
const over = `${exact}x`;

test("popup active-tab snapshot accepts exact-bound browser URL strings", () => {
  assert.deepEqual(snapshotPopupActiveTab([{ id: 3, url: exact }]), { id: 3, url: exact });
  const tab = Object.assign(Object.create(null), { id: 4, url: exact });
  assert.deepEqual(snapshotPopupActiveTab([tab]), { id: 4, url: exact });
});

test("popup active-tab snapshot rejects oversized or type-confused URL values", () => {
  assert.equal(snapshotPopupActiveTab([{ id: 3, url: over }]), null);
  assert.equal(snapshotPopupActiveTab([{ id: 3, url: 7 }]), null);
  assert.equal(snapshotPopupActiveTab([{ id: 3 }]), null);
});

test("popup active-tab snapshot rejects URL accessors without executing them", () => {
  let reads = 0;
  const tab = { id: 3 };
  Object.defineProperty(tab, "url", {
    enumerable: true,
    get() { reads += 1; return exact; }
  });
  assert.equal(snapshotPopupActiveTab([tab]), null);
  assert.equal(reads, 0);
});
