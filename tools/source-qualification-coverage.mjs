import { compareQualificationText } from "./source-qualification-order.mjs";
import { validateSourceQualificationReport } from "./source-qualification-report.mjs";
import { snapshotQualificationSourceCatalog } from "./source-qualification-summary.mjs";

export function assertQualificationOutcomeCoverage(selectedSources, report) {
  const selected = snapshotQualificationSourceCatalog(selectedSources);
  const safeReport = validateSourceQualificationReport(report);
  const expected = selected.map((source) => source.id).sort(compareQualificationText);
  const actual = [
    ...safeReport.sources.map((source) => source.id),
    ...safeReport.failures.map((failure) => failure.id)
  ].sort(compareQualificationText);
  if (actual.length !== expected.length) {
    throw new TypeError("Source qualification report does not cover every selected source exactly once");
  }
  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      throw new TypeError("Source qualification report outcome ids do not match selected sources");
    }
  }
  return safeReport;
}
