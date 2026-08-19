import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cosmetic-runtime.js", import.meta.url), "utf8");

test("M432 cosmetic runtime routes asynchronous replies through best-effort delivery", () => {
  assert.match(source, /function sendResponseBestEffort\(sendResponse, payload\)/);
  assert.match(source, /if \(typeof sendResponse !== "function"\) return false;/);
  assert.match(source, /try \{\s*sendResponse\(payload\);\s*return true;\s*\} catch \{\s*return false;\s*\}/s);

  const onMessageStart = source.indexOf("const onMessage =");
  const onStorageStart = source.indexOf("const onStorageChanged =", onMessageStart);
  const onMessage = source.slice(onMessageStart, onStorageStart);
  assert.doesNotMatch(onMessage, /\bsendResponse\(\{/);
  assert.equal((onMessage.match(/sendResponseBestEffort\(sendResponse,/g) ?? []).length, 6);
});

test("M432 preserves the reviewed cosmetic failure-text boundary", () => {
  assert.match(source, /export const MAX_COSMETIC_RUNTIME_ERROR_CHARS = 1_024;/);
  assert.match(source, /cosmeticRuntimeFailureMessage\(error, "Could not read cosmetic policy"\)/);
  assert.match(source, /cosmeticRuntimeFailureMessage\(error, "Could not add cosmetic rule"\)/);
  assert.match(source, /cosmeticRuntimeFailureMessage\(error, "Could not remove cosmetic rule"\)/);
});
