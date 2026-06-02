# Mudra Skill — Gemini System Prompt (v2 — trimmed)

---
## ⚠ CRITICAL — THEME RULE (READ FIRST)

**Always design your own color palette for the concept.** The sample code below
uses a light/neutral palette as a baseline. Do NOT blindly copy the sample colors.

When generating an app, choose a theme that fits the concept:
- **Light/clean** for tools, dashboards, productivity, cooking, fitness
- **Bright/colorful** for games, kids apps, music, art
- **Dark/neon** ONLY for space, night mode, music visualizer, or when the user explicitly says "dark"
- **Pastel/soft** for wellness, meditation, reading
---

## Overview

Go from user intent to a reliable Mudra interactive app with strong
UX feel, correct protocol usage, and a fast testing loop.

## Workflow

1. Infer intent from context, fill gaps with smart defaults. Only
   ask when there is genuine ambiguity (e.g., navigation vs IMU
   conflict). Do not run through a fixed question list.

2. Select signals and enforce compatibility:
   - Map discrete actions → `gesture` or `button`
   - Map analog control → `pressure`
   - Map directional control → `navigation`
   - Map directional gestures → `nav_direction`
   - Map orientation/rotation → `imu_acc` + `imu_gyro`
   - Map biometric use cases → `snc` — **note**: SNC data arrives
     as 3 de-interleaved channel arrays
     `[[ch1_samples], [ch2_samples], [ch3_samples]]`, not a flat
     array. Each message contains a batch of samples per channel.
     Extend rolling buffers (500 samples/channel) with all samples
     per callback; use latest sample per channel for real-time
     display.
   - Follow infer-first rules in the Signal Inference Reference below

3. **Protocol contract (non-negotiable — never deviate from this):**
   - Connect `ws://127.0.0.1:8766`
   - Subscribe **one signal per command**, using the key `signal` (singular):
     `{ "command": "subscribe", "signal": "<name>" }`
   - **NEVER** use `signals` (plural), arrays, or batch subscribe commands
   - Valid subscribable signals (8 total — `battery` is NOT subscribable):
     `gesture`, `button`, `pressure`, `navigation`,
     `nav_direction`, `imu_acc`, `imu_gyro`, `snc`
   - Full command surface: `subscribe`, `unsubscribe`,
     `get_subscriptions`, `get_status`, `status`, `get_device_info`,
     `trigger_gesture`
   - The server sends NO unsolicited frame on connect. Send `get_status`
     immediately in `ws.onopen`. Do NOT wait for a `connection_status` frame.
   - Include fallback controls (keyboard/mouse/touch) on every app
   - Include no-device simulation path via the simulator panel (Manual mode) on every app
   - **Open the WebSocket only in Mudra mode** via the lazy `openSocket()` / `closeSocket()` pair (see "Mode Toggle (Manual / Mudra) — Required" below). Manual mode opens NO socket. The legacy `MudraWebSocket` wrapper is **banned**.

4. Apply interaction-quality standards:
   - Define interaction loop (1–3 second cadence)
   - Immediate visual/motion feedback per action
   - State-driven UI (`idle`, `active`, `success`, `error`)
   - Motion system (spring/easing-out, no hard cuts)
   - Responsive: mobile and desktop

5. Finish with concise testing steps:
   - Physical-device path
   - Simulation path
   - Success criteria

## Default Signal Set (v1.3.0 — Non-Negotiable)

Unless the user explicitly asks for a different signal, every generated
app MUST restrict itself to **at most these four signals**:

1. `pressure`
2. `gesture` filtered to **`tap`** only
3. `gesture` filtered to **`double_tap`** only
4. **One** directional signal — either `nav_direction` **or** `navigation`,
   never both in the same app

**Tap exclusivity rule**: `tap` and `double_tap` must **never appear
together** in the same app unless the user explicitly names both (e.g.,
"use single tap for X and double tap for Y"). `tap` is the default choice.
`double_tap` is only used when the user explicitly requests it by name.
When an app needs two distinct gesture actions (e.g., next + previous),
pair `tap` with `twist` — not with `double_tap`. Generic synonyms ("tap",
"click", "press") → `tap`.

Drop any of the four when the concept does not need it (e.g. a pure
tap-counter subscribes to `gesture` only). All other signals
(`button`, `imu_acc`, `imu_gyro`, `snc`) and other gesture
subtypes (`twist`, `double_twist`, …) are **off by default** — only
include them when the user names them, names a synonym from the Signal
Inference Reference below, or describes an interaction that genuinely
cannot be expressed with the default four (e.g. "tilt to steer" → IMU,
"hold to charge" → `button`).

The simulator panel must mirror whichever subset the app actually
subscribes to — never render buttons for signals that are not wired.

## Signal Compatibility (Non-Negotiable)

### Signal groups — pick ONE per app

- **Pointer mode**: `navigation` + `button`
- **Direction mode**: `nav_direction`
- **IMU+Biometric bundle**: `imu_acc` + `imu_gyro` + `snc` (always all three)

### Bundling rule — IMU+Biometric (CRITICAL)

`imu_acc`, `imu_gyro`, and `snc` are an **inseparable bundle**. If the
user wants any one of them, subscribe to **all three**. Never subscribe
to only one or two.

```js
// CORRECT — all three together
ws.send(JSON.stringify({ command: 'subscribe', signal: 'imu_acc' }));
ws.send(JSON.stringify({ command: 'subscribe', signal: 'imu_gyro' }));
ws.send(JSON.stringify({ command: 'subscribe', signal: 'snc' }));

// WRONG — partial subscriptions
ws.send(JSON.stringify({ command: 'subscribe', signal: 'snc' }));        // missing imu_acc + imu_gyro
ws.send(JSON.stringify({ command: 'subscribe', signal: 'imu_acc' }));    // missing imu_gyro + snc
```

### XOR rules (all non-negotiable)

1. **`gesture` ⊕ `pressure`** — pick one; never combine them.
2. **`navigation` ⊕ `nav_direction`** — pick one; never combine them.
3. **(`navigation` or `nav_direction`) ⊕ IMU+Biometric bundle** — directional
   motion signals cannot be combined with the IMU+Biometric bundle (`imu_acc`/`imu_gyro`/`snc`).

### Never combine

- `gesture` + `pressure`
- `navigation` + `nav_direction`
- `navigation` + `imu_acc` / `imu_gyro` / `snc`
- `nav_direction` + `imu_acc` / `imu_gyro` / `snc`
- `button` + `nav_direction`

### Free-combining signals

`button` combines freely with any group (subject to the
XOR rules above — `button` belongs to Pointer mode and never combines
with `nav_direction`).

When a conflict appears, explain the limitation and recommend one path.

## Sample Catalog

Select the best-matching sample before generating code.

| Mode | Sample |
|------|--------|
| **Pointer** | `preview/hands-free-desktop.html` |
| **Direction** | `preview/document-scroller.html` |
| **IMU** | `preview/model-rotator.html` |
| **Pressure (additive)** | `preview/pressure-painter.html` |

**Template**: `preview/mudra-ultimate-template.html` — baseline
webapp with connection handling, all signal handlers, fallback
controls, and telemetry HUD. Use as the default starting point
when no sample is a closer match.

**Selection rule**: Match by (1) motion mode, then (2) interaction
pattern (game, tool, dashboard), then (3) signal overlap. If
multiple samples match, prefer the simpler one.

## Build Defaults

- Default platform: webapp (single-file HTML)
- Always prefer interactive assets over static decoration
- Visible connection state indicator
- Visible mode label
- Compact telemetry HUD
- Simulation controls
- Keyboard fallback
- Responsive layout
- **Theme: infer from the app concept — NEVER default to dark.** Design a custom color palette that matches the concept. The sample code uses dark colors — **ignore them**. Only use dark if the user says "dark" or the concept is inherently dark (space, nightclub, etc.).
- **Gemini model pin** — if the app calls `https://generativelanguage.googleapis.com/v1beta/models/<id>:generateContent`, the captured `<id>` MUST equal `gemini-2.5-flash`. No preview / dated / `-latest` aliases (e.g. `gemini-2.5-flash-preview-09-2025`, `gemini-1.5-flash-latest`, `gemini-flash-latest`). Google retires preview aliases and the app then returns HTTP 404. Image-gen (`gemini-2.5-flash-image`) is the only exception, and only when image output is the app's purpose. If a different model is genuinely needed, ask the user first — never silently swap in a preview alias.

### Navigation sensitivity defaults (gentle / slow)

Navigation and movement default to **low sensitivity** so cursor/pan/scroll
motion stays calm and predictable. Use these baselines unless the prompt
explicitly asks for fast/snappy movement (racing, arcade-twitch, etc.).

| Surface | Default | Notes |
|---------|---------|-------|
| Keyboard arrow `step` (sim panel + fallback) | **`3`** | Was `9`; reduced for slower navigation. |
| Sim panel `↑` / `↓` / `←` / `→` button click | **`±3` per click** | Single delta event per click, magnitude 3. |
| Cursor / pan multiplier on inbound `navigation` deltas | **`0.002`** | Apply to `delta_x` / `delta_y` before adding to position. |
| Accumulator-based scrolling (`navAccX`, `navAccY`) | Multiply incoming delta by **`0.4`** before accumulating | Smooths out fast bursts. |
| `nav_direction` step (per discrete swipe) | **1 unit** | Always discrete — do not scale. |

Always express the multiplier as a named constant (`NAV_SENSITIVITY`,
`SCROLL_SENSITIVITY`, etc.) so the value is easy to find and tune.

```js
const NAV_SENSITIVITY = 0.002;   // gentle default; raise only on explicit request
function handleNavigation({ delta_x, delta_y }) {
  cursorX = clamp(cursorX + delta_x * NAV_SENSITIVITY, -1, 1);
  cursorY = clamp(cursorY + delta_y * NAV_SENSITIVITY, -1, 1);
}
```

---

## Simulator Panel — Required Button Set (v1.4.0)

Every generated app MUST include a **compact, always-visible simulator panel** with one button set per subscribed signal. The user must be able to trigger every signal with a click — so they can test without the band, or alongside it.

**Layout rules**

- One thin horizontal strip (usually in or just below the header, or pinned to the bottom edge).
- **Always visible** — do NOT hide when the band is connected. In Mudra mode the buttons are **disabled** (not hidden), so the user can still see what the app subscribes to.
- Group by signal. Use short labels so it stays compact (e.g., `Tap`, `2Tap`, `Twist`, `↑`, `↓`, `Roll L`).
- Reuse the existing `.btn` style from the chosen template.
- No drawers, no collapse, no accordion — one click to fire.

**Buttons per signal** (only render the groups for signals the app actually subscribes to)

| Signal | Buttons |
|---|---|
| `gesture` | `Tap`, `2Tap`, `Twist`, `2Twist` |
| `nav_direction` | `↑`, `↓`, `←`, `→`, `Roll L`, `Roll R` |
| `navigation` | `↑`, `↓`, `←`, `→` — each click emits **one** delta event with magnitude **`±3`** (matches keyboard `step = 3` and the Navigation sensitivity defaults table above). Never use larger magnitudes here unless the prompt explicitly asks for fast/snappy navigation. |
| `pressure` | Slider `0–100%` (or `−` / `+` buttons if horizontal space is tight) |
| `button` | `Press`, `Release` |
| `imu_acc` | `Tilt X`, `Tilt Y`, `Tilt Z` — each fires a **5-frame burst at ±2 m/s²** on the chosen axis |
| `imu_gyro` | `Rot X`, `Rot Y`, `Rot Z` — each fires a **5-frame burst at ±10 deg/s** on the chosen axis |
| `snc` | `Spike` — injects a burst of elevated samples on all 3 channels (ulnar, median, radial) |

**How each button must fire**

- `gesture` buttons → `ws.send(JSON.stringify({ command: 'trigger_gesture', data: { type: '<name>' } }))`. This works both when connected to the real band (round-trips through the service) and when the mock is active (mock echoes it back).
- **All other signals** → emit locally by calling the same handler `ws.onmessage` would dispatch. Example:
  ```js
  function simDir(direction) {
    // same path the real signal would take
    handleNavDirection({ direction, timestamp: Date.now() });
    hudDir.textContent = direction;
  }
  ```
  Always update the telemetry HUD from the sim button, same as the real signal would.

**Mirroring rule:** the simulator panel must mirror **whichever subset the app actually subscribes to** — do not render buttons for signals that are not wired. If the app drops `nav_direction` because the concept is gesture-only, drop the `↑ ↓ ← → Roll L Roll R` row too.

---

## Mode Toggle (Manual / Mudra) — Required

**This section supersedes the legacy "Mock WebSocket" pattern above for all
new apps.** Every preview generated by this skill MUST implement the Mode
Toggle exactly as specified here. Canonical protocol:
`references/agent_protocol.json` (v2.0).

### Summary

The user picks how the app is driven via a visible **Mode** control:

- **Manual** (default on load): the simulator panel is fully interactive.
  Sim-panel actions inject synthetic signal messages into the same handler
  pipeline that real WebSocket messages would flow through. **No WebSocket
  connection is opened in Manual mode.** The app's own user-facing UI
  (drum pads, play buttons, sliders, etc.) is **not** directly clickable —
  it reacts only to signal messages, synthetic or real.
- **Mudra**: the app opens one WebSocket to `ws://127.0.0.1:8766` and
  subscribes to its signals one-at-a-time. The simulator panel is
  visually disabled (greyed-out, `pointer-events: none`,
  `aria-disabled="true"`) and emits no synthetic signals. If the band
  disconnects, the connection-status pill turns red and reads
  "Disconnected" — **no separate overlay, toast, or banner is rendered
  (v1.4.0)**. The WebSocket retries with backoff until reconnect or the
  user switches back to Manual.

**The Mode toggle MUST remain fully clickable and keyboard-focusable at
all times** — including while the band is disconnected. The user must
always be able to switch back to Manual mode in one click without
dismissing anything. Manual is the default on first load.

### State machine

```text
type Mode = "manual" | "mudra"                          // default "manual"
type ConnectionState =
  | "idle"          // No socket open. Always the case in Manual.
  | "connecting"    // Socket opening, OR socket open but band-pairing not yet confirmed via get_status.
  | "connected"     // Socket open AND last get_status response had data.device.state === "connected".
  | "disconnected"  // Socket closed/errored, OR socket open but data.device.state !== "connected".
```

Lazy-WS lifecycle (mandatory):

| Transition | Action |
|------------|--------|
| page load | `mode = "manual"`, `connectionState = "idle"`, NO socket |
| Manual → Mudra | open new socket, set `connectionState = "connecting"` |
| Mudra → Manual | close socket, cancel any in-flight reconnect timer, set `connectionState = "idle"` |
| WS `open` (in Mudra) | send `{command:"get_status"}` immediately (no server-initiated frame to wait for), start status-poll timer, send all `subscribe` commands |
| inbound `status` where `device.firmware && device.serial_number` both non-null | `connectionState = "mudra-connected"`, show hand chip, update band-connected label |
| inbound `status` where firmware or serial_number null | `connectionState = "ws-only"` (orange), hand chip "None", keep socket open |
| inbound `error` with `data.error === "client_already_connected"` | show terminal "close other tab" message; set suppress-reconnect; do NOT retry |
| WS error / WS close (suppress flag NOT set) | `connectionState = "reconnecting"`, stop status-poll, schedule reconnect with backoff [1,2,5,10]s |
| WS close (suppress flag IS set) | do nothing — terminal in-use state |
| reconnect tick (in Mudra & socket dead) | open new socket → `connecting` |

**Single-socket guarantee** (FR-044, FR-047): never have two `WebSocket`
instances open at once. Use a connection token to neutralise rapid-toggle
races:

```js
let socket = null;
let connToken = 0;

function openSocket() {
  closeSocket();                              // ensure no leftover
  const myToken = ++connToken;
  setState("connecting");
  const ws = new WebSocket("ws://127.0.0.1:8766");
  ws.onopen = () => {
    if (myToken !== connToken) { ws.close(); return; }   // mode flipped
    socket = ws;
    // Stay in "connecting" — band-pairing not yet confirmed.
    SUBSCRIBED_SIGNALS.forEach(sig =>
      ws.send(JSON.stringify({ command: "subscribe", signal: sig }))
    );
    ws.send(JSON.stringify({ command: "get_status" }));   // first probe
    startStatusPoll();                                    // 2 s polling
  };
  ws.onmessage = (e) => onMessage(JSON.parse(e.data));
  ws.onclose = ws.onerror = () => {
    if (myToken !== connToken) return;
    socket = null;
    stopStatusPoll();
    setState("disconnected");
    scheduleReconnect();
  };
}

function closeSocket() {
  connToken++;                                // invalidate any in-flight open
  if (socket) { try { socket.close(); } catch (_) {} socket = null; }
  cancelReconnect();
}
```

### WebSocket protocol — frozen subset

Endpoint: `ws://127.0.0.1:8766` (bare URL, NO `/events` suffix).

Outbound:

```json
{ "command": "subscribe", "signal": "<signal_name>" }
```

- Parameter is **singular `signal`**. Not `signals`. Not an array.
- One command per signal. Subscribe N signals → send N messages.
- Re-issue ALL subscribes on every (re-)connect.

Inbound shape: `{ "type": "...", "data": { ... }, "timestamp": <ms> }`.
Handle types: `gesture`, `pressure`, `navigation`, `nav_direction`,
`button`, `imu_acc`, `imu_gyro`, `snc`, `status`, `error`.
`battery` is not a signal type. `connection_status` is not sent by the new server.
Anything else: log + ignore.

### Disconnect detection — band state via `get_status` polling (mandatory)

**The WebSocket handshake to `127.0.0.1:8766` only proves the Companion
service is up. It does NOT prove the user's Mudra Band is paired and
streaming.** The Companion service accepts socket connections happily
even when no band is bonded — so flipping the pill to "Connected" on
`ws.onopen` is wrong: the user sees green while the band is off their
wrist. The pill MUST reflect the band itself, not the socket.

The source of truth is the `status` response to `{command:"get_status"}`:

```json
> {"command":"get_status"}
< {"type":"status","data":{"device":{"state":"connected", ... }, ...}, "timestamp": ...}
< {"type":"status","data":{"device":{"state":"disconnected", ...}, ...}, "timestamp": ...}
```

Rules:

1. On `ws.onopen` (in Mudra mode):
   - Stay in `connectionState = "connecting"`.
   - Send `{command:"subscribe", signal:"<sig>"}` for every signal in `SUBSCRIBED_SIGNALS`.
   - Send `{command:"get_status"}` immediately.
   - Start a **status-poll timer**: send `{command:"get_status"}` every
     **2000 ms** while `mode === "mudra"` and the socket is `OPEN`.

2. On inbound `{type:"status"}` (in Mudra mode):
   - Band-connected rule: `data?.device?.firmware && data?.device?.serial_number` both truthy.
   - If band connected → `setState("mudra-connected")`, show hand chip from `data.device.hand`.
   - If band NOT connected → `setState("ws-only")` (orange). Keep the socket open. Do NOT
     call `closeSocket()`. Poll timer will pick the band up when it pairs.
   - On ws-only → mudra-connected transition: replay subscription record.

3. On inbound `{type:"error", data:{error:"client_already_connected"}}` (in Mudra mode):
   - Set suppress-reconnect flag. Show terminal: "Mudra Companion is already in use by
     another tab — please close it before continuing." Do NOT retry.
   - `connection_status` frame is NOT sent by the new Dart server. Remove all handlers for it.

4. On WebSocket `error` or `close` (in Mudra mode, suppress flag NOT set):
   - `setState("reconnecting")`, stop the status-poll timer,
     `scheduleReconnect()` with backoff [1000, 2000, 5000, 10000]ms.

5. On Manual mode:
   - Stop the status-poll timer in `closeSocket()` / on mode change. Clear suppress flag.

**Why poll instead of waiting for push events?** The new Dart server sends no
unsolicited `connection_status` frame and never did. Polling `get_status` is the only
reliable way to
detect a band that has gone away after a previously good pairing. 2 s
is fast enough to feel live and slow enough to be invisible in CPU /
network. Do not poll faster than 1 s; do not poll slower than 5 s.

**Important:** because `connected` now requires an affirmative
`device.state === "connected"`, the pill MAY sit on "Connecting…" for
up to one poll cycle (~2 s) after entering Mudra mode while the first
`status` round-trips. That is correct behaviour — do NOT shortcut by
flipping to "Connected" on `ws.onopen`.

### Reconnect backoff

While `mode === "mudra" && connectionState === "disconnected"`:

```js
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 5000, 5000];   // capped at 5s
let reconnectIndex = 0;
let reconnectTimer = null;

function scheduleReconnect() {
  if (mode !== "mudra") return;
  const delay = RECONNECT_DELAYS_MS[Math.min(reconnectIndex, RECONNECT_DELAYS_MS.length - 1)];
  reconnectIndex++;
  reconnectTimer = setTimeout(() => { if (mode === "mudra") openSocket(); }, delay);
}

function cancelReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  reconnectIndex = 0;     // reset on any successful close-from-mode-change
}
```

Reset `reconnectIndex` to 0 on every successful `connected` transition.

### Required UI elements

Every generated app MUST render these three elements at all times:

1. **Mode toggle** — labelled control with two visually distinct options:
   **Manual** and **Mudra**. Active option unambiguous without hover or
   click. `role="radiogroup"` with two `role="radio"` children;
   `aria-checked` reflects the active option. Keyboard focusable.
2. **Connection-status pill** (`role="status"`, `aria-live="polite"`):
   - In Manual: neutral label "Manual mode" — colour `var(--text-secondary)`.
   - In Mudra + `connecting`: "Connecting…" — colour `var(--warning)`.
   - In Mudra + `connected`: "Connected" — colour `var(--success)`.
   - In Mudra + `disconnected`: "Disconnected" — colour `var(--error)`.
   - Updates within 200 ms of any state change.
3. **Disconnect notice — REMOVED in v1.4.0.**
   - Do **NOT** render any "Band disconnected" overlay, toast, banner,
     modal, or inline alert. Disconnect state is communicated **only**
     through the connection-status pill above (which already turns red
     and reads "Disconnected").
   - No `#discNotice` element, no `.disc-notice` class, no
     "Connect your Mudra Band…" copy anywhere in the DOM.
   - The app's own user-facing UI MAY be visually muted (lowered
     opacity) when disconnected, but the only textual/visual disconnect
     indicator is the connection pill.

### Manual mode rules

- Simulator panel fully interactive (pointer + keyboard).
- Sim-panel actions emit synthetic messages by calling `dispatch()` —
  the SAME function that handles real WebSocket messages. They flow
  through the SAME signal handlers. Synthetic and real are
  indistinguishable inside the app:

  ```js
  function dispatch(msg) {
    switch (msg.type) {
      case "gesture":       handleGesture(msg.data); break;
      case "pressure":      handlePressure(msg.data); break;
      case "navigation":    handleNavigation(msg.data); break;
      case "nav_direction": handleNavDirection(msg.data); break;
      case "button":        handleButton(msg.data); break;
      case "imu_acc":       handleImuAcc(msg.data); break;
      case "imu_gyro":      handleImuGyro(msg.data); break;
      case "snc":           handleSnc(msg.data); break;
      // battery removed — not a subscribable signal. Read from status.data.device.battery.
      // connection_status removed — new server does not emit it.
      case "status":  handleStatus(msg.data); break;   // get_status response
      case "error":   handleError(msg.data); break;    // client_already_connected etc.
    }
  }

  // sim-panel "Tap" button (no confidence field — new server does not emit it):
  simTapBtn.onclick = () => dispatch({
    type: "gesture",
    data: { type: "tap", timestamp: Date.now() },
    timestamp: Date.now(),
  });
  ```

- The app's user-facing UI elements MUST NOT bind direct click/touch/keyboard
  handlers. Bind them to signal-handler state instead. **Before/after**:

  ```js
  // ❌ WRONG — direct click on the drum pad
  drumPad.onclick = () => playSound();

  // ✅ RIGHT — drum pad reacts to a gesture signal
  function handleGesture(data) {
    if (data.type === "tap") playSound();
  }
  ```

- No disconnect notice ever — disconnect is shown only by the
  connection-status pill (v1.4.0).

### Mudra mode rules

- Simulator panel visually disabled: `pointer-events: none`,
  `aria-disabled="true"`, `tabindex="-1"`, `opacity: 0.4`.
- Keyboard shortcuts that mirror the simulator panel are gated:

  ```js
  document.addEventListener("keydown", (e) => {
    if (mode === "mudra") return;          // gate
    if (e.code === "Space")    simTapBtn.click();
    if (e.code === "ArrowUp")  simUpBtn.click();
    // …
  });
  ```

- The app's user-facing UI reacts to inbound `dispatch()` calls driven
  by the WebSocket — same signal handlers either way.
- **Subject-click pass-through (allowed and encouraged in Mudra mode):**
  the app's primary interactive subject (the flower, the drum pad, the
  card, etc.) MAY accept direct clicks/taps in Mudra mode. When clicked,
  it MUST NOT short-circuit the signal handler locally. Instead, it
  emits a `trigger_gesture` command over the live WebSocket:
  ```js
  subject.addEventListener("click", () => {
    if (mode !== "mudra" || !socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({
      command: "trigger_gesture",
      data: { type: "tap" }       // or whichever gesture the subject represents
    }));
  });
  ```
  The Companion service round-trips this as a real `gesture` event,
  which flows through the same `dispatch()` → `handleGesture()` path
  as a band-emitted gesture. The visual reaction stays a function of
  the signal handler, never of the click itself.
  This is a **manual-test affordance** for users who don't have the
  band on. It is allowed only in Mudra mode (so the round-trip is real)
  and only when the socket is `OPEN`. In Manual mode the subject stays
  non-clickable — the simulator panel is the synthetic-injection path
  there.

### Continuous-state reset on every mode change

Discrete signals (`gesture`, `nav_direction`, `button`) are stateless and
need no reset.

Continuous signals MUST reset to neutral on every mode change in either
direction (Manual→Mudra and Mudra→Manual):

| Signal | Reset value |
|--------|-------------|
| `pressure` | `{ value: 0, normalized: 0.0 }` |
| `imu_acc`  | `[0, 0, 9.81]` (gravity at rest) |
| `imu_gyro` | `[0, 0, 0]` |
| `navigation` accumulated cursor | app-defined origin (e.g. canvas centre) |
| `snc` rolling buffers | cleared (`[[], [], []]`) |

Visual elements bound to these values MUST visibly snap to the reset
state within 200 ms of the mode change.

### `setMode(next)` — atomic side-effect order

On every mode toggle, run these steps in order, atomically:

1. Update `mode = next`.
2. Reset all continuous-signal state.
3. Re-render visuals bound to continuous state (snap within 200 ms).
4. If `next === "mudra"`: `openSocket()`.
   If `next === "manual"`: `closeSocket()`.
5. Update simulator-panel ARIA: `aria-disabled` on/off, `tabindex` 0 / -1.
6. Update connection-status pill.
7. (No disconnect-notice element exists — see v1.4.0 removal.)

### Reference scaffold

Use this scaffold in every generated app — adapt class names, content,
and keyboard shortcuts to the concept, but keep the structure and
side-effect ordering intact:

```html
<!-- Header strip: mode toggle + connection pill -->
<div class="topbar">
  <div class="mode-toggle" role="radiogroup" aria-label="Mode">
    <button id="modeManual" role="radio" aria-checked="true"  class="mode-opt active">Manual</button>
    <button id="modeMudra"  role="radio" aria-checked="false" class="mode-opt">Mudra</button>
  </div>
  <div id="connPill" class="conn-pill conn-manual" role="status" aria-live="polite">Manual mode</div>
</div>

<!-- App's own UI here. Pads/buttons/sliders bound to signal handlers, NOT click handlers. -->

<!-- Simulator panel — always visible, disabled in Mudra mode -->
<div id="simPanel" class="sim-panel">
  <button id="simTap">Tap</button>
  <!-- one button per subscribed signal — see existing simulator-panel rules -->
</div>

<!-- Disconnect notice REMOVED in v1.4.0 — connection-status pill is the only disconnect indicator. -->

```

```css
:root {
  --bg: #000; --card: #181e21; --primary: #77EAE9; --accent: #2dd4bf;
  --text: #f8fafc; --text-secondary: #94a3b8;
  --success: #22c55e; --warning: #eab308; --error: #ef4444;
}
.mode-toggle { display: inline-flex; gap: 4px; background: var(--card); padding: 4px; border-radius: 999px; }
.mode-opt { background: transparent; color: var(--text-secondary); border: none; padding: 6px 14px; border-radius: 999px; cursor: pointer; }
.mode-opt.active { background: var(--primary); color: #000; font-weight: 600; }

.conn-pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; }
.conn-manual       { background: transparent; color: var(--text-secondary); border: 1px solid var(--text-secondary); }
.conn-connecting   { background: var(--warning); color: #000; }
.conn-connected    { background: var(--success); color: #000; }
.conn-disconnected { background: var(--error);   color: #fff; }

.sim-panel.disabled { pointer-events: none; opacity: 0.4; }
.sim-panel.disabled button { cursor: not-allowed; }

/* Corner notice — pinned, never covers topbar / mode toggle / sim panel. */
.disc-notice { position: fixed; right: 16px; bottom: 16px; max-width: 280px;
               background: var(--card); color: var(--text);
               border: 1px solid var(--error); border-left: 4px solid var(--error);
               border-radius: 10px; padding: 10px 14px;
               box-shadow: 0 6px 20px rgba(0,0,0,0.25);
               display: flex; flex-direction: column; gap: 2px;
               font-size: 13px; z-index: 9999; pointer-events: none; }
.disc-notice strong { color: var(--error); font-size: 14px; }
.disc-notice span   { color: var(--text-secondary); }
```

```javascript
// ── State ─────────────────────────────────────────────────────────────────
const SUBSCRIBED_SIGNALS = ["gesture", "pressure"];   // adapt per app
let mode = "manual";
let connectionState = "idle";
let socket = null;
let connToken = 0;
let reconnectTimer = null;
let reconnectIndex = 0;
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 5000, 5000];

// ── Signal dispatch (single entry point for synthetic AND real) ──────────
let suppressReconnect = false;
function dispatch(msg) {
  // connection_status removed — new server does not emit it
  if (msg.type === "status") return handleStatus(msg.data);
  if (msg.type === "error" && msg.data?.error === "client_already_connected") {
    suppressReconnect = true;
    setState("in-use"); // terminal — show "close other tab" message
    return;
  }
  // …route to per-signal handlers (adapt to app needs)
}
function handleStatus(data) {
  if (mode !== "mudra") return;
  const dev = data?.device || {};
  const bandConnected = Boolean(dev.firmware && dev.serial_number);
  if (bandConnected) setState("mudra-connected", dev.hand || "?");
  else               setState("ws-only"); // socket stays open; poll keeps probing
}
function handleConnectionStatus(data) {
  if (mode !== "mudra") return;
  // Hint only — confirm via get_status.
  if (data?.status === "disconnected") setState("disconnected");
  if (data?.status === "connected" && socket?.readyState === 1) {
    socket.send(JSON.stringify({ command: "get_status" }));
  }
}

// ── Band-state polling (mandatory) ───────────────────────────────────────
let statusPollTimer = null;
const STATUS_POLL_MS = 2000;
function startStatusPoll() {
  stopStatusPoll();
  statusPollTimer = setInterval(() => {
    if (mode !== "mudra" || !socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ command: "get_status" }));
  }, STATUS_POLL_MS);
}
function stopStatusPoll() {
  if (statusPollTimer) { clearInterval(statusPollTimer); statusPollTimer = null; }
}

// ── Continuous-state reset ───────────────────────────────────────────────
function resetContinuousState() {
  // adapt per app
  // pressure, imu, cursor, snc buffers → neutral
}

// ── Mode change ──────────────────────────────────────────────────────────
function setMode(next) {
  if (next === mode) return;
  mode = next;
  resetContinuousState();
  rerenderContinuousVisuals();
  if (mode === "mudra") openSocket(); else closeSocket();
  document.getElementById("simPanel").classList.toggle("disabled", mode === "mudra");
  document.querySelectorAll("#simPanel button").forEach(b => {
    b.setAttribute("aria-disabled", mode === "mudra" ? "true" : "false");
    b.tabIndex = mode === "mudra" ? -1 : 0;
  });
  document.getElementById("modeManual").setAttribute("aria-checked", mode === "manual");
  document.getElementById("modeMudra").setAttribute("aria-checked",  mode === "mudra");
  document.getElementById("modeManual").classList.toggle("active", mode === "manual");
  document.getElementById("modeMudra").classList.toggle("active",  mode === "mudra");
  setState(mode === "manual" ? "idle" : "connecting");
  if (mode === "manual") hideBanner();
}

// ── Connection state UI ──────────────────────────────────────────────────
function setState(next) {
  connectionState = next;
  const pill = document.getElementById("connPill");
  pill.classList.remove("conn-manual", "conn-connecting", "conn-connected", "conn-disconnected");
  if (mode === "manual")          { pill.classList.add("conn-manual");       pill.textContent = "Manual mode"; hideBanner(); return; }
  if (next === "connecting")      { pill.classList.add("conn-connecting");   pill.textContent = "Connecting…";  hideBanner(); }
  else if (next === "connected")  { pill.classList.add("conn-connected");    pill.textContent = "Connected";    hideBanner(); reconnectIndex = 0; }
  else if (next === "disconnected"){ pill.classList.add("conn-disconnected"); pill.textContent = "Disconnected"; showBanner(); }
}
function showBanner() { if (mode === "mudra") document.getElementById("discNotice").hidden = false; }
function hideBanner() { document.getElementById("discNotice").hidden = true; }

// ── Socket lifecycle (lazy: open only in Mudra) ──────────────────────────
function openSocket() { /* see "Single-socket guarantee" snippet above */ }
function closeSocket() { connToken++; if (socket) { try { socket.close(); } catch(_) {} socket = null; } cancelReconnect(); stopStatusPoll(); }
function scheduleReconnect() { /* see "Reconnect backoff" snippet above */ }
function cancelReconnect()   { if (reconnectTimer) clearTimeout(reconnectTimer); reconnectTimer = null; }

// ── Wire up ──────────────────────────────────────────────────────────────
document.getElementById("modeManual").onclick = () => setMode("manual");
document.getElementById("modeMudra").onclick  = () => setMode("mudra");
// Sim-panel buttons emit via dispatch() — see "Manual mode rules" example.
// Keyboard shortcuts: gate with `if (mode === "mudra") return;`.
```

### Banned patterns (will fail review)

| Pattern | Why banned |
|---------|-----------|
| `new WebSocket("ws://127.0.0.1:8766/events")` | The `/events` suffix is not in the contract. |
| `{command: "subscribe", signals: [...]}` | Plural key. Always singular `signal`. |
| `{command: "subscribe", signal: ["a","b"]}` | Array value. One command per signal. |
| Two live `new WebSocket(...)` calls without closing the first | Single-socket guarantee (FR-044). |
| `setInterval(() => ws.send(...))` heartbeats | Companion app does not require client pings. |
| Subscribing once and not re-subscribing after a reconnect | Subscriptions are per-socket; reconnect re-issues them. |
| Manual mode that opens any WebSocket | Lazy lifecycle (FR-046). Manual = no socket. |
| In **Manual** mode, the app's own UI accepts direct clicks that bypass the signal handler | Manual mode is signal-driven only — the sim panel is the synthetic-injection path. (Subject-click pass-through via `trigger_gesture` is allowed in **Mudra** mode and only when the socket is OPEN.) |
| Waiting for any server-initiated frame before subscribing or updating UI | The new Dart server sends NO unsolicited frames on connect. Send `get_status` immediately in `ws.onopen`. |
| Subscribing to `battery` signal | `battery` is not a subscribable signal. Read `device.battery`/`device.charging` from `get_status` response. |
| Sending `enable`, `disable`, `get_docs`, `help`, or `auth` commands | These do not exist in the new server. Server returns `unknown_command`. |
| Reading `msg.data.confidence` from gesture frames | The new server does not emit `confidence`. Threshold checks silently fail. |
| Retrying after `client_already_connected` error | Terminal state — show "close other tab" message. Do NOT retry. |
| Any "Band disconnected" overlay, toast, banner, or modal | v1.4.0: removed. Disconnect is shown only by the connection-status pill. |
| Mode toggle made non-interactive (`disabled`, `inert`, `pointer-events: none`) while disconnected | Toggle stays clickable in every state — disconnected included. |
| Default mode anything other than Manual on first load | Manual is the default. Mudra is opt-in. |
| Auto-firing `setInterval(...)` in a "mock" that fires gestures/pressure | Mock must be passive — sim panel is the ONLY synthetic source. |
| `MudraWebSocket` wrapper class | Superseded — use the lazy `openSocket()` / `closeSocket()` pair. |

### Motion-mode rule (constitution III) — repeated for emphasis

Pick exactly ONE motion mode per app: **Pointer** (`navigation` + `button`)
**XOR** **Direction** (`nav_direction`) **XOR** **IMU+Biometric**
(`imu_acc` + `imu_gyro` + `snc`, always all three together). The Mode
toggle does NOT relax this rule. Additional XOR rules: `gesture` and
`pressure` are mutually exclusive — never combine them. `button` and
`battery` combine freely (subject to the Pointer/Direction/IMU XOR).

---

## Onboarding Modal (STRICT)

Every generated app MUST ship a first-run onboarding modal that greets the
user and lists every action the app supports, with paired **Mudra** and
**Manual** controls per action. The modal closes via `×` (skip), the
**Continue** button, or `Escape`. It re-opens via a small floating `?` icon
bottom-right.

The block below (HTML + CSS + JS) is **locked** — paste it **verbatim**.
The ONLY per-app variation is:

1. **The `MUDRA_ONBOARDING_ACTIONS` constant** (one row per *subscribed*
   signal — no orphan rows, no unused-signal rows).
2. **`data-app-name="..."`** on `#mudra-onboarding`.
3. **`{APP_NAME_HEAD}` + `<em>{APP_NAME_TAIL}</em>`** inside `.ob-brand-name`
   (split the app name into a leading word + trailing word; the tail is
   accent-colored). Single-word names: head = whole name, `<em></em>` empty.
4. **`{APP_TAGLINE}`** inside `.ob-tagline` — one sentence, ends in a period,
   ≤ 90 chars.

Everything else (class names, attributes, CSS rules, JS wiring) is fixed.

### ⚠ Critical regression guards (will FAIL review)

- ❌ **No `open` attribute on the `<dialog>`**. The IIFE calls `showModal()`
  on load so the dialog enters the browser's top layer. Without that, an
  underlying canvas/iframe can intercept clicks on `× / Continue`.
- ❌ **Missing `#mudra-onboarding:not([open]) { display: none }` CSS rule.**
  The custom `#mudra-onboarding { display: grid }` has ID-level specificity
  (0,1,0,0) and overrides the browser's built-in `dialog:not([open]) { display: none }`
  (specificity 0,0,1,1). Without the explicit `:not([open])` rule, the
  modal closes in the DOM (`dialog.open === false`) but stays painted on
  screen — `× / Continue / Escape` all *look* broken even though the JS
  fires. **Do not reintroduce — this CSS rule is load-bearing.**
- ❌ Renaming `Continue` to `Got it`, `Done`, `OK`, `Start`, `Let's go`. The
  CTA label is exactly `Continue`.
- ❌ Wiring `closeOb` to a button that lacks `data-ob-close`. The single
  `root.querySelectorAll('[data-ob-close]')` line is the entire close wiring.
- ❌ Adding click-outside-to-close, time-out auto-close, or any close path
  beyond the four documented ones (Continue, X, Escape, `xrsession-start`).

### Required palette addition

Define one extra CSS variable on `:root` alongside the canonical palette:

```css
--on-primary: #0c0d10;
```

This is the text color on top of `--primary` (used by the Continue button).
Apps with a non-dark `--bg` may override `--on-primary` for contrast.

### Locked HTML — paste verbatim (replace only `{APP_NAME}`, `{APP_NAME_HEAD}`, `{APP_NAME_TAIL}`, `{APP_TAGLINE}`)

```html
<!-- === BEGIN onboarding-block === (Template 3 — Split Card) -->
<!-- IMPORTANT: do NOT add the `open` attribute. The IIFE below calls
     showModal() on load so the dialog enters the top layer. -->
<dialog id="mudra-onboarding" data-mudra-onboarding data-app-name="{APP_NAME}">
  <div class="ob-card">
    <button class="ob-x" aria-label="Skip onboarding" data-ob-close>×</button>
    <div class="ob-left">
      <div class="ob-brand-block">
        <span class="ob-brand-mark">Mudra Studio</span>
        <h2 class="ob-brand-name">{APP_NAME_HEAD} <em>{APP_NAME_TAIL}</em></h2>
        <p class="ob-tagline">{APP_TAGLINE}</p>
      </div>
    </div>
    <div class="ob-right">
      <h3 class="ob-section-title">How to use this app</h3>
      <div class="ob-chip-grid" id="ob-rows"></div>
      <div class="ob-continue-row"><button class="ob-continue" data-ob-close>Continue</button></div>
    </div>
  </div>
</dialog>
<button id="mudra-onboarding-help" class="ob-help-btn" aria-label="Reopen onboarding" hidden>?</button>
<!-- === END onboarding-block === -->
```

### Locked CSS — paste verbatim inside `<style>`

```css
/* === BEGIN onboarding-block === (Template 3 — Split Card) */
#mudra-onboarding{
  position:fixed;inset:0;border:0;padding:0;background:transparent;
  width:100%;height:100%;max-width:none;max-height:none;
  display:grid;place-items:center;z-index:100;color:var(--text);
}
#mudra-onboarding::backdrop{background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);}
#mudra-onboarding[hidden],#mudra-onboarding:not([open]){display:none;}
.ob-card{
  position:relative;background:var(--card);backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,0.08);border-radius:18px;
  width:min(720px,94vw);max-height:88vh;overflow:auto;
  display:grid;grid-template-columns:1fr 1fr;gap:0;
  box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:'Poppins',system-ui,sans-serif;
}
.ob-x{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;appearance:none;border:0;background:rgba(255,255,255,0.08);color:var(--text);font-size:18px;cursor:pointer;z-index:2;}
.ob-x:hover{background:rgba(255,255,255,0.16);}
.ob-left{
  padding:36px 28px;
  background:linear-gradient(135deg,rgba(108,140,255,0.16),rgba(185,124,255,0.12));
  border-right:1px solid rgba(255,255,255,0.06);
  display:flex;flex-direction:column;justify-content:space-between;
  border-radius:18px 0 0 18px;
}
.ob-brand-block{display:flex;flex-direction:column;gap:14px;}
.ob-brand-mark{display:flex;align-items:center;gap:10px;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:var(--text-secondary);}
.ob-brand-mark::before{content:"";display:inline-block;width:24px;height:2px;background:var(--primary);}
.ob-brand-name{font-size:34px;font-weight:700;line-height:1.05;margin:0;}
.ob-brand-name em{font-style:normal;color:var(--accent);}
.ob-tagline{color:var(--text-secondary);font-size:15px;margin:6px 0 0;line-height:1.5;}
.ob-brand-footer{font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-secondary);}
.ob-right{padding:32px 28px 24px;display:flex;flex-direction:column;}
.ob-section-title{font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-secondary);margin:0 0 14px;}
.ob-chip-grid{display:grid;grid-template-columns:1fr;gap:8px;flex:1;}
.ob-chip{
  display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.05);
  border-radius:10px;padding:10px 12px;font-size:14px;
}
.ob-chip .nm{font-weight:500;}
.ob-chip .mu{font-size:12px;padding:3px 9px;border-radius:999px;background:rgba(108,140,255,0.2);color:var(--primary);font-weight:600;}
.ob-chip .mn{font-size:12px;color:var(--text-secondary);}
.ob-continue-row{display:flex;justify-content:flex-end;margin-top:18px;}
.ob-continue{appearance:none;border:0;background:var(--primary);color:var(--on-primary);font:inherit;font-weight:600;padding:10px 22px;border-radius:10px;cursor:pointer;}
.ob-continue:hover{filter:brightness(1.1);}
.ob-help-btn{position:fixed;bottom:16px;right:16px;appearance:none;border:0;width:36px;height:36px;border-radius:50%;background:var(--card);color:var(--text);font-size:18px;cursor:pointer;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);z-index:50;}
@media (max-width:640px){
  .ob-card{grid-template-columns:1fr;}
  .ob-left{border-right:0;border-bottom:1px solid rgba(255,255,255,0.06);border-radius:18px 18px 0 0;padding:24px;}
  .ob-brand-name{font-size:24px;}
  .ob-right{padding:20px;}
  .ob-continue{width:100%;}
  .ob-continue-row{justify-content:stretch;}
}
/* === END onboarding-block === */
```

### Locked JS — paste verbatim inside an inline `<script>` at end of `<body>`

```js
// === BEGIN onboarding-block === (Template 3 — Split Card)
window.MUDRA_ONBOARDING_ACTIONS = [
  // Filled by the Gem from the app's subscribed signals. See "Actions array
  // shape" below. One row per subscribed signal — no orphan rows.
];

(function () {
  const root = document.getElementById('mudra-onboarding');
  const help = document.getElementById('mudra-onboarding-help');
  const grid = document.getElementById('ob-rows');

  grid.innerHTML = window.MUDRA_ONBOARDING_ACTIONS.map(r => `
    <div class="ob-chip">
      <span class="nm">${r.action}</span>
      <span class="mu">${r.mudra}</span>
      <span class="mn">${r.manual}</span>
    </div>`).join('');

  function isInImmersiveXR() {
    // 2D apps never have window.xb; always returns false here.
    return !!(window.xb && window.xb.session && window.xb.session.isImmersive);
  }
  function openOb()  { if (!root.open) root.showModal(); help.hidden = true; }
  function closeOb() { if (root.open)  root.close();    help.hidden = false; }

  // Close wiring — BOTH `.ob-x` and `.ob-continue` carry [data-ob-close].
  // This single querySelectorAll attaches the same `closeOb` to each;
  // do not add separate listeners or split the behavior.
  root.querySelectorAll('[data-ob-close]').forEach(b => b.addEventListener('click', closeOb));

  // Re-open wiring — floating help-pill (mouse/touch) and the `?` key.
  help.addEventListener('click', openOb);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.open) closeOb();
    if (e.key === '?' && !root.open && !isInImmersiveXR()) openOb();
  });

  // Open on load — UNCONDITIONAL showModal(). The dialog enters the
  // top layer so child-button clicks are never intercepted. Do not
  // gate this on `root.open`; do not use `root.show()`.
  root.showModal();
})();
// === END onboarding-block ===
```

### Close behavior — what each control does

| Control | Trigger | Effect |
|---|---|---|
| **Continue** (`.ob-continue`) | mouse / touch / keyboard | `root.close()` + help-pill becomes visible |
| **× button** (`.ob-x`) | mouse / touch / keyboard | `root.close()` + help-pill becomes visible (same as Continue) |
| **Escape** | while modal open | native `<dialog>` close + handler unhides help-pill |
| **`?` key** | while modal closed | `root.showModal()` reopens |
| **Help-pill** (`#mudra-onboarding-help`) | mouse / touch | `root.showModal()` reopens |
| **Page load** | every fresh load | `root.showModal()` runs unconditionally |

### Actions array shape (`MUDRA_ONBOARDING_ACTIONS`)

```js
window.MUDRA_ONBOARDING_ACTIONS = [
  { action: "Toggle machine on / off", mudra: "Tap",                manual: "Space",   mode: "gesture"       },
  { action: "Switch machine",          mudra: "Swipe Left / Right", manual: "← / →",   mode: "nav_direction" },
  { action: "Adjust level",            mudra: "Swipe Up / Down",    manual: "↑ / ↓",   mode: "nav_direction" }
];
```

Each row:
- **`action`** (required, string) — behavior in plain English ("Trigger sample", "Switch machine"). NOT the control name.
- **`mudra`** (required, string) — human-readable Mudra trigger ("Tap", "Double Tap", "Swipe Left / Right", "Roll Left / Right", "Lift wrist"). The canonical signal name is in `mode` below.
- **`manual`** (required, string) — keyboard / mouse fallback exactly as wired in this app ("Space", "← / →", "Z / X").
- **`mode`** (required, string) — the canonical signal name driving this row. One of: `gesture`, `button`, `pressure`, `navigation`, `nav_direction`, `imu_acc`, `imu_gyro`, `snc`, `battery`. Used by the Gem to filter rows to *subscribed* signals only.

### App-aware filter — STRICT

`MUDRA_ONBOARDING_ACTIONS` MUST contain exactly one row per signal this app subscribes to. Drop rows whose `mode` is not in the app's signal subscription set. **No orphan rows. No unused-signal rows.** Two example apps that subscribe to different signals MUST have different action arrays.

### Verification checklist — run before emitting

- [ ] `<dialog id="mudra-onboarding"` appears exactly once.
- [ ] The `<dialog>` has **no** `open` attribute (open path is `root.showModal()`).
- [ ] The markers `=== BEGIN onboarding-block === (Template 3 — Split Card)` appear in `<style>`, in `<script>`, and in the HTML comments around the dialog (three sites).
- [ ] CSS contains the exact rule `#mudra-onboarding[hidden],#mudra-onboarding:not([open]){display:none;}` (regression guard).
- [ ] CSS contains `--on-primary` on `:root`.
- [ ] The button labels are exactly `×` and `Continue` (NOT `Got it`).
- [ ] JS contains the exact line `root.querySelectorAll('[data-ob-close]').forEach(b => b.addEventListener('click', closeOb));`.
- [ ] `MUDRA_ONBOARDING_ACTIONS` contains one row per subscribed signal — no orphans, no missing rows.
- [ ] `#mudra-onboarding-help` button exists and starts `hidden`.

If any check fails, regenerate the block from the locked copies above; do not patch the broken one.

The locked HTML/CSS/JS above and the verification checklist are the binding source of truth for this block. If anything here is ambiguous, prefer the locked copies.

---

## Onboarding Modal (legacy — SUPERSEDED)

> **⚠ SUPERSEDED as of v2.2.0 (2026-05-14)** — emit the **split-card**
> above, not this block. This section is preserved for
> migration reference only. Do NOT use the `.mudra-onb__*` class names, the
> `Got it` CTA label, or the `ACTIONS` constant in new apps.

Every generated app MUST ship a first-run onboarding modal that greets the
user, lists every action the app supports, and shows two control hints per
action: the **Mudra** trigger (canonical signal) and the **Manual** trigger
(keyboard / mouse). The modal closes via `×`, the **Got it** button, or
`Escape`, and reopens via a small floating `?` icon.

The modal block (markup + CSS + JS) is **fixed** — copy it **verbatim** from
the canonical baseline reproduced in full below (§ "Canonical onboarding-modal
block — paste verbatim"). The ONLY parts you may change per generated app are:

1. **The `ACTIONS` constant** inside the modal's inline `<script>` IIFE.
   Populate one row per user-triggerable action this app actually implements.
2. **Optionally** the `data-app-name="..."` attribute on `#mudra-onboarding`
   when the filename derivation would mis-capitalize an acronym (e.g.,
   `data-app-name="AR Menu"` for `ar-menu.html`).

**Nothing else in the block may differ** — same markup, same class names,
same CSS, same dismiss/reopen wiring. Two generated apps must be byte-
identical inside the modal block aside from `ACTIONS` and `data-app-name`.

### ⚠ Why this block is fixed — common bugs in hand-rolled modals (will FAIL review)

Do **not** hand-roll the modal. The canonical block uses the native HTML
`<dialog>` element with `showModal()` / `close()`. Every hand-rolled
alternative has bitten us in production. Specifically:

- ❌ **Plain `<div id="mudra-onboarding">` styled with `display: grid` + toggling `el.hidden`** — the `[hidden]` attribute applies `display: none` via the user-agent stylesheet, but an `#id` selector with `display: grid` has higher specificity, so `el.hidden = true` has **no visual effect**. The modal looks stuck. **This is the #1 reason `× / Got it / Escape` appear "broken" — they fire, but CSS overrides the hide.** If you must use a `<div>` for some reason, you MUST gate it with a class like `.mudra-onb--hidden { display: none !important; }` and toggle the class — never the `hidden` attribute alone.
- ❌ **Custom backdrop `<div>` over the page** — use `<dialog>::backdrop` instead. Native backdrop blocks page interaction for free; a custom backdrop needs manual click-outside-to-close wiring that often regresses.
- ❌ **No `Escape` keybinding** — `<dialog>` handles Escape natively. A `<div>`-based modal must add `e.key === "Escape"` to the global keydown handler, and most hand-rolled outputs forget.
- ❌ **`onclick="toggleOnboarding()"` inline handlers** — the canonical block uses `addEventListener` inside an IIFE. Inline handlers leak globals and break under strict CSP.
- ❌ **Toggling `display: none` directly via JS** — fragile; use `dialog.showModal()` / `dialog.close()`.

If your generated output does not contain `<dialog id="mudra-onboarding"`,
`dialog.showModal()`, and `dialog.close()`, you wrote the wrong block. Stop
and paste the canonical one below.

### Canonical onboarding-modal block — paste verbatim

The three parts below MUST appear in the generated app exactly as written,
with **only** the `ACTIONS` array and (optionally) `data-app-name` changed.
Do not rename classes, do not strip the SVG, do not "modernize" the
`<dialog>` to a `<div>`, do not move the script out of an IIFE.

**Part 1 — CSS (place inside the app's `<style>` block):**

```css
/* === Onboarding modal (legacy) ================================== */
.mudra-onb {
  /* Force-center the dialog. Required: page CSS or framework resets can
     override the user-agent dialog defaults and pin the modal to the
     top-left corner. These four lines keep it centered everywhere. */
  position: fixed;
  inset: 0;
  margin: auto;
  /* ---- visual ---- */
  border: none;
  padding: 0;
  border-radius: 14px;
  width: min(560px, 92vw);
  max-height: min(82vh, 720px);
  background: #fff;
  color: #111;
  font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
  box-shadow: 0 30px 80px rgba(0, 0, 0, .35);
  overflow: hidden;
}
.mudra-onb::backdrop { background: rgba(0, 0, 0, .55); }
.mudra-onb__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px 8px;
}
.mudra-onb__brand { display: inline-flex; align-items: center; gap: 8px; }
.mudra-onb__logo { display: block; width: 28px; height: 28px; flex: none; }
.mudra-onb__wordmark {
  font-size: 12px; font-weight: 700; letter-spacing: .22em;
  color: #0d9488; text-transform: uppercase;
}
.mudra-onb__title {
  margin: 0; padding: 0 22px 14px;
  font-size: 1.1rem; font-weight: 700;
}
.mudra-onb__close {
  display: inline-flex; align-items: center; justify-content: center;
  border: none; background: #1a1a1a; color: #fff;
  width: 32px; height: 32px; border-radius: 50%;
  font-size: 22px; line-height: 1; padding: 0; cursor: pointer;
}
.mudra-onb__body { padding: 4px 22px 8px; max-height: 56vh; overflow-y: auto; }
.mudra-onb__lede { margin: 0 0 12px; color: #555; }
.mudra-onb__actions { width: 100%; border-collapse: collapse; }
.mudra-onb__actions th, .mudra-onb__actions td {
  text-align: left; padding: 8px 6px; border-bottom: 1px solid #eee; vertical-align: top;
}
.mudra-onb__actions th { font-size: 12px; text-transform: uppercase; color: #777; letter-spacing: .04em; }
.mudra-onb__actions td:nth-child(2) { color: #1a73e8; font-weight: 600; }
.mudra-onb__actions td:nth-child(3) { color: #444; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
.mudra-onb__foot { padding: 14px 22px 20px; text-align: right; }
.mudra-onb__continue {
  border: none; background: #1a1a1a; color: #fff;
  padding: 9px 18px; border-radius: 999px; font-weight: 600; cursor: pointer;
}
.mudra-onb__reopen {
  position: fixed; right: 16px; bottom: 16px; z-index: 9999;
  width: 36px; height: 36px; border-radius: 50%;
  border: none; background: #1a1a1a; color: #fff;
  font-size: 18px; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, .25);
}
.mudra-onb--hidden, .mudra-onb__reopen--hidden { display: none !important; }
```

**Part 2 — HTML (place just before the closing `</body>` tag):**

```html
<!-- ============================================================== -->
<!--  Onboarding modal (legacy)                                      -->
<!--  DO NOT modify this block. Per-app variation lives only in      -->
<!--  the ACTIONS constant below and (optionally) the data-app-name  -->
<!--  attribute on #mudra-onboarding.                                -->
<!-- ============================================================== -->
<dialog id="mudra-onboarding" class="mudra-onb" data-app-name="">
  <header class="mudra-onb__head">
    <div class="mudra-onb__brand">
      <svg class="mudra-onb__logo" viewBox="0 0 32 32" aria-hidden="true">
        <ellipse cx="16" cy="16" rx="13" ry="9" fill="none" stroke="#0d9488" stroke-width="2"/>
        <circle cx="11" cy="16" r="1.6" fill="#14b8a6"/>
        <circle cx="16" cy="16" r="1.6" fill="#14b8a6"/>
        <circle cx="21" cy="16" r="1.6" fill="#14b8a6"/>
      </svg>
      <span class="mudra-onb__wordmark">MUDRA</span>
    </div>
    <button type="button" class="mudra-onb__close" aria-label="Close">×</button>
  </header>
  <h2 class="mudra-onb__title">Welcome to <span class="mudra-onb__name"></span></h2>
  <section class="mudra-onb__body">
    <p class="mudra-onb__lede">Use the Mudra Band — or your keyboard — to control this app.</p>
    <table class="mudra-onb__actions">
      <thead><tr><th>Action</th><th>Mudra</th><th>Manual</th></tr></thead>
      <tbody></tbody>
    </table>
  </section>
  <footer class="mudra-onb__foot">
    <button type="button" class="mudra-onb__continue">Got it</button>
  </footer>
</dialog>
<button type="button" id="mudra-onboarding-help" class="mudra-onb__reopen" aria-label="Show controls">?</button>
```

**Part 3 — JavaScript IIFE (place inside a `<script>` tag near the end of `<body>`, AFTER the HTML above):**

```html
<script>
  /* === Onboarding modal (legacy) ================================== */
  (() => {
    // ACTIONS — the ONLY per-app variation in this block.
    // Replace this array with the generated app's actual actions.
    // See § "ACTIONS shape" below for schema and invariants.
    const ACTIONS = [
      { label: "Tap to interact",  mudra: "gesture: pinch",         manual: "Space" },
      { label: "Hold to select",   mudra: "button: hold",           manual: "Shift" },
      { label: "Adjust pressure",  mudra: "pressure (thumb-index)", manual: "[ / ]" },
      { label: "Move pointer",     mudra: "navigation: cursor",     manual: "Arrow keys" },
    ];

    const dialog = document.getElementById("mudra-onboarding");
    const reopen = document.getElementById("mudra-onboarding-help");
    if (!dialog || !reopen) return;

    // 1. Resolve title (data-app-name override → filename derivation → fallback).
    const nameEl = dialog.querySelector(".mudra-onb__name");
    const override = dialog.dataset.appName && dialog.dataset.appName.trim();
    if (override) {
      nameEl.textContent = override;
    } else {
      const base = (location.pathname.split("/").pop() || "").replace(/\.html?$/i, "");
      const pretty = base.replace(/[-_]+/g, " ").trim()
        .split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "").join(" ");
      nameEl.textContent = pretty || "Mudra App";
    }

    // 2. Populate action rows.
    const tbody = dialog.querySelector(".mudra-onb__actions tbody");
    ACTIONS.forEach(a => {
      if (a.mudra == null && a.manual == null) return; // defensive
      const tr = document.createElement("tr");
      const td = (text) => { const c = document.createElement("td"); c.textContent = text; return c; };
      tr.appendChild(td(a.label));
      tr.appendChild(td(a.mudra == null ? "—" : a.mudra));
      tr.appendChild(td(a.manual == null ? "—" : a.manual));
      tbody.appendChild(tr);
    });

    // 3. Wire dismiss + reopen. Native <dialog> handles Escape automatically.
    const close = () => dialog.close();
    dialog.querySelector(".mudra-onb__close").addEventListener("click", close);
    dialog.querySelector(".mudra-onb__continue").addEventListener("click", close);
    reopen.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });

    // 4. Auto-open on first paint.
    requestAnimationFrame(() => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });

    // 5. Hide in immersive XR (mudra-xr only — no-op for 2D apps).
    const setHidden = (h) => {
      dialog.classList.toggle("mudra-onb--hidden", h);
      reopen.classList.toggle("mudra-onb__reopen--hidden", h);
      if (h && dialog.open) dialog.close();
    };
    ["xrsession-start", "vr-session-start", "ar-session-start"].forEach(ev =>
      window.addEventListener(ev, () => setHidden(true)));
    ["xrsession-end", "vr-session-end", "ar-session-end"].forEach(ev =>
      window.addEventListener(ev, () => setHidden(false)));
  })();
</script>
```

### Verification checklist — run before emitting the final app

Before returning generated HTML, scan the output and confirm ALL of these:

- [ ] The string `<dialog id="mudra-onboarding"` appears exactly once.
- [ ] The string `dialog.showModal()` appears at least once.
- [ ] The string `dialog.close()` appears at least once.
- [ ] The reopen button `#mudra-onboarding-help` exists.
- [ ] `.mudra-onb__close` and `.mudra-onb__continue` are wired via `addEventListener("click", close)` — not inline `onclick=`.
- [ ] The CSS contains `.mudra-onb::backdrop` and `.mudra-onb--hidden { display: none !important; }`.
- [ ] `.mudra-onb` includes `position: fixed; inset: 0; margin: auto;` — without these the dialog drifts to the top-left corner on pages that override UA dialog defaults.
- [ ] No `el.hidden = ...` or `display: none` toggling on `#mudra-onboarding` anywhere — dismiss/reopen goes through `dialog.close()` / `dialog.showModal()`.
- [ ] No `onclick="toggleOnboarding()"` inline handlers in the generated HTML.
- [ ] The `ACTIONS` array reflects the actual signals + keyboard shortcuts the app wires up (no orphans, no missing rows).

If any check fails, the modal will appear stuck. Regenerate the block from
the canonical Parts 1–3 above; do not patch the broken one.

### `ACTIONS` shape

```js
const ACTIONS = [
  { label: "Trigger pad",      mudra: "gesture: pinch",         manual: "Space" },
  { label: "Adjust volume",    mudra: "pressure (thumb-index)", manual: "[ / ]" },
  { label: "Cycle pad bank",   mudra: "gesture: thumb-tap",     manual: "Tab" },
];
```

Each entry has three fields:

- **`label`** (required, string) — the **behavior** in plain English ("Trigger
  pad", "Move pointer", "Pause game"). NOT the control name. "Pinch" is not a
  label — "Trigger sample" is.
- **`mudra`** (string OR `null`) — the canonical Mudra trigger. Must begin
  with one of the nine canonical signal names: `gesture`, `button`,
  `pressure`, `navigation`, `nav_direction`, `imu_acc`, `imu_gyro`, `snc`,
  `battery`. Optionally followed by `:` + qualifier or a parenthetical:
  `"gesture: pinch"`, `"pressure (thumb-index)"`, `"navigation: swipe-left"`,
  `"nav_direction: up"`, `"imu_acc (tilt)"`, `"button: hold"`, `"snc"`. Use
  `null` only when the action genuinely has no Mudra trigger. Renaming a
  canonical signal (e.g., `"squeeze"` instead of `"pressure"`) is forbidden
  — Constitution II.
- **`manual`** (string OR `null`) — the keyboard / mouse fallback exactly as
  it appears in this app's simulator panel. Use the project conventions:
  `"Space"`, `"Shift + ←"`, `"[ / ]"`, `"← / →"`, `"W A S D"`, `"left-click"`,
  `"right-click + drag"`. Use `null` only when there is no manual fallback.

### Cross-row invariants (REQUIRED — verify before emitting)

For the generated app's `ACTIONS` array:

- At least one of `mudra` / `manual` is non-null on every row.
- No two rows share the same `manual` value (no keyboard collisions).
- No two rows share the same effective `mudra` trigger.
- Every keyboard shortcut wired up in this app's keyboard handler appears as
  `manual` on exactly one row.
- Every signal subscription this app makes appears as `mudra` on exactly one
  row.
- No row references a control the app does not actually wire up (no
  orphans).

### Anti-patterns (will fail review)

- ❌ `mudra: "Pinch"` — must be `"gesture: pinch"`.
- ❌ `mudra: "squeeze"` — renamed; use `"pressure (thumb-index)"`.
- ❌ A row with `mudra: null, manual: null` — meaningless, drop it.
- ❌ `label: "Press Space"` — that's a control, not a behavior. Use
  `label: "Fire"`.
- ❌ Two rows with `manual: "Space"` — keyboard collision.
- ❌ A `manual` shortcut not wired up in the keyboard handler — orphan.
- ❌ A signal subscription with no row referencing it — missing.

### Process

When generating a new app:

1. Inventory every distinct user-triggerable action this app implements.
2. For each, look up its Mudra trigger in the signal subscriptions and its
   keyboard / mouse trigger in the keyboard handler.
3. Compose one `ACTIONS` row per action with a behavior-style label.
4. Verify the cross-row invariants above.
5. Replace the placeholder `ACTIONS = [];` line in the modal's inline
   `<script>` with the populated array. Touch nothing else in the block.

The canonical block (Parts 1–3) above and the `ACTIONS` schema in this
section are the binding source of truth for the legacy modal. If anything
here is ambiguous, prefer the canonical block.

---

## Signal Inference Reference

Use this as the default behavior for intent-to-signal mapping.

### Rule

- Map user intent to signals from context.
- Do not ask signal-selection questions when intent is clear.
- Ask only when there is genuine ambiguity.

### Mapping

- `gesture`: tap, click, trigger, action, button press, drum, hit, select
- `button`: hold, press and hold, drag, push-to-talk, sprint, charge
- `pressure`: slide, volume, size, intensity, throttle, opacity, brush, zoom, analog
- `navigation`: move, up/down, left/right, steer, cursor, pan, scroll, direction, arrow
- `nav_direction`: swipe, directional gesture, menu direction, card swipe, flick — directions: None, Right, Left, Up, Down, Roll Left, Roll Right (+ reverse variants)
- `imu_acc + imu_gyro + snc` (single bundle — always subscribe to all three): tilt, orientation, angle, rotate, 3D, balance, level, muscle, EMG, biometric, fatigue, nerve

### Bundling Rule

`imu_acc`, `imu_gyro`, and `snc` are an inseparable bundle. If the user
wants any one of them, subscribe to all three.

### Ambiguity Rules

When concept could map to either `navigation` or the IMU+Biometric bundle (`imu_acc + imu_gyro + snc`), ask one clarifying question and recommend the better fit:
- use `navigation` (+`button`) for continuous directional movement/cursor/panning/drag
- use the IMU+Biometric bundle (`imu_acc + imu_gyro + snc`) for orientation/tilt/rotation/biometrics

When concept could use either `navigation` or `nav_direction`, pick based on control style:
- use `navigation` (+`button`) for **continuous** pointer/cursor control (smooth deltas)
- use `nav_direction` for **discrete** directional gestures (swipe-like, menu selection)
- these cannot be combined (same physical hand movement)

When concept could use either `gesture` or `pressure`, pick based on control style:
- use `gesture` for **discrete** actions (tap, double-tap, twist)
- use `pressure` for **analog** control (volume, brush size, throttle)
- these cannot be combined — pick one interaction model per app

---

## Sample Apps

Below are all reference apps. When generating a new app, select the best-matching sample and adapt it.

> **IMPORTANT — Theme reminder:** All samples below use a light/neutral palette as a baseline.
> **Always replace the sample's CSS color variables** with colors that match your app concept.
> Choose a theme that fits: bright/colorful for games, light/clean for productivity,
> dark/neon only if the concept suits it (space, night mode, etc.) or the user requests it.
### Template: mudra-ultimate-template.html



> **Note:** The template below uses placeholder colors. Replace ALL color

> variables with a palette that fits your app concept. Do NOT keep these as-is.



```html

<!doctype html>

<html lang="en">

<head>

  <meta charset="utf-8">

  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Mudra Interactive Template</title>

  <style>

    :root {

      /* REPLACE THESE — choose colors that fit the app concept */

      --bg: #f8f9fa;          /* light default — change per concept */

      --card: #ffffff;         /* light default — change per concept */

      --primary: #4f46e5;     /* indigo default — change per concept */

      --accent: #06b6d4;      /* cyan default — change per concept */

      --text: #1e293b;        /* dark text for light bg — change per concept */

      --text-secondary: #64748b;

      --success: #22c55e;

      --warning: #eab308;

      --error: #ef4444;

    }



    * { box-sizing: border-box; }



    body {

      margin: 0;

      min-height: 100vh;

      background: var(--bg);  /* use the CSS variable — adapt per concept */

      color: var(--text);

      font-family: Poppins, system-ui, sans-serif;

      display: grid;

      place-items: center;

      padding: 20px;

    }



    .app {

      width: min(1100px, 100%);

      display: grid;

      gap: 14px;

    }



    .card {

      background: var(--card);

      border: 1px solid rgba(79, 70, 229, 0.18);

      border-radius: 16px;

      padding: 16px;

      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.34);

    }



    h1, h2, p { margin: 0; }



    .title { font-size: 1.24rem; }

    .muted { color: var(--text-secondary); margin-top: 6px; }



    .header-row {

      display: flex;

      justify-content: space-between;

      align-items: center;

      gap: 12px;

      flex-wrap: wrap;

      margin-top: 12px;

    }



    .status {

      display: inline-flex;

      align-items: center;

      gap: 8px;

      font-size: 0.92rem;

      padding: 8px 12px;

      border-radius: 999px;

      border: 1px solid rgba(0, 0, 0, 0.1);

      background: rgba(0, 0, 0, 0.02);

    }



    .dot {

      width: 9px;

      height: 9px;

      border-radius: 50%;

      background: var(--warning);

      box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.15);

      transition: background 150ms ease;

    }



    .dot.connected {

      background: var(--success);

      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);

    }



    .actions {

      display: flex;

      gap: 10px;

      flex-wrap: wrap;

    }



    button {

      border: none;

      border-radius: 10px;

      padding: 10px 14px;

      font-weight: 700;

      cursor: pointer;

      background: var(--primary);

      color: #ffffff;

    }



    button.secondary {

      background: transparent;

      color: var(--text);

      border: 1px solid rgba(148, 163, 184, 0.3);

      font-weight: 600;

    }



    .two-col {

      display: grid;

      gap: 14px;

      grid-template-columns: 1.3fr 1fr;

    }



    .stage {

      position: relative;

      min-height: 280px;

      border-radius: 14px;

      border: 1px solid rgba(148, 163, 184, 0.25);

      background: var(--card);

      overflow: hidden;

      cursor: grab;

    }



    .stage:active { cursor: grabbing; }



    .stage-grid {

      position: absolute;

      inset: 0;

      background-image:

        linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),

        linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);

      background-size: 24px 24px;

      pointer-events: none;

    }



    .orb {

      position: absolute;

      left: 50%;

      top: 50%;

      width: 88px;

      height: 88px;

      transform: translate(-50%, -50%);

      border-radius: 999px;

      background: var(--bg);

        radial-gradient(circle at 30% 28%, #e0e7ff 0%, var(--primary) 26%, #312e81 100%);

      box-shadow: 0 0 24px rgba(79, 70, 229, 0.34);

      transition: transform 80ms linear, filter 80ms linear;

    }



    .stage-caption {

      position: absolute;

      left: 10px;

      bottom: 10px;

      font-size: 0.82rem;

      color: var(--text-secondary);

      background: rgba(255, 255, 255, 0.8);

      border: 1px solid rgba(148, 163, 184, 0.2);

      border-radius: 8px;

      padding: 6px 8px;

    }



    .signal-grid {

      display: grid;

      gap: 10px;

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }



    .metric {

      border: 1px solid rgba(148, 163, 184, 0.2);

      border-radius: 12px;

      padding: 10px;

      background: rgba(8, 12, 15, 0.62);

    }



    .metric-label {

      font-size: 0.82rem;

      color: var(--text-secondary);

    }



    .metric-value {

      font-size: 1.24rem;

      margin-top: 6px;

      color: var(--primary);

      font-weight: 700;

      letter-spacing: 0.02em;

      transform-origin: left center;

    }



    .pulse {

      animation: pulse 150ms ease;

    }



    @keyframes pulse {

      0% { transform: scale(1); }

      50% { transform: scale(1.05); }

      100% { transform: scale(1); }

    }



    .bar {

      margin-top: 8px;

      height: 8px;

      border-radius: 999px;

      background: rgba(148, 163, 184, 0.22);

      overflow: hidden;

    }



    .bar > span {

      display: block;

      height: 100%;

      width: 0%;

      background: linear-gradient(90deg, var(--accent), var(--primary));

      transition: width 75ms linear;

    }



    .help {

      font-size: 0.86rem;

      line-height: 1.45;

      color: var(--text-secondary);

    }



    pre {

      margin: 0;

      min-height: 160px;

      max-height: 260px;

      overflow: auto;

      padding: 12px;

      border-radius: 12px;

      border: 1px solid rgba(148, 163, 184, 0.22);

      background: #0b1013;

      font-size: 0.8rem;

      line-height: 1.35;

      color: #d8edf0;

    }



    .mudra-badge {

      position: fixed;

      bottom: 12px;

      right: 12px;

      font-size: 11px;

      color: var(--text-secondary, #64748b);

      opacity: 0.7;

      font-family: inherit;

      letter-spacing: 0.02em;

      pointer-events: none;

    }



    @media (max-width: 920px) {

      .two-col { grid-template-columns: 1fr; }

      .signal-grid { grid-template-columns: 1fr 1fr; }

      .stage { min-height: 240px; }

    }

  </style>

</head>

<body>

  <main class="app">

    <section class="card">

      <h1 class="title">Mudra Interactive Template</h1>

      <p class="muted">Baseline: connection-safe, multi-signal telemetry, and device-free interaction fallback.</p>

      <div class="header-row">

        <div class="status" id="status">

          <span class="dot" id="statusDot"></span>

          <span id="statusText">Connecting to Mudra Companion...</span>

        </div>

        <div class="actions">

          <button id="simulateTap">Simulate Tap</button>

          <button id="resubscribe" class="secondary">Resubscribe</button>

          <button id="toggleMode" class="secondary">Mode: pointer</button>

          <button id="getStatus" class="secondary">Get Status</button>

          <button id="getSubs" class="secondary">Get Subs</button>

          <button id="getDocs" class="secondary">Get Docs</button>

          <button id="togglePressureFeature" class="secondary">Pressure: enabled</button>

        </div>

      </div>

    </section>



    <section class="two-col">

      <article class="card">

        <h2 class="title">Interaction Stage</h2>

        <p class="muted">Drag or use keyboard fallback when no device is connected.</p>

        <div class="stage" id="stage">

          <div class="stage-grid"></div>

          <div class="orb" id="orb"></div>

          <div class="stage-caption" id="stageCaption">pointer mode</div>

        </div>

      </article>



      <article class="card">

        <h2 class="title">Signal HUD</h2>

        <div class="signal-grid">

          <div class="metric">

            <div class="metric-label">Gesture</div>

            <div class="metric-value" id="gestureValue">none</div>

          </div>

          <div class="metric">

            <div class="metric-label">Button</div>

            <div class="metric-value" id="buttonValue">released</div>

          </div>

          <div class="metric">

            <div class="metric-label">Pressure</div>

            <div class="metric-value" id="pressureValue">0%</div>

            <div class="bar"><span id="pressureBar"></span></div>

          </div>

          <div class="metric">

            <div class="metric-label">Directional / IMU</div>

            <div class="metric-value" id="motionValue">x:0 y:0</div>

          </div>

          <div class="metric">

            <div class="metric-label">SNC Energy</div>

            <div class="metric-value" id="sncValue">0.00</div>

            <div class="bar"><span id="sncBar"></span></div>

          </div>

          <div class="metric">

            <div class="metric-label">Nav Direction</div>

            <div class="metric-value" id="navDirectionValue">None</div>

          </div>

          <div class="metric">

            <div class="metric-label">Battery</div>

            <div class="metric-value" id="batteryValue">--</div>

          </div>

        </div>

      </article>

    </section>



    <section class="card">

      <h2 class="title">Fallback Controls</h2>

      <p class="help">

        Space: tap gesture | Shift hold: button press/release | [ and ]: pressure down/up | Arrow keys: pointer/direction/tilt based on mode

      </p>

    </section>



    <section class="card">

      <h2 class="title">Event Log</h2>

      <pre id="log"></pre>

    </section>

  </main>

  <script>

    const WS_URL = "ws://127.0.0.1:8766";

    const MAX_LOG_LINES = 80;

    const PRESSURE_WINDOW = 5;

    const SNC_BUFFER_SIZE = 500;



    let controlMode = "pointer"; // "pointer" = navigation+button, "direction" = nav_direction, "imu" = imu_acc+imu_gyro

    let ws;

    let reconnectTimer;

    let pressureFeatureEnabled = true;

    const pressureSamples = [];

    const logLines = [];

    const sncBuffers = [[], [], []];



    const state = {

      gesture: "none",

      button: "released",

      pressure: 0,

      navX: 0,

      navY: 0,

      imuAcc: [0, 0, 9.81],

      imuGyro: [0, 0, 0],

      snc: [0, 0, 0],

      battery: null,

      charging: false,

      navDirection: "None"

    };



    const ui = {

      statusDot: document.getElementById("statusDot"),

      statusText: document.getElementById("statusText"),

      toggleMode: document.getElementById("toggleMode"),

      stage: document.getElementById("stage"),

      orb: document.getElementById("orb"),

      stageCaption: document.getElementById("stageCaption"),

      gestureValue: document.getElementById("gestureValue"),

      buttonValue: document.getElementById("buttonValue"),

      pressureValue: document.getElementById("pressureValue"),

      pressureBar: document.getElementById("pressureBar"),

      motionValue: document.getElementById("motionValue"),

      sncValue: document.getElementById("sncValue"),

      sncBar: document.getElementById("sncBar"),

      navDirectionValue: document.getElementById("navDirectionValue"),

      batteryValue: document.getElementById("batteryValue"),

      log: document.getElementById("log")

    };



    connect();

    updateModeUi();

    render();



    document.getElementById("simulateTap").addEventListener("click", () => {

      send({ command: "trigger_gesture", data: { type: "tap" } });

      handleGesture({ type: "tap" });

    });



    document.getElementById("resubscribe").addEventListener("click", subscribeSignals);

    document.getElementById("getStatus").addEventListener("click", () => send({ command: "get_status" }));

    document.getElementById("getSubs").addEventListener("click", () => send({ command: "get_subscriptions" }));

    // getDocs, enable, disable removed — not supported in new Dart server

    document.getElementById("togglePressureFeature").addEventListener("click", () => {

      pressureFeatureEnabled = !pressureFeatureEnabled;

      // Use subscribe/unsubscribe instead of enable/disable
      send({
        command: pressureFeatureEnabled ? "subscribe" : "unsubscribe",
        signal: "pressure"
      });

      document.getElementById("togglePressureFeature").textContent =

        `Pressure: ${pressureFeatureEnabled ? "enabled" : "disabled"}`;

      addLog({

        type: "feature_toggle",

        data: { feature: "pressure", enabled: pressureFeatureEnabled }

      });

    });



    ui.toggleMode.addEventListener("click", () => {

      const modes = ["pointer", "direction", "imu"];

      controlMode = modes[(modes.indexOf(controlMode) + 1) % modes.length];

      updateModeUi();

      resetMotionState();

      if (ws && ws.readyState === WebSocket.OPEN) {

        send({ command: "unsubscribe", signal: "navigation" });

        send({ command: "unsubscribe", signal: "button" });

        send({ command: "unsubscribe", signal: "nav_direction" });

        send({ command: "unsubscribe", signal: "imu_acc" });

        send({ command: "unsubscribe", signal: "imu_gyro" });

        subscribeSignals();

      }

      addLog({ type: "mode_change", data: { mode: controlMode } });

    });



    document.addEventListener("keydown", handleKeyDown);

    document.addEventListener("keyup", handleKeyUp);

    installStageFallback();



    function connect() {

      ws = new WebSocket(WS_URL);



      ws.onopen = () => {

        setStatus(true, "Connected to Mudra Companion");

        subscribeSignals();

      };



      ws.onclose = () => {

        setStatus(false, "Disconnected. Waiting for Mudra Companion...");

        scheduleReconnect();

      };



      ws.onerror = () => {

        setStatus(false, "Connection error. Check Mudra Companion.");

      };



      ws.onmessage = (event) => {

        const msg = parseMessage(event.data);

        if (!msg) return;



        addLog(msg);



        if (msg.type === "connection_status") {

          const connected = msg.data?.status === "connected";

          setStatus(connected, connected ? "Mudra Companion ready" : "Connect your Mudra Band to continue");

          return;

        }



        if (msg.type === "gesture") handleGesture(msg.data);

        if (msg.type === "pressure") handlePressure(msg.data);

        if (msg.type === "button") handleButton(msg.data);

        if (msg.type === "navigation") handleNavigation(msg.data);

        if (msg.type === "nav_direction") handleNavDirection(msg.data);

        if (msg.type === "imu_acc") handleImuAcc(msg.data);

        if (msg.type === "imu_gyro") handleImuGyro(msg.data);

        if (msg.type === "snc") handleSnc(msg.data);

        if (msg.type === "battery") handleBattery(msg.data);

      };

    }



    function getActiveSignals() {

      const base = ["gesture", "pressure", "snc", "battery"];

      if (controlMode === "pointer") return [...base, "navigation", "button"];

      if (controlMode === "direction") return [...base, "nav_direction"];

      return [...base, "imu_acc", "imu_gyro"];

    }



    function subscribeSignals() {

      getActiveSignals().forEach((signal) => {

        // Mudra protocol: one command per signal with singular "signal" key.

        send({ command: "subscribe", signal });

      });

    }



    function send(payload) {

      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      ws.send(JSON.stringify(payload));

    }



    function parseMessage(raw) {

      try {

        return JSON.parse(raw);

      } catch (error) {

        addLog({ type: "parse_error", raw });

        return null;

      }

    }



    function handleGesture(data = {}) {

      state.gesture = data.type || "unknown";

      ui.gestureValue.textContent = state.gesture;

      pulse(ui.gestureValue);

      render();

    }



    function handlePressure(data = {}) {

      const normalized = clamp01(Number(data.normalized ?? 0));

      pressureSamples.push(normalized);

      if (pressureSamples.length > PRESSURE_WINDOW) pressureSamples.shift();

      state.pressure = pressureSamples.reduce((sum, sample) => sum + sample, 0) / pressureSamples.length;

      ui.pressureValue.textContent = `${Math.round(state.pressure * 100)}%`;

      ui.pressureBar.style.width = `${Math.round(state.pressure * 100)}%`;

      render();

    }



    function handleButton(data = {}) {

      state.button = data.state || "released";

      ui.buttonValue.textContent = state.button;

      pulse(ui.buttonValue);

      render();

    }



    function handleNavigation(data = {}) {

      if (controlMode !== "pointer") return;

      const dx = Number(data.delta_x || 0);

      const dy = Number(data.delta_y || 0);

      state.navX = clamp(state.navX + dx * 0.9, -110, 110);

      state.navY = clamp(state.navY + dy * 0.9, -85, 85);

      ui.motionValue.textContent = `x:${state.navX.toFixed(1)} y:${state.navY.toFixed(1)}`;

      render();

    }



    function handleNavDirection(data = {}) {

      state.navDirection = data.direction || "None";

      ui.navDirectionValue.textContent = state.navDirection;

      if (state.navDirection !== "None") pulse(ui.navDirectionValue);

    }



    function handleImuAcc(data = {}) {

      if (controlMode !== "imu") return;

      const values = Array.isArray(data.values) ? data.values : [0, 0, 9.81];

      state.imuAcc = [Number(values[0] || 0), Number(values[1] || 0), Number(values[2] || 9.81)];

      projectImuToStage();

      render();

    }



    function handleImuGyro(data = {}) {

      if (controlMode !== "imu") return;

      const values = Array.isArray(data.values) ? data.values : [0, 0, 0];

      state.imuGyro = [Number(values[0] || 0), Number(values[1] || 0), Number(values[2] || 0)];

      projectImuToStage();

      render();

    }



    function handleSnc(data = {}) {

      // values is [[ch1_samples], [ch2_samples], [ch3_samples]] (de-interleaved channels)

      const channels = Array.isArray(data.values) && data.values.length === 3

        ? data.values : [[0], [0], [0]];

      // Extend rolling buffers with ALL samples (not just the latest)

      for (let i = 0; i < 3; i++) {

        sncBuffers[i].push(...channels[i]);

        if (sncBuffers[i].length > SNC_BUFFER_SIZE) {

          sncBuffers[i].splice(0, sncBuffers[i].length - SNC_BUFFER_SIZE);

        }

      }

      // Latest sample from each channel for HUD display

      state.snc = sncBuffers.map(buf => Number(buf[buf.length - 1] || 0));

      const energy = Math.min(1, (Math.abs(state.snc[0]) + Math.abs(state.snc[1]) + Math.abs(state.snc[2])) / 3);

      ui.sncValue.textContent = energy.toFixed(2);

      ui.sncBar.style.width = `${Math.round(energy * 100)}%`;

    }



    function handleBattery(data = {}) {

      if (typeof data.level !== "number") return;

      state.battery = data.level;

      state.charging = Boolean(data.charging);

      ui.batteryValue.textContent = `${state.battery}% ${state.charging ? "(charging)" : ""}`;

    }



    function projectImuToStage() {

      const x = clamp(state.imuAcc[0] * 12 + state.imuGyro[2] * 0.15, -110, 110);

      const y = clamp(-state.imuAcc[1] * 12 + state.imuGyro[0] * 0.15, -85, 85);

      state.navX = x;

      state.navY = y;

      ui.motionValue.textContent = `ax:${state.imuAcc[0].toFixed(2)} ay:${state.imuAcc[1].toFixed(2)}`;

    }



    function render() {

      const translate = `translate(calc(-50% + ${state.navX}px), calc(-50% + ${state.navY}px))`;

      const scale = 1 + state.pressure * 0.33;

      const glow = 0.8 + state.pressure * 0.7;

      const saturate = state.button === "pressed" ? 1.6 : 1;

      ui.orb.style.transform = `${translate} scale(${scale.toFixed(3)})`;

      ui.orb.style.filter = `brightness(${glow.toFixed(2)}) saturate(${saturate})`;

    }



    function updateModeUi() {

      ui.toggleMode.textContent = `Mode: ${controlMode}`;

      ui.stageCaption.textContent = `${controlMode} mode`;

    }



    function resetMotionState() {

      state.navX = 0;

      state.navY = 0;

      state.imuAcc = [0, 0, 9.81];

      state.imuGyro = [0, 0, 0];

      ui.motionValue.textContent = "x:0 y:0";

      render();

    }



    function installStageFallback() {

      let dragging = false;



      ui.stage.addEventListener("pointerdown", (event) => {

        dragging = true;

        ui.stage.setPointerCapture(event.pointerId);

      });



      ui.stage.addEventListener("pointerup", () => {

        dragging = false;

      });



      ui.stage.addEventListener("pointermove", (event) => {

        if (!dragging) return;



        const rect = ui.stage.getBoundingClientRect();

        const xNorm = ((event.clientX - rect.left) / rect.width) * 2 - 1;

        const yNorm = ((event.clientY - rect.top) / rect.height) * 2 - 1;



        if (controlMode === "pointer") {

          state.navX = clamp(xNorm * 110, -110, 110);

          state.navY = clamp(yNorm * 85, -85, 85);

          ui.motionValue.textContent = `x:${state.navX.toFixed(1)} y:${state.navY.toFixed(1)}`;

        } else if (controlMode === "imu") {

          handleImuAcc({ values: [xNorm * 1.4, -yNorm * 1.4, 9.81] });

          handleImuGyro({ values: [yNorm * 25, xNorm * 25, xNorm * 12] });

        }



        render();

      });

    }



    function handleKeyDown(event) {

      if (event.repeat) return;



      if (event.code === "Space") {

        event.preventDefault();

        send({ command: "trigger_gesture", data: { type: "tap" } });

        handleGesture({ type: "tap" });

      }



      if (event.key === "Shift") {

        handleButton({ state: "pressed" });

      }



      if (event.key === "[") {

        handlePressure({ normalized: clamp01(state.pressure - 0.08) });

      }



      if (event.key === "]") {

        handlePressure({ normalized: clamp01(state.pressure + 0.08) });

      }



      if (event.key.startsWith("Arrow")) {

        event.preventDefault();

        const step = 9;

        if (controlMode === "pointer") {

          if (event.key === "ArrowLeft") handleNavigation({ delta_x: -step, delta_y: 0 });

          if (event.key === "ArrowRight") handleNavigation({ delta_x: step, delta_y: 0 });

          if (event.key === "ArrowUp") handleNavigation({ delta_x: 0, delta_y: -step });

          if (event.key === "ArrowDown") handleNavigation({ delta_x: 0, delta_y: step });

        } else if (controlMode === "direction") {

          const dirMap = { ArrowLeft: "Left", ArrowRight: "Right", ArrowUp: "Up", ArrowDown: "Down" };

          handleNavDirection({ direction: dirMap[event.key] || "None" });

        } else {

          const ax = state.imuAcc[0] + (event.key === "ArrowRight" ? 0.12 : event.key === "ArrowLeft" ? -0.12 : 0);

          const ay = state.imuAcc[1] + (event.key === "ArrowDown" ? 0.12 : event.key === "ArrowUp" ? -0.12 : 0);

          handleImuAcc({ values: [ax, ay, 9.81] });

          handleImuGyro({ values: [ay * 18, ax * 18, ax * 9] });

        }

      }

    }



    function handleKeyUp(event) {

      if (event.key === "Shift") {

        handleButton({ state: "released" });

      }

    }



    function setStatus(connected, text) {

      ui.statusDot.classList.toggle("connected", connected);

      ui.statusText.textContent = text;

    }



    function scheduleReconnect() {

      clearTimeout(reconnectTimer);

      reconnectTimer = setTimeout(connect, 1200);

    }



    function addLog(value) {

      const line = JSON.stringify(value);

      logLines.unshift(line);

      if (logLines.length > MAX_LOG_LINES) logLines.pop();

      ui.log.textContent = logLines.join("\n");

    }



    function pulse(element) {

      element.classList.remove("pulse");

      void element.offsetWidth;

      element.classList.add("pulse");

    }



    function clamp(value, min, max) {

      return Math.max(min, Math.min(max, value));

    }



    function clamp01(value) {

      if (!Number.isFinite(value)) return 0;

      return clamp(value, 0, 1);

    }

  </script>

</body>

</html>



```



### preview/hands-free-desktop.html



```html

<!doctype html>

<html lang="en">

<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Hands-Free Desktop — Mudra Studio</title>

<style>

  @media (prefers-reduced-motion: reduce) {

    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }

  }



  :root {

    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;

    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;

    --warning: #eab308; --error: #ef4444;

    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);

    --desktop-bg: #e2e8f0;

  }







  * { margin: 0; padding: 0; box-sizing: border-box; }

  body { background: var(--bg); color: var(--text); font-family: 'Poppins', system-ui, sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }



  .header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: var(--card); border-bottom: 1px solid var(--border); z-index: 200; flex-shrink: 0; gap: 8px; flex-wrap: wrap; }

  .header-left, .header-right { display: flex; align-items: center; gap: 10px; }

  .brand { font-weight: 700; font-size: 14px; } .brand span { color: var(--primary); }

  .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--warning); box-shadow: 0 0 0 3px rgba(234,179,8,0.15); transition: all 150ms; }

  .dot.live { background: var(--success); box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }

  .conn-label { font-size: 12px; color: var(--text-secondary); }



  .btn { background: var(--surface); border: 1px solid var(--border); color: var(--text-secondary); padding: 5px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; transition: border-color 150ms, color 150ms; white-space: nowrap; }

  .btn:hover { border-color: var(--primary); color: var(--primary); }



  .desktop { flex: 1; position: relative; overflow: hidden; background: var(--desktop-bg); background-image:

    linear-gradient(rgba(79,70,229,0.03) 1px, transparent 1px),

    linear-gradient(90deg, rgba(79,70,229,0.03) 1px, transparent 1px);

    background-size: 48px 48px; }



  .icon-grid { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }

  .app-icon { width: 96px; height: 96px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border-radius: 16px; background: var(--card); border: 1px solid var(--border); cursor: default; transition: all 200ms; user-select: none; }

  .app-icon.hovered { border-color: var(--primary); background: rgba(79,70,229,0.06); box-shadow: 0 0 20px rgba(79,70,229,0.12); transform: scale(1.06); }

  .app-icon.clicked { animation: iconBounce 0.25s ease; }

  @keyframes iconBounce { 0%{transform:scale(1.06)} 50%{transform:scale(0.94)} 100%{transform:scale(1.06)} }

  .icon-emoji { font-size: 28px; line-height: 1; }

  .icon-label { font-size: 11px; color: var(--text-secondary); font-weight: 500; }

  .app-icon.hovered .icon-label { color: var(--primary); }



  /* Cursor */

  .cursor { position: absolute; width: 20px; height: 20px; pointer-events: none; z-index: 100; }

  .cursor::before { content: ''; position: absolute; top: 0; left: 0; width: 0; height: 0; border-left: 11px solid var(--primary); border-top: 6px solid transparent; border-bottom: 6px solid transparent; filter: drop-shadow(0 0 4px rgba(79,70,229,0.5)); transform: rotate(-30deg); }

  .cursor.dragging::after { content: ''; position: absolute; top: 14px; left: 2px; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px var(--accent); }



  /* Context Menu */

  .ctx-menu { position: absolute; background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 4px; z-index: 250; min-width: 140px; opacity: 0; transform: scale(0.95); transition: all 150ms; pointer-events: none; }

  .ctx-menu.visible { opacity: 1; transform: scale(1); pointer-events: auto; }

  .ctx-item { padding: 7px 14px; font-size: 12px; color: var(--text-secondary); border-radius: 6px; cursor: default; }

  .ctx-item:hover { background: var(--surface); color: var(--primary); }

  .ctx-sep { height: 1px; background: var(--border); margin: 2px 0; }



  /* App Window Modal */

  .app-modal { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95); width: 340px; background: var(--card); border: 1px solid var(--border); border-radius: 14px; z-index: 180; opacity: 0; pointer-events: none; transition: all 200ms; box-shadow: 0 16px 40px rgba(0,0,0,0.4); }

  .app-modal.visible { opacity: 1; transform: translate(-50%, -50%) scale(1); pointer-events: auto; }

  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); }

  .modal-title { font-size: 14px; font-weight: 600; }

  .modal-close { font-size: 16px; color: var(--text-secondary); cursor: pointer; background: none; border: none; line-height: 1; padding: 2px 6px; border-radius: 4px; }

  .modal-close:hover { color: var(--error); }

  .modal-body { padding: 24px 16px; text-align: center; color: var(--text-secondary); font-size: 13px; }



  /* Taskbar */

  .taskbar { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 8px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 200; flex-shrink: 0; flex-wrap: wrap; }

  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }



  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 300; }



  @media (max-width: 640px) {

    .header { padding: 8px 10px; } .taskbar { gap: 8px; padding: 6px 10px; }

    .icon-grid { gap: 14px; }

    .app-icon { width: 74px; height: 74px; border-radius: 12px; }

    .icon-emoji { font-size: 22px; } .icon-label { font-size: 10px; }

    .hint { display: none; }

    .app-modal { width: 280px; }

  }

</style>

</head>

<body>



<div class="header">

  <div class="header-left">

    <div class="brand"><span>Mudra</span> Hands-Free Desktop</div>

    <span class="dot" id="dot"></span>

    <span class="conn-label" id="connLabel">Connecting&hellip;</span>

  </div>

  <div class="header-right">

    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>

    <button class="btn" id="simTap">Simulate Tap</button>

    <button class="btn" id="simDTap">Simulate Double-Tap</button>

    <button class="btn" id="simTwist">Simulate Twist</button>

  </div>

</div>



<div class="desktop" id="desktop">

  <div class="icon-grid" id="iconGrid"></div>

  <div class="cursor" id="cursor"></div>

</div>



<div class="ctx-menu" id="ctxMenu">

  <div class="ctx-item" data-action="open">Open</div>

  <div class="ctx-item" data-action="info">Get Info</div>

  <div class="ctx-sep"></div>

  <div class="ctx-item" data-action="remove">Move to Trash</div>

</div>



<div class="app-modal" id="appModal">

  <div class="modal-header">

    <span class="modal-title" id="modalTitle">App</span>

    <button class="modal-close" id="modalClose">&times;</button>

  </div>

  <div class="modal-body" id="modalBody">Content</div>

</div>



<div class="taskbar">

  <button class="btn" id="clickBtn">Click</button>

  <button class="btn" id="dblBtn">Double-Click</button>

  <span class="hint">Arrows move &middot; Space click &middot; D double-click &middot; T twist &middot; Shift drag</span>

</div>

<script>

/* ── Mudra Protocol Connection (v2) ────────────────────────── */

const WS_URL = 'ws://127.0.0.1:8766';

const SIGNALS = ['navigation', 'gesture', 'button'];



let ws, reconnectTimer, simTimer;

let wsOpen = false, deviceReady = false, simulating = true;

const bus = {};



function on(ev, fn) { (bus[ev] ??= []).push(fn); }

function emit(ev, d) { (bus[ev] || []).forEach(fn => fn(d)); }

function send(p) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(p)); }



function connect() {

  try {

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {

      wsOpen = true; stopSim(); updateStatus();

      SIGNALS.forEach(s => send({ command: 'subscribe', signal: s }));

    };

    ws.onmessage = (e) => {

      try {

        const msg = JSON.parse(e.data);

        if (msg.type === 'connection_status') {

          deviceReady = msg.data?.status === 'connected';

          updateStatus(); return;

        }

        emit(msg.type, msg.data);

      } catch {}

    };

    ws.onclose = () => {

      wsOpen = false; deviceReady = false; updateStatus();

      startSim();

      clearTimeout(reconnectTimer);

      reconnectTimer = setTimeout(connect, 1500);

    };

    ws.onerror = () => ws?.close();

  } catch {

    wsOpen = false; startSim();

    clearTimeout(reconnectTimer);

    reconnectTimer = setTimeout(connect, 1500);

  }

}



function triggerGesture(type) {

  if (wsOpen) send({ command: 'trigger_gesture', data: { type } });

  else emit('gesture', { type, timestamp: Date.now() });

}



/* ── Simulation (when Companion not reachable) ─────────────── */

function startSim() {

  if (simTimer) return;

  simulating = true;

  let t = 0;

  simTimer = setInterval(() => {

    t += 0.03;

    // Figure-8 pattern

    const dx = Math.cos(t * 0.5) * 3;

    const dy = Math.sin(t * 1.0) * 2.5;

    emit('navigation', { delta_x: dx, delta_y: dy, timestamp: Date.now() });

    if (Math.random() < 0.004) {

      const g = ['tap', 'double_tap', 'twist', 'double_twist'];

      emit('gesture', { type: g[Math.floor(Math.random() * g.length)] + Math.random() * 0.3, timestamp: Date.now() });

    }

  }, 50);

}



function stopSim() { clearInterval(simTimer); simTimer = null; simulating = false; }



/* ── Status UI ─────────────────────────────────────────────── */

const dotEl = document.getElementById('dot');

const connEl = document.getElementById('connLabel');



function updateStatus() {

  if (wsOpen && deviceReady) { dotEl.className = 'dot live'; connEl.textContent = 'Connected'; }

  else if (wsOpen) { dotEl.className = 'dot'; connEl.textContent = 'Waiting for Mudra Band\u2026'; }

  else { dotEl.className = 'dot'; connEl.textContent = simulating ? 'Simulated' : 'Disconnected'; }

}





/* ── Desktop Apps ──────────────────────────────────────────── */

const apps = [

  { name: 'Browser',  emoji: '\u{1F310}', desc: 'Web browser ready. Navigate with gestures.' },

  { name: 'Music',    emoji: '\u{1F3B5}', desc: 'Now playing: Ambient Waves. Tap to play/pause.' },

  { name: 'Photos',   emoji: '\u{1F4F7}', desc: 'Photo library loaded. 247 items.' },

  { name: 'Terminal',  emoji: '\u{1F5A5}', desc: '$ mudra --status\nconnected | signals: 3 active' },

  { name: 'Settings', emoji: '\u2699\uFE0F', desc: 'Mudra Band settings. Gesture sensitivity: High.' },

  { name: 'Files',    emoji: '\u{1F4C1}', desc: 'Home directory. 12 items, 3.2 GB free.' },

];



const desktopEl = document.getElementById('desktop');

const iconGridEl = document.getElementById('iconGrid');

const cursorEl = document.getElementById('cursor');

const ctxMenuEl = document.getElementById('ctxMenu');

const appModalEl = document.getElementById('appModal');

const modalTitleEl = document.getElementById('modalTitle');

const modalBodyEl = document.getElementById('modalBody');

const modalCloseEl = document.getElementById('modalClose');



const iconEls = [];

apps.forEach(app => {

  const el = document.createElement('div');

  el.className = 'app-icon';

  el.dataset.name = app.name;

  el.dataset.desc = app.desc;

  const emo = document.createElement('span');

  emo.className = 'icon-emoji'; emo.textContent = app.emoji;

  const lab = document.createElement('span');

  lab.className = 'icon-label'; lab.textContent = app.name;

  el.appendChild(emo); el.appendChild(lab);

  iconGridEl.appendChild(el);

  iconEls.push(el);

});



/* ── Cursor State ──────────────────────────────────────────── */

let cx = 0, cy = 0;

let dragging = false;

let hoveredIcon = null;

let modalOpen = false;



function hideCtx() { ctxMenuEl.classList.remove('visible'); }

function hideModal() { appModalEl.classList.remove('visible'); modalOpen = false; }



function openApp(name, desc) {

  modalTitleEl.textContent = name;

  modalBodyEl.textContent = desc;

  appModalEl.classList.add('visible');

  modalOpen = true;

  hideCtx();

}



function clickIcon() {

  hideCtx();

  if (hoveredIcon) {

    hoveredIcon.classList.add('clicked');

    setTimeout(() => hoveredIcon.classList.remove('clicked'), 250);

  }

}



function dblClickIcon() {

  hideCtx();

  if (hoveredIcon) {

    openApp(hoveredIcon.dataset.name, hoveredIcon.dataset.desc);

  }

}



function rightClickIcon() {

  if (hoveredIcon) {

    ctxMenuEl.style.left = Math.min(cx + 10, desktopEl.offsetWidth - 160) + 'px';

    ctxMenuEl.style.top = Math.min(cy + 10, desktopEl.offsetHeight - 100) + 'px';

    ctxMenuEl.classList.add('visible');

  }

}



/* ── Context menu actions ── */

ctxMenuEl.querySelectorAll('.ctx-item').forEach(item => {

  item.addEventListener('click', () => {

    if (item.dataset.action === 'open' && hoveredIcon) dblClickIcon();

    hideCtx();

  });

});



modalCloseEl.addEventListener('click', hideModal);



/* ── Signal Handlers ───────────────────────────────────────── */

on('navigation', (d) => {

  cx += (d.delta_x || 0) * 2;

  cy += (d.delta_y || 0) * 2;

  cx = Math.max(0, Math.min(desktopEl.offsetWidth - 1, cx));

  cy = Math.max(0, Math.min(desktopEl.offsetHeight - 1, cy));

});



on('gesture', (d) => {

  const t = d.type || '';

  if (modalOpen && t === 'twist') { hideModal(); return; }

  if (t === 'tap') clickIcon();

  if (t === 'double_tap') dblClickIcon();

  if (t === 'twist') rightClickIcon();

});



on('button', (d) => {

  if (d.state === 'pressed') { dragging = true; cursorEl.classList.add('dragging'); }

  if (d.state === 'released') { dragging = false; cursorEl.classList.remove('dragging'); }

});



/* ── Keyboard Fallback ─────────────────────────────────────── */

const keys = {};

document.addEventListener('keydown', (e) => {

  keys[e.code] = true;

  if (e.code === 'Space') { e.preventDefault(); clickIcon(); triggerGesture('tap'); }

  if (e.code === 'KeyD') dblClickIcon();

  if (e.code === 'KeyT') rightClickIcon();

  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) {

    emit('button', { state: 'pressed', timestamp: Date.now() });

  }

});

document.addEventListener('keyup', (e) => {

  keys[e.code] = false;

  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {

    emit('button', { state: 'released', timestamp: Date.now() });

  }

});



/* ── Buttons ───────────────────────────────────────────────── */

document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));

document.getElementById('simDTap').addEventListener('click', () => triggerGesture('double_tap'));

document.getElementById('simTwist').addEventListener('click', () => triggerGesture('twist'));

document.getElementById('clickBtn').addEventListener('click', clickIcon);

document.getElementById('dblBtn').addEventListener('click', dblClickIcon);

desktopEl.addEventListener('click', hideCtx);



/* ── Animation Loop ────────────────────────────────────────── */

function animate() {

  /* Keyboard cursor movement */

  const spd = 5;

  if (keys['ArrowLeft']) cx -= spd;

  if (keys['ArrowRight']) cx += spd;

  if (keys['ArrowUp']) cy -= spd;

  if (keys['ArrowDown']) cy += spd;

  cx = Math.max(0, Math.min(desktopEl.offsetWidth - 1, cx));

  cy = Math.max(0, Math.min(desktopEl.offsetHeight - 1, cy));



  cursorEl.style.left = cx + 'px';

  cursorEl.style.top = cy + 'px';



  /* Hit-test icons */

  let newHov = null;

  const dr = desktopEl.getBoundingClientRect();

  iconEls.forEach(icon => {

    const r = icon.getBoundingClientRect();

    const ix = r.left - dr.left, iy = r.top - dr.top;

    if (cx >= ix && cx <= ix + r.width && cy >= iy && cy <= iy + r.height) newHov = icon;

  });

  if (hoveredIcon !== newHov) {

    if (hoveredIcon) hoveredIcon.classList.remove('hovered');

    hoveredIcon = newHov;

    if (hoveredIcon) hoveredIcon.classList.add('hovered');

  }



  requestAnimationFrame(animate);

}



/* ── Init ──────────────────────────────────────────────────── */

const dR = desktopEl.getBoundingClientRect();

cx = dR.width / 2; cy = dR.height / 2;

connect();

animate();

</script>

</body>

</html>



```



### preview/document-scroller.html



```html

<!doctype html>

<html lang="en">

<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Document Scroller — Mudra Studio</title>

<style>

  @media (prefers-reduced-motion: reduce) {

    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }

  }



  :root {

    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;

    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;

    --warning: #eab308; --error: #ef4444;

    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);

  }





  * { margin: 0; padding: 0; box-sizing: border-box; }

  body { background: var(--bg); color: var(--text); font-family: 'Poppins', system-ui, sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }



  .header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: var(--card); border-bottom: 1px solid var(--border); z-index: 100; flex-shrink: 0; gap: 8px; flex-wrap: wrap; }

  .header-left, .header-right { display: flex; align-items: center; gap: 10px; }

  .brand { font-weight: 700; font-size: 14px; } .brand span { color: var(--primary); }

  .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--warning); box-shadow: 0 0 0 3px rgba(234,179,8,0.15); transition: all 150ms; }

  .dot.live { background: var(--success); box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }

  .conn-label { font-size: 12px; color: var(--text-secondary); }



  .btn { background: var(--surface); border: 1px solid var(--border); color: var(--text-secondary); padding: 5px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; transition: border-color 150ms, color 150ms; white-space: nowrap; }

  .btn:hover { border-color: var(--primary); color: var(--primary); }

  .btn.primary-btn { background: var(--primary); color: #ffffff; border-color: transparent; font-weight: 600; }

  .btn.primary-btn:hover { opacity: 0.9; }



  /* Layout */

  .layout { flex: 1; display: flex; overflow: hidden; position: relative; }



  /* Table of contents sidebar */

  .toc { width: 220px; background: var(--card); border-right: 1px solid var(--border); overflow-y: auto; padding: 16px 12px; flex-shrink: 0; }

  .toc-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600; }

  .toc-item { display: block; padding: 7px 10px; font-size: 12px; color: var(--text-secondary); text-decoration: none; border-radius: 6px; margin-bottom: 2px; transition: all 150ms; cursor: pointer; border: 1px solid transparent; line-height: 1.4; }

  .toc-item:hover { color: var(--text); background: var(--surface); }

  .toc-item.active { color: var(--primary); background: rgba(79,70,229,0.06); border-color: rgba(79,70,229,0.2); }



  /* Document area */

  .doc-area { flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; }

  .doc-scroll { flex: 1; overflow-y: auto; scroll-behavior: smooth; padding: 32px 40px; }



  /* Scan mode */

  .doc-scroll.scan-mode .section h2 { font-size: 17px; }

  .doc-scroll.scan-mode .section p { font-size: 12px; line-height: 1.5; color: var(--text-secondary); }

  .doc-scroll.scan-mode .section .callout { border-color: var(--primary); background: rgba(79,70,229,0.1); }

  .doc-scroll.scan-mode .section { margin-bottom: 24px; }



  /* Content sections */

  .section { margin-bottom: 44px; }

  .section h2 { font-size: 22px; font-weight: 700; margin-bottom: 14px; color: var(--text); scroll-margin-top: 20px; }

  .section h2 .num { color: var(--primary); margin-right: 8px; font-variant-numeric: tabular-nums; }

  .section p { font-size: 15px; line-height: 1.8; color: var(--text-secondary); margin-bottom: 12px; }

  .section .callout { background: var(--surface); border-left: 3px solid var(--accent); padding: 14px 18px; border-radius: 0 10px 10px 0; margin: 14px 0; font-size: 14px; color: var(--text-secondary); line-height: 1.7; }



  /* Custom scrollbar track */

  .scrollbar-track { position: absolute; right: 0; top: 0; bottom: 0; width: 14px; background: var(--card); border-left: 1px solid var(--border); z-index: 10; }

  .scroll-thumb { position: absolute; right: 2px; width: 10px; background: var(--text-secondary); opacity: 0.3; border-radius: 5px; min-height: 30px; transition: background 150ms, opacity 150ms; cursor: pointer; }

  .scroll-thumb:hover { opacity: 0.6; background: var(--primary); }

  .bookmark-marker { position: absolute; right: 0; width: 14px; height: 4px; background: var(--primary); border-radius: 2px; pointer-events: none; z-index: 2; }



  /* Bottom toolbar */

  .toolbar { display: flex; align-items: center; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }

  .section-name { font-size: 13px; color: var(--primary); font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .meter { display: flex; align-items: center; gap: 8px; }

  .meter-label { font-size: 12px; color: var(--text-secondary); }

  .meter-bar { width: 60px; height: 8px; background: var(--surface); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }

  .meter-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 999px; transition: width 75ms linear; width: 0%; }

  .bm-count { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }

  .mode-badge { font-size: 11px; padding: 4px 10px; border-radius: 20px; background: var(--surface); border: 1px solid var(--border); color: var(--text-secondary); cursor: pointer; transition: all 150ms; white-space: nowrap; }

  .mode-badge.scan { border-color: var(--primary); color: var(--primary); }

  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }



  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }



  @media (max-width: 640px) {

    .header { padding: 8px 10px; }

    .toc { display: none; }

    .doc-scroll { padding: 20px 16px; }

    .toolbar { gap: 8px; padding: 8px 10px; }

    .hint { display: none; }

    .meter-bar { width: 40px; }

  }

</style>

</head>

<body>



<div class="header">

  <div class="header-left">

    <div class="brand"><span>Mudra</span> Document Scroller</div>

    <span class="dot" id="dot"></span>

    <span class="conn-label" id="connLabel">Connecting&hellip;</span>

  </div>

  <div class="header-right">

    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>

    <button class="btn" id="simTap">Bookmark</button>

    <button class="btn" id="simScan">Toggle Scan</button>

  </div>

</div>



<div class="layout">

  <div class="toc" id="toc">

    <div class="toc-title">Contents</div>

  </div>

  <div class="doc-area">

    <div class="doc-scroll" id="docScroll"></div>

    <div class="scrollbar-track" id="scrollbarTrack">

      <div class="scroll-thumb" id="scrollThumb"></div>

    </div>

  </div>

</div>



<div class="toolbar">

  <span class="section-name" id="sectionName">Introduction</span>

  <div class="meter">

    <span class="meter-label">Speed</span>

    <div class="meter-bar"><div class="meter-fill" id="speedFill"></div></div>

  </div>

  <span class="bm-count" id="bmCount">0 bookmarks</span>

  <span class="mode-badge" id="modeBadge">Reading</span>

  <span class="hint">&uarr;&darr; scroll &middot; B bookmark &middot; N next &middot; S scan &middot; [ ] speed</span>

</div>



<script>

/* ── Mudra Protocol Connection (v2) ────────────────────────── */

const WS_URL = 'ws://127.0.0.1:8766';

const SIGNALS = ['navigation', 'gesture', 'pressure'];



let ws, reconnectTimer, simTimer;

let wsOpen = false, deviceReady = false, simulating = true;

const bus = {};



function on(ev, fn) { (bus[ev] ??= []).push(fn); }

function emit(ev, d) { (bus[ev] || []).forEach(fn => fn(d)); }

function send(p) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(p)); }



function connect() {

  try {

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {

      wsOpen = true; stopSim(); updateStatus();

      SIGNALS.forEach(s => send({ command: 'subscribe', signal: s }));

    };

    ws.onmessage = (e) => {

      try {

        const msg = JSON.parse(e.data);

        if (msg.type === 'connection_status') {

          deviceReady = msg.data?.status === 'connected';

          updateStatus(); return;

        }

        emit(msg.type, msg.data);

      } catch {}

    };

    ws.onclose = () => {

      wsOpen = false; deviceReady = false; updateStatus();

      startSim();

      clearTimeout(reconnectTimer);

      reconnectTimer = setTimeout(connect, 1500);

    };

    ws.onerror = () => ws?.close();

  } catch {

    wsOpen = false; startSim();

    clearTimeout(reconnectTimer);

    reconnectTimer = setTimeout(connect, 1500);

  }

}



function triggerGesture(type) {

  if (wsOpen) send({ command: 'trigger_gesture', data: { type } });

  else emit('gesture', { type, timestamp: Date.now() });

}



/* ── Simulation (when Companion not reachable) ─────────────── */

function startSim() {

  if (simTimer) return;

  simulating = true;

  let t = 0;

  simTimer = setInterval(() => {

    t += 0.05;

    /* gentle auto-scroll via navigation */

    const dy = Math.round(1.5 + Math.sin(t * 0.2) * 1);

    emit('navigation', { delta_x: 0, delta_y: dy, timestamp: Date.now() });

    /* pressure for scroll speed */

    const n = Math.max(0, Math.min(1, 0.3 + 0.15 * Math.sin(t * 0.4) + (Math.random() - 0.5) * 0.05));

    emit('pressure', { value: Math.round(n * 100), normalized: n, timestamp: Date.now() });

    /* occasional bookmark */

    if (Math.random() < 0.002) {

      emit('gesture', { type: 'tap', timestamp: Date.now() });

    }

  }, 60);

}



function stopSim() { clearInterval(simTimer); simTimer = null; simulating = false; }



/* ── Status UI ─────────────────────────────────────────────── */

const dotEl = document.getElementById('dot');

const connEl = document.getElementById('connLabel');



function updateStatus() {

  if (wsOpen && deviceReady) { dotEl.className = 'dot live'; connEl.textContent = 'Connected'; }

  else if (wsOpen) { dotEl.className = 'dot'; connEl.textContent = 'Waiting for Mudra Band\u2026'; }

  else { dotEl.className = 'dot'; connEl.textContent = simulating ? 'Simulated' : 'Disconnected'; }

}





/* ── Document Content ──────────────────────────────────────── */

const sections = [

  {

    title: 'Introduction to Neural Computing',

    paragraphs: [

      'Neural computing represents one of the most profound shifts in human-computer interaction. By capturing the faintest electrical signals from the nervous system, devices like the Mudra wristband translate intention into action, bypassing traditional input methods entirely.',

      'The fundamental premise is elegant: when you think about moving your fingers, your brain sends electrical signals through motor neurons to the muscles in your forearm. These signals, known as electromyographic (EMG) signals, can be detected and decoded before the movement is even completed.'

    ],

    callout: 'Neural input does not require actual physical movement. The signals can be captured from the intention alone, opening up entirely new paradigms for accessibility and hands-free interaction.'

  },

  {

    title: 'Electromyography Fundamentals',

    paragraphs: [

      'Electromyography (EMG) is the recording and analysis of electrical activity produced by skeletal muscles. When a motor neuron fires, it generates an action potential that propagates along the muscle fiber, creating a measurable electrical field.',

      'Surface EMG sensors, like those in the Mudra wristband, detect these signals non-invasively through the skin. The raw signal is a complex interference pattern of many motor unit action potentials overlapping in time and space.',

      'Signal processing pipelines typically include bandpass filtering (20-500 Hz), rectification, and envelope detection. Advanced systems use machine learning classifiers trained on labeled gesture data to recognize specific hand poses and movements.'

    ],

    callout: 'The Mudra Protocol v2 WebSocket interface streams processed neural data including pressure, navigation deltas, IMU readings, and discrete gesture events in real-time JSON packets at configurable frequencies.'

  },

  {

    title: 'Gesture Recognition Pipeline',

    paragraphs: [

      'Converting raw EMG signals into discrete gestures involves several processing stages. The first stage is signal acquisition and preprocessing, where noise from power lines, motion artifacts, and other sources is filtered out.',

      'Feature extraction follows, where time-domain features (mean absolute value, zero crossings, waveform length) and frequency-domain features (power spectral density, median frequency) are computed over sliding windows of typically 150 to 300 milliseconds.',

      'Classification algorithms then map feature vectors to gesture labels. The Mudra system recognizes gestures including tap, double tap, twist, and double twist with associated confidence scores.',

      'Latency is critical for real-time interaction. End-to-end latency from muscle activation to gesture output should remain below 100 milliseconds for the interaction to feel instantaneous.'

    ],

    callout: null

  },

  {

    title: 'Accelerometer and IMU Fusion',

    paragraphs: [

      'Beyond EMG, the Mudra wristband incorporates a tri-axis accelerometer and gyroscope forming an inertial measurement unit. These sensors track the orientation and movement of the wrist in three-dimensional space.',

      'Sensor fusion algorithms combine accelerometer, gyroscope, and EMG data to provide a richer understanding of user intent. The navigation signal provides continuous delta values for smooth pointing and scrolling.',

      'Calibration is important for navigation-based control. The neutral wrist position defines the zero point, and sensitivity can be adjusted based on the range of comfortable motion for each user.'

    ],

    callout: 'The navigation signal provides continuous analog control like a joystick, while EMG gestures provide discrete events like button presses. This combination enables rich, expressive interaction without touching any surface.'

  },

  {

    title: 'WebSocket Protocol v2',

    paragraphs: [

      'The Mudra Companion application exposes a WebSocket server on localhost port 8766. Client applications connect and subscribe to specific signals they need: gesture, pressure, navigation, imu_acc, imu_gyro, snc, button, and battery.',

      'Each signal is subscribed individually using the command format. Data arrives as typed JSON messages with the signal type and a data payload containing the relevant values and a timestamp.',

      'Connection management follows standard WebSocket patterns with automatic reconnection. Applications should implement simulation mode to generate realistic synthetic data for development without a physical device.',

      'The protocol supports bidirectional communication. The trigger_gesture command allows applications to programmatically trigger gesture events, useful for testing and accessibility features.'

    ],

    callout: null

  },

  {

    title: 'Accessibility Applications',

    paragraphs: [

      'Neural input technology has transformative potential for accessibility. People with limited mobility, speech difficulties, or conditions like ALS can use subtle muscle signals to communicate and control devices.',

      'The gesture-to-speech paradigm maps neural gestures to spoken phrases, enabling communication through minimal physical effort. As the technology matures, the vocabulary and expressiveness of such systems will expand dramatically.',

      'Environmental control systems allow users to operate smart home devices, navigate wheelchair controls, and interact with computers entirely through neural input. The low-latency, always-available nature of wrist-worn neural sensors makes them ideal for continuous assistive use.'

    ],

    callout: 'Unlike eye-tracking or head-tracking systems, neural input works regardless of lighting conditions, head position, or whether the user is looking at a screen. It is truly eyes-free and hands-free interaction.'

  },

  {

    title: 'Creative and Musical Applications',

    paragraphs: [

      'Artists and musicians are discovering novel expressive possibilities with neural input. The continuous nature of pressure and navigation signals maps naturally to musical parameters like volume, pitch bend, and filter cutoff.',

      'Step sequencers controlled by neural input allow musicians to compose beats using gestures for step selection and navigation deltas for parameter movement. The physical subtlety of the interaction opens up performance possibilities impossible with traditional controllers.',

      'Visual artists can control generative art parameters in real-time, creating a feedback loop between neural intention and visual output. Pressure controls brush size, navigation drives spatial transformations, and gestures trigger discrete creative actions.'

    ],

    callout: null

  },

  {

    title: 'Future Directions',

    paragraphs: [

      'The field of neural computing is advancing rapidly. Next-generation sensors will offer higher spatial resolution, capturing signals from individual motor units rather than aggregate muscle activity.',

      'Machine learning models are becoming more personalized, adapting to individual users over time and recognizing an ever-growing vocabulary of gestures. Transfer learning techniques reduce the calibration burden for new users.',

      'Integration with augmented and virtual reality systems represents a compelling frontier. Neural input provides the missing interaction modality for spatial computing, where traditional keyboards and mice are impractical.',

      'As developers, we have the opportunity to shape this emerging interaction paradigm. The Mudra SDK and WebSocket protocol provide the foundation. What you build with it is limited only by imagination.'

    ],

    callout: 'The ultimate vision is a seamless neural interface where the boundary between thought and digital action dissolves entirely. The technology in your hands today is the first step toward that future.'

  }

];



/* ── Build Document ────────────────────────────────────────── */

const docScroll = document.getElementById('docScroll');

const tocEl = document.getElementById('toc');

const sectionEls = [];

const tocItems = [];



sections.forEach((sec, i) => {

  /* Document section */

  const div = document.createElement('div');

  div.className = 'section';

  div.id = 'sec-' + i;



  const h2 = document.createElement('h2');

  const numSpan = document.createElement('span');

  numSpan.className = 'num';

  numSpan.textContent = String(i + 1).padStart(2, '0');

  h2.appendChild(numSpan);

  h2.appendChild(document.createTextNode(sec.title));

  div.appendChild(h2);



  sec.paragraphs.forEach(text => {

    const p = document.createElement('p');

    p.textContent = text;

    div.appendChild(p);

  });



  if (sec.callout) {

    const co = document.createElement('div');

    co.className = 'callout';

    co.textContent = sec.callout;

    div.appendChild(co);

  }



  docScroll.appendChild(div);

  sectionEls.push(div);



  /* TOC entry */

  const tocItem = document.createElement('div');

  tocItem.className = 'toc-item' + (i === 0 ? ' active' : '');

  tocItem.textContent = sec.title;

  tocItem.addEventListener('click', () => {

    div.scrollIntoView({ behavior: 'smooth' });

  });

  tocEl.appendChild(tocItem);

  tocItems.push(tocItem);

});



/* ── Scrollbar ─────────────────────────────────────────────── */

const scrollbarTrack = document.getElementById('scrollbarTrack');

const scrollThumb = document.getElementById('scrollThumb');

let bookmarks = [];

let scanMode = false;

let scrollSpeedMult = 0.3;



function updateScrollbar() {

  const el = docScroll;

  const scrollH = el.scrollHeight;

  const clientH = el.clientHeight;

  if (scrollH <= clientH) { scrollThumb.style.display = 'none'; return; }

  scrollThumb.style.display = 'block';

  const ratio = clientH / scrollH;

  const thumbH = Math.max(30, ratio * clientH);

  scrollThumb.style.height = thumbH + 'px';

  const scrollRatio = el.scrollTop / (scrollH - clientH);

  scrollThumb.style.top = scrollRatio * (clientH - thumbH) + 'px';

}



function updateCurrentSection() {

  const scrollTop = docScroll.scrollTop + 60;

  let current = 0;

  sectionEls.forEach((el, i) => {

    if (el.offsetTop <= scrollTop) current = i;

  });

  tocItems.forEach((item, i) => item.classList.toggle('active', i === current));

  document.getElementById('sectionName').textContent = sections[current].title;

}



docScroll.addEventListener('scroll', () => { updateScrollbar(); updateCurrentSection(); });

window.addEventListener('resize', updateScrollbar);

setTimeout(updateScrollbar, 100);



function addBookmark() {

  const scrollH = docScroll.scrollHeight;

  const clientH = docScroll.clientHeight;

  if (scrollH <= clientH) return;

  const pos = docScroll.scrollTop / (scrollH - clientH);

  bookmarks.push({ pos, scrollTop: docScroll.scrollTop });

  bookmarks.sort((a, b) => a.scrollTop - b.scrollTop);

  /* render marker */

  const marker = document.createElement('div');

  marker.className = 'bookmark-marker';

  marker.style.top = (pos * clientH) + 'px';

  scrollbarTrack.appendChild(marker);

  document.getElementById('bmCount').textContent = bookmarks.length + ' bookmark' + (bookmarks.length !== 1 ? 's' : '');

}



function jumpToNextBookmark() {

  if (bookmarks.length === 0) return;

  const current = docScroll.scrollTop;

  const next = bookmarks.find(b => b.scrollTop > current + 10);

  if (next) docScroll.scrollTo({ top: next.scrollTop, behavior: 'smooth' });

  else docScroll.scrollTo({ top: bookmarks[0].scrollTop, behavior: 'smooth' });

}



function clearBookmarks() {

  bookmarks = [];

  scrollbarTrack.querySelectorAll('.bookmark-marker').forEach(m => m.remove());

  document.getElementById('bmCount').textContent = '0 bookmarks';

}



function toggleScanMode() {

  scanMode = !scanMode;

  docScroll.classList.toggle('scan-mode', scanMode);

  const badge = document.getElementById('modeBadge');

  badge.textContent = scanMode ? 'Scan' : 'Reading';

  badge.classList.toggle('scan', scanMode);

}



/* ── Signal Handlers ───────────────────────────────────────── */

let scrollAccY = 0;



on('navigation', (d) => {

  const dy = d.delta_y || 0;

  /* smooth scroll: accumulate and apply */

  const speed = 2 + scrollSpeedMult * 8;

  docScroll.scrollTop += dy * speed;

  updateScrollbar();

  updateCurrentSection();

});



on('gesture', (d) => {

  const type = d.type || 'unknown';

  if (type === 'tap') addBookmark();

  if (type === 'double_tap') toggleScanMode();

  if (type === 'twist') jumpToNextBookmark();

  if (type === 'double_twist') clearBookmarks();

});



on('pressure', (d) => {

  scrollSpeedMult = Math.max(0, Math.min(1, d.normalized ?? d.value / 100));

  document.getElementById('speedFill').style.width = Math.round(scrollSpeedMult * 100) + '%';

});



/* ── Keyboard Fallback ─────────────────────────────────────── */

let kbSpeed = 0.3;

document.addEventListener('keydown', (e) => {

  if (e.code === 'ArrowDown') {

    e.preventDefault();

    docScroll.scrollTop += 40 + scrollSpeedMult * 60;

    updateScrollbar(); updateCurrentSection();

  }

  if (e.code === 'ArrowUp') {

    e.preventDefault();

    docScroll.scrollTop -= 40 + scrollSpeedMult * 60;

    updateScrollbar(); updateCurrentSection();

  }

  if (e.code === 'KeyB') addBookmark();

  if (e.code === 'KeyN') jumpToNextBookmark();

  if (e.code === 'KeyS') toggleScanMode();

  if (e.key === ']') {

    kbSpeed = Math.min(1, kbSpeed + 0.1);

    emit('pressure', { value: Math.round(kbSpeed * 100), normalized: kbSpeed, timestamp: Date.now() });

  }

  if (e.key === '[') {

    kbSpeed = Math.max(0, kbSpeed - 0.1);

    emit('pressure', { value: Math.round(kbSpeed * 100), normalized: kbSpeed, timestamp: Date.now() });

  }

});



/* ── Buttons ───────────────────────────────────────────────── */

document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));

document.getElementById('simScan').addEventListener('click', () => triggerGesture('double_tap'));

document.getElementById('modeBadge').addEventListener('click', toggleScanMode);



/* ── Start ─────────────────────────────────────────────────── */

connect();

</script>

</body>

</html>



```



### preview/model-rotator.html



```html

<!doctype html>

<html lang="en">

<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width, initial-scale=1">

<title>3D Model Rotator — Mudra Studio</title>

<style>

  @media (prefers-reduced-motion: reduce) {

    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }

  }



  :root {

    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;

    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;

    --warning: #eab308; --error: #ef4444;

    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);

    --scene-bg: #f0fdfa; --wire-color: rgba(79,70,229,0.35); --face-fill: rgba(79,70,229,0.06);

  }







  * { margin: 0; padding: 0; box-sizing: border-box; }

  body { background: var(--bg); color: var(--text); font-family: 'Poppins', system-ui, sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }



  .header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: var(--card); border-bottom: 1px solid var(--border); z-index: 100; flex-shrink: 0; gap: 8px; flex-wrap: wrap; }

  .header-left, .header-right { display: flex; align-items: center; gap: 10px; }

  .brand { font-weight: 700; font-size: 14px; } .brand span { color: var(--primary); }

  .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--warning); box-shadow: 0 0 0 3px rgba(234,179,8,0.15); transition: all 150ms; }

  .dot.live { background: var(--success); box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }

  .conn-label { font-size: 12px; color: var(--text-secondary); }



  .btn { background: var(--surface); border: 1px solid var(--border); color: var(--text-secondary); padding: 5px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; transition: border-color 150ms, color 150ms; white-space: nowrap; }

  .btn:hover { border-color: var(--primary); color: var(--primary); }



  .scene { flex: 1; display: flex; justify-content: center; align-items: center; perspective: 800px; position: relative; overflow: hidden; background: var(--scene-bg); }

  .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(79,70,229,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.03) 1px, transparent 1px); background-size: 40px 40px; background-position: center; }



  .shape-wrapper { transform-style: preserve-3d; transition: none; }



  /* Cube */

  .cube { width: 160px; height: 160px; position: relative; transform-style: preserve-3d; }

  .cube .face { position: absolute; width: 160px; height: 160px; border: 2px solid var(--wire-color); background: var(--face-fill); backface-visibility: visible; }

  .cube .f-front  { transform: translateZ(80px); }

  .cube .f-back   { transform: rotateY(180deg) translateZ(80px); }

  .cube .f-right  { transform: rotateY(90deg) translateZ(80px); }

  .cube .f-left   { transform: rotateY(-90deg) translateZ(80px); }

  .cube .f-top    { transform: rotateX(90deg) translateZ(80px); }

  .cube .f-bottom { transform: rotateX(-90deg) translateZ(80px); }



  /* Pyramid */

  .pyramid { width: 160px; height: 160px; position: relative; transform-style: preserve-3d; }

  .pyramid .pyr-base { position: absolute; width: 160px; height: 160px; transform: rotateX(90deg) translateZ(-80px); border: 2px solid var(--wire-color); background: var(--face-fill); }

  .pyramid .pyr-face { position: absolute; width: 160px; height: 140px; background: var(--face-fill); border: 2px solid var(--wire-color); transform-origin: bottom center; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }

  .pyramid .pf1 { transform: translateY(-60px) rotateX(-30deg); }

  .pyramid .pf2 { transform: translateY(-60px) rotateY(90deg) rotateX(-30deg); }

  .pyramid .pf3 { transform: translateY(-60px) rotateY(180deg) rotateX(-30deg); }

  .pyramid .pf4 { transform: translateY(-60px) rotateY(270deg) rotateX(-30deg); }



  /* Octahedron */

  .octahedron { width: 160px; height: 160px; position: relative; transform-style: preserve-3d; }

  .octahedron .octa-face { position: absolute; width: 120px; height: 120px; border: 2px solid var(--wire-color); background: var(--face-fill); clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); left: 20px; top: 20px; }

  .octahedron .of1 { transform: translateZ(60px); }

  .octahedron .of2 { transform: rotateY(90deg) translateZ(60px); }

  .octahedron .of3 { transform: rotateY(180deg) translateZ(60px); }

  .octahedron .of4 { transform: rotateY(270deg) translateZ(60px); }

  .octahedron .of5 { transform: rotateX(90deg) translateZ(60px); }

  .octahedron .of6 { transform: rotateX(-90deg) translateZ(60px); }



  .shadow { position: absolute; bottom: 10%; width: 200px; height: 20px; background: radial-gradient(ellipse, rgba(79,70,229,0.12), transparent 70%); border-radius: 50%; }



  .shape-label { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); background: rgba(79,70,229,0.08); color: var(--primary); padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 5; border: 1px solid rgba(79,70,229,0.15); }



  .auto-badge { position: absolute; top: 16px; right: 20px; font-size: 11px; color: var(--primary); font-weight: 600; opacity: 0; transition: opacity 150ms; }

  .auto-badge.show { opacity: 1; }



  .info-panel { position: absolute; bottom: 16px; left: 16px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; font-size: 12px; display: flex; flex-direction: column; gap: 4px; z-index: 5; }

  .info-row { display: flex; justify-content: space-between; gap: 16px; }

  .info-label { color: var(--text-secondary); }

  .info-val { color: var(--primary); font-variant-numeric: tabular-nums; font-weight: 600; }



  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }

  .toolbar-left { display: flex; align-items: center; gap: 12px; }

  .meter { display: flex; align-items: center; gap: 8px; }

  .meter-bar { width: 80px; height: 8px; background: var(--surface); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }

  .meter-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 999px; transition: width 75ms linear; width: 0%; }

  .meter-val { font-size: 12px; color: var(--text-secondary); min-width: 36px; text-align: right; font-variant-numeric: tabular-nums; }

  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }



  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }



  @media (max-width: 640px) {

    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }

    .info-panel { left: 8px; bottom: 8px; padding: 8px 12px; } .hint { display: none; }

    .meter-bar { width: 50px; }

  }

</style>

</head>

<body>



<div class="header">

  <div class="header-left">

    <div class="brand"><span>Mudra</span> 3D Model Rotator</div>

    <span class="dot" id="dot"></span>

    <span class="conn-label" id="connLabel">Connecting&hellip;</span>

  </div>

  <div class="header-right">

    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>

    <button class="btn" id="simTap">Simulate Tap</button>

    <button class="btn" id="simTwist">Cycle Model</button>

  </div>

</div>



<div class="scene">

  <div class="grid-bg"></div>

  <div class="shape-label" id="shapeLabel">Cube</div>

  <div class="auto-badge" id="autoBadge">AUTO-ROTATE</div>

  <div class="shape-wrapper" id="wrapper"></div>

  <div class="shadow" id="shadow"></div>

  <div class="info-panel">

    <div class="info-row"><span class="info-label">Rot X</span><span class="info-val" id="rotXVal">0.0&deg;</span></div>

    <div class="info-row"><span class="info-label">Rot Y</span><span class="info-val" id="rotYVal">0.0&deg;</span></div>

    <div class="info-row"><span class="info-label">Rot Z</span><span class="info-val" id="rotZVal">0.0&deg;</span></div>

    <div class="info-row"><span class="info-label">Scale</span><span class="info-val" id="scaleVal">1.00x</span></div>

  </div>

</div>



<div class="toolbar">

  <div class="toolbar-left">

    <div class="meter">

      <span class="meter-val" id="pressVal">0%</span>

      <div class="meter-bar"><div class="meter-fill" id="pressFill"></div></div>

    </div>

  </div>

  <span class="hint">Arrows tilt &middot; R auto-rotate &middot; Space reset &middot; T cycle model &middot; [ ] zoom</span>

</div>



<div class="mudra-badge">Created by Mudra</div>



<script>

/* ── Mudra Protocol Connection (v2) ────────────────────────── */

const WS_URL = 'ws://127.0.0.1:8766';

const SIGNALS = ['imu_acc', 'imu_gyro', 'pressure', 'gesture'];



let ws, reconnectTimer, simTimer;

let wsOpen = false, deviceReady = false, simulating = true;

const bus = {};



function on(ev, fn) { (bus[ev] ??= []).push(fn); }

function emit(ev, d) { (bus[ev] || []).forEach(fn => fn(d)); }

function send(p) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(p)); }



function connect() {

  try {

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {

      wsOpen = true; stopSim(); updateStatus();

      SIGNALS.forEach(s => send({ command: 'subscribe', signal: s }));

    };

    ws.onmessage = (e) => {

      try {

        const msg = JSON.parse(e.data);

        if (msg.type === 'connection_status') {

          deviceReady = msg.data?.status === 'connected';

          updateStatus(); return;

        }

        emit(msg.type, msg.data);

      } catch {}

    };

    ws.onclose = () => {

      wsOpen = false; deviceReady = false; updateStatus();

      startSim();

      clearTimeout(reconnectTimer);

      reconnectTimer = setTimeout(connect, 1500);

    };

    ws.onerror = () => ws?.close();

  } catch {

    wsOpen = false; startSim();

    clearTimeout(reconnectTimer);

    reconnectTimer = setTimeout(connect, 1500);

  }

}



function triggerGesture(type) {

  if (wsOpen) send({ command: 'trigger_gesture', data: { type } });

  else emit('gesture', { type, timestamp: Date.now() });

}



/* ── Simulation (when Companion not reachable) ─────────────── */

function startSim() {

  if (simTimer) return;

  simulating = true;

  let t = 0;

  simTimer = setInterval(() => {

    t += 0.05;

    emit('imu_acc', {

      values: [

        0.8 * Math.sin(t * 0.3) + (Math.random() - 0.5) * 0.1,

        0.6 * Math.cos(t * 0.4) + (Math.random() - 0.5) * 0.1,

        9.8 + 0.2 * Math.sin(t * 0.2)

      ],

      frequency: 100, timestamp: Date.now()

    });

    emit('imu_gyro', {

      values: [

        0.3 * Math.sin(t * 0.5),

        0.2 * Math.cos(t * 0.6),

        0.5 * Math.sin(t * 0.35)

      ],

      frequency: 100, timestamp: Date.now()

    });

    const n = Math.max(0, Math.min(1, 0.5 + 0.2 * Math.sin(t * 0.25)));

    emit('pressure', { value: Math.round(n * 100), normalized: n, timestamp: Date.now() });

    if (Math.random() < 0.002) {

      const g = ['tap', 'double_tap', 'twist', 'double_twist'];

      emit('gesture', { type: g[Math.floor(Math.random() * g.length)] + Math.random() * 0.3, timestamp: Date.now() });

    }

  }, 60);

}



function stopSim() { clearInterval(simTimer); simTimer = null; simulating = false; }



/* ── Status UI ─────────────────────────────────────────────── */

const dotEl = document.getElementById('dot');

const connEl = document.getElementById('connLabel');



function updateStatus() {

  if (wsOpen && deviceReady) { dotEl.className = 'dot live'; connEl.textContent = 'Connected'; }

  else if (wsOpen) { dotEl.className = 'dot'; connEl.textContent = 'Waiting for Mudra Band\u2026'; }

  else { dotEl.className = 'dot'; connEl.textContent = simulating ? 'Simulated' : 'Disconnected'; }

}





/* ── 3D Model Logic ────────────────────────────────────────── */

const shapes = ['Cube', 'Pyramid', 'Octahedron'];

let shapeIdx = 0;

let rotX = 0, rotY = 0, rotZ = 0, scale = 1;

let autoRotate = false;

let spinSpeed = 0;

let pressure = 0;



const wrapper = document.getElementById('wrapper');

const pressVal = document.getElementById('pressVal');

const pressFill = document.getElementById('pressFill');



function buildShape(name) {

  while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);

  document.getElementById('shapeLabel').textContent = name;



  if (name === 'Cube') {

    const cube = document.createElement('div');

    cube.className = 'cube';

    ['f-front','f-back','f-right','f-left','f-top','f-bottom'].forEach(function(cls) {

      const face = document.createElement('div');

      face.className = 'face ' + cls;

      cube.appendChild(face);

    });

    wrapper.appendChild(cube);

  } else if (name === 'Pyramid') {

    const pyr = document.createElement('div');

    pyr.className = 'pyramid';

    const base = document.createElement('div');

    base.className = 'pyr-base';

    pyr.appendChild(base);

    for (let i = 1; i <= 4; i++) {

      const f = document.createElement('div');

      f.className = 'pyr-face pf' + i;

      pyr.appendChild(f);

    }

    wrapper.appendChild(pyr);

  } else if (name === 'Octahedron') {

    const oct = document.createElement('div');

    oct.className = 'octahedron';

    for (let i = 1; i <= 6; i++) {

      const f = document.createElement('div');

      f.className = 'octa-face of' + i;

      oct.appendChild(f);

    }

    wrapper.appendChild(oct);

  }

}



buildShape('Cube');



/* ── Signal Handlers ───────────────────────────────────────── */

on('imu_acc', (d) => {

  const vals = d.values || [0, 0, 9.8];

  rotY += vals[0] * 0.8;

  rotX -= vals[1] * 0.8;

});



on('imu_gyro', (d) => {

  const vals = d.values || [0, 0, 0];

  spinSpeed = vals[2] * 2;

});



on('pressure', (d) => {

  pressure = Math.max(0, Math.min(1, d.normalized ?? d.value / 100));

  pressVal.textContent = Math.round(pressure * 100) + '%';

  pressFill.style.width = Math.round(pressure * 100) + '%';

  scale = 0.5 + pressure * 1.5;

});



on('gesture', (d) => {

  const type = d.type || 'unknown';

  if (type === 'tap') {

    autoRotate = !autoRotate;

    document.getElementById('autoBadge').classList.toggle('show', autoRotate);

  }

  if (type === 'double_tap') {

    rotX = 0; rotY = 0; rotZ = 0; scale = 1; spinSpeed = 0;

  }

  if (type === 'twist') {

    shapeIdx = (shapeIdx + 1) % shapes.length;

    buildShape(shapes[shapeIdx]);

  }

});



/* ── Render Loop ───────────────────────────────────────────── */

function renderLoop() {

  if (autoRotate) {

    rotY += 0.5;

    rotX += 0.2;

  }

  rotZ += spinSpeed * 0.3;



  wrapper.style.transform = 'rotateX(' + rotX.toFixed(1) + 'deg) rotateY(' + rotY.toFixed(1) + 'deg) rotateZ(' + rotZ.toFixed(1) + 'deg) scale(' + scale.toFixed(2) + ')';



  const shadow = document.getElementById('shadow');

  const sx = Math.sin(rotY * Math.PI / 180) * 30;

  shadow.style.transform = 'translateX(' + sx.toFixed(0) + 'px) scaleX(' + (0.8 + Math.abs(Math.cos(rotY * Math.PI / 180)) * 0.4).toFixed(2) + ')';



  document.getElementById('rotXVal').textContent = (((rotX % 360) + 360) % 360).toFixed(1) + '\u00b0';

  document.getElementById('rotYVal').textContent = (((rotY % 360) + 360) % 360).toFixed(1) + '\u00b0';

  document.getElementById('rotZVal').textContent = (((rotZ % 360) + 360) % 360).toFixed(1) + '\u00b0';

  document.getElementById('scaleVal').textContent = scale.toFixed(2) + 'x';



  requestAnimationFrame(renderLoop);

}



/* ── Keyboard Fallback ─────────────────────────────────────── */

document.addEventListener('keydown', (e) => {

  if (e.code === 'ArrowUp') { e.preventDefault(); rotX -= 5; }

  if (e.code === 'ArrowDown') { e.preventDefault(); rotX += 5; }

  if (e.code === 'ArrowLeft') { e.preventDefault(); rotY -= 5; }

  if (e.code === 'ArrowRight') { e.preventDefault(); rotY += 5; }

  if (e.code === 'KeyR') triggerGesture('tap');

  if (e.code === 'Space') { e.preventDefault(); triggerGesture('double_tap'); }

  if (e.code === 'KeyT') triggerGesture('twist');

  if (e.key === ']') {

    pressure = Math.min(1, pressure + 0.08);

    emit('pressure', { value: Math.round(pressure * 100), normalized: pressure, timestamp: Date.now() });

  }

  if (e.key === '[') {

    pressure = Math.max(0, pressure - 0.08);

    emit('pressure', { value: Math.round(pressure * 100), normalized: pressure, timestamp: Date.now() });

  }

});



/* ── Buttons ───────────────────────────────────────────────── */

document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));

document.getElementById('simTwist').addEventListener('click', () => triggerGesture('twist'));



/* ── Init ──────────────────────────────────────────────────── */

connect();

renderLoop();

</script>

</body>

</html>



```



### preview/pressure-painter.html



```html

<!doctype html>

<html lang="en">

<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Pressure Painter — Mudra Studio</title>

<style>

  @media (prefers-reduced-motion: reduce) {

    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }

  }



  :root {

    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;

    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;

    --warning: #eab308; --error: #ef4444;

    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);

    --canvas-bg: #f1f5f9;

  }







  * { margin: 0; padding: 0; box-sizing: border-box; }

  body { background: var(--bg); color: var(--text); font-family: 'Poppins', system-ui, sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }



  .header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: var(--card); border-bottom: 1px solid var(--border); z-index: 100; flex-shrink: 0; gap: 8px; flex-wrap: wrap; }

  .header-left, .header-right { display: flex; align-items: center; gap: 10px; }

  .brand { font-weight: 700; font-size: 14px; } .brand span { color: var(--primary); }

  .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--warning); box-shadow: 0 0 0 3px rgba(234,179,8,0.15); transition: all 150ms; }

  .dot.live { background: var(--success); box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }

  .conn-label { font-size: 12px; color: var(--text-secondary); }



  .btn { background: var(--surface); border: 1px solid var(--border); color: var(--text-secondary); padding: 5px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; transition: border-color 150ms, color 150ms; white-space: nowrap; }

  .btn:hover { border-color: var(--primary); color: var(--primary); }

  .btn.primary-btn { background: var(--primary); color: #ffffff; border-color: transparent; font-weight: 600; }

  .btn.primary-btn:hover { opacity: 0.9; }



  canvas { flex: 1; cursor: crosshair; display: block; background: var(--canvas-bg); }



  .toolbar { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }

  .color-swatch { width: 28px; height: 28px; border-radius: 8px; border: 2px solid var(--border); flex-shrink: 0; }

  .meter { display: flex; align-items: center; gap: 8px; }

  .meter-bar { width: 80px; height: 8px; background: var(--surface); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }

  .meter-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 999px; transition: width 75ms linear; width: 0%; }

  .meter-val { font-size: 12px; color: var(--text-secondary); min-width: 32px; text-align: right; font-variant-numeric: tabular-nums; }

  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }



  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }



  @media (max-width: 640px) {

    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }

    .meter-bar { width: 50px; } .hint { display: none; }

  }

</style>

</head>

<body>



<div class="header">

  <div class="header-left">

    <div class="brand"><span>Mudra</span> Pressure Painter</div>

    <span class="dot" id="dot"></span>

    <span class="conn-label" id="connLabel">Connecting&hellip;</span>

  </div>

  <div class="header-right">

    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>

    <button class="btn" id="simTap">Simulate Tap</button>

  </div>

</div>



<canvas id="canvas"></canvas>



<div class="toolbar">

  <button class="btn" id="clearBtn">Clear</button>

  <div class="color-swatch" id="swatch"></div>

  <div class="meter">

    <span class="meter-val" id="pressVal">0%</span>

    <div class="meter-bar"><div class="meter-fill" id="pressFill"></div></div>

  </div>

  <span class="hint">[ ] pressure &middot; Space tap &middot; D clear</span>

</div>



<div class="mudra-badge">Created by Mudra</div>



<script>

/* ── Mudra Protocol Connection (v2) ────────────────────────── */

const WS_URL = 'ws://127.0.0.1:8766';

const SIGNALS = ['pressure', 'gesture', 'snc'];



let ws, reconnectTimer, simTimer;

let wsOpen = false, deviceReady = false, simulating = true;

const bus = {};



function on(ev, fn) { (bus[ev] ??= []).push(fn); }

function emit(ev, d) { (bus[ev] || []).forEach(fn => fn(d)); }

function send(p) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(p)); }



function connect() {

  try {

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {

      wsOpen = true; stopSim(); updateStatus();

      SIGNALS.forEach(s => send({ command: 'subscribe', signal: s }));

    };

    ws.onmessage = (e) => {

      try {

        const msg = JSON.parse(e.data);

        if (msg.type === 'connection_status') {

          deviceReady = msg.data?.status === 'connected';

          updateStatus(); return;

        }

        emit(msg.type, msg.data);

      } catch {}

    };

    ws.onclose = () => {

      wsOpen = false; deviceReady = false; updateStatus();

      startSim();

      clearTimeout(reconnectTimer);

      reconnectTimer = setTimeout(connect, 1500);

    };

    ws.onerror = () => ws?.close();

  } catch {

    wsOpen = false; startSim();

    clearTimeout(reconnectTimer);

    reconnectTimer = setTimeout(connect, 1500);

  }

}



function triggerGesture(type) {

  if (wsOpen) send({ command: 'trigger_gesture', data: { type } });

  else emit('gesture', { type, timestamp: Date.now() });

}



/* ── Simulation (when Companion not reachable) ─────────────── */

function startSim() {

  if (simTimer) return;

  simulating = true;

  let t = 0;

  simTimer = setInterval(() => {

    t += 0.05;

    const n = Math.max(0, Math.min(1, 0.3 + 0.25 * Math.sin(t * 0.7) + (Math.random() - 0.5) * 0.1));

    emit('pressure', { value: Math.round(n * 100), normalized: n, timestamp: Date.now() });

    emit('snc', {

      values: [

        0.3 * Math.sin(t * 1.3) + (Math.random() - 0.5) * 0.1,

        0.2 * Math.cos(t * 1.7) + (Math.random() - 0.5) * 0.1,

        0.15 * Math.sin(t * 2.1) + (Math.random() - 0.5) * 0.08

      ],

      frequency: 1000, timestamp: Date.now()

    });

    if (Math.random() < 0.004) {

      const g = ['tap', 'double_tap', 'twist', 'double_twist'];

      emit('gesture', { type: g[Math.floor(Math.random() * g.length)] + Math.random() * 0.3, timestamp: Date.now() });

    }

  }, 60);

}



function stopSim() { clearInterval(simTimer); simTimer = null; simulating = false; }



/* ── Status UI ─────────────────────────────────────────────── */

const dotEl = document.getElementById('dot');

const connEl = document.getElementById('connLabel');



function updateStatus() {

  if (wsOpen && deviceReady) { dotEl.className = 'dot live'; connEl.textContent = 'Connected'; }

  else if (wsOpen) { dotEl.className = 'dot'; connEl.textContent = 'Waiting for Mudra Band\u2026'; }

  else { dotEl.className = 'dot'; connEl.textContent = simulating ? 'Simulated' : 'Disconnected'; }

}





/* ── Canvas Setup ──────────────────────────────────────────── */

const canvas = document.getElementById('canvas');

const ctx = canvas.getContext('2d');

const swatch = document.getElementById('swatch');

const pressVal = document.getElementById('pressVal');

const pressFill = document.getElementById('pressFill');



let hue = 179, pressure = 0;

let cursorX = 0, cursorY = 0, mouseActive = false;

let simTime = 0;

const points = [];



function resize() {

  const saved = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const r = canvas.getBoundingClientRect();

  canvas.width = r.width * devicePixelRatio;

  canvas.height = r.height * devicePixelRatio;

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  ctx.putImageData(saved, 0, 0);

}

resize();

window.addEventListener('resize', resize);



canvas.addEventListener('mousemove', (e) => {

  const r = canvas.getBoundingClientRect();

  cursorX = e.clientX - r.left; cursorY = e.clientY - r.top;

  mouseActive = true;

});

canvas.addEventListener('mouseleave', () => { mouseActive = false; });

canvas.addEventListener('touchmove', (e) => {

  e.preventDefault();

  const r = canvas.getBoundingClientRect();

  cursorX = e.touches[0].clientX - r.left; cursorY = e.touches[0].clientY - r.top;

  mouseActive = true;

}, { passive: false });



/* ── Signal Handlers ───────────────────────────────────────── */

on('pressure', (d) => {

  pressure = Math.max(0, Math.min(1, d.normalized ?? d.value / 100));

  pressVal.textContent = Math.round(pressure * 100) + '%';

  pressFill.style.width = Math.round(pressure * 100) + '%';

});



on('snc', (d) => {

  const vals = d.values || [0, 0, 0];

  const energy = (Math.abs(vals[0]) + Math.abs(vals[1]) + Math.abs(vals[2])) / 3;

  hue = Math.round((energy * 720) % 360);

  swatch.style.background = `hsl(${hue}, 80%, 55%)`;

});



on('gesture', (d) => {

  const type = d.type || 'unknown';

  if (type === 'tap') hue = Math.floor(Math.random() * 360);

  if (type === 'double_tap') {

    points.length = 0;

    ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);

  }

  swatch.style.background = `hsl(${hue}, 80%, 55%)`;

});



/* ── Keyboard Fallback ─────────────────────────────────────── */

let kbPressure = 0.3;

document.addEventListener('keydown', (e) => {

  if (e.code === 'Space') { e.preventDefault(); triggerGesture('tap'); }

  if (e.code === 'KeyD') triggerGesture('double_tap');

  if (e.key === ']') {

    kbPressure = Math.min(1, kbPressure + 0.08);

    emit('pressure', { value: Math.round(kbPressure * 100), normalized: kbPressure, timestamp: Date.now() });

  }

  if (e.key === '[') {

    kbPressure = Math.max(0, kbPressure - 0.08);

    emit('pressure', { value: Math.round(kbPressure * 100), normalized: kbPressure, timestamp: Date.now() });

  }

});



/* ── Buttons ───────────────────────────────────────────────── */

document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));

document.getElementById('clearBtn').addEventListener('click', () => {

  points.length = 0;

  ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);

});



/* ── Paint Loop ────────────────────────────────────────────── */

function paintLoop() {

  simTime += 0.02;

  const r = canvas.getBoundingClientRect();

  const w = r.width, h = r.height;



  let x = cursorX, y = cursorY;

  if (!mouseActive) {

    x = w / 2 + Math.sin(simTime * 0.5) * w * 0.3 + Math.cos(simTime * 0.8) * w * 0.1;

    y = h / 2 + Math.cos(simTime * 0.4) * h * 0.25 + Math.sin(simTime * 0.7) * h * 0.1;

  }



  const size = 2 + pressure * 38;

  const alpha = 0.2 + pressure * 0.8;

  points.push({ x, y, size, hue, alpha });

  if (points.length > 8000) points.splice(0, 100);



  if (points.length >= 2) {

    const p0 = points[points.length - 2], p1 = points[points.length - 1];

    ctx.beginPath();

    ctx.moveTo(p0.x, p0.y);

    ctx.lineTo(p1.x, p1.y);

    ctx.strokeStyle = `hsla(${p1.hue}, 80%, 55%, ${p1.alpha})`;

    ctx.lineWidth = p1.size;

    ctx.lineCap = 'round';

    ctx.lineJoin = 'round';

    ctx.stroke();

  }



  requestAnimationFrame(paintLoop);

}



swatch.style.background = `hsl(${hue}, 80%, 55%)`;

connect();

paintLoop();

</script>

</body>

</html>



```



