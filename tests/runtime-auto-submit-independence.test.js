import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime, MENU_BLOCK_DEFAULT } from "../src/core/runtime.js";
import { RULE_TIERS } from "../src/core/rules.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

async function setup({ autoSubmit = false } = {}) {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const fixture = createFixtureFetch();
  const runtime = createBackgroundRuntime({
    api: mock.api,
    fetchImpl: fixture.fetchImpl,
    now: () => 1_000_000,
    logger: quietLogger
  }).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();

  if (autoSubmit) {
    const state = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
    await mock.api.storage.local.set({ [STORAGE_KEY]: { ...state, autoSubmitCommunity: true } });
    await runtime.whenIdle();
  }
  return { mock, runtime };
}

function hasPersonalBlock(mock, domain) {
  return [...mock.inspect.dynamicRules.values()].some((rule) =>
    rule.id >= RULE_TIERS.personalBlock.idStart
    && rule.id <= RULE_TIERS.personalBlock.idEnd
    && rule.condition.requestDomains?.includes(domain));
}

test("auto-submit remains off by default and a local block requests no GitHub tab", async () => {
  const { mock, runtime } = await setup();
  assert.equal(mock.inspect.storageData[STORAGE_KEY].autoSubmitCommunity, false);

  const result = await mock.sendMessage({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "domain", value: "local-only.example" }
  });
  await runtime.whenIdle();

  assert.equal(result.ok, true);
  assert.equal(result.result.communitySubmission, "not-requested");
  assert.equal(mock.inspect.tabs.length, 0);
  assert.ok(hasPersonalBlock(mock, "local-only.example"));
});

test("GitHub tab failure after an opt-in block reports contribution failure but keeps local policy successful", async () => {
  const { mock, runtime } = await setup({ autoSubmit: true });
  mock.inspect.failNextTabCreate();

  const result = await mock.sendMessage({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "domain", value: "submit-fail.example" }
  });
  await runtime.whenIdle();

  assert.equal(result.ok, true);
  assert.equal(result.result.changed, true);
  assert.equal(result.result.communitySubmission, "failed");
  assert.ok(mock.inspect.storageData[STORAGE_KEY].personalBlock.some((rule) => rule.value === "submit-fail.example"));
  assert.ok(hasPersonalBlock(mock, "submit-fail.example"));
  assert.equal(mock.inspect.tabs.length, 0);
});

test("successful opt-in preparation reports prepared and opens only a domain-only GitHub issue", async () => {
  const { mock, runtime } = await setup({ autoSubmit: true });

  const result = await mock.sendMessage({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "url", value: "https://ads.example/path/banner.js?token=secret" }
  });
  await runtime.whenIdle();

  assert.equal(result.ok, true);
  assert.equal(result.result.communitySubmission, "prepared");
  assert.equal(mock.inspect.tabs.length, 1);
  const opened = new URL(mock.inspect.tabs[0].url);
  const body = opened.searchParams.get("body") ?? "";
  assert.match(body, /ads\.example/);
  assert.doesNotMatch(body, /banner\.js|token=secret|path\//);
});

test("private LAN auto-submit is rejected locally while the personal block stays active", async () => {
  const { mock, runtime } = await setup({ autoSubmit: true });

  const result = await mock.sendMessage({
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "domain", value: "192.168.50.20" }
  });
  await runtime.whenIdle();

  assert.equal(result.ok, true);
  assert.equal(result.result.changed, true);
  assert.equal(result.result.communitySubmission, "failed");
  assert.ok(mock.inspect.storageData[STORAGE_KEY].personalBlock.some((rule) => rule.value === "192.168.50.20"));
  assert.ok(hasPersonalBlock(mock, "192.168.50.20"));
  assert.equal(mock.inspect.tabs.length, 0, "private LAN candidate must never reach GitHub tab creation");
});

test("manual Submit rejects private/local candidates before tabs.create", async () => {
  const { mock, runtime } = await setup();
  const beforeTabs = mock.inspect.tabs.length;

  for (const rule of [
    { kind: "domain", value: "192.168.1.25" },
    { kind: "domain", value: "printer.local" },
    { kind: "url", value: "http://127.0.0.1/private" },
    { kind: "url", value: "http://[fd00::42]/private" }
  ]) {
    const result = await mock.sendMessage({ type: "drop-ads:submit-community", rule });
    await runtime.whenIdle();
    assert.equal(result.ok, false);
    assert.match(result.error, /Local\/private network targets/);
    assert.equal(mock.inspect.tabs.length, beforeTabs);
  }
});

test("duplicate/no-op local block does not create a duplicate community submission", async () => {
  const { mock, runtime } = await setup({ autoSubmit: true });
  const message = {
    type: "drop-ads:add-personal-rule",
    field: "personalBlock",
    rule: { kind: "domain", value: "duplicate-submit.example" }
  };

  const first = await mock.sendMessage(message);
  await runtime.whenIdle();
  assert.equal(first.result.communitySubmission, "prepared");
  assert.equal(mock.inspect.tabs.length, 1);

  mock.inspect.failNextTabCreate();
  const duplicate = await mock.sendMessage(message);
  await runtime.whenIdle();
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.result.changed, false);
  assert.equal(duplicate.result.communitySubmission, "not-requested");
  assert.equal(mock.inspect.tabs.length, 1);

  const manual = await mock.sendMessage({
    type: "drop-ads:submit-community",
    rule: { kind: "domain", value: "duplicate-submit.example" }
  });
  await runtime.whenIdle();
  assert.equal(manual.ok, false, "manual Submit consumes the pending simulated tab failure, proving duplicate auto-submit did not run");
});

test("context-menu block remains active when optional GitHub preparation fails", async () => {
  const { mock, runtime } = await setup({ autoSubmit: true });
  mock.inspect.failNextTabCreate();

  mock.events.menuClicked.emit({
    menuItemId: MENU_BLOCK_DEFAULT,
    srcUrl: "https://context-submit-fail.example/banner.js"
  });
  await runtime.whenIdle();

  assert.ok(mock.inspect.storageData[STORAGE_KEY].personalBlock.some((rule) => rule.value === "context-submit-fail.example"));
  assert.ok(hasPersonalBlock(mock, "context-submit-fail.example"));
  assert.equal(mock.inspect.tabs.length, 0);
});
