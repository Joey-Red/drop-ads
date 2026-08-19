import test from "node:test";
import assert from "node:assert/strict";
import { installActionCount } from "../src/core/action-count.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

test("action count installer does not use normal get access for validated options", () => {
  const mock = createMockWebExtension();
  let gets = 0;
  const options = new Proxy({ api: mock.api }, {
    get(target, key, receiver) {
      gets += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  const registration = installActionCount(options);
  assert.equal(gets, 0);
  registration.dispose();
});

test("action count installer rejects supplied logger getters without invoking them", () => {
  const mock = createMockWebExtension();
  let reads = 0;
  const logger = {};
  Object.defineProperty(logger, "warn", { enumerable: true, get() { reads += 1; return () => {}; } });
  assert.throws(() => installActionCount({ api: mock.api, logger }), /logger/i);
  assert.equal(reads, 0);
});

test("action count installer accepts a plain supplied logger", () => {
  const mock = createMockWebExtension();
  const registration = installActionCount({ api: mock.api, logger: { warn() {} } });
  assert.ok(registration);
  registration.dispose();
});
