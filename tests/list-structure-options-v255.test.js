import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_REMOTE_LIST_LINE_CHARS,
  MAX_REMOTE_LIST_LINES,
  assertRemoteListTextStructure
} from "../src/core/list-limits.js";

test("remote list structure options preserve reviewed defaults and lower test limits", () => {
  assert.deepEqual(assertRemoteListTextStructure("a\nbb"), { lines: 2, longestLineChars: 2 });
  assert.deepEqual(
    assertRemoteListTextStructure("a\nbb", { maxLines: 2, maxLineChars: 2 }),
    { lines: 2, longestLineChars: 2 }
  );
  assert.throws(() => assertRemoteListTextStructure("a\nb\nc", { maxLines: 2 }), /too many lines/);
  assert.throws(() => assertRemoteListTextStructure("abc", { maxLineChars: 2 }), /excessively long line/);
  assert.doesNotThrow(() => assertRemoteListTextStructure("x", {
    maxLines: MAX_REMOTE_LIST_LINES,
    maxLineChars: MAX_REMOTE_LIST_LINE_CHARS
  }));
});

test("remote list structure option accessors and normal get traps are never executed", () => {
  let getterRuns = 0;
  const accessor = {};
  Object.defineProperty(accessor, "maxLines", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return 2;
    }
  });
  assert.throws(() => assertRemoteListTextStructure("x", accessor), /data field|structure option/);
  assert.equal(getterRuns, 0);

  let getRuns = 0;
  const proxy = new Proxy({ maxLineChars: 3 }, {
    get(target, key, receiver) {
      getRuns += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  assert.deepEqual(assertRemoteListTextStructure("abc", proxy), { lines: 1, longestLineChars: 3 });
  assert.equal(getRuns, 0);
});

test("remote list structure option descriptor changes fail closed", () => {
  let descriptorReads = 0;
  const proxy = new Proxy({ maxLines: 2 }, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "maxLines") {
        descriptorReads += 1;
        if (descriptorReads > 1) throw new Error("changed");
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => assertRemoteListTextStructure("x", proxy), /own enumerable data field|plain object/);
});
