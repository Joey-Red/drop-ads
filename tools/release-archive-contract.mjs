export const RELEASE_ARCHIVE_LIMITS = Object.freeze({
  maxEntries: 1_024,
  maxArchiveBytes: 64 * 1024 * 1024,
  maxEntryBytes: 16 * 1024 * 1024,
  maxPathBytes: 512,
  maxTotalUncompressedBytes: 64 * 1024 * 1024,
  maxSourceDirectories: 4_096,
  maxSourcePathBytes: 1_024
});
