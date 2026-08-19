import test from "node:test";
import assert from "node:assert/strict";
import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

function apiWithSink(sent) {
  return {
    tabs: {
      sendMessage(tabId) {
        sent.push(tabId);
        return Promise.resolve();
      }
    }
  };
}

test("M486 skips unsafe tab ids and continues with later valid tabs", async () => {
  const sent = [];
  const result = await sendTabMessageBatched(
    apiWithSink(sent),
    [
      { id: Number.MAX_SAFE_INTEGER + 1 },
      { id: -1 },
      { id: 7 },
      { id: 7 },
      { id: 9 }
    ],
    { type: "drop-ads:cosmetic-refresh" }
  );
  assert.deepEqual(sent, [7, 9]);
  assert.deepEqual(result, { attempted: 2, failed: 0 });
});
