import test from "node:test";
import assert from "node:assert/strict";
import { parseDiagnosticContentLength, snapshotHeadResponseMetadata } from "../tools/source-head-response.mjs";

test("HEAD response metadata uses receiver-preserving data properties", () => {
  const headers = { get(name) { assert.equal(this, headers); return name === "content-length" ? "123" : null; } };
  const result = snapshotHeadResponseMetadata({ ok: true, redirected: false, headers });
  assert.deepEqual(result, { declaredBytes: 123 });
});

test("HEAD response metadata rejects accessors without running them", () => {
  let ran = false;
  const response = { redirected: false, headers: { get() { return "1"; } } };
  Object.defineProperty(response, "ok", { enumerable: true, get() { ran = true; return true; } });
  assert.equal(snapshotHeadResponseMetadata(response), null);
  assert.equal(ran, false);
});

test("Content-Length diagnostic accepts only canonical safe decimals", () => {
  assert.equal(parseDiagnosticContentLength("0"), 0);
  assert.equal(parseDiagnosticContentLength("42"), 42);
  assert.equal(parseDiagnosticContentLength("0042"), null);
  assert.equal(parseDiagnosticContentLength("-1"), null);
  assert.equal(parseDiagnosticContentLength("9007199254740992"), null);
});
