import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  COOKIE_RULE_ID,
  COOKIE_RULE_PRIORITY,
  MANAGED_RULE_ID_MAX,
  MANAGED_RULE_ID_MIN,
  RULE_TIERS
} from "../src/core/rules.js";

const PRECEDENCE = Object.freeze(["communityBlock", "communityAllow", "personalBlock", "personalAllow"]);

function positiveSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive safe integer`);
  return value;
}

export function auditDnrLayout({
  tiers,
  cookieRuleId,
  cookiePriority,
  managedMin,
  managedMax,
  staticRules = []
}) {
  if (!tiers || typeof tiers !== "object" || Array.isArray(tiers)) throw new Error("DNR tiers must be an object");
  const ranges = [];
  for (const name of PRECEDENCE) {
    const tier = tiers[name];
    if (!tier || typeof tier !== "object") throw new Error(`Missing DNR tier: ${name}`);
    const start = positiveSafeInteger(tier.idStart, `${name}.idStart`);
    const end = positiveSafeInteger(tier.idEnd, `${name}.idEnd`);
    positiveSafeInteger(tier.priority, `${name}.priority`);
    if (end < start) throw new Error(`${name} id range is reversed`);
    ranges.push({ name, start, end });
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (current.start <= previous.end) throw new Error(`DNR tier id overlap: ${previous.name} and ${current.name}`);
  }

  const cookieId = positiveSafeInteger(cookieRuleId, "COOKIE_RULE_ID");
  const cookiePrio = positiveSafeInteger(cookiePriority, "COOKIE_RULE_PRIORITY");
  for (const range of ranges) {
    if (cookieId >= range.start && cookieId <= range.end) throw new Error(`COOKIE_RULE_ID collides with ${range.name}`);
  }

  const lowestStart = Math.min(...ranges.map((range) => range.start));
  const highestTierEnd = Math.max(...ranges.map((range) => range.end));
  if (cookieId <= highestTierEnd) throw new Error("COOKIE_RULE_ID must be above all managed network tiers");
  if (managedMin !== lowestStart) throw new Error(`MANAGED_RULE_ID_MIN must equal ${lowestStart}`);
  if (managedMax !== cookieId) throw new Error(`MANAGED_RULE_ID_MAX must equal COOKIE_RULE_ID (${cookieId})`);

  for (let index = 1; index < PRECEDENCE.length; index += 1) {
    const lower = tiers[PRECEDENCE[index - 1]];
    const higher = tiers[PRECEDENCE[index]];
    if (higher.priority <= lower.priority) {
      throw new Error(`DNR priority precedence drift: ${PRECEDENCE[index - 1]} must be below ${PRECEDENCE[index]}`);
    }
  }
  if (cookiePrio >= tiers.communityBlock.priority) {
    throw new Error("COOKIE_RULE_PRIORITY must remain below communityBlock priority");
  }

  if (!Array.isArray(staticRules)) throw new Error("Static DNR rules must be an array");
  for (const [index, rule] of staticRules.entries()) {
    const id = rule?.id;
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Static DNR rule ${index} has an invalid id`);
    if (id >= managedMin && id <= managedMax) throw new Error(`Static DNR rule id ${id} collides with the managed dynamic namespace`);
  }

  return Object.freeze({
    tiers: PRECEDENCE.length,
    managedMin,
    managedMax,
    cookieRuleId: cookieId
  });
}

export async function auditCurrentDnrLayout(rootDirectory) {
  const root = resolve(rootDirectory);
  const staticRules = JSON.parse(await readFile(resolve(root, "src", "rules", "static.json"), "utf8"));
  return auditDnrLayout({
    tiers: RULE_TIERS,
    cookieRuleId: COOKIE_RULE_ID,
    cookiePriority: COOKIE_RULE_PRIORITY,
    managedMin: MANAGED_RULE_ID_MIN,
    managedMax: MANAGED_RULE_ID_MAX,
    staticRules
  });
}

function isMainModule(moduleUrl, argvPath) {
  if (!argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const root = resolve(import.meta.dirname, "..");
  auditCurrentDnrLayout(root)
    .then((result) => console.log(`DNR layout audit passed (${result.tiers} tiers, managed ${result.managedMin}-${result.managedMax}).`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
