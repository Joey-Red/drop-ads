import assert from "node:assert/strict";
import test from "node:test";
import {
  QUALIFICATION_SERVER_LIMITS,
  applyQualificationFixtureBounds,
  applyQualificationServerBounds
} from "../tools/qualification-server-bounds.mjs";

test("qualification server bounds set every reviewed resource ceiling", () => {
  const server = {};
  assert.equal(applyQualificationServerBounds(server), server);
  for (const [key, value] of Object.entries(QUALIFICATION_SERVER_LIMITS)) {
    assert.equal(server[key], value);
  }
});

test("qualification fixture bounds apply to every loopback listener", () => {
  const fixture = { servers: [{}, {}, {}, {}, {}, {}] };
  assert.equal(applyQualificationFixtureBounds(fixture), fixture);
  for (const server of fixture.servers) {
    assert.equal(server.maxHeadersCount, QUALIFICATION_SERVER_LIMITS.maxHeadersCount);
    assert.equal(server.requestTimeout, QUALIFICATION_SERVER_LIMITS.requestTimeout);
    assert.equal(server.maxRequestsPerSocket, QUALIFICATION_SERVER_LIMITS.maxRequestsPerSocket);
  }
});
