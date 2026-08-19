import assert from "node:assert/strict";
import test from "node:test";
import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";
import { fetchHeadDiagnostic } from "../tools/source-qualification.mjs";

function response(length) {
  return {
    ok: true,
    redirected: false,
    headers: { get(name) { return name === "content-length" ? String(length) : null; } }
  };
}

test("HEAD declared bytes are retained only within the GET byte ceiling", async () => {
  assert.equal(await fetchHeadDiagnostic("https://example.com/list.txt", async () => response(MAX_REMOTE_LIST_BYTES)), MAX_REMOTE_LIST_BYTES);
  assert.equal(await fetchHeadDiagnostic("https://example.com/list.txt", async () => response(MAX_REMOTE_LIST_BYTES + 1)), null);
});

test("oversized HEAD metadata remains non-authoritative rather than failing qualification", async () => {
  const value = await fetchHeadDiagnostic("https://example.com/list.txt", async () => response(Number.MAX_SAFE_INTEGER));
  assert.equal(value, null);
});
