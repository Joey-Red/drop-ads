import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

test("M458 runtime/onMessage listener collaborators are descriptor-captured once", () => {
  assert.match(source, /MAX_MESSAGE_GUARD_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /captureMessageGuardValue\(api, "runtime"/);
  assert.match(source, /captureMessageGuardValue\(rawRuntime, "onMessage"/);
  assert.match(source, /captureMessageGuardMethod\(rawOnMessage, "addListener"/);
  assert.match(source, /captureMessageGuardMethod\(rawOnMessage, "removeListener"/);
  assert.doesNotMatch(source, /rawOnMessage\.addListener\(/);
  assert.doesNotMatch(source, /rawOnMessage\.removeListener/);
});

test("M458 accessor runtime namespace is rejected without getter execution", () => {
  let reads = 0;
  const api = {};
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() {
      reads += 1;
      return { onMessage: { addListener() {} } };
    }
  });
  assert.throws(() => createMessageGuardedApi(api, { group: "core" }), /runtime namespace/);
  assert.equal(reads, 0);
});

test("M458 prototype data methods remain compatible", () => {
  class Event {
    addListener() {}
    removeListener() {}
  }
  class Runtime {}
  Runtime.prototype.onMessage = new Event();
  class Api {}
  Api.prototype.runtime = new Runtime();
  assert.doesNotThrow(() => createMessageGuardedApi(new Api(), { group: "core" }));
});
