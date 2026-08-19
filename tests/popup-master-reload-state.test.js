import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const popupHtml = await readFile(new URL("../src/popup/index.html", import.meta.url), "utf8");
const earlyStateSource = await readFile(new URL("../src/popup/popup-engine-state.js", import.meta.url), "utf8");

test("master checkbox cannot accept a pre-bootstrap change that would be lost", () => {
  assert.match(popupHtml, /<input id="enabled"[^>]*\sdisabled>/);
});

test("early popup state reflects the persisted master preference before background bootstrap", () => {
  assert.match(earlyStateSource, /const configuredEnabled = state\.enabled;/);
  assert.match(earlyStateSource, /if \(enabledControl\) enabledControl\.checked = configuredEnabled;/);
});
