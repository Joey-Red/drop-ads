import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cosmetic-runtime.js", import.meta.url), "utf8");

test("M469 cosmetic runtime captures browser namespaces and tab query before listener publication", () => {
  assert.match(source, /function captureDataValue\(receiver, key, label\)/);
  assert.match(source, /const runtimeNamespace = captureDataValue\(api, "runtime", "Cosmetic runtime runtime namespace"\);/);
  assert.match(source, /const storageNamespace = captureDataValue\(api, "storage", "Cosmetic runtime storage namespace"\);/);
  assert.match(source, /const tabsNamespace = captureDataValue\(api, "tabs", "Cosmetic runtime tabs namespace"\);/);
  assert.match(source, /const runtimeMessageEvent = captureDataValue\(runtimeNamespace, "onMessage", "Cosmetic runtime message event"\);/);
  assert.match(source, /const storageChangedEvent = captureDataValue\(storageNamespace, "onChanged", "Cosmetic storage change event"\);/);
  assert.match(source, /const queryTabs = captureEventMethod\(tabsNamespace, "query", "Cosmetic runtime tabs\.query"\);/);
  assert.match(source, /tabs = await queryTabs\(\{\}\);/);
  assert.doesNotMatch(source, /api\.tabs\.query\(/);
});

test("M469 first-install API capture rejects accessors and preserves receivers", () => {
  assert.match(source, /if \(!\("value" in descriptor\)\) throw new TypeError\(`\$\{label\} must be a data property`\);/);
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, event, args\);/);
  const installStart = source.indexOf("export function installCosmeticRuntime");
  const listenerStart = source.indexOf("runtimeMessageListeners.add(onMessage)", installStart);
  const setup = source.slice(installStart, listenerStart);
  assert.doesNotMatch(setup, /api\?\.runtime/);
  assert.doesNotMatch(setup, /api\?\.storage/);
  assert.doesNotMatch(setup, /api\?\.tabs/);
});
