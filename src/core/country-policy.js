import { normalizeRule, ruleKey } from "./rules.js";
import { snapshotDenseDataArray } from "./object-schema.js";

export const COUNTRY_MODES = Object.freeze(["navigation", "all"]);
export const MAX_COUNTRY_RULE_CANDIDATES = 10_000;
export const MAX_COUNTRY_TLD_INPUT_CHARS = 256;
const ISO_REGION_CODES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");

export const COUNTRY_PRESETS = Object.freeze(ISO_REGION_CODES.map((region) => Object.freeze({
  region,
  tld: region === "GB" ? "uk" : region.toLowerCase()
})));

export function normalizeCountryTld(value) {
  if (typeof value !== "string") throw new TypeError("Country TLD must be a string");
  if (value.length > MAX_COUNTRY_TLD_INPUT_CHARS) {
    throw new Error(`Country TLD input must be at most ${MAX_COUNTRY_TLD_INPUT_CHARS} characters`);
  }
  const raw = value.trim().replace(/^\.+/, "");
  if (!raw) throw new Error("Choose a country or enter a country-code TLD");
  let hostname;
  try {
    hostname = new URL(`https://${raw}/`).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    throw new Error("Country TLD is invalid");
  }
  if (!hostname || hostname.includes(".")) throw new Error("Enter one TLD label, not a hostname");
  if (!/^(?:[a-z]{2}|xn--[a-z0-9-]{1,59})$/.test(hostname)) {
    throw new Error("Country TLD must be a two-letter ccTLD or an IDN ccTLD label");
  }
  return hostname;
}

export function normalizeCountryMode(value) {
  if (!COUNTRY_MODES.includes(value)) throw new Error("Country blocking mode is invalid");
  return value;
}

export function makeCountryRule(tld, mode = "navigation") {
  const normalizedTld = normalizeCountryTld(tld);
  const normalizedMode = normalizeCountryMode(mode);
  return normalizeRule({
    kind: "pattern",
    value: `||${normalizedTld}^`,
    ...(normalizedMode === "navigation" ? { resourceTypes: ["main_frame"] } : {})
  });
}

export function parseCountryRule(candidate) {
  let rule;
  try { rule = normalizeRule(candidate); } catch { return null; }
  if (rule.kind !== "pattern") return null;
  const match = /^\|\|([a-z]{2}|xn--[a-z0-9-]{1,59})\^$/.exec(rule.value);
  if (!match) return null;
  const types = rule.resourceTypes ?? [];
  if (types.length !== 0 && !(types.length === 1 && types[0] === "main_frame")) return null;
  return {
    tld: match[1],
    mode: types.length === 1 ? "navigation" : "all",
    rule,
    key: ruleKey(rule)
  };
}

export function collectCountryRules(rules) {
  let isArray;
  try { isArray = Array.isArray(rules); }
  catch { throw new TypeError("Country policy rules array kind is invalid"); }
  const candidates = isArray
    ? snapshotDenseDataArray(rules, "Country policy rules", MAX_COUNTRY_RULE_CANDIDATES)
    : [];
  const grouped = new Map();
  for (const candidate of candidates) {
    const parsed = parseCountryRule(candidate);
    if (!parsed) continue;
    const current = grouped.get(parsed.tld);
    if (!current) grouped.set(parsed.tld, { tld: parsed.tld, mode: parsed.mode, rules: [parsed] });
    else {
      current.rules.push(parsed);
      if (parsed.mode === "all") current.mode = "all";
    }
  }
  return [...grouped.values()].sort((a, b) => a.tld.localeCompare(b.tld));
}

function parsedCountryLabelView(value) {
  let isArray;
  try { isArray = Array.isArray(value); }
  catch { return null; }
  if (!value || typeof value !== "object" || isArray) return null;
  let prototype;
  let tldDescriptor;
  let modeDescriptor;
  try {
    prototype = Object.getPrototypeOf(value);
    tldDescriptor = Object.getOwnPropertyDescriptor(value, "tld");
    modeDescriptor = Object.getOwnPropertyDescriptor(value, "mode");
  } catch {
    return null;
  }
  if (prototype !== Object.prototype && prototype !== null) return null;
  if (!tldDescriptor) return null;
  if (!tldDescriptor.enumerable || !("value" in tldDescriptor)) return null;
  if (!modeDescriptor?.enumerable || !("value" in modeDescriptor)) return null;
  try {
    return {
      tld: normalizeCountryTld(tldDescriptor.value),
      mode: normalizeCountryMode(modeDescriptor.value)
    };
  } catch {
    return null;
  }
}

export function countryRuleLabel(candidate) {
  const item = parsedCountryLabelView(candidate) ?? parseCountryRule(candidate);
  if (!item) return null;
  return `Country TLD · .${item.tld} · ${item.mode === "all" ? "All resources" : "Navigation only"}`;
}
