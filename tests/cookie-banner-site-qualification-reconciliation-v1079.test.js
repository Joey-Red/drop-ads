import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../tools/qualification-server.mjs", import.meta.url), "utf8");
const guide = fs.readFileSync(new URL("../docs/COOKIE_BANNER_SITE_QUALIFICATION.md", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("canonical loopback fixture covers immediate and delayed cookie-banner rejection", () => {
  assert.equal(pkg.scripts["qualify:serve"], "node tools/qualification-server-run.mjs");
  assert.match(server, /Immediate cookie-banner rejection/);
  assert.match(server, /Delayed open-shadow cookie banner/);
  assert.match(server, /cookie-banner-static-reject/);
  assert.match(server, /cookie-shadow-reject/);
  assert.match(server, /Everything on this page is served by local loopback listeners/);
});

test("per-site guide exercises disable reload and re-enable without retained results", () => {
  assert.match(guide, /clear \*\*Reject cookie banners here\*\*/);
  assert.match(guide, /Reload the page/);
  assert.match(guide, /Re-enable \*\*Reject cookie banners here\*\*/);
  assert.match(guide, /fixture itself uses loopback resources only and does not record qualification results/);
});
