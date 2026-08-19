import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_INTEGRATION_MARKER,
  auditQualificationObservationResultContractIntegration
} from "./qualification-observation-result-contract-integration-audit.mjs";
import {
  QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MARKER,
  auditQualificationObservationResultContractPrivacySurface
} from "./qualification-observation-result-contract-privacy-surface-audit.mjs";

export const QUALIFICATION_OBSERVATION_CONTRACT_AUDIT_CLOSEOUT_MARKER =
  "canonical M1428 qualification observation contract-audit integrity closeout verified";

export async function auditQualificationObservationContractAuditCloseout(rootDirectory) {
  const integration = auditQualificationObservationResultContractIntegration();
  const privacy = await auditQualificationObservationResultContractPrivacySurface(resolve(rootDirectory));
  if (integration.marker !== QUALIFICATION_OBSERVATION_RESULT_CONTRACT_INTEGRATION_MARKER
    || privacy.marker !== QUALIFICATION_OBSERVATION_RESULT_CONTRACT_PRIVACY_MARKER
    || privacy.reviewedSources !== 5) {
    throw new TypeError("qualification observation contract-audit closeout child evidence is not canonical");
  }
  return Object.freeze({
    integrationMarker: integration.marker,
    privacyMarker: privacy.marker,
    privacyReviewedSources: privacy.reviewedSources,
    marker: QUALIFICATION_OBSERVATION_CONTRACT_AUDIT_CLOSEOUT_MARKER
  });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation contract-audit closeout accepts no arguments");
    console.log((await auditQualificationObservationContractAuditCloseout(resolve(import.meta.dirname, ".."))).marker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
