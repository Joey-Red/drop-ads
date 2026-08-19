import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("cookie-banner controller captures runtime messaging through bounded data descriptors", () => {
  assert.match(source, /MAX_API_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /function captureData\(receiver, key\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, key\)/);
  assert.match(source, /"value" in descriptor \? descriptor\.value : null/);
  assert.match(source, /Object\.getPrototypeOf\(current\)/);
  assert.match(source, /function capturedGlobalValue\(key\)/);
  assert.match(source, /const api = capturedGlobalValue\("browser"\) \?\? capturedGlobalValue\("chrome"\)/);
  assert.match(source, /function captureMethod\(receiver, key\)/);
  assert.match(source, /Reflect\.apply\(callback, receiver, args\)/);
  assert.match(source, /const runtime = captureData\(browserApi, "runtime"\)/);
  assert.match(source, /return captureMethod\(runtime, "sendMessage"\)/);
  assert.match(source, /const sendMessage = captureSendMessage\(api\)/);
  assert.match(source, /!sendMessage \|\| !scheduleTimeout \|\| !cancelTimeout/);
  assert.match(source, /response = await sendMessage\(/);
  assert.doesNotMatch(source, /globalThis\.browser\b|globalThis\.chrome\b|api\.runtime\.sendMessage\(/);
});

test("cookie-banner controller captures extension-owned collaborators before messaging", () => {
  assert.match(source, /DropAdsCookieBannerUtilsComposition/);
  assert.match(source, /exactFrozenApi\("DropAdsCookieBannerExecutor"/);
  assert.match(source, /exactFrozenApi\("DropAdsCookieBannerShadowRoots"/);
  assert.match(source, /exactFrozenApi\("DropAdsCookieBannerConsentSafety"/);
});
