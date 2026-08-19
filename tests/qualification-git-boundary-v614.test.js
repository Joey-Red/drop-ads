import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const gitSource = fs.readFileSync(new URL("../tools/qualification-git.mjs", import.meta.url), "utf8");
const recordSource = fs.readFileSync(new URL("../tools/qualification-record.mjs", import.meta.url), "utf8");
const observationSource = fs.readFileSync(new URL("../tools/qualification-observation-record-audit.mjs", import.meta.url), "utf8");

test("qualification Git helper bounds subprocess execution", () => {
  assert.match(gitSource, /maxBuffer: QUALIFICATION_GIT_MAX_BUFFER_BYTES/);
  assert.match(gitSource, /timeout: QUALIFICATION_GIT_TIMEOUT_MS/);
  assert.match(gitSource, /shell: false/);
  assert.match(gitSource, /\["rev-parse", "HEAD"\]/);
  assert.match(gitSource, /\["status", "--porcelain=v1", "--untracked-files=all"\]/);
});

test("qualification exact-head consumers use the shared Git boundary", () => {
  assert.match(recordSource, /readQualificationGitState/);
  assert.doesNotMatch(recordSource, /execFile/);
  assert.match(observationSource, /readQualificationGitState/);
  assert.doesNotMatch(observationSource, /execFile/);
});
