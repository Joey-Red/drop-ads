import test from "node:test";
import assert from "node:assert/strict";
import { isCommunityCandidateEligible } from "../src/core/community.js";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

test("only unscoped domain and exact URL rules are automatic community candidates", () => {
  assert.equal(isCommunityCandidateEligible({ kind: "domain", value: "ads.example.com" }), true);
  assert.equal(isCommunityCandidateEligible({ kind: "url", value: "https://ads.example.com/a?b=1" }), true);
  assert.equal(isCommunityCandidateEligible({ kind: "pattern", value: "||*.ru^" }), false);
  assert.equal(isCommunityCandidateEligible({ kind: "domain", value: "ads.example.com", resourceTypes: ["image"] }), false);
  assert.equal(isCommunityCandidateEligible({ kind: "url", value: "https://ads.example.com/a", resourceTypes: ["script"] }), false);
});

test("auto-submit marks policy-only rules not-eligible without opening GitHub", async () => {
  const mock = createMockWebExtension();
  const fixture = createFixtureFetch();
  const runtime = createBackgroundRuntime({ api: mock.api, fetchImpl: fixture.fetchImpl, logger: { log() {}, warn() {}, error() {} } });
  runtime.start();
  await runtime.initializeRuntime({ repairState: true });
  await runtime.whenIdle();

  mock.inspect.storageData[STORAGE_KEY].autoSubmitCommunity = true;
  const tabsBefore = mock.inspect.tabs.length;
  const result = await runtime.addPersonalRule("personalBlock", { kind: "pattern", value: "||*.ru^", resourceTypes: ["main_frame"] });
  await runtime.whenIdle();

  assert.equal(result.changed, true);
  assert.equal(result.communitySubmission, "not-eligible");
  assert.equal(mock.inspect.tabs.length, tabsBefore);
});

test("private domains stay locally valid but community preparation still fails closed", async () => {
  const mock = createMockWebExtension();
  const fixture = createFixtureFetch();
  const runtime = createBackgroundRuntime({ api: mock.api, fetchImpl: fixture.fetchImpl, logger: { log() {}, warn() {}, error() {} } });
  runtime.start();
  await runtime.initializeRuntime({ repairState: true });
  await runtime.whenIdle();

  mock.inspect.storageData[STORAGE_KEY].autoSubmitCommunity = true;
  const tabsBefore = mock.inspect.tabs.length;
  const result = await runtime.addPersonalRule("personalBlock", { kind: "domain", value: "printer.local" });
  await runtime.whenIdle();

  assert.equal(result.changed, true);
  assert.equal(result.communitySubmission, "failed");
  assert.equal(mock.inspect.tabs.length, tabsBefore);
});
