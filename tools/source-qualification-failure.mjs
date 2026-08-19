export const SOURCE_QUALIFICATION_FAILURE_CODE = "source-unavailable-or-invalid";

export function sourceQualificationFailure(id) {
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9._-]{0,95}$/i.test(id)) throw new TypeError("Source qualification failure id is invalid");
  return Object.freeze({ id, error: SOURCE_QUALIFICATION_FAILURE_CODE });
}
