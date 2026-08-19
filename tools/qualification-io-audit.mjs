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

const boundedArtifactReaders = [
  "tools/qualification-record-audit.mjs",
  "tools/qualification-observation-record-audit.mjs",
  "tools/qualification-observation-prepare.mjs",
  "tools/qualification-observation-update.mjs",
  "tools/qualification-observation-next.mjs",
  "tools/qualification-observation-summary.mjs"
];

for (const path of boundedArtifactReaders) {
  const source = read(path);
  requireText(source, "readQualificationUtf8File", `${path} bounded file reader`);
  reject(source, /\breadFileSync?\s*\(/, `${path} raw qualification artifact read`);
}

const fileIo = read("tools/qualification-file-io.mjs");
for (const [needle, label] of [
  ["QUALIFICATION_PACKAGE_MAX_BYTES", "package byte ceiling"],
  ["QUALIFICATION_RECORD_MAX_BYTES", "record byte ceiling"],
  ["QUALIFICATION_OBSERVATION_MAX_BYTES", "observation byte ceiling"],
  ["new TextDecoder(\"utf-8\", { fatal: true })", "strict UTF-8 decoder"],
  ["readQualificationUtf8Stream", "bounded stdin reader"],
  ["stat.isFile()", "regular-file requirement"],
  ["allowMissing", "optional missing-file handling"]
]) requireText(fileIo, needle, label);

const jsonData = read("tools/qualification-json-data.mjs");
for (const [needle, label] of [
  ["Reflect.ownKeys", "descriptor-safe key inspection"],
  ["Object.getOwnPropertyDescriptor", "descriptor-safe field inspection"],
  ["MAX_DEPTH", "qualification JSON depth ceiling"],
  ["MAX_NODES", "qualification JSON work ceiling"],
  ["stringifyQualificationJsonData", "safe qualification JSON serializer"]
]) requireText(jsonData, needle, label);
reject(jsonData, /\bcurrent\s*\[[^\]]+\]/, "qualification JSON ordinary dynamic property read");

const update = read("tools/qualification-observation-update.mjs");
requireText(update, "cloneQualificationJsonData", "guarded update descriptor-safe clone");
requireText(update, "snapshotQualificationObservationUpdate", "guarded update command snapshot");

const prepare = read("tools/qualification-observation-prepare.mjs");
requireText(prepare, "cloneQualificationJsonData", "observation seed qualification-record snapshot");
requireText(prepare, "stringifyQualificationJsonData", "sanitized identical-seed comparison");

const writer = read("tools/qualification-observation-io.mjs");
for (const [needle, label] of [
  ["readQualificationUtf8File", "atomic writer bounded conflict read"],
  ["QUALIFICATION_OBSERVATION_MAX_BYTES", "atomic writer observation ceiling"],
  ["stringifyQualificationJsonData", "atomic writer safe serialization"],
  ['open(temporaryPath, "wx", 0o600)', "atomic writer exclusive temporary create"],
  ["rename(temporaryPath, canonicalOutputPath)", "atomic writer final canonical rename"],
  ["verifyPublishedQualificationObservationTarget", "atomic writer publication identity verification"]
]) requireText(writer, needle, label);
reject(writer, /\breadFileSync?\s*\(/, "atomic writer raw conflict read");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["qualification-io-audit"] !== "node tools/qualification-io-audit.mjs") {
  throw new Error("package qualification-io-audit script is missing");
}
if (!packageJson.scripts?.check?.includes("npm run qualification-io-audit")) {
  throw new Error("qualification-io-audit is not part of npm run check");
}

console.log("qualification-io-audit: bounded strict-UTF-8 qualification I/O and safe serialization verified");
