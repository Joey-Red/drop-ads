import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");

test("Settings status regions are polite and atomic", () => {
  for (const id of ["country-status", "refresh-status", "backup-status"]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"`));
  }
});

test("Settings alert regions are atomic", () => {
  for (const id of [
    "block-error",
    "allow-error",
    "cosmetic-hide-error",
    "cosmetic-allow-error",
    "subscription-error",
    "cookie-exception-error",
    "backup-error"
  ]) assert.match(html, new RegExp(`id="${id}"[^>]*role="alert"[^>]*aria-atomic="true"`));
});
