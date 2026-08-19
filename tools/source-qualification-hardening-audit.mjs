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

const main = read("tools/source-qualification.mjs");
const input = read("tools/source-qualification-input.mjs");
const head = read("tools/source-head-response.mjs");
const controller = read("tools/source-head-controller.mjs");
const summary = read("tools/source-qualification-summary.mjs");
const coverage = read("tools/source-qualification-coverage.mjs");
const order = read("tools/source-qualification-order.mjs");
const failure = read("tools/source-qualification-failure.mjs");
const reportLimits = read("tools/source-qualification-report-limits.mjs");
const reportSerialize = read("tools/source-qualification-report-serialize.mjs");
const report = read("tools/source-qualification-report.mjs");
const packageJson = read("package.json");

for (const [needle, label] of [
  ["snapshotSourceQualificationIds", "source id snapshot"],
  ["snapshotSourceQualificationOptions", "source options snapshot"],
  ["snapshotPerSourceQualificationOptions", "per-source options snapshot"],
  ["snapshotHeadDiagnosticOptions", "HEAD options snapshot"],
  ["MAX_SOURCE_HEAD_TIMEOUT_MS = 30_000", "HEAD timeout ceiling"],
  ["Reflect.ownKeys", "descriptor key inspection"],
  ["Object.getOwnPropertyDescriptor", "descriptor value inspection"]
]) requireText(input, needle, label);

for (const [needle, label] of [
  ["snapshotHeadResponseMetadata", "HEAD response snapshot"],
  ["nativeAccessorValue", "native HEAD response accessor capture"],
  ["NativeResponse.prototype", "native Response prototype boundary"],
  ["NativeHeaders.prototype", "native Headers prototype boundary"],
  ["Reflect.apply(descriptor.get, object, [])", "receiver-preserving native response accessor"],
  ["Reflect.apply(descriptor.value, headers, args)", "receiver-preserving native Headers.get"],
  ["exactPlainDataSnapshot", "strict injected HEAD data snapshot"],
  ["INJECTED_RESPONSE_KEYS", "exact injected response schema"],
  ["INJECTED_HEADERS_KEYS", "exact injected headers schema"],
  ["parseDiagnosticContentLength", "bounded Content-Length parser"]
]) requireText(head, needle, label);

for (const [needle, label] of [
  ["captureSourceHeadController", "HEAD AbortController collaborator capture"],
  ["Object.getOwnPropertyDescriptor(NativeAbortController.prototype, \"signal\")", "native AbortController signal descriptor"],
  ["Reflect.apply(abortDescriptor.value, controller", "receiver-preserving AbortController abort"],
  ["Reflect.ownKeys(controller)", "injected AbortController descriptor inspection"],
  ["signalDescriptor", "injected AbortController signal data descriptor"],
  ["abortDescriptor", "injected AbortController abort data descriptor"]
]) requireText(controller, needle, label);

for (const [needle, label] of [
  ["MAX_SOURCE_QUALIFICATION_RESULTS = 64", "source summary result ceiling"],
  ["MAX_QUALIFICATION_CATALOG_SOURCES = 64", "source catalog ceiling"],
  ["snapshotQualificationSourceCatalog", "source catalog snapshot"],
  ["Qualification source catalog contains duplicate id", "catalog duplicate-id rejection"],
  ["Qualification source catalog contains duplicate source identity", "catalog duplicate-source rejection"],
  ["snapshotSourceQualificationResults", "source summary result snapshot"],
  ["snapshotDenseDataArray", "parsed policy dense-array snapshot"],
  ["MAX_REMOTE_SUPPORTED_RULES", "parsed policy supported-rule ceiling"],
  ["normalizeSubscription", "summary subscription normalization"],
  ["subscriptionSourceKey(subscription)", "summary source-key binding"],
  ["parsed.sourceKey does not match its subscription", "source-key mismatch rejection"],
  ["Source qualification results contain duplicate id", "successful result duplicate-id rejection"],
  ["Source qualification results contain duplicate source identity", "successful result duplicate-source rejection"],
  ["freezeNormalizedNetworkRule", "canonical network rule snapshot helper"],
  ["normalizeRule(rule)", "network rule normalization before summary"],
  ["Object.freeze([...normalized.resourceTypes])", "deep-frozen network resource types"],
  ["freezeNormalizedCosmeticRule", "canonical cosmetic rule snapshot helper"],
  ["normalizeCosmeticRule(rule)", "cosmetic rule normalization before summary"],
  ["Object.freeze([...normalized.domains])", "deep-frozen cosmetic domains"],
  ["Object.freeze([...normalized.excludedDomains])", "deep-frozen cosmetic exclusions"],
  ["Object.freeze(block)", "frozen parsed block snapshot"],
  ["Object.freeze(cosmeticAllow)", "frozen parsed cosmetic snapshot"]
]) requireText(summary, needle, label);

for (const [needle, label] of [
  ["compareQualificationText", "fixed qualification comparator"],
  ["if (left < right) return -1", "code-unit ordering lower branch"],
  ["if (left > right) return 1", "code-unit ordering upper branch"]
]) requireText(order, needle, label);

for (const [needle, label] of [
  ["assertQualificationOutcomeCoverage", "selected-source outcome coverage gate"],
  ["does not cover every selected source exactly once", "coverage cardinality rejection"],
  ["outcome ids do not match selected sources", "coverage identity rejection"]
]) requireText(coverage, needle, label);

for (const [needle, label] of [
  ["source-unavailable-or-invalid", "fixed source failure code"],
  ["sourceQualificationFailure", "source failure envelope"]
]) requireText(failure, needle, label);

for (const [needle, label] of [
  ["MAX_REMOTE_SUPPORTED_RULES", "report supported-rule ceiling source"],
  ["MAX_REMOTE_LIST_BYTES", "report declared-byte ceiling source"],
  ["assertSourceRowRuleCeiling", "per-source report rule ceiling"],
  ["assertSourceDeclaredBytes", "report declared-byte validator"],
  ["value > MAX_REMOTE_LIST_BYTES", "declared-byte upper-bound rejection"]
]) requireText(reportLimits, needle, label);

for (const [needle, label] of [
  ["Object.create(null)", "null-prototype report record"],
  ["Object.setPrototypeOf(copy, null)", "null-prototype report array"],
  ["stringifyValidatedSourceQualificationReport", "prototype-isolated report serializer"],
  ["Reflect.apply(stringify, JSON", "captured JSON stringify invocation"]
]) requireText(reportSerialize, needle, label);

for (const [needle, label] of [
  ["SOURCE_QUALIFICATION_REPORT_MAX_BYTES = 128 * 1024", "report byte ceiling"],
  ["validateSourceQualificationReport", "report schema validator"],
  ["serializeSourceQualificationReport", "report serializer"],
  ["Reflect.ownKeys", "report descriptor inspection"],
  ["source qualification report.failures", "failure report schema"],
  ["assertSectionConsistency", "report section-count consistency"],
  ["assertTotalsConsistency", "report totals consistency"],
  ["assertIdentitySets", "report identity-set consistency"],
  ["must be strictly ascending by id", "deterministic report identity ordering"],
  ["cannot be both successful and failed", "disjoint source outcome identities"],
  ["SOURCE_REPORT_FORMATS", "canonical report format set"],
  ["title must be canonical trimmed text", "canonical report title"],
  ["assertCombinedOutcomeBound", "combined report outcome ceiling"],
  ["combined outcomes", "combined outcome rejection"],
  ["assertSourceRowRuleCeiling(network, cosmetic)", "per-source rule ceiling routing"],
  ["assertSourceDeclaredBytes(fields.declaredBytes)", "declared-byte ceiling routing"],
  ["stringifyValidatedSourceQualificationReport(safe)", "prototype-isolated serializer routing"]
]) requireText(report, needle, label);

for (const [needle, label] of [
  ["normalizeDiagnosticSourceUrl", "diagnostic target normalization"],
  ["normalizeSubscription({", "public source policy reuse"],
  ["captureSourceHeadController(new safe.AbortControllerImpl())", "safe HEAD controller routing"],
  ["clearSourceHeadTimerBestEffort", "best-effort HEAD timer cleanup"],
  ["MAX_REMOTE_LIST_BYTES", "authoritative HEAD diagnostic byte ceiling"],
  ["declaredBytes <= MAX_REMOTE_LIST_BYTES", "HEAD diagnostic byte-bound routing"],
  ["snapshotQualificationSourceCatalog(BUILT_IN_SUBSCRIPTIONS)", "safe source-catalog routing"],
  ["snapshotSourceQualificationResults(results)", "safe source-summary routing"],
  ["compareQualificationText", "locale-independent source ordering"],
  ["canonicalActionKeys", "duplicate canonical rule rejection"],
  ["Object.freeze({ sources: Object.freeze(rows), totals })", "frozen summary envelope"],
  ["sourceQualificationFailure(subscription.id)", "privacy-minimal failure routing"],
  ["assertQualificationOutcomeCoverage(selected", "selected-source coverage routing"],
  ["serializeSourceQualificationReport(report)", "bounded CLI report output"]
]) requireText(main, needle, label);

reject(main, /error\.message/, "raw error.message reporting");
reject(main, /String\s*\(\s*error\s*\)/, "raw thrown-value stringification");
reject(main, /JSON\.stringify\s*\(\s*report\b/, "direct report JSON serialization");
reject(main, /const\s+ordered\s*=\s*\[\.\.\.results\]/, "direct unsnapshotted source-result aggregation");
reject(main, /\.localeCompare\s*\(/, "locale-sensitive source ordering in qualification main");
reject(report, /\.localeCompare\s*\(/, "locale-sensitive source ordering in qualification report");
reject(report, /JSON\.stringify\s*\(\s*(?:safe|report)\b/, "prototype-bearing direct report serialization");

requireText(packageJson, '"source-qualification-hardening-audit": "node tools/source-qualification-hardening-audit.mjs"', "package source qualification audit script");
requireText(packageJson, "npm run source-qualification-hardening-audit", "npm check source qualification audit gate");

console.log("source-qualification-hardening-audit: bounded canonical privacy-minimal source diagnostic/report boundaries verified");
