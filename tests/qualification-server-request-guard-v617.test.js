import assert from "node:assert/strict";
import test from "node:test";
import {
  QUALIFICATION_REQUEST_URL_MAX_CHARS,
  qualificationRequestAdmission
} from "../tools/qualification-server-request-guard.mjs";

const base = {
  method: "GET",
  url: "/",
  hostHeader: "127.0.0.1:41731",
  listenerHost: "127.0.0.1",
  port: 41731
};

test("qualification request guard accepts exact loopback GET and HEAD", () => {
  assert.equal(qualificationRequestAdmission(base).ok, true);
  assert.equal(qualificationRequestAdmission({ ...base, method: "HEAD" }).ok, true);
});

test("qualification request guard rejects unsupported methods", () => {
  assert.equal(qualificationRequestAdmission({ ...base, method: "POST" }).status, 405);
});

test("qualification request guard rejects wrong Host headers", () => {
  assert.equal(qualificationRequestAdmission({ ...base, hostHeader: "localhost:41731" }).status, 421);
  assert.equal(qualificationRequestAdmission({ ...base, hostHeader: "127.0.0.1:9999" }).status, 421);
});

test("qualification request guard rejects non-origin and oversized targets", () => {
  assert.equal(qualificationRequestAdmission({ ...base, url: "http://example.test/" }).status, 400);
  assert.equal(qualificationRequestAdmission({ ...base, url: "//example.test/" }).status, 400);
  assert.equal(qualificationRequestAdmission({ ...base, url: `/${"a".repeat(QUALIFICATION_REQUEST_URL_MAX_CHARS)}` }).status, 400);
});
