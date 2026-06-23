# Update and Signing Strategy

Status: guarded baseline, not enabled.

MarkForge does not currently publish signed updater artifacts. This is intentional until signing keys, certificate storage, release channels, hosting, rollback rules, and CI secret handling are decided.

## Current Guardrails

- `bundle.createUpdaterArtifacts` is explicitly `false` in both Tauri apps.
- `plugins.updater` is not configured.
- Windows signing fields are not configured.
- `pnpm packaging:check` fails if updater endpoints or Windows signing fields appear before the release policy is approved.

## Why Updates Are Disabled

Tauri updater artifacts require signatures. The updater public key must be configured in `tauri.conf.json`, and the private key must be supplied during build. Losing the private updater key prevents publishing future updates to installed users. Because of that, MarkForge must not enable updater artifacts until the key custody model is settled.

Windows code signing also requires a certificate workflow: certificate import or secure signing service, certificate thumbprint, digest algorithm, timestamp URL, and CI secret storage. Unsigned local NSIS builds are acceptable for pre-release smoke validation, but not for a public release.

## Required Decisions Before Enabling

- Release channels: stable, beta, nightly, or stable-only.
- Artifact host: GitHub Releases, static CDN JSON, or dedicated update service.
- Updater key custody: who owns the key, where it is stored, backup process, and rotation process.
- Windows signing: certificate provider, signing method, timestamp authority, and CI secret names.
- Rollback policy: when a release is pulled, how users are protected, and how emergency hotfixes are cut.
- Versioning policy: when root/package/Tauri/Cargo versions change and how tags map to channels.

## Future Enablement Checklist

1. Generate Tauri updater key pair.
2. Store the private key in CI secrets, never in the repository.
3. Add updater plugin dependencies to editor and viewer.
4. Initialize the updater plugin in both Tauri builders.
5. Add `plugins.updater.pubkey` and HTTPS `endpoints` to each app config.
6. Set `bundle.createUpdaterArtifacts` to `true`.
7. Configure Windows signing through certificate thumbprint or a signing command.
8. Add CI validation that updater `.sig` files and Windows signatures exist for release builds.
9. Publish and test an internal update from `0.0.0` to a later version before any public installer release.

## References

- Tauri updater documentation: https://v2.tauri.app/plugin/updater/
- Tauri Windows signing documentation: https://v2.tauri.app/distribute/sign/windows/
