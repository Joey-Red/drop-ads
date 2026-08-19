import assert from "node:assert/strict";
import test from "node:test";
import { snapshotHeadResponseMetadata } from "../tools/source-head-response.mjs";

function plainResponse() {
  return {
    ok: true,
    redirected: false,
    headers: { get(name) { return name === "content-length" ? "7" : null; } }
  };
}

test("accepts exact plain injected response and headers", () => {
  assert.deepEqual(snapshotHeadResponseMetadata(plainResponse()), { declaredBytes: 7 });
});

test("rejects response accessors without invoking them", () => {
  let touched = false;
  const response = plainResponse();
  Object.defineProperty(response, "ok", { enumerable: true, get() { touched = true; return true; } });
  assert.equal(snapshotHeadResponseMetadata(response), null);
  assert.equal(touched, false);
});

test("rejects extra response/header fields, symbols, and custom prototypes", () => {
  const extra = plainResponse();
  extra.extra = true;
  assert.equal(snapshotHeadResponseMetadata(extra), null);

  const symbol = plainResponse();
  symbol[Symbol("extra")] = true;
  assert.equal(snapshotHeadResponseMetadata(symbol), null);

  const custom = plainResponse();
  Object.setPrototypeOf(custom, {});
  assert.equal(snapshotHeadResponseMetadata(custom), null);

  const headerExtra = plainResponse();
  headerExtra.headers.extra = true;
  assert.equal(snapshotHeadResponseMetadata(headerExtra), null);
});

test("rejects injected headers getter accessors without invoking them", () => {
  let touched = false;
  const response = plainResponse();
  Object.defineProperty(response.headers, "get", { enumerable: true, get() { touched = true; return () => "7"; } });
  assert.equal(snapshotHeadResponseMetadata(response), null);
  assert.equal(touched, false);
});
