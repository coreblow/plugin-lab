const idPattern = /^[a-z0-9][a-z0-9-_]*$/;

export function validatePluginManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return ["manifest must be an object"];
  }
  if (typeof manifest.id !== "string" || !idPattern.test(manifest.id)) {
    errors.push("id must be kebab-case (alphanumeric with hyphens/underscores)");
  }
  if (typeof manifest.name !== "string" || manifest.name.trim().length === 0) {
    errors.push("name is required");
  }
  if (manifest.version !== undefined && (typeof manifest.version !== "string" || !/^\d+\.\d+\.\d+/.test(manifest.version))) {
    errors.push("version must be semver-like when present");
  }
  if (manifest.entry !== undefined && typeof manifest.entry !== "string") {
    errors.push("entry must be a valid file path string when present");
  }
  if (manifest.coreblow && typeof manifest.coreblow !== "object") {
    errors.push("coreblow metadata must be an object when present");
  }
  return errors;
}
