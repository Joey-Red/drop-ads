export function compareCodeUnitText(left, right) {
  if (typeof left !== "string" || typeof right !== "string") throw new TypeError("Text ordering requires strings");
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
