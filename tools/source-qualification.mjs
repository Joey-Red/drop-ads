import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { BUILT_IN_SUBSCRIPTIONS, normalizeSubscription } from "../src/core/subscriptions.js";
import { downloadAndParseSubscription, MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";
import { ruleKey } from "../src/core/rules.js";
import { cosmeticRuleKey } from "../src/core/cosmetic-rules.js";
import { sourceQualificationFailure } from "./source-qualification-failure.mjs";
import { snapshotHeadDiagnosticOptions, snapshotPerSourceQualificationOptions, snapshotSourceQualificationIds, snapshotSourceQualificationOptions } from "./source-qualification-input.mjs";
import { serializeSourceQualificationReport } from "./source-qualification-report.mjs";
import { snapshotHeadResponseMetadata } from "./source-head-response.mjs";
import { captureSourceHeadController } from "./source-head-controller.mjs";
import { assertQualificationOutcomeCoverage } from "./source-qualification-coverage.mjs";
import { compareQualificationText } from "./source-qualification-order.mjs";
import { snapshotQualificationSourceCatalog, snapshotSourceQualificationResults } from "./source-qualification-summary.mjs";

const SAFE_FETCH_OPTIONS = Object.freeze({ credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer" });
export const SOURCE_HEAD_TIMEOUT_MS = 5_000;

export function isMainModule(moduleUrl, argvPath) {
  if (typeof moduleUrl !== "string" || typeof argvPath !== "string" || !argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

export function normalizeDiagnosticSourceUrl(url) {
  if (typeof url !== "string") throw new TypeError("Source HEAD diagnostic URL must be a string");
  return normalizeSubscription({
    id: "qualification-diagnostic",
    title: "Qualification diagnostic",
    format: "hosts",
    sourceUrl: url,
    enabled: false,
    builtIn: false
  }).sourceUrl;
}

function clearSourceHeadTimerBestEffort(clearTimeoutImpl, timer) {
  if (timer == null) return;
  try { clearTimeoutImpl(timer); } catch { }
}

function canonicalActionKeys(rules, prefix, keyFn, label) {
  const seen = new Set();
  const keys = [];
  for (const rule of rules) {
    const key = `${prefix}\u0000${keyFn(rule)}`;
    if (seen.has(key)) throw new TypeError(`${label} contains a duplicate canonical rule`);
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

export async function fetchHeadDiagnostic(url, fetchImpl = fetch, options = undefined) {
  if (typeof fetchImpl !== "function") throw new TypeError("Source HEAD fetch implementation must be a function");
  const safeUrl = normalizeDiagnosticSourceUrl(url);
  const safe = snapshotHeadDiagnosticOptions(options, SOURCE_HEAD_TIMEOUT_MS);
  const controller = captureSourceHeadController(new safe.AbortControllerImpl());
  let timer = null;
  let operation;
  try { operation = Promise.resolve(fetchImpl(safeUrl, { ...SAFE_FETCH_OPTIONS, method: "HEAD", signal: controller.signal })); }
  catch (error) { operation = Promise.reject(error); }
  const timeout = new Promise((_, reject) => {
    timer = safe.setTimeoutImpl(() => {
      try { controller.abort(); } catch { }
      reject(new Error("Source HEAD diagnostic timed out"));
    }, safe.timeoutMs);
  });
  try {
    const response = await Promise.race([operation, timeout]);
    const declaredBytes = snapshotHeadResponseMetadata(response)?.declaredBytes ?? null;
    return declaredBytes !== null && declaredBytes <= MAX_REMOTE_LIST_BYTES ? declaredBytes : null;
  } catch { return null; }
  finally { clearSourceHeadTimerBestEffort(safe.clearTimeoutImpl, timer); }
}

export function summarizeQualifiedSources(results) {
  const seenNetwork = new Set();
  const seenCosmetic = new Set();
  const rows = [];
  const ordered = [...snapshotSourceQualificationResults(results)].sort((left, right) => compareQualificationText(left.subscription.id, right.subscription.id));
  for (const result of ordered) {
    const parsed = result.parsed;
    const networkKeys = [
      ...canonicalActionKeys(parsed.block, "block", ruleKey, `${result.subscription.id} network block rules`),
      ...canonicalActionKeys(parsed.allow, "allow", ruleKey, `${result.subscription.id} network allow rules`)
    ];
    const cosmeticKeys = [
      ...canonicalActionKeys(parsed.cosmeticHide, "hide", cosmeticRuleKey, `${result.subscription.id} cosmetic hide rules`),
      ...canonicalActionKeys(parsed.cosmeticAllow, "allow", cosmeticRuleKey, `${result.subscription.id} cosmetic allow rules`)
    ];
    let uniqueNetwork = 0;
    let overlapNetwork = 0;
    for (const key of networkKeys) {
      if (seenNetwork.has(key)) overlapNetwork += 1;
      else { seenNetwork.add(key); uniqueNetwork += 1; }
    }
    let uniqueCosmetic = 0;
    let overlapCosmetic = 0;
    for (const key of cosmeticKeys) {
      if (seenCosmetic.has(key)) overlapCosmetic += 1;
      else { seenCosmetic.add(key); uniqueCosmetic += 1; }
    }
    const network = Object.freeze({
      block: parsed.block.length,
      allow: parsed.allow.length,
      supported: networkKeys.length,
      uniqueContribution: uniqueNetwork,
      overlapWithEarlierSources: overlapNetwork
    });
    const cosmetic = Object.freeze({
      hide: parsed.cosmeticHide.length,
      allow: parsed.cosmeticAllow.length,
      supported: cosmeticKeys.length,
      uniqueContribution: uniqueCosmetic,
      overlapWithEarlierSources: overlapCosmetic
    });
    rows.push(Object.freeze({
      id: result.subscription.id,
      title: result.subscription.title,
      enabledByDefault: result.subscription.enabled,
      format: result.subscription.format,
      declaredBytes: result.declaredBytes,
      network,
      cosmetic
    }));
  }
  const totals = Object.freeze({ uniqueNetworkRules: seenNetwork.size, uniqueCosmeticRules: seenCosmetic.size });
  return Object.freeze({ sources: Object.freeze(rows), totals });
}

export async function qualifySubscription(subscription, fetchImpl = fetch, options = undefined) {
  const normalized = normalizeSubscription(subscription);
  const safeOptions = snapshotPerSourceQualificationOptions(options);
  const declaredBytes = await fetchHeadDiagnostic(normalized.sourceUrl, fetchImpl, safeOptions.headTimeoutOptions);
  const parsed = await downloadAndParseSubscription(normalized, fetchImpl);
  return { subscription: normalized, parsed, declaredBytes };
}

export async function qualifyBuiltInSources(options = undefined) {
  const safe = snapshotSourceQualificationOptions(options);
  const ids = safe.ids;
  const fetchImpl = safe.fetchImpl ?? fetch;
  const headTimeoutOptions = safe.headTimeoutOptions;
  const requested = new Set(ids);
  const available = snapshotQualificationSourceCatalog(BUILT_IN_SUBSCRIPTIONS).filter((source) => source.id !== "drop-ads-default");
  const availableIds = new Set(available.map((source) => source.id));
  for (const id of requested) if (!availableIds.has(id)) throw new Error(`Unknown built-in source id requested: ${id}`);
  const selected = available.filter((source) => requested.size === 0 || requested.has(source.id)).sort((left, right) => compareQualificationText(left.id, right.id));
  const completed = [];
  const failures = [];
  for (const subscription of selected) {
    try { completed.push(await qualifySubscription(subscription, fetchImpl, { headTimeoutOptions })); }
    catch { failures.push(sourceQualificationFailure(subscription.id)); }
  }
  failures.sort((left, right) => compareQualificationText(left.id, right.id));
  return assertQualificationOutcomeCoverage(selected, { ...summarizeQualifiedSources(completed), failures });
}

export async function main(argv = process.argv.slice(2)) {
  const ids = snapshotSourceQualificationIds(argv);
  const report = await qualifyBuiltInSources({ ids });
  process.stdout.write(serializeSourceQualificationReport(report));
  if (report.failures.length) process.exitCode = 1;
  return report;
}

if (isMainModule(import.meta.url, process.argv[1])) await main();
