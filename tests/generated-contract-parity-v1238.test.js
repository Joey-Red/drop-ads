import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/generated-contract-parity-audit.mjs", import.meta.url), "utf8");

test("M1238 limits Chromium/Firefox generated contract delta to rules/static.json", () => {
  assert.match(source, /FIREFOX_ONLY_MEMBER = "rules\/static\.json"/);
  assert.match(source, /snapshotGeneratedContractStringArray/);
  assert.match(source, /MAX_CONTRACT_FILES = 4096/);
  assert.match(source, /chromium\.includes\(FIREFOX_ONLY_MEMBER\)/);
  assert.match(source, /firefoxOnlyCount !== 1/);
  assert.match(source, /firefox\.length !== chromium\.length \+ 1/);
  assert.match(source, /chromium\[index\] !== firefoxCommon\[index\]/);
  assert.match(source, /Object\.freeze\(\{/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|analytics|telemetry/);
});
