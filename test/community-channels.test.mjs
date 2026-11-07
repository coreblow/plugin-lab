import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COREHUB_DIR = path.resolve(__dirname, "../../corehub");
const CATALOG_PATH = path.join(COREHUB_DIR, "catalog.json");
const ARTIFACTS_DIR = path.join(COREHUB_DIR, "artifacts");

const EXPECTED_COMMUNITY_CHANNELS = [
  "@coreblow/discord",
  "@coreblow/matrix",
  "@coreblow/twitch",
  "@coreblow/feishu",
  "@coreblow/line",
  "@coreblow/zalo",
  "@coreblow/zalouser",
  "@coreblow/qqbot",
  "@coreblow/mattermost",
  "@coreblow/nextcloud-talk",
  "@coreblow/synology-chat",
  "@coreblow/tlon",
  "@coreblow/nostr",
  "@coreblow/irc",
  "@coreblow/msteams",
];

test("All 15 externalized community channels exist in CoreHub catalog.json", () => {
  assert.ok(fs.existsSync(CATALOG_PATH), `catalog.json not found at ${CATALOG_PATH}`);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  assert.ok(Array.isArray(catalog), "catalog.json must be a JSON array");

  const catalogIds = new Set(catalog.map((entry) => entry.id));

  for (const channelId of EXPECTED_COMMUNITY_CHANNELS) {
    assert.ok(
      catalogIds.has(channelId),
      `Channel ${channelId} is missing from CoreHub catalog.json`,
    );
  }
});

test("Every community channel artifact exists on disk with matching SHA-256 digest and valid manifest", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));

  for (const channelId of EXPECTED_COMMUNITY_CHANNELS) {
    const entry = catalog.find((e) => e.id === channelId);
    assert.ok(entry, `Entry for ${channelId} not found in catalog`);
    assert.equal(entry.kind, "channel");

    assert.ok(
      Array.isArray(entry.versions) && entry.versions.length > 0,
      `Channel ${channelId} must have at least one version entry`,
    );

    const version = entry.versions[0];
    const artifact = version.artifact;
    assert.ok(artifact, `Version artifact missing for ${channelId}`);

    const artifactName = artifact.name;
    const expectedSha256 = artifact.sha256;
    assert.ok(artifactName, `Artifact name missing for ${channelId}`);
    assert.ok(expectedSha256, `Artifact sha256 missing for ${channelId}`);

    // Verify .coreblow-plugin.tgz exists on disk
    const tgzPath = path.join(ARTIFACTS_DIR, artifactName);
    assert.ok(fs.existsSync(tgzPath), `Artifact file not found on disk: ${tgzPath}`);

    const fileBuffer = fs.readFileSync(tgzPath);
    const actualSha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    assert.equal(
      actualSha256,
      expectedSha256,
      `SHA-256 digest mismatch for ${artifactName}: expected ${expectedSha256}, got ${actualSha256}`,
    );

    // Verify .corehub-manifest.json exists on disk and references matching metadata
    const manifestName = artifactName.replace(/\.coreblow-plugin\.tgz$/, ".corehub-manifest.json");
    const manifestPath = path.join(ARTIFACTS_DIR, manifestName);
    assert.ok(fs.existsSync(manifestPath), `Manifest file not found on disk: ${manifestPath}`);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.equal(manifest.package?.id, channelId);
    assert.equal(manifest.artifact?.sha256, expectedSha256);
  }
});
