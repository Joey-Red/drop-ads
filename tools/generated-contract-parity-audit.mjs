import { pathToFileURL } from "node:url";
import {
  generatedExtensionFilesForBrowser,
  snapshotGeneratedContractStringArray
} from "./generated-extension-contract.mjs";

const FIREFOX_ONLY_MEMBER = "rules/static.json";
const MAX_CONTRACT_FILES = 4096;

function snapshotBrowserContract(browser) {
  const files = snapshotGeneratedContractStringArray(
    generatedExtensionFilesForBrowser(browser),
    `${browser} generated contract parity source`
  );
  if (files.length <= 0 || files.length > MAX_CONTRACT_FILES) {
    throw new RangeError(`${browser} generated contract parity member count is invalid`);
  }
  return files;
}

export function auditGeneratedContractParity() {
  const chromium = snapshotBrowserContract("chromium");
  const firefox = snapshotBrowserContract("firefox");

  if (chromium.includes(FIREFOX_ONLY_MEMBER)) {
    throw new Error(`Chromium generated contract must not contain Firefox-only member: ${FIREFOX_ONLY_MEMBER}`);
  }

  let firefoxOnlyCount = 0;
  const firefoxCommon = [];
  for (const path of firefox) {
    if (path === FIREFOX_ONLY_MEMBER) {
      firefoxOnlyCount += 1;
      continue;
    }
    firefoxCommon.push(path);
  }
  if (firefoxOnlyCount !== 1) {
    throw new Error(`Firefox generated contract must contain exactly one Firefox-only member: ${FIREFOX_ONLY_MEMBER}`);
  }
  if (firefox.length !== chromium.length + 1 || firefoxCommon.length !== chromium.length) {
    throw new Error("Chromium/Firefox generated contract cardinality differs beyond the reviewed Firefox-only member");
  }
  for (let index = 0; index < chromium.length; index += 1) {
    if (chromium[index] !== firefoxCommon[index]) {
      throw new Error(`Chromium/Firefox generated common contract differs at member ${index}`);
    }
  }

  return Object.freeze({
    chromiumMembers: chromium.length,
    firefoxMembers: firefox.length,
    firefoxOnlyMember: FIREFOX_ONLY_MEMBER
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const result = auditGeneratedContractParity();
    console.log(`Generated contract parity verified: chromium=${result.chromiumMembers}, firefox=${result.firefoxMembers}, firefox-only=${result.firefoxOnlyMember}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
