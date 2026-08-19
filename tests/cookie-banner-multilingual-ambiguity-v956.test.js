import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("multilingual accept/manage wording only suppresses automatic rejection", () => {
  for (const term of [
    "akzeptieren", "zustimmen", "einstellungen",
    "accepter", "autoriser", "preferences", "parametres",
    "aceptar", "permitir", "preferencias", "configuracion",
    "accetta", "consenti", "preferenze", "impostazioni",
    "aceitar", "configuracoes",
    "accepteren", "toestaan", "voorkeuren", "instellingen"
  ]) assert.ok(source.includes(term), `missing ambiguity term: ${term}`);
  assert.match(source, /if \(!text \|\| AMBIGUOUS_OR_POSITIVE\.test\(text\)\) return 0/);
  assert.match(source, /if \(text === phrase\) return score/);
});
