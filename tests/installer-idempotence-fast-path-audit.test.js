import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function source(path) {
  return fs.readFileSync(new URL(`../src/core/${path}`, import.meta.url), "utf8");
}

function ordered(text, ...needles) {
  let cursor = -1;
  for (const needle of needles) {
    const next = text.indexOf(needle, cursor + 1);
    assert.ok(next > cursor, `expected ordered token: ${needle}`);
    cursor = next;
  }
}

test("action-count validates options/API key before idempotence and defers collaborator capture", () => {
  const text = source("action-count.js");
  ordered(
    text,
    'assertPlainExactObject(options, "Action count options", ACTION_COUNT_OPTION_KEYS);',
    'const api = optionValue(options, "api");',
    'const existing = installations.get(api);',
    'if (existing) return existing;',
    'const logger = suppliedLogger(options);',
    'const namespaces = captureActionCountNamespaces(api);'
  );
});

test("refresh watchdog validates options/API key before idempotence and defers controller/logger/browser capture", () => {
  const text = source("refresh-watchdog.js");
  ordered(
    text,
    'assertPlainExactObject(options, "Refresh watchdog options", WATCHDOG_OPTION_KEYS);',
    'const api = optionValue(options, "api");',
    'const existingInstallation = installations.get(api);',
    'if (existingInstallation) return existingInstallation;',
    'const controller = optionValue(options, "controller");',
    'const warn = suppliedWarning(options);',
    'const alarms = captureDataValue(api, "alarms", "Refresh watchdog alarms namespace");'
  );
});

test("policy convergence validates options/API key before idempotence and defers controller/logger/event capture", () => {
  const text = source("policy-convergence.js");
  ordered(
    text,
    'assertPlainExactObject(options, "Policy convergence options", CONVERGENCE_OPTION_KEYS);',
    'const api = optionValue(options, "api");',
    'const existing = REGISTRATIONS.get(api);',
    'if (existing) return existing;',
    'const controller = optionValue(options, "controller");',
    'const errorLog = suppliedError(options);',
    'const events = requireApi(api);'
  );
});

test("cosmetic runtime validates/detaches options before idempotence and defers logger/event capture", () => {
  const text = source("cosmetic-runtime.js");
  ordered(
    text,
    'const snapshot = exactDataSnapshot(options, "Cosmetic runtime options", COSMETIC_RUNTIME_OPTION_KEYS);',
    'const api = snapshot.api;',
    'const existing = INSTALLATIONS.get(api);',
    'if (existing) return existing;',
    'const warn = captureWarn(Object.hasOwn(snapshot, "logger") ? snapshot.logger : undefined);',
    'const runtimeMessageListeners = captureListenerEvent(runtimeMessageEvent, "Cosmetic runtime message event");'
  );
});
