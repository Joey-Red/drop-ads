import assert from "node:assert/strict";
import test from "node:test";
import { fetchHeadDiagnostic } from "../tools/source-qualification.mjs";

function responseWithLength(length) {
  return {
    ok: true,
    redirected: false,
    headers: { get(name) { return name === "content-length" ? String(length) : null; } }
  };
}

class InjectedController {
  constructor() {
    return { signal: { test: true }, abort() {} };
  }
}

test("clearTimeout cleanup failure does not replace a successful HEAD diagnostic", async () => {
  const result = await fetchHeadDiagnostic(
    "https://example.com/list.txt",
    async () => responseWithLength(42),
    {
      timeoutMs: 1000,
      setTimeoutImpl() { return 7; },
      clearTimeoutImpl() { throw new Error("cleanup-only failure"); },
      AbortControllerImpl: InjectedController
    }
  );
  assert.equal(result, 42);
});

test("clearTimeout cleanup failure does not escape a failed optional diagnostic", async () => {
  const result = await fetchHeadDiagnostic(
    "https://example.com/list.txt",
    async () => { throw new Error("network failure"); },
    {
      timeoutMs: 1000,
      setTimeoutImpl() { return 8; },
      clearTimeoutImpl() { throw new Error("cleanup-only failure"); },
      AbortControllerImpl: InjectedController
    }
  );
  assert.equal(result, null);
});
