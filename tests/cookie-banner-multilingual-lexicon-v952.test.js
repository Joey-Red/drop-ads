import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("cookie-banner rejection adds a small exact multilingual lexicon", () => {
  for (const phrase of [
    "alle ablehnen", "alles ablehnen",
    "tout refuser", "refuser tout",
    "rechazar todo", "rechazar todas",
    "rifiuta tutto", "rifiuta tutti",
    "rejeitar tudo", "recusar tudo",
    "alles weigeren", "alles afwijzen"
  ]) assert.ok(source.includes(`[\"${phrase}\"`), `missing reviewed phrase: ${phrase}`);
  assert.match(source, /if \(text === phrase\) return score/);
  assert.doesNotMatch(source, /startsWith\(|endsWith\(|includes\(phrase\)/);
  assert.match(source, /const MAX_COOKIE_BANNER_TEXT_CHARS = 160/);
});
