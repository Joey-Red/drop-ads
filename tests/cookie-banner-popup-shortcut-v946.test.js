import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const catalog = fs.readFileSync(new URL("../src/popup/shortcut-catalog.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("B is the canonical site-only cookie-banner shortcut", () => {
  assert.match(catalog, /key: "b", shortcut: "B", controlId: "cookie-banner-site-enabled", help: "Toggle cookie-banner rejection on this site", siteOnly: true/);
  assert.match(html, /data-shortcut="b" data-shortcut-control="cookie-banner-site-enabled"/);
  assert.match(html, /aria-keyshortcuts="B"/);
});
