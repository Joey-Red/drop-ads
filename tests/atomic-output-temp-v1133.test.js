import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const helper = fs.readFileSync(new URL("../tools/atomic-output-temp.mjs", import.meta.url), "utf8");
const releaseOutput = fs.readFileSync(new URL("../tools/release-output-io.mjs", import.meta.url), "utf8");
const packageOutput = fs.readFileSync(new URL("../tools/package-output-io.mjs", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../tools/release-tool-contract.mjs", import.meta.url), "utf8");

test("M1133 atomic output temp names use cryptographic randomness", () => {
  assert.match(helper, /import \{ randomBytes \} from "node:crypto"/);
  assert.match(helper, /randomBytes\(16\)\.toString\("hex"\)/);
  assert.doesNotMatch(helper, /Math\.random/);
});

test("M1133 release and package output writers share the canonical temp helper", () => {
  for (const source of [releaseOutput, packageOutput]) {
    assert.match(source, /createAtomicOutputTempPath\(output\)/);
    assert.doesNotMatch(source, /Math\.random/);
    assert.match(source, /open\(temp, "wx", 0o600\)/);
    assert.match(source, /await handle\.sync\(\)/);
  }
  assert.match(contract, /tools\/atomic-output-temp\.mjs/);
});
