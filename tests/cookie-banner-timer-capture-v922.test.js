import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("cookie-banner timers use descriptor-safe captured collaborators", () => {
  assert.match(source, /const MAX_API_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /const scheduleTimeout = captureMethod\(globalThis, "setTimeout"\)/);
  assert.match(source, /const cancelTimeout = captureMethod\(globalThis, "clearTimeout"\)/);
  assert.match(source, /!sendMessage \|\| !scheduleTimeout \|\| !cancelTimeout/);
  assert.match(source, /scanTimer = scheduleTimeout\(\(\) => \{ scanForRejection\(\); \}, MUTATION_SETTLE_MS\)/);
  assert.match(source, /stopTimer = scheduleTimeout\(stop, MAX_OBSERVE_MS\)/);
  assert.match(source, /cancelTimeout\(timer\)/);
  assert.doesNotMatch(source, /globalThis\.setTimeout|globalThis\.clearTimeout/);
});
