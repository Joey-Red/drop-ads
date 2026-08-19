import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");

test("primary policy text inputs reject empty submission natively", () => {
  for (const id of ["block-input", "allow-input", "cookie-exception-input"]) {
    assert.match(html, new RegExp(`<input id="${id}"[^>]*\\srequired(?:\\s|>)`));
  }
});
