import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/shortcut-availability.js", import.meta.url), "utf8");

test("shared shortcut availability rejects busy, disabled, hidden, and stale controls", () => {
  assert.match(source, /!pageActive \|\| !control\?\.isConnected \|\| control\.disabled \|\| control\.hidden === true/);
  assert.match(source, /popupMain\?\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(source, /control\.getAttribute\?\.\("aria-busy"\) === "true"/);
  assert.match(source, /control\.closest\?\.\("\[hidden\]"\)/);
  assert.match(source, /control\.closest\?\.\('\[aria-busy="true"\]'\)/);
});
