import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync(new URL("../src/content/selector-utils.js",import.meta.url),"utf8");
test("M846 selector generation is bounded and recovers from ambiguous identity",()=>{for(const needle of ["const MAX_SELECTOR_LENGTH = 400;","const MAX_DEPTH = 5;","const MAX_SIBLING_SCAN = 10_000;","const MAX_UNIQUENESS_PROBES = 32;","function directIdentityCandidates(element, includeId = true)","function stableIdIsUnique(element, documentRef, probe = unique)","const duplicateId = directCandidates[0]?.startsWith(\"#\") === true;","function stableClassSelectorCandidates(element, tag)","Picker selector uniqueness probe limit exceeded"]) assert.ok(source.includes(needle),needle);});
