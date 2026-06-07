# Releasing mudra-skills

This repo ships one npm package (`mudra-skills`) across several channels (npx installer,
Claude Code plugin marketplace, downloadable ZIPs, the Gemini Gem, the docs site). To keep
them from drifting, **`mudra-plugin/package.json` `version` is the single source of truth**
and one script regenerates everything else.

## The model

```
.claude/skills/{mudra-master,mudra-preview,mudra-xr}   ← EDIT HERE (canonical)
        │  npm run sync   (regenerates everything below — never hand-edit these)
        ▼
mudra-plugin/skills/…          shipped by `npx mudra-skills` and the plugin
mudra-master/{preview,xr}/…    nested copies (both trees)
Skill download/*.zip           deterministic, no __MACOSX junk
SKILL.md  version: X.Y.Z  (all)  +  .claude-plugin/marketplace.json  "version": X.Y.Z
        ▲
mudra-plugin/package.json  "version"   ← single source of truth
```

## SemVer policy

- **patch** — docs, typos, asset-only fixes.
- **minor** — skill prompt/behavior changes, signal/protocol updates, a new skill.
- **major** — removing a skill, or breaking the CLI / marketplace contract.

## CI overview

Two GitHub Actions workflows (`.github/workflows/`):

- **`validate.yml`** — runs on every PR and push to `main`. Validates version consistency
  and structure, and runs the **drift gate** (regenerate from `.claude/skills`, fail if the
  committed tree differs). This is what *enforces* the source-of-truth model — a PR that
  hand-edits a generated file or forgets `npm run sync` fails here.
- **`release.yml`** — the one-click release (see below).

## One-time setup (do these once)

1. **npm Trusted Publishing (OIDC)** — on <https://npmjs.com> → package **mudra-skills** →
   *Settings → Trusted Publishers* → add a **GitHub Actions** publisher:
   - Repository: `wearable-devices/mudra-skills`
   - Workflow filename: `release.yml`
   - Environment: `release`

   This lets CI publish without storing an `NPM_TOKEN`, and stamps the package with provenance.
2. **Approval gate** — repo *Settings → Environments → New environment* named **`release`**,
   then add yourself under **Required reviewers**. The release job pauses for your approval
   before anything is published.
3. **Branch push permission** — the release job pushes the version-bump commit + tag to
   `main`. If `main` has branch protection, allow `github-actions[bot]` to bypass it
   (*Settings → Branches → branch protection rule → Allow specified actors to bypass*),
   otherwise the push is rejected.

## Releasing (one-click, recommended)

1. *(Optional)* Add notes under `## [Unreleased]` in `CHANGELOG.md` and commit to `main`.
2. **Actions tab → `release` → Run workflow** → choose `patch` / `minor` / `major` → **Run**.
3. **Approve** when the run requests it (the `release` environment gate).
4. CI then: bumps the version → `sync` stamps everything and rebuilds the ZIPs → commits +
   tags `vX.Y.Z` → pushes to `main` → `npm publish --provenance` (OIDC) → creates the GitHub
   Release with the three ZIPs and auto-generated notes.

## Manual steps (cannot be automated)

- **Gemini Gem:** paste the updated `gemini-gem/*.prompt.md` into the cloud Gem(s), save/publish.
- **Docs site / README:** update `docs/` and the README install section only if version
  strings or install commands changed.

## Verify the release

- `npm view mudra-skills version` matches the new tag.
- In a temp dir: `npx mudra-skills@latest --llm claude` installs the three skills and they
  load in Claude Code.
- `/plugin update mudra && /reload-plugins` picks up the new tag (the git-subdir marketplace
  channel needs no publish — pushing the tag is enough).

## Local fallback (if you can't use CI)

```bash
# 1. Edit skills only in .claude/skills/ and commit your changes (tree must be clean).
# 2. Move CHANGELOG '## [Unreleased]' notes under '## [X.Y.Z]'; commit.
cd mudra-plugin && npm version patch|minor|major   # bumps, syncs, commits, tags vX.Y.Z
cd .. && git push --follow-tags
cd mudra-plugin && npm publish --provenance --access public   # `npm login` first if needed
gh release create vX.Y.Z --generate-notes "Skill download/"*.zip
```

## Notes

- The marketplace channel reads `mudra-plugin/` straight from the repo at the tag, so it is
  covered the moment the tag is pushed — only the npx/npm channel needs `npm publish`.
- ZIP filenames are intentionally version-less so README/docs links never break; the embedded
  `SKILL.md` carries the version.
- ZIPs are built with Info-ZIP `zip -X` and normalized mtimes, so they are byte-reproducible
  on a given OS and carry no macOS `__MACOSX/`/`._*` junk. They are **not** byte-identical
  across macOS and Linux, which is why the CI drift gate excludes them.
