import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseWithReader(events) {
  return {
    body: {
      getReader() {
        return {
          async read() {
            events.push("read");
            return { done: true };
          },
          async cancel() {
            events.push("cancel");
          }
        };
      }
    },
    text: async () => ""
  };
}

test("M453 abort-listener add failure rolls back listener and reader without replacing the original error", async () => {
  const events = [];
  const original = new Error("listener registration failed");
  const signal = {
    aborted: false,
    addEventListener() {
      events.push("add");
      throw original;
    },
    removeEventListener() {
      events.push("remove");
      throw new Error("remove cleanup failed");
    }
  };

  await assert.rejects(
    readResponseTextBounded(responseWithReader(events), 16, { signal }),
    (error) => error === original
  );
  assert.deepEqual(events, ["add", "remove", "cancel"]);
});

test("M453 registration failure performs no stream read work", async () => {
  const events = [];
  const signal = {
    aborted: false,
    addEventListener() { throw new Error("no listener"); },
    removeEventListener() {}
  };

  await assert.rejects(readResponseTextBounded(responseWithReader(events), 16, { signal }), /no listener/);
  assert.equal(events.includes("read"), false);
  assert.equal(events.includes("cancel"), true);
});
