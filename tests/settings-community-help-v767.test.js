import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");

test("community opt-in explicitly references its privacy explanation", () => {
  assert.match(html, /id="auto-submit"[^>]*aria-describedby="community-help"/);
  assert.match(html, /id="community-help" class="hint">Off by default\./);
  assert.match(html, /never embeds a GitHub token or silently posts on your behalf/);
  assert.match(html, /Exact URLs are reduced to their domain before leaving the browser/);
});
