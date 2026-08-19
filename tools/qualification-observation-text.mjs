export const QUALIFICATION_BROWSER_VERSION_MAX_BYTES = 120;
export const QUALIFICATION_OBSERVATION_NOTES_MAX_BYTES = 2_000;

const UNSAFE_QUALIFICATION_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b\u200e\u200f\u2028\u2029\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u;

export function validateQualificationObservationText(value, label, maxBytes, { allowEmpty = true } = {}) {
  if (typeof label !== "string" || !label) throw new TypeError("qualification observation text label is invalid");
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || maxBytes > 16_384) throw new TypeError(`${label} byte ceiling is invalid`);
  if (typeof value !== "string") throw new TypeError(`${label} is invalid`);
  if (!value.isWellFormed() || value.normalize("NFC") !== value) throw new TypeError(`${label} is invalid`);
  if (UNSAFE_QUALIFICATION_TEXT.test(value)) throw new TypeError(`${label} is invalid`);
  if (Buffer.byteLength(value, "utf8") > maxBytes) throw new TypeError(`${label} is invalid`);
  if (!allowEmpty && !value.trim()) throw new TypeError(`${label} is invalid`);
  return value;
}

export function validateQualificationBrowserVersion(value, label = "browser version") {
  return validateQualificationObservationText(value, label, QUALIFICATION_BROWSER_VERSION_MAX_BYTES, { allowEmpty: false });
}

export function validateQualificationObservationNotes(value, label = "qualification observation notes") {
  return validateQualificationObservationText(value, label, QUALIFICATION_OBSERVATION_NOTES_MAX_BYTES);
}
