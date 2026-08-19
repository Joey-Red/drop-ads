function nullRecord(entries) {
  const record = Object.create(null);
  for (const [key, value] of entries) record[key] = value;
  return record;
}

function nullArray(values) {
  const copy = new Array(values.length);
  for (let index = 0; index < values.length; index += 1) copy[index] = values[index];
  Object.setPrototypeOf(copy, null);
  return copy;
}

function countsSnapshot(counts, leftKey) {
  return nullRecord([
    [leftKey, counts[leftKey]],
    ["allow", counts.allow],
    ["supported", counts.supported],
    ["uniqueContribution", counts.uniqueContribution],
    ["overlapWithEarlierSources", counts.overlapWithEarlierSources]
  ]);
}

function sourceRowSnapshot(source) {
  return nullRecord([
    ["id", source.id],
    ["title", source.title],
    ["enabledByDefault", source.enabledByDefault],
    ["format", source.format],
    ["declaredBytes", source.declaredBytes],
    ["network", countsSnapshot(source.network, "block")],
    ["cosmetic", countsSnapshot(source.cosmetic, "hide")]
  ]);
}

function failureSnapshot(failure) {
  return nullRecord([
    ["id", failure.id],
    ["error", failure.error]
  ]);
}

export function stringifyValidatedSourceQualificationReport(report) {
  const sources = new Array(report.sources.length);
  for (let index = 0; index < report.sources.length; index += 1) sources[index] = sourceRowSnapshot(report.sources[index]);
  const failures = new Array(report.failures.length);
  for (let index = 0; index < report.failures.length; index += 1) failures[index] = failureSnapshot(report.failures[index]);

  const serializable = nullRecord([
    ["sources", nullArray(sources)],
    ["totals", nullRecord([
      ["uniqueNetworkRules", report.totals.uniqueNetworkRules],
      ["uniqueCosmeticRules", report.totals.uniqueCosmeticRules]
    ])],
    ["failures", nullArray(failures)]
  ]);

  const stringify = JSON.stringify;
  if (typeof stringify !== "function") throw new TypeError("JSON.stringify is unavailable");
  return `${Reflect.apply(stringify, JSON, [serializable, null, 2])}\n`;
}
