import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDiagnosticSourceUrl } from "../tools/source-qualification.mjs";

test("diagnostic URLs normalize through public HTTPS subscription policy", () => {
  const value = normalizeDiagnosticSourceUrl("https://example.com/list.txt#fragment");
  assert.equal(value, "https://example.com/list.txt");
});

test("diagnostic URLs reject unsafe targets", () => {
  assert.throws(() => normalizeDiagnosticSourceUrl("http://example.com/list.txt"), /HTTPS/);
  assert.throws(() => normalizeDiagnosticSourceUrl("https://user:pass@example.com/list.txt"), /credentials/);
  assert.throws(() => normalizeDiagnosticSourceUrl("https://127.0.0.1/list.txt"), /public network host/);
  assert.throws(() => normalizeDiagnosticSourceUrl({ toString() { throw new Error("coercion"); } }), /must be a string/);
});
