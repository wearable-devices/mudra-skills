# `claude-review` — one-time setup

The `claude-review` workflow (`.github/workflows/claude-review.yml`) lets you
comment **`@claude-review`** on a PR to get an AI code review that also reports
back to the Jira **MS** board. This file is the one-time setup; everything else
is in the workflow header.

## What it does

1. You open a PR and list the related bug IDs in the **description**, e.g.
   `Fixes MS-52, MS-53`.
2. You comment **`@claude-review`** on the PR.
3. Claude reviews the diff and posts a PR comment. Then, for each `MS-NN` in the
   description, it checks Jira (via the Atlassian MCP): if the issue is in the
   **`Review`** status, Claude judges whether the PR actually fixes it and posts
   **✅ Fixed** / **❌ Not fixed** on that Jira issue. Issues not in `Review` are
   skipped (and listed in the PR comment). Claude only ever *comments* on Jira —
   it never transitions or edits issues.

## 1. Install the Claude GitHub App

Run `/install-github-app` in the Claude Code CLI, or install
<https://github.com/apps/claude> on `wearable-devices/mudra-skills`. This lets
Claude read PRs and post comments.

## 2. Mint the Claude subscription OAuth token

On a machine logged into your Claude Max/Team plan:

```bash
claude setup-token
```

Copy the token into a repo secret named **`CLAUDE_CODE_OAUTH_TOKEN`**.

## 3. Create a Jira API token

1. Go to <https://id.atlassian.com/manage-profile/security/api-tokens> and
   **Create API token**. Recommended: do this from a **dedicated bot Atlassian
   account** so Jira comments come from e.g. "Mudra Bot" and the token isn't tied
   to a person. The account must have permission to comment on the **MS** project.
2. Add repo secrets/variables:

| Name | Kind | Value |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | secret | from `claude setup-token` |
| `JIRA_USERNAME` | secret | the Atlassian account email (e.g. the bot's, or `jabbour.d@wearabledevices.co.il`) |
| `JIRA_API_TOKEN` | secret | the token from step 3.1 |
| `JIRA_URL` | variable (optional) | `https://wearabledevices.atlassian.net` — only needed to override the default baked into `.github/mcp-atlassian.json` |

Set repo secrets under **Settings → Secrets and variables → Actions → Secrets**;
the optional `JIRA_URL` goes under the **Variables** tab.

## 4. Try it

1. Open a test PR whose **description** says `Fixes MS-52` (MS-52 is currently in
   `Review`).
2. Comment **`@claude-review`** on the PR.
3. Confirm in the **Actions** tab that `claude-review` ran, that Claude posted a
   review comment on the PR, and that a **✅ Fixed / ❌ Not fixed** comment appeared
   on <https://wearabledevices.atlassian.net/browse/MS-52>.
4. Negative check: reference an `MS-NN` that is **not** in `Review` and confirm
   Claude skips it and says so in the PR comment.

## Notes & troubleshooting

- **Only collaborators can trigger it.** The workflow runs only for commenters
  with write access (`OWNER`/`MEMBER`/`COLLABORATOR`) — important because
  `issue_comment` runs with repo secrets.
- **Headless MCP auth.** The official Atlassian *Rovo* MCP uses interactive OAuth
  and won't work in CI, so `.github/mcp-atlassian.json` uses the token-auth
  community image `ghcr.io/sooperset/mcp-atlassian` (pinned). If the run fails at
  the MCP handshake, the cause is almost always a missing/blank `JIRA_USERNAME`
  or `JIRA_API_TOKEN` secret.
- **Pinned versions.** Both `anthropics/claude-code-action` and the
  `mcp-atlassian` image are pinned to exact tags; bump them deliberately.
- **Fallback.** If headless MCP ever proves flaky, the same `JIRA_*` secrets work
  with a deterministic `curl` step against the Jira REST API
  (`POST /rest/api/3/issue/{key}/comment`) as a drop-in replacement for step 3 of
  the flow.
