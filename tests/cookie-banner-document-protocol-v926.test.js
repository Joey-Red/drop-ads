import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("cookie-banner policy requests are limited to HTTP(S) documents through captured location getters", () => {
  assert.match(source, /const locationGetter = captureGetter\(globalThis, "location"\)/);
  assert.match(source, /const location = readGetter\(locationGetter, globalThis\)/);
  assert.match(source, /const protocolGetter = captureGetter\(location, "protocol"\)/);
  assert.match(source, /const hostnameGetter = captureGetter\(location, "hostname"\)/);
  assert.match(source, /const protocol = readGetter\(protocolGetter, location\)/);
  assert.match(source, /protocol !== "http:" && protocol !== "https:"/);
  assert.match(source, /const domain = readGetter\(hostnameGetter, location\)/);
  assert.match(source, /Object\.freeze\(\{ type: MESSAGE_TYPE, domain \}\)/);
  assert.doesNotMatch(source, /globalThis\.location\?\.|location\.href|document\.URL|document\.referrer/);
});
