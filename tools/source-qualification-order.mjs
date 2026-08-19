export function compareQualificationText(left, right) {
  if (typeof left !== "string" || typeof right !== "string") {
    throw new TypeError("Qualification ordering values must be strings");
  }
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
