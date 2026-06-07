# Changelog

All notable changes to **mudra-skills** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versioning is driven by `mudra-plugin/package.json` — the single source of truth. See
[RELEASING.md](./RELEASING.md) for how a release is cut.

## [Unreleased]

## [3.1.0] - 2026-06-07

### Added

- Release tooling: `mudra-plugin/scripts/sync-skills.mjs` regenerates every derived
  artifact from the canonical `.claude/skills/` source, and the `npm version` lifecycle
  now stamps the version everywhere and rebuilds the skill ZIPs automatically.
- CI: `validate.yml` (version-consistency + drift gate on every PR/push) and `release.yml`
  (one-click `workflow_dispatch` release — bump, tag, `npm publish` with OIDC provenance,
  GitHub Release with ZIPs, gated by a required-reviewer environment), plus
  `mudra-plugin/scripts/validate.mjs`.
- `CHANGELOG.md` and `RELEASING.md`.

### Changed

- **Single source of truth for the version.** `package.json` now propagates to all three
  `SKILL.md` frontmatters and to `.claude-plugin/marketplace.json` (which gains a `version`
  field). These had drifted (`3.0.8` / `3.0.1` / `3.0.0` / none).
- Skills are now authored only in `.claude/skills/`; `mudra-plugin/skills/`, the nested
  `mudra-master/{mudra-preview,mudra-xr}` copies, and the `Skill download/*.zip` files are
  generated outputs.

### Fixed

- Reconciled the previously drifted `references/agent_protocol.json` between the canonical
  and shipped skill trees.
- `Skill download/*.zip` are now built deterministically without macOS `__MACOSX/`/`._*` junk.

## [3.0.8] - 2026-06-07

### Fixed

- `mudra-xr` skill and Gem aligned with the new agent protocol; corrected a routing-table
  corruption and a battery signal that was listed incorrectly.
- `mudra-preview` updated for the new protocol; master-skill prompt fixes.

## [3.0.0] - 2026-06-03

### Added

- npm package `mudra-skills` with the `bin/cli.js` installer (Claude, Codex, Antigravity)
  and the Claude Code plugin marketplace manifest.

### Changed

- Major restructure consolidating the 2D, 3D/XR, and master-router skills.

## [1.0.0] - 2026-05-24

### Added

- Initial public release of the Mudra Band skills (2D preview, 3D/XR, master router).

[Unreleased]: https://github.com/wearable-devices/mudra-skills/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/wearable-devices/mudra-skills/compare/v3.0.0...v3.1.0
[3.0.8]: https://github.com/wearable-devices/mudra-skills/compare/v3.0.0...v3.0.8
[3.0.0]: https://github.com/wearable-devices/mudra-skills/compare/v1.0.0...v3.0.0
[1.0.0]: https://github.com/wearable-devices/mudra-skills/releases/tag/v1.0.0
