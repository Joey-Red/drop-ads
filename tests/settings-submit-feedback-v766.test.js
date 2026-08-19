import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");

test("policy submit buttons reference their own feedback regions", () => {
  for (const [text, region] of [
    ["Add", "block-error"],
    ["Add", "allow-error"],
    ["Block TLD", "country-status"],
    ["Add hide", "cosmetic-hide-error"],
    ["Add exception", "cosmetic-allow-error"],
    ["Add", "subscription-error"],
    ["Add", "cookie-exception-error"]
  ]) {
    assert.match(html, new RegExp(`<button[^>]*type="submit"[^>]*aria-describedby="${region}"[^>]*>${text}<\\/button>`));
  }
});
