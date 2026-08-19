import { normalizeCosmeticRule, cosmeticRuleKey } from "./cosmetic-rules.js";
import { normalizeDomain } from "./rules.js";
import { assertRemoteListTextStructure } from "./list-limits.js";

function parseIpv4(hostname) {
  if (typeof hostname !== "string") return null;
  const parts = hostname.split(".").map(Number);
  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) ? parts : null;
}

export function isLocalOrPrivatePageHostname(value) {
  if (typeof value !== "string") return true;
  const host = value.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host === "local" || host.endsWith(".local") || host === "home.arpa" || host.endsWith(".home.arpa")) return true;
  const ipv4 = parseIpv4(host);
  if (ipv4) {
    const [a, b] = ipv4;
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  if (host.includes(":")) {
    return host === "::" || host === "::1" || /^f[cd][0-9a-f]{0,2}:/i.test(host) || /^fe[89ab][0-9a-f]?:/i.test(host) || /^ff/i.test(host);
  }
  return false;
}

function normalizeRemoteDomain(value) {
  const domain = normalizeDomain(value);
  if (isLocalOrPrivatePageHostname(domain)) throw new Error("Remote cosmetic rules cannot target local/private sites");
  return domain;
}

export function normalizeRemoteCosmeticRule(candidate) {
  const rule = normalizeCosmeticRule(candidate);
  return normalizeCosmeticRule({
    selector: rule.selector,
    domains: (rule.domains ?? []).map(normalizeRemoteDomain),
    excludedDomains: (rule.excludedDomains ?? []).map(normalizeRemoteDomain)
  });
}

function dedupe(rules) {
  const map = new Map();
  for (const candidate of rules) {
    const rule = normalizeRemoteCosmeticRule(candidate);
    map.set(cosmeticRuleKey(rule), rule);
  }
  return [...map.values()].sort((a, b) => cosmeticRuleKey(a).localeCompare(cosmeticRuleKey(b)));
}

function parseScope(raw) {
  if (!raw) return {};
  const domains = [];
  const excludedDomains = [];
  for (const token of raw.split(",")) {
    const value = token.trim();
    if (!value) throw new Error("Cosmetic domain scope is empty");
    if (value.startsWith("~")) excludedDomains.push(normalizeRemoteDomain(value.slice(1)));
    else domains.push(normalizeRemoteDomain(value));
  }
  return {
    ...(domains.length ? { domains } : {}),
    ...(excludedDomains.length ? { excludedDomains } : {})
  };
}

function parseCosmeticLine(line) {
  if (line.includes("#?#") || line.includes("#$#") || line.includes("#%#")) return { unsupported: true };
  const exceptionIndex = line.indexOf("#@#");
  const hideIndex = line.indexOf("##");
  const action = exceptionIndex >= 0 ? "allow" : hideIndex >= 0 ? "hide" : null;
  if (!action) return null;
  const index = action === "allow" ? exceptionIndex : hideIndex;
  const separatorLength = action === "allow" ? 3 : 2;
  const scope = line.slice(0, index).trim();
  const selector = line.slice(index + separatorLength).trim();
  if (!selector) return { unsupported: true };
  try {
    return { action, rule: normalizeRemoteCosmeticRule({ selector, ...parseScope(scope) }) };
  } catch {
    return { unsupported: true };
  }
}

export function parseThirdPartyCosmetics(text) {
  assertRemoteListTextStructure(text);
  const hide = [];
  const allow = [];
  let unsupportedCount = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("!") || /^\[.*\]$/.test(line)) continue;
    const parsed = parseCosmeticLine(line);
    if (!parsed) continue;
    if (parsed.unsupported) {
      unsupportedCount += 1;
      continue;
    }
    (parsed.action === "allow" ? allow : hide).push(parsed.rule);
  }
  return { hide: dedupe(hide), allow: dedupe(allow), unsupportedCount };
}
