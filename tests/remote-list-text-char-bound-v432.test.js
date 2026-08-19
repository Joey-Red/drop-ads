import test from "node:test";
import assert from "node:assert/strict";

import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";
import {
  MAX_REMOTE_LIST_TEXT_CHARS,
  assertRemoteListTextStructure
} from "../src/core/list-limits.js";

test("M432 direct remote-list text ceiling is numerically locked to the download byte ceiling", () => {
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, MAX_REMOTE_LIST_BYTES);
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, 5_000_000);
});

test("M432 one-over direct text rejects before option metadata or structural scanning", () => {
  let optionMetadataTouched = false;
  const hostileOptions = new Proxy({}, {
    getPrototypeOf() {
      optionMetadataTouched = true;
      throw new Error("options should not be inspected");
    }
  });
  const text = "a".repeat(MAX_REMOTE_LIST_TEXT_CHARS + 1);
  assert.throws(
    () => assertRemoteListTextStructure(text, hostileOptions),
    /exceeds 5000000 characters/
  );
  assert.equal(optionMetadataTouched, false);
});
