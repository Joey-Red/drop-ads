import test from "node:test";
import assert from "node:assert/strict";
import { MAX_POPUP_ACTIVE_TAB_CANDIDATES, snapshotPopupActiveTab } from "../src/core/popup-boundary.js";

test("popup active-tab snapshot accepts own-data tab records", () => {
  const tab = Object.assign(Object.create(null), { id: 7, url: "https://example.com/path" });
  assert.deepEqual(snapshotPopupActiveTab([tab]), { id: 7, url: "https://example.com/path" });
});

test("popup active-tab snapshot rejects sparse and oversized query arrays", () => {
  const sparse = new Array(1);
  assert.equal(snapshotPopupActiveTab(sparse), null);
  assert.equal(snapshotPopupActiveTab(Array.from({ length: MAX_POPUP_ACTIVE_TAB_CANDIDATES + 1 }, () => ({ id: 1, url: "https://example.com" }))), null);
});

test("popup active-tab snapshot never executes tab accessors", () => {
  let reads = 0;
  const tab = { id: 1 };
  Object.defineProperty(tab, "url", { enumerable: true, get() { reads += 1; return "https://example.com"; } });
  assert.equal(snapshotPopupActiveTab([tab]), null);
  assert.equal(reads, 0);
});

test("popup active-tab snapshot rejects custom prototypes and malformed fields", () => {
  assert.equal(snapshotPopupActiveTab([Object.assign(Object.create({}), { id: 1, url: "https://example.com" })]), null);
  assert.equal(snapshotPopupActiveTab([{ id: -1, url: "https://example.com" }]), null);
  assert.equal(snapshotPopupActiveTab([{ id: 1.5, url: "https://example.com" }]), null);
  assert.equal(snapshotPopupActiveTab([{ id: 1, url: new URL("https://example.com") }]), null);
});
