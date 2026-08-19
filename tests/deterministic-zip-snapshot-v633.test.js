import test from "node:test";
import assert from "node:assert/strict";
import { createStoredZipBuffer, snapshotZipEntries } from "../tools/deterministic-zip.mjs";

test("ZIP entry snapshot rejects getters without executing them", () => {
  let getterCalls = 0;
  const entry = { data: "x" };
  Object.defineProperty(entry, "name", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "x.txt";
    }
  });
  assert.throws(() => snapshotZipEntries([entry]), /data property/);
  assert.equal(getterCalls, 0);
});

test("ZIP entry snapshot rejects sparse arrays and extra entry fields", () => {
  const sparse = new Array(1);
  assert.throws(() => snapshotZipEntries(sparse), /dense/);
  assert.throws(() => snapshotZipEntries([{ name: "a.txt", data: "a", extra: true }]), /fields are invalid/);
});

test("ZIP entry snapshot copies byte payloads before encoding", () => {
  const source = Buffer.from("a");
  const snapshot = snapshotZipEntries([{ name: "a.txt", data: source }]);
  source[0] = 0x62;
  assert.equal(snapshot[0].data.toString("utf8"), "a");
  const zip = createStoredZipBuffer([{ name: "a.txt", data: new Uint8Array([0x61]) }]);
  assert.ok(zip.length > 22);
});
