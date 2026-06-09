# Claude PR review + Jira `MS` board sync

You are reviewing the pull request that the triggering `@claude-review` comment
was posted on, in the `wearable-devices/mudra-skills` repo. Work in this order
and do not skip steps.

## 1. Read the PR description and extract bug IDs

Read the PR title and description (body). Extract every Jira bug ID matching the
pattern `MS-<number>` (case-insensitive; normalize to upper-case, e.g. `ms-52`
→ `MS-52`). Deduplicate.

- If the description contains **no** `MS-NN` IDs, post a single PR comment saying
  exactly that — "No `MS-NN` bug IDs found in the PR description, so nothing was
  synced to Jira. Add the related IDs (e.g. `Fixes MS-52`) and re-comment
  `@claude-review`." — then stop. Still do the code review in step 2 first.

## 2. Review the code — critical bugs only

Review the **entire** PR diff like a careful reviewer — not just the parts tied
to the bug IDs — but report **only critical bugs**: defects that would actually
break a generated app, change behavior unintentionally, or violate the canonical
Mudra contract. Be concrete and cite `file:line` for every finding.

A finding is **critical** only if it is one of these:

- **Correctness & regressions** — logic bugs, broken edge cases, off-by-one, or
  anything that changes behavior unintentionally or makes a generated app fail.
- **Contract-breaking inconsistencies** — a signal name, payload shape, or state
  string that disagrees with the canonical contract or across files. This repo
  keeps the same signal tables in several places (the 2D and 3D Build Rules,
  `README.md`, the Gem prompts in `gemini-gem/`, and the skill sources under
  `.claude/skills/`). A single wrong token here (e.g. `press` vs `pressed`) is a
  real bug — call it out. A truncated or garbled instruction that drops a
  mandatory requirement is also critical.
- **Broken references** — dead/wrong links, `file:line` pointers, version pins,
  or section references that no longer resolve.

Do **NOT** report non-critical findings. Skip them entirely — do not list them,
not even at the bottom: pure typos / spelling / grammar in prose, formatting or
whitespace nits, style preferences, and wording you would merely phrase
differently are all out of scope for this review.

List each critical bug as: **what's wrong, where (`file:line`), and the suggested
fix**, ordered by severity. If the diff has no critical bugs, say so in one line —
do not invent problems or pad with nits. Post this as your normal PR review
comment (your top-level reply on the PR).

## 3. For each `MS-NN`, check Jira status — comment only when it is in `Review`

For each extracted `MS-NN`, call `mcp__atlassian__jira_get_issue` (fields:
`summary`, `status`, `description`) and read `fields.status.name`.

- **If `status.name` is NOT `Review`** (case-insensitive): do **not** comment on
  the issue. Record it for the PR summary as `skipped — MS-NN is not in Review
  (current status: <name>)`.

- **If `status.name` IS `Review`**: read the ticket's description — these tickets
  state a **Problem** and an intended **Fix** (and a Priority). Decide whether
  *this PR's diff actually implements that stated fix*. Then call
  `mcp__atlassian__jira_add_comment` on that issue with one of:

  - **Fixed** — start the comment with `✅ Fixed in PR #<number>` and then, in 2–5
    bullet points, state what you verified in the diff against the ticket's
    stated Fix (cite `file:line`). End with the PR URL.

  - **Not fixed** — start the comment with `❌ Not fixed in PR #<number>` and then,
    in 2–5 bullet points, state precisely what is still missing or wrong relative
    to the ticket's stated Fix. End with the PR URL.

  Keep each Jira comment self-contained and readable by someone looking only at
  the board.

## 4. Summarize on the PR

Edit/extend your PR comment with a short "Jira sync" section listing each
`MS-NN` and what you did: `✅ Fixed`, `❌ Not fixed`, or `skipped (status: X)`.

## Hard rules

- **Comment only.** Never transition issues, never edit issue fields, never edit
  the repo, never push commits. Your only Jira write is `jira_add_comment`, and
  only on issues that are in `Review`.
- Only the three Atlassian tools are available to you:
  `jira_get_issue`, `jira_search`, `jira_add_comment`. If a `jira_get_issue`
  call fails (e.g. the key does not exist), note it in the PR summary as
  `error — MS-NN could not be read` and continue with the rest.
- Be honest in the verdict. If you are not confident the diff fully implements
  the ticket's fix, say **Not fixed** and explain why, rather than guessing
  "fixed".
