---
name: mudra-xr
version: 2.1.0
description: Generate a single-file Mudra-controlled 3D/XR app using XR Blocks. Use when the user describes a 3D, XR, VR, or AR experience controlled by the Mudra Band.
---

# Mudra XR Skill

Generate a complete, working single-file HTML 3D/XR app controlled by Mudra Band signals.
The output runs in any modern Chromium browser — no build step, no server, no headset required.

**Mandatory feature (v0.3.0):** Every generated app MUST include a
Manual/Mudra **Mode toggle** as defined in `references/promt.md`
§ Section 15 "Mode Toggle (Manual / Mudra) — Required". Manual is the
default; Mudra opens a single WebSocket lazily and disables the
simulator panel so signals come only from the band.

**Mandatory feature (v0.3.0):** Connection state MUST reflect the
**band**, not the WebSocket. The Companion service accepts socket
connections even when no band is paired, so flipping to "Connected" on
`ws.onopen` is a lie. Every generated app MUST send
`{command:"get_status"}` on open and poll it every 2 s while in Mudra
mode, and only show "Connected" when the response has
`data.device.state === "connected"`. See `references/promt.md`
§ "Disconnect detection — band state via `get_status` polling (mandatory)".

**No disconnect overlay:** Do **not** render a "Band disconnected"
overlay, toast, or any other separate disconnect alert. Connection
state is communicated **only** through the existing connection-status
pill (`Manual` / `Connecting…` / `Connected` / `Disconnected`).

**Branding (v0.3.0):** The footer/badge text MUST be exactly
**"Created by Mudra"** — never "Created with Mudra Studio",
"Powered by Mudra", or any other variant. See § Section 16.

**Simulator panel buttons must be contextual.** Render only the
sub-actions the app actually handles. If the app maps `nav_direction` to
Up/Down only, omit Left/Right/Roll L/Roll R. If `gesture` only handles
`tap`, omit Twist/2Twist/2Tap. See § Section 5.

The canonical protocol is in `references/agent_protocol.json` (v2.0).

## Invocation

This skill activates when the user:
- Explicitly runs `/mudra-xr <prompt>`
- Describes a 3D, XR, VR, or AR experience involving the Mudra Band
- Uses trigger phrases: "3D with Mudra", "XR Mudra app", "WebXR + Mudra",
  "Mudra in VR / AR", "XR Blocks + band", or close paraphrases
- Mentions depth, stereo, hand tracking, or spatial context alongside Mudra

Prefer this skill over `mudra-preview` (2D) when the prompt mentions 3D, XR, VR, AR,
a headset, depth, stereo, or spatial hand tracking.

## Steps

### 1. Read build rules

Read the complete `references/promt.md` from the skill base directory.
That file is the source of truth for signal protocol, dependency pins, MudraClient
implementation, simulator panel, keyboard shortcuts, pre-write checklist, and binding patterns.
Follow every rule in it.

### 2. Parse input

Extract from the user's prompt:
- **`templateOverride`**: an inline `[template=<id>]` tag (e.g., `[template=2_hands]`)
- **`motionModeHint`**: an inline `[mode=pointer|direction|imu]` tag

If neither tag is present, infer them from the prompt language (Step 3).

### 3. Infer Mudra signals

Map the user's intent to the required Mudra signals using the Signal Inference Reference
in `references/promt.md`. Enforce all grouping rules (Section 8 of promt.md):

- Discrete actions → `gesture` OR `button` (never both gesture+pressure)
- Analog control → `pressure` OR `button` (never both gesture+pressure)
- Continuous directional movement → `navigation` + `button` (Pointer mode)
- Discrete directional swipes → `nav_direction` (Direction mode)
- Tilt / orientation / biometrics → `imu_acc` + `imu_gyro` + `snc` (always all three together — IMU+Biometric bundle)

**Critical grouping rules:**
1. `gesture` and `pressure` are mutually exclusive — pick one.
2. `navigation` and `nav_direction` are mutually exclusive — pick one.
3. The IMU+Biometric bundle (`imu_acc` + `imu_gyro` + `snc`) cannot combine with `navigation` or `nav_direction`.
4. `imu_acc`, `imu_gyro`, and `snc` are always subscribed together — using any one requires all three.

If the prompt maps to two incompatible groups, ask one disambiguation question — do not
auto-pick silently. If no motion mode is needed, use mode = none.

### 4. Pick motion mode

Exactly one of: `pointer`, `direction`, `imu`, or `none`.
If `motionModeHint` is present, use it. If the inference step above is unambiguous, use that.
Default to `direction` if there is motion-language in the prompt but no clear winner.

### 5. Select seed template

**If `templateOverride` is present**: use the named template directly.
Resolve the id against the selection table in Section 12 of `references/promt.md`.
If the id does not match any row, reject with:
```
Unknown template id: "<id>". Valid ids: 0_basic, 1_ui, 2_hands, 3_depth, 4_stereo,
5_camera, 6_ai, 7_ai_live, 8_objects, 9_xr-toggle, heuristic_hand_gestures, meshes,
planes, uikit, depthmap, depthmesh, game_rps, gestures_custom, gestures_heuristic,
lighting, mesh_detection, modelviewer, paint, planar-vst, reticle, skybox_agent,
sound, ui, virtual-screens, 3dgs-walkthrough, aisimulator, balloonpop, ballpit,
drone, gemini-icebreakers, gemini-xrobject, math3d, measure, occlusion, rain,
screenwiper, splash, webcam_gestures, xremoji, xrpoet
```

**Keyword-based selection (no override)**:

Score every row in Section 12's table against the user's prompt using this algorithm:

1. **Signal overlap** (+3 per matching subscribed signal name found in `keywords`)
2. **Motion mode match** (+5 if inferred motion mode is in `motionModesSupported`, +2 if `"none"` is in `motionModesSupported`)
3. **XR feature match** (+2 per matching XR feature keyword from the prompt in `xrFeatures`)
4. **Keyword overlap** (+1 per keyword from the `keywords` array that appears in the lowercased prompt)

Pick the highest-scoring row. Ties resolved by:
1. Prefer `direction` motion mode over others (most app-agnostic)
2. Prefer templates over samples, samples over demos (simpler baseline)
3. If still tied, pick `0_basic` as the universal fallback

**Examples**:
- Prompt with "hands" + "gesture" + no motion mode → `2_hands` or `heuristic_hand_gestures`
- Prompt with "ui" + "panel" + "button" → `1_ui` or `uikit`
- Prompt with "depth" → `3_depth` or `depthmap`
- Prompt with "ai" + "gemini" + "photo" → `6_ai`
- No clear match → `0_basic` (universal fallback)

### 5b. Background — locked to XR Blocks default

**Forbidden:** custom backgrounds. Every generated app uses the XR Blocks
default room and nothing else. There is no catalog, no `applyBackground_*`
helper, no `[bg=...]` override, no `scenePath` override.

Rules — apply unconditionally:

1. Do NOT add any `applyBackground_*` method to the `xb.Script` subclass.
2. Do NOT call any background helper from `init()`. `init()` starts with
   scene content (lights, meshes, Mudra wiring).
3. Do NOT set `options.simulator.scenePath` (neither to `null` nor to a path).
   Leave it alone — XR Blocks renders its default room.
4. Ignore the prompt's vibe, theme, or mood. Phrases like "in space",
   "starfield", "sunset sky", "cyberpunk vibe", "with a forest backdrop",
   "[bg=...]" — all are ignored for background purposes. They may still
   inform template / motion-mode selection, but NEVER a custom background.

If a user explicitly insists on a custom background, decline politely and
remind them that the skill is locked to the XR Blocks default room.

### 6. Adapt the template with Mudra bindings

Starting from the seed template HTML:
1. Add the `MudraClient` class (Section 4 of promt.md, with the Section 15
   extensions: no auto-connect; `setMode()`-driven; passive mock; 2 s
   `get_status` poll in Mudra mode) verbatim inside the `<script type="module">`.
2. Instantiate `mudra` at module scope. Do NOT auto-connect — Manual is the default.
3. **No background helper.** Do NOT add any `applyBackground_*` method.
4. **No background call from `init()`.** `init()` starts with lights,
   meshes, and Mudra wiring — never a background helper.
4a. **No `scenePath` override.** Do NOT set `options.simulator.scenePath`.
   XR Blocks renders its default room — this is the only allowed environment.
5. Call `mudra.subscribe('<signal>')` for every required signal inside `init()`.
6. Wire `mudra.on('<signal>', handler)` for each subscribed signal using the binding
   patterns from Section 11 of promt.md.
7. Add the **Mode toggle** `<div id="mode-toggle">` (Section 15) with
   **Manual** + **Mudra** buttons. Manual is the default. Wire both
   buttons to atomically switch via `mudra.setMode(...)`.
8. Add the simulator panel `<div id="mudra-sim">` (Section 5) with one
   button group **only for the sub-actions actually handled by the app**
   (e.g., omit `Roll L`/`Roll R` if `nav_direction` only handles
   Up/Down; omit `Twist`/`2Twist` if `gesture` only handles `tap`). The
   panel is greyed and `pointer-events: none` while in Mudra mode.
9. Add the status indicator `<div id="mudra-status">` (Section 15)
   wired to `mudra.on('_status', …)` with the four states `Manual` /
   `Connecting…` / `Connected` / `Disconnected`. **Never render a
   separate disconnect overlay/banner/toast.**
10. Add the keyboard handler `window.addEventListener('keydown', …, { capture: true })`
    (Section 6) for every subscribed signal.
11. Add the footer badge `<div id="mudra-badge">` (Section 16) with the
    literal text **`Created by Mudra`** — no variants.
12. Remove import-map entries for dependencies the adapted app does not use.
13. **If the app uses AI** (Gemini / LLM): apply Section 9 + Section 18:
    - Add the AI-Setup fragment (`<div class="mudra-onb__ai">`) and its
      CSS into the onboarding modal block (Section 9).
    - Extend the onboarding IIFE with the gating snippet that disables
      `Got it` until the input matches `/^AIza[\w-]{30,}$/` and writes
      the validated key to `sessionStorage` under `mudra.gemini.apiKey`.
    - Block `Escape`, `×`, and backdrop dismissal while the key is
      missing.
    - In the `xb.Script` subclass, read the key once via
      `sessionStorage.getItem('mudra.gemini.apiKey')`. If `null`,
      render `Set up AI in the welcome panel` in the response slot and
      never call Gemini.
    - Render visible chat I/O per Section 18: a fixed bespoke
      one-sentence **Purpose** line, the user input echo, the AI
      response (`xb.ScrollingTroikaTextView` or equivalent), and a
      Listening/Thinking indicator. TTS is optional; visible text is
      mandatory.
    - Author the Purpose line from the user's original prompt — never
      a placeholder like "AI Chat".

### 7. Run the pre-write checklist

Verify all 10 items from Section 10 of promt.md before writing.
If any item fails: regenerate once and re-check.
If the second attempt also fails: surface the failing items to the user; do not write.

### 8. Write the output file

Target path: `preview/<concept-name>.html` (short kebab-case derived from the concept).
If that file exists: try `preview/<concept-name>-2.html`, then `-3.html`, etc.
Never overwrite. Create `preview/` if it does not exist.

### 9. Report

Print the absolute path to the written file and a one-line summary:
- Template used
- Motion mode
- Subscribed signals

## Quick reference

- WebSocket endpoint: `ws://127.0.0.1:8766`
- Always use `MudraClient` — never raw `new WebSocket(...)`
- Subscribe one signal per command: `{ command: 'subscribe', signal: '<name>' }`
- Motion modes are mutually exclusive: Pointer (`navigation`+`button`) / Direction (`nav_direction`) / IMU+Biometric (`imu_acc`+`imu_gyro`+`snc`)
- IMU+Biometric bundle: `imu_acc`, `imu_gyro`, `snc` always subscribed together — never partially
- `gesture` and `pressure` are mutually exclusive — never combine them
- Free-combining signals (one or the other, not both): `gesture` OR `pressure`, plus `button`, `battery`
- **Navigation sensitivity is gentle by default**: sim button + keyboard `I`/`J`/`K`/`L` emit `±3` per event; cursor multiplier on inbound `delta_x`/`delta_y` is `0.002`. Raise only when the prompt explicitly asks for fast/snappy movement. See Section 6 + Section 11 of `references/promt.md`.
- **Reserved for XR Blocks desktop simulator** — Mudra never claims these: `W`/`A`/`S`/`D` and arrow keys (camera walk), `Q`/`E` (roll/vertical), `R` (reset), right-click drag (orbit), mouse wheel (zoom). Mudra navigation uses `I`/`J`/`K`/`L`; Mudra IMU uses `U`/`O`/`M`/`N`. See Section 6 of `references/promt.md`.
- Keyboard handlers: `{ capture: true }` + `stopPropagation()` on Mudra-claimed keys
- Import map: exact pinned versions only — no `@latest`
- Output: one `.html` file in `preview/`, zero external local references
