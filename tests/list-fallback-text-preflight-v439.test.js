import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function textResponse(text) {
  return { headers: null, body: null, async text() { return text; } };
}

test("M439 fallback text rejects obvious code-unit overflow before UTF-8 sizing", async () => {
  await assert.rejects(readResponseTextBounded(textResponse("a".repeat(17)), 16), /Remote list is too large/);
});

test("M439 exact-bound ASCII fallback remains valid", async () => {
  assert.equal(await readResponseTextBounded(textResponse("a".repeat(16)), 16), "a".repeat(16));
});

test("M439 UTF-8 byte gate remains authoritative for multibyte text", async () => {
  const text = "é".repeat(8); // 8 code units, 16 UTF-8 bytes
  assert.equal(await readResponseTextBounded(textResponse(text), 16), text);
  await assert.rejects(readResponseTextBounded(textResponse("é".repeat(9)), 16), /Remote list is too large/);
});
