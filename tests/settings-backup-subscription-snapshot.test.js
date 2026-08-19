import test from "node:test";
import assert from "node:assert/strict";
import { parseSettingsBackup, SETTINGS_BACKUP_FORMAT, SETTINGS_BACKUP_VERSION } from "../src/core/settings-backup.js";

function settings(subscriptions) {
  return {
    enabled: true,
    autoSubmitCommunity: false,
    updateIntervalHours: 12,
    cookieMode: "third-party",
    cookieAllowSites: [],
    personalBlock: [],
    personalAllow: [],
    disabledSites: [],
    subscriptions
  };
}

function backup(subscriptions) {
  return { format: SETTINGS_BACKUP_FORMAT, version: SETTINGS_BACKUP_VERSION, settings: settings(subscriptions) };
}

test("built-in backup subscription id getter is never executed", () => {
  const record = { enabled: true };
  let reads = 0;
  Object.defineProperty(record, "id", { enumerable: true, get() { reads += 1; return "drop-ads-default"; } });
  assert.throws(() => parseSettingsBackup(backup([record])));
  assert.equal(reads, 0);
});

test("external backup subscription sourceUrl getter is never executed", () => {
  const record = { title: "Example", format: "hosts", enabled: true };
  let reads = 0;
  Object.defineProperty(record, "sourceUrl", { enumerable: true, get() { reads += 1; return "https://example.com/list.txt"; } });
  assert.throws(() => parseSettingsBackup(backup([record])));
  assert.equal(reads, 0);
});

test("backup subscription records avoid normal Proxy get traps", () => {
  const record = new Proxy({
    title: "Example",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt"
  }, { get() { throw new Error("normal get trap must not run"); } });
  const parsed = parseSettingsBackup(backup([record]));
  assert.ok(parsed.subscriptions.some((item) => item.sourceUrl === "https://example.com/list.txt"));
});

test("built-in enabled omission retains enabled default", () => {
  const parsed = parseSettingsBackup(backup([{ id: "drop-ads-default" }]));
  const item = parsed.subscriptions.find((subscription) => subscription.id === "drop-ads-default");
  assert.equal(item.enabled, true);
});

test("external enabled omission retains enabled default", () => {
  const parsed = parseSettingsBackup(backup([{
    title: "Example",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt"
  }]));
  const item = parsed.subscriptions.find((subscription) => subscription.sourceUrl === "https://example.com/list.txt");
  assert.equal(item.enabled, true);
});

test("backup subscription descriptor trap failures are contained", () => {
  const record = new Proxy({ id: "drop-ads-default" }, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "id") throw new Error("descriptor trap");
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => parseSettingsBackup(backup([record])), /subscription|id|inspectable|field/i);
});
