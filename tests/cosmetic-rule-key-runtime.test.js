import test from "node:test";
import assert from "node:assert/strict";
import { cosmeticRuleKey } from "../src/core/cosmetic-rules.js";
import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = { log() {}, warn() {}, error() {} };

test("malformed cosmetic removal key fails before storage mutation", async () => {
  const mock = createMockWebExtension();
  const runtime = installCosmeticRuntime({ api: mock.api, logger: quietLogger });
  const added = await runtime.addRule("personalCosmeticHide", { selector: ".ad" });
  assert.equal(added.changed, true);
  const writesBefore = mock.inspect.storageChanges.length;

  await assert.rejects(
    () => runtime.removeRule("personalCosmeticHide", ".ad\u0000missing-second-separator"),
    /exactly two separators/
  );
  assert.equal(mock.inspect.storageChanges.length, writesBefore);

  const removed = await runtime.removeRule("personalCosmeticHide", cosmeticRuleKey({ selector: ".ad" }));
  assert.equal(removed.changed, true);
});
