import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function reject(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`${label} is forbidden`);
}

const record = read("tools/qualification-record.mjs");
const artifact = read("tools/qualification-artifact-verify.mjs");
const recordInput = read("tools/qualification-record-input.mjs");
const recordIo = read("tools/qualification-record-io.mjs");
const git = read("tools/qualification-git.mjs");
const serverRun = read("tools/qualification-server-run.mjs");
const serverOptions = read("tools/qualification-server-options.mjs");
const serverBounds = read("tools/qualification-server-bounds.mjs");
const requestGuard = read("tools/qualification-server-request-guard.mjs");
const packageJson = JSON.parse(read("package.json"));

for (const [needle, label] of [
  ["readQualificationUtf8File", "bounded qualification metadata reads"],
  ["verifyQualificationArtifactFile", "streamed package verification"],
  ["snapshotQualificationRecordInput", "descriptor-safe record input snapshot"],
  ["stringifyQualificationJsonData", "descriptor-safe record serialization"],
  ["writeQualificationRecordAtomic", "atomic record persistence"],
  ["readQualificationGitState", "bounded Git inspection"]
]) requireText(record, needle, label);
reject(record, /readFile\(resolve\(root, "dist"/m, "raw qualification dist reads");
reject(record, /execFile/, "direct qualification-record Git execution");

for (const [source, needle, label] of [
  [artifact, "HASH_CHUNK_BYTES", "streamed artifact chunking"],
  [artifact, "isSymbolicLink", "artifact symlink rejection"],
  [recordInput, "qualification record input", "record input snapshot"],
  [recordIo, "flag: \"wx\"", "exclusive record temporary write"],
  [recordIo, "mode: 0o600", "private record temporary mode"],
  [git, "maxBuffer: QUALIFICATION_GIT_MAX_BUFFER_BYTES", "Git max buffer"],
  [git, "timeout: QUALIFICATION_GIT_TIMEOUT_MS", "Git timeout"],
  [serverOptions, "snapshotQualificationServerOptions", "fixture option snapshot"],
  [serverBounds, "maxRequestsPerSocket", "fixture requests-per-socket bound"],
  [requestGuard, "QUALIFICATION_REQUEST_URL_MAX_CHARS", "fixture request-target bound"],
  [requestGuard, "misdirected request", "fixture Host guard"],
  [serverRun, "applyQualificationFixtureBounds", "active fixture resource bounds"],
  [serverRun, "installQualificationRequestGuards", "active fixture request guards"]
]) requireText(source, needle, label);

if (packageJson.scripts?.["qualify:serve"] !== "node tools/qualification-server-run.mjs") {
  throw new Error("qualify:serve must use the validated fixture entrypoint");
}
if (!String(packageJson.scripts?.check ?? "").includes("qualification-runtime-hardening-audit")) {
  throw new Error("npm run check must include qualification-runtime-hardening-audit");
}

for (const source of [record, artifact, recordInput, recordIo, git, serverRun, serverOptions, serverBounds, requestGuard]) {
  reject(source, /telemetry|analytics|browsingHistory|requestHistory|userId|deviceId/i, "qualification hardening telemetry/identity surface");
}

console.log("qualification-runtime-hardening-audit: M609-M618 record and loopback boundaries verified");
