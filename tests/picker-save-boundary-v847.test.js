import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const selector=fs.readFileSync(new URL("../src/content/selector-utils.js",import.meta.url),"utf8");
const guard=fs.readFileSync(new URL("../src/content/picker-save-guard.js",import.meta.url),"utf8");
const picker=fs.readFileSync(new URL("../src/content/picker.js",import.meta.url),"utf8");
test("M847 bounds CSS escape expansion and revalidates the exact target before save",()=>{assert.match(selector,/result\.length \+ escaped\.length > MAX_SELECTOR_LENGTH/);assert.match(selector,/CSS escape output exceeds/);assert.match(guard,/selectorUniquelyIdentifies\(selector, target, documentRef\)/);const verify=picker.indexOf("saveGuard.verifyCandidate(candidate, target, document);");const send=picker.indexOf("api.runtime.sendMessage({",verify);assert.ok(verify>=0&&send>verify);});
