---
name: mudra-master
version: 2.2.0
description: Master router for Mudra Band app builds. Use when the user describes an app, experience, prototype, timer, counter, or tool to build with the Mudra Band but has not made clear whether they want a 2D (flat/screen) or 3D (spatial/XR/VR/AR) version. This skill classifies the prompt deterministically and hands off the original prompt verbatim to either mudra-preview (2D) or mudra-xr (3D), asking exactly one 2D-or-3D disambiguation question only when the dimension cannot be inferred. Do not use for pure code edits, repo questions, or any request that is not a Mudra-app build.
---
# Mudra Master Skill

Route an incoming Mudra-Band app-build prompt to the correct child skill — `mudra-preview` for 2D (flat/screen) apps, `mudra-xr` for 3D/XR/VR/AR apps — with a single disambiguation question only when the dimension is unclear.

This skill emits no app artifacts of its own. Its sole outputs are a routing decision, an optional one-line reasoning note, and at most one invocation of a child skill. Every invocation is ephemeral: no log files, no cached state, no persisted history.

## When this skill activates

Activate when the user:

- Describes something they want to **build / make / create / prototyp e** with the Mudra Band — an app, experience, tool, timer, counter, demo, game, dashboard, visualizer, panel, or scene — AND
- Has not made clear whether they want a 2D (screen-based) or 3D (spatial / XR / VR / AR) version.

I have 2 sklills and I want to build other skill master that can use both skill, how it can be done ?



and what the structure should look like ?Prefer letting `mudra-preview` or `mudra-xr` activate directly when Claude Code's skill-discovery heuristic matches a child skill's description confidently on an explicit-dimension prompt. This skill is the router for ambiguous prompts and the safe fallback for explicit-dimension prompts that still reach it.

### The verbatim-prompt rule (FR-012)

At no point may the agent modify, summarise, enrich, rephrase, prefix, suffix, or markdown-wrap the user's prompt. The string received is the exact string passed as `args` to the child skill, trimmed only at its leading and trailing whitespace edges. No "Build a 2D …" rewrites. No context injection. No examples appended.

## Classification algorithm

Evaluate these rules top-to-bottom against the user's trimmed, lowercased prompt. **First match wins.** First-match-wins plus a fixed rule order plus a fixed cue list is what makes this router deterministic (FR-015): the same prompt string always produces the same classification.

Before running any rule: if the trimmed prompt is **empty**, do NOT run the classification rules. Emit exactly `What would you like to build?` and stop the turn. The user's next message is a fresh invocation.

| # | Rule                                                                             | Outcome                                                                                                        |
| - | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1 | Prompt contains BOTH whole-word `2d` AND whole-word `3d`                     | `ASK` (source=`LITERAL`) — never guess when both dimension markers are explicit                           |
| 2 | Prompt contains whole-word `2d` and NOT whole-word `3d`                      | `TWO_D` (source=`LITERAL`, triggering_token=`2D`)                                                        |
| 3 | Prompt contains whole-word `3d` and NOT whole-word `2d`                      | `THREE_D` (source=`LITERAL`, triggering_token=`3D`)                                                      |
| 4 | Prompt matches ≥1 token from the 3D cue list AND ≥1 token from the 2D cue list | `ASK` (source=`CUE`)                                                                                       |
| 5 | Prompt matches ≥1 token from the 3D cue list and NO token from the 2D cue list  | `THREE_D` (source=`CUE`, triggering_token = the first 3D cue that matched, listed in cue-list order below) |
| 6 | Prompt matches ≥1 token from the 2D cue list and NO token from the 3D cue list  | `TWO_D` (source=`CUE`, triggering_token = the first 2D cue that matched, listed in cue-list order below)   |
| 7 | Prompt contains NONE of the in-scope build verbs/nouns listed below              | `DECLINE` (source=`OUT_OF_SCOPE`)                                                                          |
| 8 | None of the above matched                                                        | `ASK` (source=`LITERAL`) — ambiguous prompt, no cue, no literal marker                                    |

**In-scope build verbs/nouns** (Rule 7 passes if AT LEAST ONE appears in the prompt, case-insensitive, whole-word or contiguous substring):

`build`, `make`, `create`, `prototype`, `generate`, `app`, `experience`, `tool`, `timer`, `counter`, `demo`, `game`, `dashboard`, `visualizer`, `visualiser`, `panel`, `scene`, `widget`, `ui`.

### 3D cue tokens

**Fixed built-in constant. Changing this list requires a new `version` bump in this SKILL.md's frontmatter (FR-018).**

Whole-word match (case-insensitive): `XR`, `VR`, `AR`.

Contiguous-substring match (case-insensitive): `immersive`, `spatial`, `room-scale`, `world-space`, `in 3d space`, `headset`, `stereo`.

Rule-5 evaluation order is the order above: `XR` is checked first, then `VR`, `AR`, `immersive`, `spatial`, `room-scale`, `world-space`, `in 3d space`, `headset`, `stereo`. The first cue that matches is the `triggering_token`, rendered in its display form (uppercase for acronyms; as-listed for the rest).

### 2D cue tokens

**Fixed built-in constant. Changing this list requires a new `version` bump in this SKILL.md's frontmatter (FR-018).**

Whole-word match (case-insensitive): `flat`, `HUD`.

Contiguous-substring match (case-insensitive): `on-screen`, `on my screen`, `dashboard`, `screen-based`.

Rule-6 evaluation order is the order above: `flat` first, then `HUD`, `on-screen`, `on my screen`, `dashboard`, `screen-based`.

## Disambiguation question

When Rule 1, Rule 4, or Rule 8 yields an `ASK` outcome, emit exactly this text and then **stop the turn**. Do NOT call any tool. Do NOT re-state or re-request the prompt. Do NOT ask any follow-up beyond this one question — FR-008 / SC-003 forbid a second question:

```
Your prompt doesn't specify whether this should be a 2D (flat/screen)
or 3D (spatial/XR) experience. Which should I build?

A) 2D — screen-based
B) 3D — spatial/XR
```

## ASK-reply interpretation

After the disambiguation question has been emitted, the user's next message is their reply. Classify it with these rules (first match wins, against the trimmed, lowercased reply):

| Reply pattern                                                                                                         | Outcome                                                                                               |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Contains `2d`, equals `a`, `option a`, `screen`, `flat`, `flat ui`, `screen-based`, or clearly picks 2D | `TWO_D` (source=`ASK_REPLY`)                                                                      |
| Contains `3d`, equals `b`, `option b`, `spatial`, `xr`, `vr`, `ar`, `immersive`, or clearly picks 3D  | `THREE_D` (source=`ASK_REPLY`)                                                                    |
| Anything else (`either`, `you pick`, blank, nonsense)                                                             | `TWO_D` (source=`ASK_DEFAULT`) — emit the default-notice reasoning note before hand-off (FR-010) |

Once a reply is classified, route the **original prompt** (the one from before the disambiguation question was asked) — NOT the user's reply text — to the chosen child skill (FR-009).

## Out-of-scope decline

When Rule 7 yields `DECLINE`, emit this template, filling only the `<brief reason>` slot with one short human-readable clause (e.g., `a code-refactoring request`, `a question about this repository`, `a file-listing request`). Do NOT call any tool. Do NOT ask 2D-or-3D (FR-014 / SC-007):

```
I only dispatch Mudra-controlled 2D or 3D app builds. Your request looks
like <brief reason>. Try rephrasing as a "build / prototype / make a
[thing]" request, or invoke the underlying tool directly.
```

## Hand-off

For every outcome in `{TWO_D, THREE_D}`, emit the appropriate pre-hand-off text (if any) and then issue **exactly one** `Skill` tool call. Between classification and hand-off there must be no other tool calls — no `Write`, no `Bash`, no `Read`, no logging, no file writes, no state (FR-019).

### Pre-hand-off reasoning note, by classification source

| Classification source                 | Reasoning note emitted before the Skill call                     |
| ------------------------------------- | ---------------------------------------------------------------- |
| `LITERAL` (Rules 2, 3)              | (none — self-evident from the user's own words)                 |
| `CUE`, outcome=`THREE_D` (Rule 5) | `Routing to 3D skill — detected '<triggering_token>' cue.`    |
| `CUE`, outcome=`TWO_D` (Rule 6)   | `Routing to 2D skill — detected '<triggering_token>' cue.`    |
| `ASK_REPLY`                         | (none — the user just answered; the reasoning is their reply)   |
| `ASK_DEFAULT`                       | `Defaulting to 2D — your reply didn't clearly pick 2D or 3D.` |

Example for an inferred-3D case, prompt `build me a VR meditation app`: emit `Routing to 3D skill — detected 'VR' cue.` then call the Skill tool. `<triggering_token>` is rendered in display form (acronyms uppercase).

### Skill tool invocation

For `outcome=TWO_D` (any source):

```
Skill(skill="mudra-preview", args="<original prompt, byte-for-byte verbatim, trimmed only at the edges>")
```

For `outcome=THREE_D` (any source):

```
Skill(skill="mudra-xr", args="<original prompt, byte-for-byte verbatim, trimmed only at the edges>")
```

`args` is the ORIGINAL prompt — not the user's disambiguation reply, not a rewritten version, not a prefixed version. Exactly what the user first typed. Invoke the Skill tool exactly once per routing decision. No retries. No fan-out to both children. No wrapper context in `args`.

## Execution flow (summary)

```
user prompt
   │
   ▼
[empty?  YES → "What would you like to build?"  | STOP]
   │ NO
   ▼
[Classification rules 1–8, first-match-wins]
   │
   ├── TWO_D    → [emit reasoning note if any] → Skill(mudra-preview, args=prompt) → DONE
   ├── THREE_D  → [emit reasoning note if any] → Skill(mudra-xr,      args=prompt) → DONE
   ├── DECLINE  → [emit out-of-scope template]                                     → DONE
   └── ASK      → [emit disambiguation question] → STOP TURN → await user reply
                     │
                     ▼
               [ASK-reply rules]
                     │
                     ├── TWO_D  (ASK_REPLY)   → Skill(mudra-preview, args=ORIGINAL prompt) → DONE
                     ├── TWO_D  (ASK_DEFAULT) → [emit default-notice] → Skill(mudra-preview, args=ORIGINAL prompt) → DONE
                     └── THREE_D (ASK_REPLY)  → Skill(mudra-xr,      args=ORIGINAL prompt) → DONE
```

## Onboarding contract — defer to children (feature 008)

The locked onboarding modal contract (DOM, CSS, JS, branding string, close behavior, app-aware filter) is owned by the **child** skills:

- 2D apps → `mudra-preview/references/promt.md` § "Onboarding Modal (mandatory, STRICT) — feature 008-strict-onboarding-templates" — see "Close behavior" subsection
- 3D apps → `mudra-xr/references/promt.md` § "Section 17" **and** `mudra-xr-2/references/xr_build_rules.md` § "§21" — both encode the same locked contract including the close-behavior table.

Binding contracts live at `specs/008-strict-onboarding-templates/contracts/onboarding-block.md` and `…/actions-array.md`.

The contract guarantees a uniform close model across all routed apps:

- The `<dialog>` is opened via `root.showModal()` on page load (never the HTML `open` attribute — non-modal dialogs let an underlying canvas intercept clicks).
- Both `Continue` and `×` close the modal via the same `closeOb` handler (no skip-vs-save split).
- Escape closes; `?` reopens (2D always, 3D outside immersive XR).
- The help-pill `#mudra-onboarding-help` is the mouse/touch re-open path.

This router MUST NOT:

- Mention the onboarding modal in its prompt-trimming or hand-off logic.
- Append, prefix, or inject any "include onboarding" / "use template N" / "skip close button" hint to `args`.
- Suggest a different layout, branding string, CTA label, or close behavior.
- Override or weaken any rule in the child contract (FR-012, FR-019).

The verbatim-prompt rule above already implies all of this — the router never modifies the user's prompt. This subsection exists to make the deferral explicit so future router edits do not accidentally introduce onboarding rules at the router layer.

## Guarantees (invariants the router must preserve)

1. **Deterministic** — the same prompt string always yields the same classification (FR-015).
2. **Verbatim hand-off** — `args` is byte-identical to the user's original prompt, trimmed only at the edges (FR-012 / SC-006).
3. **Exactly one Skill call per routed outcome** — never zero (silent guess), never two (fan-out) (FR-002).
4. **At most one disambiguation question per turn** — never two (SC-003).
5. **No persisted state** — no files written, no logs, no caches, no console decision records (FR-019).
6. **Explicit beats inferred** — literal `2D`/`3D` markers always win over any cue match (FR-016).
7. **No child-skill modification** — routing never reads or edits anything under `.claude/skills/mudra-preview/` or `.claude/skills/mudra-xr/` (FR-011).
8. **No onboarding-layer overrides** (feature 008) — router never edits or weakens the locked onboarding contract owned by the child skills.

## Not this skill's job

- Generating HTML files — that's `mudra-preview` (2D) or `mudra-xr` (3D).
- Selecting templates, inferring motion modes, or wiring Mudra signals — child-skill concerns.
- Explaining WHY a user should pick 2D vs 3D — the disambiguation question is one line, no advice.
- Refactoring code, answering repo questions, running shell commands — decline these via Rule 7.
- Logging, persisting, or summarising routing decisions — explicitly forbidden in v1 (FR-019).
