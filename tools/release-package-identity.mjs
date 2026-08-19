export const RELEASE_PACKAGE_NAME_MAX_LENGTH = 128;
export const RELEASE_PACKAGE_VERSION_MAX_LENGTH = 64;
export const RELEASE_PACKAGE_IDENTITY_TEXT = /^[A-Za-z0-9._@+-]+$/;

function releaseIdentityToken(value, label, maxLength) {
  if (typeof value !== "string" || !value || value.length > maxLength || !RELEASE_PACKAGE_IDENTITY_TEXT.test(value)) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

export function snapshotReleasePackageIdentity(name, version, label = "release package") {
  return Object.freeze({
    name: releaseIdentityToken(name, `${label}.name`, RELEASE_PACKAGE_NAME_MAX_LENGTH),
    version: releaseIdentityToken(version, `${label}.version`, RELEASE_PACKAGE_VERSION_MAX_LENGTH)
  });
}
