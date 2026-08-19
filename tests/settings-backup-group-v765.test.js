import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");

test("backup controls form one labelled feedback-associated group", () => {
  assert.match(html, /class="backup-row" role="group" aria-label="Backup actions" aria-describedby="backup-status backup-error"/);
  assert.match(html, /id="export-settings"[^>]*aria-describedby="backup-status backup-error"/);
  assert.match(html, /id="import-settings-file"[^>]*aria-describedby="backup-status backup-error"/);
  assert.match(html, /id="import-settings"[^>]*aria-describedby="backup-status backup-error"/);
});
