import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_OBSERVATION_PRIVACY_CONTRACT_AUDIT_MARKER,
  auditQualificationObservationPrivacyContract
} from "./qualification-observation-privacy-contract-audit.mjs";
import {
  QUALIFICATION_OBSERVATION_PUBLICATION_CONTRACT_AUDIT_MARKER,
  auditQualificationObservationPublicationContract
} from "./qualification-observation-publication-contract-audit.mjs";
import {
  QUALIFICATION_OBSERVATION_HARDENING_RESULT_CONTRACT_AUDIT_MARKER,
  auditQualificationObservationHardeningResultContract
} from "./qualification-observation-hardening-result-contract-audit.mjs";
import { QUALIFICATION_OBSERVATION_RESULT_CONTRACT_CLOSEOUT_MARKER } from "./qualification-observation-result-contract-closeout-audit.mjs";

export const QUALIFICATION_OBSERVATION_RESULT_CONTRACT_INTEGRATION_MARKER =
  "canonical M1425 qualification observation result contract integration verified";

export function auditQualificationObservationResultContractIntegration() {
  const privacy = auditQualificationObservationPrivacyContract();
  const publication = auditQualificationObservationPublicationContract();
  const hardening = auditQualificationObservationHardeningResultContract();
  if (privacy.marker !== QUALIFICATION_OBSERVATION_PRIVACY_CONTRACT_AUDIT_MARKER
    || publication.marker !== QUALIFICATION_OBSERVATION_PUBLICATION_CONTRACT_AUDIT_MARKER
    || hardening.marker !== QUALIFICATION_OBSERVATION_HARDENING_RESULT_CONTRACT_AUDIT_MARKER
    || QUALIFICATION_OBSERVATION_RESULT_CONTRACT_CLOSEOUT_MARKER
      !== "canonical M1418 qualification observation result-contract integrity closeout verified") {
    throw new TypeError("qualification observation result contract integration markers are not canonical");
  }
  return Object.freeze({
    privacyMarker: privacy.marker,
    publicationMarker: publication.marker,
    hardeningMarker: hardening.marker,
    priorCloseoutMarker: QUALIFICATION_OBSERVATION_RESULT_CONTRACT_CLOSEOUT_MARKER,
    marker: QUALIFICATION_OBSERVATION_RESULT_CONTRACT_INTEGRATION_MARKER
  });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

if (isMainModule()) {
  try {
    if (process.argv.length !== 2) throw new Error("qualification observation result contract integration audit accepts no arguments");
    console.log(auditQualificationObservationResultContractIntegration().marker);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
