import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

function functionBody(name, nextName) {
  const start = source.indexOf(`async function ${name}`);
  const end = source.indexOf(`async function ${nextName}`, start + 1);
  assert.notEqual(start, -1, `${name} must exist`);
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return source.slice(start, end);
}

test("M463 country removal always releases the owning connected row/control", () => {
  const body = functionBody("removeCountryBlock", "changeCountryMode");
  assert.match(body, /const row = button\.closest\("li"\)/);
  assert.match(body, /row\?\.setAttribute\("aria-busy", "true"\)/);
  assert.match(body, /finally \{[\s\S]*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);[\s\S]*if \(button\.isConnected\) button\.disabled = false;/);
});

test("M463 country mode changes always release the owning connected row/control", () => {
  const body = functionBody("changeCountryMode", "renderSafely");
  assert.match(body, /const row = select\.closest\("li"\)/);
  assert.match(body, /row\?\.setAttribute\("aria-busy", "true"\)/);
  assert.match(body, /finally \{[\s\S]*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);[\s\S]*if \(select\.isConnected\) select\.disabled = false;/);
});
