import assert from "node:assert/strict";
import test from "node:test";
import { snapshotHeadResponseMetadata } from "../tools/source-head-response.mjs";

test("reads native Fetch Response metadata through captured intrinsics", () => {
  const response = new Response(null, {
    status: 200,
    headers: { "content-length": "123" }
  });
  assert.deepEqual(snapshotHeadResponseMetadata(response), { declaredBytes: 123 });
});

test("retains injected plain-data response support", () => {
  const headers = {
    get(name) { return name === "content-length" ? "42" : null; }
  };
  const response = { ok: true, redirected: false, headers };
  assert.deepEqual(snapshotHeadResponseMetadata(response), { declaredBytes: 42 });
});

test("native failure and redirect responses remain non-authoritative", () => {
  assert.equal(snapshotHeadResponseMetadata(new Response(null, { status: 500 })), null);
  const response = new Response(null, { status: 200 });
  const redirectedGetter = Object.getOwnPropertyDescriptor(Response.prototype, "redirected").get;
  assert.equal(Reflect.apply(redirectedGetter, response, []), false);
});
