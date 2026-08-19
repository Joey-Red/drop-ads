import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const popupHtml = await readFile(new URL("../src/popup/index.html", import.meta.url), "utf8");
const generatedContract = await readFile(new URL("../tools/generated-extension-contract.mjs", import.meta.url), "utf8");

test("popup installs Settings recovery and engine status before awaited popup bootstrap", () => {
  const settingsRecovery = popupHtml.indexOf('src="popup-settings-early.js"');
  const engineState = popupHtml.indexOf('src="popup-engine-state.js"');
  const popupBootstrap = popupHtml.indexOf('src="popup.js"');

  assert.ok(settingsRecovery >= 0, "early Settings module must be present");
  assert.ok(engineState >= 0, "engine-state module must be present");
  assert.ok(popupBootstrap >= 0, "popup bootstrap must be present");
  assert.ok(settingsRecovery < popupBootstrap, "Settings recovery must install before popup bootstrap awaits background state");
  assert.ok(engineState < popupBootstrap, "engine-state readout must not depend on popup bootstrap completing");
  assert.match(popupHtml, /id="engine-status"/);
});

test("popup reliability modules are part of the generated extension contract", () => {
  assert.match(generatedContract, /"popup\/popup-engine-state\.js"/);
  assert.match(generatedContract, /"popup\/popup-settings-early\.js"/);
});
