import { assertPlainExactObject, readPlainDataField } from "./object-schema.js";
import { normalizeRule, ruleKey } from "./rules.js";
import { cosmeticRuleKey } from "./cosmetic-rules.js";
import { normalizeRemoteCosmeticRule } from "./cosmetic-lists.js";
import { assertRemoteListTextStructure } from "./list-limits.js";

export const LIST_SCHEMA_VERSION = 1;
export const NATIVE_LIST_FORMAT = "drop-ads-v1";
export const MAX_NATIVE_LIST_ID_CHARS = 96;
export const MAX_NATIVE_LIST_TITLE_CHARS = 120;
export const MAX_LIST_FORMAT_CHARS = 32;

const NATIVE_METADATA_KEYS = new Set(["schemaVersion", "id", "title", "format"]);

function requireText(text) {
  if (typeof text !== "string") throw new TypeError("Filter list must be text");
  assertRemoteListTextStructure(text);
  if (text.includes("\u0000")) throw new Error("Filter list contains a NUL byte");
  return text;
}

function parseIpv4(value) {
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return parts;
}

function isNonPublicIpv4(value) {
  const parts = parseIpv4(value);
  if (!parts) return false;
  const [a, b] = parts;
  return a === 0
    || a === 10
    || (a === 100 && b >= 64 && b <= 127)
    || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || a >= 224;
}

function parseIpv6Words(value) {
  let host = String(value).trim().toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  const zoneIndex = host.indexOf("%");
  if (zoneIndex >= 0) host = host.slice(0, zoneIndex);
  if (!host.includes(":")) return null;

  if (host.includes(".")) {
    const separator = host.lastIndexOf(":");
    if (separator < 0) return null;
    const ipv4 = parseIpv4(host.slice(separator + 1));
    if (!ipv4) return null;
    const high = ((ipv4[0] << 8) | ipv4[1]).toString(16);
    const low = ((ipv4[2] << 8) | ipv4[3]).toString(16);
    host = `${host.slice(0, separator)}:${high}:${low}`;
  }

  const halves = host.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  if (halves.length === 1 && left.length !== 8) return null;
  const missing = 8 - left.length - right.length;
  if (halves.length === 2 && missing < 1) return null;

  const rawWords = halves.length === 2
    ? [...left, ...Array(missing).fill("0"), ...right]
    : left;
  if (rawWords.length !== 8) return null;

  const words = rawWords.map((word) => /^[0-9a-f]{1,4}$/.test(word) ? Number.parseInt(word, 16) : Number.NaN);
  return words.some((word) => !Number.isInteger(word) || word < 0 || word > 0xffff) ? null : words;
}

function isNonPublicIpv6(value) {
  const words = parseIpv6Words(value);
  if (!words) return false;

  const allZero = words.every((word) => word === 0);
  const loopback = words.slice(0, 7).every((word) => word === 0) && words[7] === 1;
  if (allZero || loopback) return true;

  const first = words[0];
  if ((first & 0xfe00) === 0xfc00) return true;
  if ((first & 0xffc0) === 0xfe80) return true;
  if ((first & 0xff00) === 0xff00) return true;

  const mappedIpv4 = words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff;
  const compatibleIpv4 = words.slice(0, 6).every((word) => word === 0);
  if (mappedIpv4 || compatibleIpv4) {
    const ipv4 = `${words[6] >> 8}.${words[6] & 0xff}.${words[7] >> 8}.${words[7] & 0xff}`;
    return isNonPublicIpv4(ipv4);
  }

  return false;
}

function normalizeHostnameForSafety(value) {
  let hostname = String(value).trim().toLowerCase().replace(/\.$/, "");
  if (hostname.startsWith("[") && hostname.endsWith("]")) hostname = hostname.slice(1, -1);
  return hostname;
}

function isLocalOrNonPublicHostname(value) {
  const hostname = normalizeHostnameForSafety(value);
  if (!hostname) return true;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  if (hostname === "local" || hostname.endsWith(".local")) return true;
  if (hostname === "home.arpa" || hostname.endsWith(".home.arpa")) return true;
  if (!hostname.includes(".") && !hostname.includes(":")) return true;
  return isNonPublicIpv4(hostname) || isNonPublicIpv6(hostname);
}

function assertRemoteHostnameSafe(hostname) {
  if (isLocalOrNonPublicHostname(hostname)) throw new Error("Remote lists cannot target local/private network hosts");
}

function patternTargetsLocalOrPrivateNetwork(pattern) {
  const value = pattern.toLowerCase();

  for (const match of value.matchAll(/https?:\/\/(\[[^\]/?#]+\]|[^\s/^*|?#:]+)(?::\d+)?/g)) {
    if (isLocalOrNonPublicHostname(match[1])) return true;
  }

  const domainAnchor = /^\|\|(\[[^\]]+\]|[^:/^*|?#]+)(?::\d+)?(?:\^|\/|$)/.exec(value);
  if (domainAnchor && isLocalOrNonPublicHostname(domainAnchor[1])) return true;

  for (const match of value.matchAll(/(?:^|[^0-9])(\d{1,3}(?:\.\d{1,3}){3})(?=$|[^0-9])/g)) {
    if (isNonPublicIpv4(match[1])) return true;
  }

  for (const match of value.matchAll(/\[([0-9a-f:.%]+)\]/g)) {
    if (isNonPublicIpv6(match[1])) return true;
  }

  if (/(^|[^a-z0-9-])localhost(?:[^a-z0-9-]|$)/.test(value)) return true;
  if (/(^|[^a-z0-9-])home\.arpa(?:[^a-z0-9-]|$)/.test(value)) return true;
  if (/(^|[^a-z0-9-])(?:[a-z0-9-]+\.)+local(?:[^a-z0-9-]|$)/.test(value)) return true;
  if (/(^|[^0-9a-f])f[cd][0-9a-f]{0,2}:(?:[0-9a-f:]*)(?=$|[^0-9a-f:])/.test(value)) return true;
  if (/(^|[^0-9a-f])fe[89ab][0-9a-f]?:(?:[0-9a-f:]*)(?=$|[^0-9a-f:])/.test(value)) return true;
  return false;
}

export function assertRemoteRuleSafe(rule) {
  const normalized = normalizeRule(rule);
  if (normalized.kind === "domain") assertRemoteHostnameSafe(normalized.value);
  if (normalized.kind === "url") assertRemoteHostnameSafe(new URL(normalized.value).hostname);
  if (normalized.kind === "pattern") {
    const signal = normalized.value.replace(/[|^*._\-/:?=&%]/g, "");
    if (signal.length < 3) throw new Error("Remote pattern is too broad");
    if (patternTargetsLocalOrPrivateNetwork(normalized.value)) throw new Error("Remote patterns cannot target local/private network hosts");
  }
  return normalized;
}

function dedupeRules(rules) {
  const deduped = new Map();
  for (const candidate of rules) {
    const normalized = assertRemoteRuleSafe(candidate);
    deduped.set(ruleKey(normalized), normalized);
  }
  return [...deduped.values()];
}

function pushRule(target, kind, value) {
  target.push(assertRemoteRuleSafe({ kind, value }));
}

function dedupeCosmeticRules(rules) {
  const deduped = new Map();
  for (const candidate of rules) {
    const normalized = normalizeRemoteCosmeticRule(candidate);
    deduped.set(cosmeticRuleKey(normalized), normalized);
  }
  return [...deduped.values()];
}

export function parseNativeList(text) {
  requireText(text);
  const block = [];
  const allow = [];
  const cosmeticHide = [];
  const cosmeticAllow = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;

    const cosmeticMatch = /^(hide|unhide)\s+cosmetic\s+(.+)$/.exec(line);
    if (cosmeticMatch) {
      const [, action, selector] = cosmeticMatch;
      try {
        (action === "hide" ? cosmeticHide : cosmeticAllow).push(normalizeRemoteCosmeticRule({ selector }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "invalid cosmetic rule";
        throw new Error(`Invalid native rule at line ${index + 1}: ${message}`);
      }
      continue;
    }

    const match = /^(block|allow)\s+(domain|url|pattern)\s+(.+)$/.exec(line);
    if (!match) throw new Error(`Invalid native rule at line ${index + 1}`);

    const [, action, kind, value] = match;
    try {
      pushRule(action === "block" ? block : allow, kind, value);
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid rule";
      throw new Error(`Invalid native rule at line ${index + 1}: ${message}`);
    }
  }

  // Native syntax is strict: unsupported lines throw instead of being skipped, so an
  // unsupportedCount diagnostic is meaningless here and would leak non-policy data
  // across the exact cache-entry boundary.
  return {
    block: dedupeRules(block),
    allow: dedupeRules(allow),
    cosmeticHide: dedupeCosmeticRules(cosmeticHide),
    cosmeticAllow: dedupeCosmeticRules(cosmeticAllow)
  };
}

function isCosmeticOrScriptlet(line) {
  return line.includes("##") || line.includes("#@#") || line.includes("#?#") || line.includes("#$#") || line.includes("#%#");
}

function parseHostsLine(line) {
  const match = /^(?:0\.0\.0\.0|127\.0\.0\.1|::|::1)\s+([^\s#]+)(?:\s+#.*)?$/.exec(line);
  if (!match) return null;
  if (match[1].toLowerCase() === "localhost") return null;
  return match[1];
}

function looksLikeBareDomain(line) {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(line);
}

function parseThirdPartyNetworkRule(line) {
  let value = line;
  let action = "block";

  if (value.startsWith("@@")) {
    action = "allow";
    value = value.slice(2);
  }

  if (!value || value.includes("$") || /\s/.test(value)) return null;
  if (value.startsWith("/") && value.endsWith("/") && value.length > 2) return null;

  const anchoredDomain = /^\|\|([^/^*|]+)\^$/.exec(value);
  if (anchoredDomain) {
    return { action, rule: assertRemoteRuleSafe({ kind: "domain", value: anchoredDomain[1] }) };
  }

  if (value.startsWith("|http") && value.endsWith("|") && !value.slice(1, -1).includes("*")) {
    return { action, rule: assertRemoteRuleSafe({ kind: "url", value: value.slice(1, -1) }) };
  }

  if (looksLikeBareDomain(value)) {
    return { action, rule: assertRemoteRuleSafe({ kind: "domain", value }) };
  }

  return { action, rule: assertRemoteRuleSafe({ kind: "pattern", value }) };
}

export function parseThirdPartyList(text) {
  requireText(text);
  const block = [];
  const allow = [];
  let unsupportedCount = 0;
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("!") || line.startsWith("#") || /^\[.*\]$/.test(line)) continue;

    if (isCosmeticOrScriptlet(line)) {
      unsupportedCount += 1;
      continue;
    }

    const hostsDomain = parseHostsLine(line);
    if (hostsDomain) {
      try {
        pushRule(block, "domain", hostsDomain);
      } catch {
        unsupportedCount += 1;
      }
      continue;
    }

    try {
      const parsed = parseThirdPartyNetworkRule(line);
      if (!parsed) {
        unsupportedCount += 1;
        continue;
      }
      (parsed.action === "allow" ? allow : block).push(parsed.rule);
    } catch {
      unsupportedCount += 1;
    }
  }

  return {
    block: dedupeRules(block),
    allow: dedupeRules(allow),
    unsupportedCount
  };
}

function validateListFormat(format) {
  if (typeof format !== "string" || !format || format.length > MAX_LIST_FORMAT_CHARS) {
    throw new Error("List format is invalid");
  }
  if (format !== NATIVE_LIST_FORMAT && format !== "third-party" && format !== "hosts") {
    throw new Error("Unsupported list format");
  }
  return format;
}

export function parseList(text, format) {
  const validatedFormat = validateListFormat(format);
  if (validatedFormat === NATIVE_LIST_FORMAT) return parseNativeList(text);
  return parseThirdPartyList(text);
}

export function validateListMetadata(metadata) {
  assertPlainExactObject(metadata, "List metadata", NATIVE_METADATA_KEYS);
  const snapshot = Object.create(null);
  for (const key of NATIVE_METADATA_KEYS) {
    const field = readPlainDataField(metadata, key);
    if (!field.safe) throw new Error(`List metadata.${key} must be an own enumerable data field`);
    if (!field.present) throw new Error(`List metadata is missing field: ${key}`);
    snapshot[key] = field.value;
  }

  if (!Number.isSafeInteger(snapshot.schemaVersion) || snapshot.schemaVersion !== LIST_SCHEMA_VERSION) {
    throw new Error("Unsupported list schema version");
  }
  if (typeof snapshot.id !== "string"
    || snapshot.id.length > MAX_NATIVE_LIST_ID_CHARS
    || !/^[a-z0-9][a-z0-9._-]*$/i.test(snapshot.id)) {
    throw new Error("List id is invalid");
  }
  if (typeof snapshot.title !== "string" || !snapshot.title.trim() || snapshot.title.length > MAX_NATIVE_LIST_TITLE_CHARS) {
    throw new Error("List title is invalid");
  }
  if (snapshot.format !== NATIVE_LIST_FORMAT) throw new Error("List format is invalid");

  return {
    schemaVersion: LIST_SCHEMA_VERSION,
    id: snapshot.id,
    title: snapshot.title.trim(),
    format: NATIVE_LIST_FORMAT
  };
}
