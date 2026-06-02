# Mudra Skill — Gemini System Prompt

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
   - Include no-device simulation path via `trigger_gesture` on every app
   - **ALWAYS wrap WebSocket with `MudraWebSocket`** (see Mock WebSocket section below) — no exceptions

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

Drop any of the four when the concept does not need it (e.g. a pure
tap-counter subscribes to `gesture` only). All other signals
(`button`, `imu_acc`, `imu_gyro`, `snc`) and other gesture subtypes
(`twist`, `double_twist`, …) are **off by default** — only include them
when the user names them, names a synonym from the Signal Inference
Reference below, or describes an interaction that genuinely cannot be
expressed with the default four (e.g. "tilt to steer" → IMU,
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

`button` combines freely with any group (subject to the XOR rules
above — `button` belongs to Pointer mode and never combines with
`nav_direction`). **`battery` is NOT a subscribable signal** — read
`device.battery` / `device.charging` from `get_status` instead.

When a conflict appears, explain the limitation and recommend one path.

## Sample Catalog

Select the best-matching sample before generating code.

| Mode | Samples |
|------|---------|
| **Pointer** | `preview/hands-free-desktop.html` |
| **Direction** | `preview/ar-menu.html`, `preview/document-scroller.html`, `preview/gesture-speech.html`, `preview/music-sequencer.html`, `preview/neural-pong.html`, `preview/neural-snake.html`, `preview/presentation-controller.html`, `preview/smart-home.html`, `preview/space-invaders.html` |
| **IMU** | `preview/generative-art.html`, `preview/model-rotator.html`, `preview/mudra-duel.html` |
| **Additive only** | `preview/emg-visualizer.html`, `preview/gesture-assistant.html`, `preview/pressure-painter.html`, `preview/runner.html`, `preview/waterful-ring-toss.html` |
| **All signals** | `preview/mudra-monitor.html` |

**Template**: `preview/mudra-ultimate-template.html` — baseline
webapp with connection handling, all signal handlers, fallback
controls, and telemetry HUD. Use as the default starting point
when no sample is a closer match.

**Selection rule**: Match by (1) motion mode, then (2) interaction
pattern (game, tool, dashboard), then (3) signal overlap. If
multiple samples match, prefer the simpler one.

## Build Defaults

- Default platform: webapp (single-file HTML)
- Always include Mudra badge text in output UI
- Always prefer interactive assets over static decoration
- Visible connection state indicator
- Visible mode label
- Compact telemetry HUD
- Simulation controls
- Keyboard fallback
- Responsive layout
- **Theme: infer from the app concept — NEVER default to dark.** Design a custom color palette that matches the concept. The sample code uses dark colors — **ignore them**. Only use dark if the user says "dark" or the concept is inherently dark (space, nightclub, etc.).

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

## Mock WebSocket (Legacy — superseded by Mode Toggle)

> **⚠ SUPERSEDED in v1.1.0.** The "always-open WS, fall back to mock on failure"
> pattern below is replaced by the explicit **Mode Toggle (Manual / Mudra)**
> architecture defined in the next section. Under the new model, Manual mode
> opens NO WebSocket and the simulator panel injects synthetic messages
> directly via `dispatch()`; Mudra mode opens a single real WebSocket only.
> The class below is kept for reference; new apps MUST use the Mode-Toggle
> scaffold instead. If you find yourself emitting `MudraWebSocket` or
> auto-firing intervals, stop — read § "Mode Toggle (Manual / Mudra) — Required".

**Canvas, iframes, and sandboxed environments block real WebSocket connections.**
Every app you generate MUST include a mock WebSocket that auto-activates when the
real connection fails. This is not optional — without it the app is broken in Canvas.

### Protocol violations — NEVER do these

```
// WRONG — plural key
{ "command": "subscribe", "signals": ["gesture", "pressure"] }

// WRONG — array value
{ "command": "subscribe", "signal": ["gesture", "pressure"] }

// WRONG — enable/disable commands do not exist in the new server
{ "command": "enable", "data": { "signals": ["gesture", "pressure"] } }
// → Use { "command": "subscribe", "signal": "gesture" } instead

// WRONG — raw WebSocket
const ws = new WebSocket('ws://127.0.0.1:8766');
```

```
// CORRECT — one subscribe per signal
ws.send(JSON.stringify({ "command": "subscribe", "signal": "gesture" }));
ws.send(JSON.stringify({ "command": "subscribe", "signal": "pressure" }));

// CORRECT — always use MudraWebSocket
const ws = new MudraWebSocket('ws://127.0.0.1:8766');
```

### How it works

Wrap the real `WebSocket` with a class that:
1. Tries the real connection first
2. If it fails (onerror / SecurityError), transparently switches to the mock
3. Emits realistic signal data on timers using the exact data formats below

### Required mock implementation

Always include this block in every generated app:

```javascript
// ── Mock WebSocket (auto-activates when real WS is blocked) ──────────────
class MudraWebSocket {
  constructor(url) {
    this._handlers = {};
    this._subscriptions = new Set();
    this._timers = [];
    this._useMock = false;

    try {
      this._ws = new WebSocket(url);
      this._ws.onopen    = (e) => { this._useMock = false; this._trigger('open', e); };
      this._ws.onmessage = (e) => this._trigger('message', e);
      this._ws.onclose   = (e) => this._trigger('close', e);
      this._ws.onerror   = ()  => { this._startMock(); };
    } catch (e) {
      this._startMock();
    }
  }

  set onopen(fn)    { this._handlers.open    = fn; }
  set onmessage(fn) { this._handlers.message = fn; }
  set onclose(fn)   { this._handlers.close   = fn; }
  set onerror(fn)   { this._handlers.error   = fn; }

  _trigger(event, data) {
    if (this._handlers[event]) this._handlers[event](data);
  }

  _emit(payload) {
    this._trigger('message', { data: JSON.stringify(payload) });
  }

  send(raw) {
    if (!this._useMock) { this._ws.send(raw); return; }
    const cmd = JSON.parse(raw);
    if (cmd.command === 'subscribe') this._subscriptions.add(cmd.signal);
    if (cmd.command === 'trigger_gesture') {
      // No confidence field — new Dart server does not emit it
      this._emit({ type: 'gesture', data: { type: cmd.data.type, timestamp: Date.now() }, timestamp: Date.now() });
    }
    if (cmd.command === 'get_status') {
      // Simulate a connected band response (mock always reports connected)
      this._emit({ type: 'status', data: {
        device: { name: 'Mudra Band (sim)', address: '00:00:00:00', battery: 85, charging: false,
          firmware: '6.0.0.0', serial_number: 1000000, hand: 'RIGHT', state: 'connected',
          firmware_config: { target: 'BandMode.mudraLink', active: false } },
        subscriptions: Object.fromEntries(['snc','imu_acc','imu_gyro','pressure','gesture','navigation','nav_direction','button'].map(s => [s, this._subscriptions.has(s)]))
      }, timestamp: Date.now() });
    }
  }

  _startMock() {
    this._useMock = true;
    // New server sends NO unsolicited frame on connect — just fire open
    setTimeout(() => {
      this._trigger('open', {});
    }, 100);

    // Gesture: random every 3 seconds — no confidence field
    this._timers.push(setInterval(() => {
      if (!this._subscriptions.has('gesture')) return;
      const types = ['tap', 'double_tap', 'twist', 'double_twist'];
      const type  = types[Math.floor(Math.random() * types.length)];
      this._emit({ type: 'gesture', data: { type, timestamp: Date.now() }, timestamp: Date.now() });
    }, 3000));

    // Pressure: sine wave at 20 Hz
    let t = 0;
    this._timers.push(setInterval(() => {
      if (!this._subscriptions.has('pressure')) return;
      t += 0.05;
      const norm = (Math.sin(t) + 1) / 2;
      this._emit({ type: 'pressure', data: { value: Math.round(norm * 100), normalized: norm, timestamp: Date.now() }, timestamp: Date.now() });
    }, 50));

    // Navigation: small random deltas at 20 Hz
    this._timers.push(setInterval(() => {
      if (!this._subscriptions.has('navigation')) return;
      this._emit({ type: 'navigation', data: { delta_x: (Math.random() - 0.5) * 6, delta_y: (Math.random() - 0.5) * 6, timestamp: Date.now() }, timestamp: Date.now() });
    }, 50));

    // nav_direction: random direction every 2.5 seconds
    this._timers.push(setInterval(() => {
      if (!this._subscriptions.has('nav_direction')) return;
      const dirs = ['Right', 'Left', 'Up', 'Down', 'Roll Left', 'Roll Right'];
      const direction = dirs[Math.floor(Math.random() * dirs.length)];
      this._emit({ type: 'nav_direction', data: { direction, timestamp: Date.now() }, timestamp: Date.now() });
    }, 2500));

    // IMU: smooth sine waves at 20 Hz
    let imuT = 0;
    this._timers.push(setInterval(() => {
      imuT += 0.03;
      if (this._subscriptions.has('imu_acc')) {
        this._emit({ type: 'imu_acc', data: { values: [Math.sin(imuT) * 2, Math.cos(imuT) * 2, 9.81], frequency: 1125, timestamp: Date.now() }, timestamp: Date.now() });
      }
      if (this._subscriptions.has('imu_gyro')) {
        this._emit({ type: 'imu_gyro', data: { values: [Math.sin(imuT) * 10, Math.cos(imuT) * 10, 0.5], frequency: 1125, timestamp: Date.now() }, timestamp: Date.now() });
      }
    }, 50));

    // battery is not a subscribable signal in the new Dart server — removed.
  }

  close() {
    this._timers.forEach(t => clearInterval(t));
    if (!this._useMock && this._ws) this._ws.close();
  }
}

// Use MudraWebSocket instead of WebSocket everywhere:
// const ws = new MudraWebSocket('ws://127.0.0.1:8766');
```

### Rules for using the mock

- Replace `new WebSocket(...)` with `new MudraWebSocket(...)` — everywhere, no exceptions
- The mock fires the exact same message format as the real device (see signal data formats above)
- The mock auto-starts when the real connection throws a SecurityError or any error
- The app code does not need to know whether it is talking to the real device or the mock

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
| WS `open` (in Mudra) | send `{command:"get_status"}` immediately (no waiting for any unsolicited frame — new server sends none), start status-poll timer, send all `subscribe` commands |
| inbound `status` where `device.firmware && device.serial_number` both non-null (band connected) | `connectionState = "mudra-connected"`, show hand chip (device.hand), hide warning |
| inbound `status` where firmware or serial_number is null (band not connected) | `connectionState = "ws-only"`, show orange "WebSocket only" label, hand chip = "None" |
| inbound `error` with `data.error === "client_already_connected"` | show terminal "close other tab" message; set suppress-reconnect flag; do NOT retry |
| WS error / WS close (in Mudra, suppress flag NOT set) | `connectionState = "reconnecting"`, stop status-poll, schedule reconnect with backoff [1,2,5,10]s |
| WS close (suppress flag IS set) | do nothing — terminal "in-use" state |
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
`button`, `imu_acc`, `imu_gyro`, `snc`, `status`, `device_info`,
`subscription_status`, `subscriptions`, `airtouch_state`, `error`.
`battery` is not a signal type — read from `status.data.device.battery`.
The server sends NO `connection_status` frame. Anything else: log + ignore.

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
   - If band connected → `setState("mudra-connected")`, update hand chip from `data.device.hand`.
   - If band NOT connected → `setState("ws-only")` (orange label, hand chip "None"). Keep the
     socket open. Do NOT call `closeSocket()`. Do NOT schedule a WS reconnect. The poll timer
     will pick the band up automatically the next tick after it pairs.
   - On `ws-only` → `mudra-connected` transition: replay subscription record (subscribe all).

3. On inbound `{type:"error", data:{error:"client_already_connected"}}` (in Mudra mode):
   - Set suppress-reconnect flag. Show terminal message: "Mudra Companion is already in use
     by another tab — please close it before continuing." Do NOT retry.

4. On WebSocket `error` or `close` (in Mudra mode, suppress flag NOT set):
   - `setState("reconnecting")`, stop the status-poll timer, schedule reconnect with
     backoff [1000, 2000, 5000, 10000] ms (capped at 10 s indefinitely).
   - On successful reconnect: reset backoff index, send `get_status`, replay subscriptions.

5. On WS close (suppress flag IS set):
   - Do nothing — terminal "in-use" state until page reload or Manual toggle.

6. On Manual mode:
   - Stop the status-poll timer in `closeSocket()` / on mode change. Clear suppress flag.

**Why poll instead of relying on push-only events?** The new Dart server sends no
unsolicited frame on connect and no `connection_status` push — it never did. Polling
`get_status` every 2 s is the only reliable way to detect a band that has gone away
after a previously good pairing. 2 s
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
      // battery is not a signal — handled in handleStatus via device.battery
      case "status":  handleStatus(msg.data); break;  // get_status response
      case "error":   handleError(msg.data); break;   // client_already_connected etc.
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
function dispatch(msg) {
  // New server sends NO connection_status frame — removed from dispatch.
  if (msg.type === "status") return handleStatus(msg.data);
  if (msg.type === "error" && msg.data?.error === "client_already_connected") {
    suppressReconnect = true;
    setState("in-use"); // terminal — show "close other tab" message
    return;
  }
  // …route to per-signal handlers (adapt to app needs)
}
let suppressReconnect = false;
function handleStatus(data) {
  if (mode !== "mudra") return;
  const dev = data?.device || {};
  // Band-connected rule: both firmware AND serial_number must be non-null.
  const bandConnected = Boolean(dev.firmware && dev.serial_number);
  if (bandConnected) setState("mudra-connected", dev.hand || "?");
  else               setState("ws-only");  // socket stays open; poll keeps probing
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
| Subscribing to `battery` signal | `battery` is not a subscribable signal. Server returns `invalid_signal`. Read `device.battery`/`device.charging` from `get_status` response instead. |
| Sending `enable`, `disable`, `get_docs`, `help`, or `auth` commands | These do not exist in the new server. Server returns `unknown_command`. |
| Reading `msg.data.confidence` from gesture frames | The new server does not emit `confidence`. Any threshold check silently fails. |
| Retrying after `client_already_connected` error | This is a terminal state. Show the "close other tab" message. Do NOT retry. |
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
`pressure` are mutually exclusive — never combine them. `button`
combines freely (subject to the Pointer/Direction/IMU XOR). `battery`
is NOT a subscribable signal — never call `subscribe battery`.

---

## Onboarding Modal (mandatory, STRICT) — feature 008-strict-onboarding-templates

> **Supersedes feature 005's loose modal rules.** The locked layout is
> **Template 3 — split-card**. The DOM, CSS, and JS below MUST be emitted
> **verbatim**. Only the per-app content slots may vary.

Every generated app MUST ship a first-run onboarding modal that greets the
user and lists every action the app supports, with paired **Mudra** and
**Manual** controls per action. The modal closes via `×` (skip), the
**Continue** button, or `Escape`. It re-opens via a small floating `?` icon
(2D apps always; 3D apps only outside immersive XR).

The binding contract is `specs/008-strict-onboarding-templates/contracts/onboarding-block.md`. The blocks below are the verbatim copies emitted into every app.

### Required palette addition

Every generated app's `:root` MUST add a single variable beyond the
canonical palette so the Continue button's text-on-primary contrast is
declared, not hard-coded:

```css
--on-primary: #0c0d10;  /* dark text on the primary-blue Continue button */
```

If the app concept's `--bg` is light, override `--on-primary` so the
Continue button text remains legible against `--primary`.

### Locked DOM (paste at end of `<body>`)

```html
<!-- === BEGIN onboarding-block === (Template 3 — Split Card, feature 008) -->
<!-- IMPORTANT: do NOT add the `open` attribute. The IIFE below calls
     showModal() on load so the dialog enters the browser's top layer.
     In non-modal mode (HTML `open`), clicks on Continue / × can be
     intercepted by an underlying canvas — the dialog appears visible
     but its buttons stop firing. -->
<dialog id="mudra-onboarding" data-mudra-onboarding data-app-name="{APP_NAME}">
  <div class="ob-card">
    <button class="ob-x" aria-label="Skip onboarding" data-ob-close>×</button>
    <div class="ob-left">
      <div class="ob-brand-block">
        <span class="ob-brand-mark">Mudra Studio</span>
        <h2 class="ob-brand-name">{APP_NAME_HEAD} <em>{APP_NAME_TAIL}</em></h2>
        <p class="ob-tagline">{APP_TAGLINE}</p>
      </div>
      <span class="ob-brand-footer">Created by Mudra</span>
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

### Locked CSS (paste inside the existing `<style>` block)

```css
/* === BEGIN onboarding-block === (Template 3 — Split Card, feature 008) */
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
  box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:var(--font-stack,'Poppins',system-ui,sans-serif);
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
.ob-chip{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:10px 12px;font-size:14px;}
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

### Locked JS (paste inside an inline `<script>` at end of `<body>`)

```js
// === BEGIN onboarding-block === (Template 3 — Split Card, feature 008)
window.MUDRA_ONBOARDING_ACTIONS = [
  // Filled by the skill from the app's subscribed signals. See "App-aware filter — strict" below.
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

### Close behavior — what each control does (verbatim explanation for the model)

| Control | When it fires | Effect |
|---|---|---|
| **Continue** (`.ob-continue`) | User clicks / activates the primary CTA in the right column | `root.close()`. Help-pill `?` becomes visible bottom-right. Modal is gone; user starts using the app. |
| **×** (`.ob-x`) | User clicks / activates the circular X in the top-right of the card | Same as Continue — `root.close()` + show `?` pill. The two paths are intentionally equivalent. X is the visual "skip" affordance. There is no separate "skip vs save" distinction; both routes are non-destructive and identical. |
| **Escape** | User presses Esc while modal is open | Native `<dialog>` close + our `keydown` handler unhides the `?` pill. |
| **`?` key** | User presses `?` while modal is closed | `root.showModal()` reopens. (2D apps: always; never gated by XR.) |
| **Help-pill** (`#mudra-onboarding-help`) | User clicks the floating `?` button bottom-right (visible only after the modal has been closed once) | `root.showModal()` reopens. |
| **Page load** | Every fresh render | `root.showModal()` runs unconditionally inside the IIFE. Help-pill starts hidden. |

### How "close" is wired (REQUIRED — do not refactor)

1. Both close buttons carry the `data-ob-close` attribute. The single line `root.querySelectorAll('[data-ob-close]').forEach(b => b.addEventListener('click', closeOb))` is the entire mouse/touch close wiring. If you add another close affordance later (do not, but if you did), giving it the same attribute is the only correct path.
2. Keyboard close is handled by the `document`-level `keydown` listener — never on the dialog itself, because Escape needs to fire even when focus is outside the dialog content.
3. Opening on load uses `root.showModal()` (modal mode, top layer). Never `root.show()` (non-modal) and never the `open` attribute in HTML. Both alternatives leave the dialog vulnerable to click interception by underlying canvases / overlays.

### Anti-patterns — will fail review

- ❌ `<dialog ... open>` in HTML. Open via `showModal()` only.
- ❌ Calling `root.show()` instead of `root.showModal()`.
- ❌ Adding click-outside-to-close, time-out auto-close, or any extra close path.
- ❌ Hiding `#mudra-onboarding-help` permanently after first close — it must reappear.
- ❌ Wiring `closeOb` to a button that lacks the `data-ob-close` attribute (the contract is data-attribute-driven on purpose).
- ❌ Differentiating × from Continue behaviorally (e.g., "X means skip, Continue means save"). They are the same close.

### Per-app content slots — the ONLY things you may vary

| Slot | Source | Notes |
|---|---|---|
| `{APP_NAME}` (`data-app-name`) | Derived from generated HTML filename (`drum-machine.html` → `Drum Machine`) | Preserved from feature 005. Override only to fix acronym capitalization. |
| `{APP_NAME_HEAD}` / `{APP_NAME_TAIL}` | App name split into a leading word + trailing word. Trailing word gets the `<em>` accent. | Single-word names: `{APP_NAME_HEAD}` is the whole word, `{APP_NAME_TAIL}` is empty (emit `<em></em>`). Three-plus words: first word in HEAD, rest in TAIL. |
| `{APP_TAGLINE}` | One-line description of the app | MUST end with a period. MUST NOT exceed 90 characters. |
| `MUDRA_ONBOARDING_ACTIONS` | Per `actions-array.md` (feature 008). | See filter rule below. |

### `MUDRA_ONBOARDING_ACTIONS` shape (renamed from feature-005 `ACTIONS`)

```js
window.MUDRA_ONBOARDING_ACTIONS = [
  { action: "Trigger pad",    mudra: "Tap",         manual: "Space",   mode: "gesture" },
  { action: "Adjust volume",  mudra: "Press 70%",   manual: "[ / ]",   mode: "pressure" },
  { action: "Cycle pad bank", mudra: "Twist",       manual: "Tab",     mode: "gesture" }
];
```

Each row has four required fields:

- **`action`** — the behavior in plain English. NOT the control name.
- **`mudra`** — the Mudra-control prose (e.g., `"Tap"`, `"Twist"`, `"Press 70%"`, `"Tilt left"`).
- **`manual`** — the keyboard / mouse fallback (`"Space"`, `"Shift + ←"`, `"[ / ]"`). Use `"—"` (em dash) if no Manual equivalent exists.
- **`mode`** — one of the nine canonical signal names: `gesture` | `button` | `pressure` | `navigation` | `nav_direction` | `imu_acc` | `imu_gyro` | `snc`. The skill uses this for the filter rule below.

### App-aware filter — STRICT (feature 008, FR-010)

Before emitting `MUDRA_ONBOARDING_ACTIONS`, the skill MUST filter:

1. **Build the subscribed set** — every canonical signal this specific app subscribes to.
2. **Drop every row** whose `mode` is not in the subscribed set. **Forbidden** to emit a row for an unsubscribed signal — that is a generation-time bug, not a runtime filter.
3. **Verify exactly one motion mode** (`navigation` | `nav_direction` | `imu_acc`/`imu_gyro` family) appears across all rows (Constitution Principle III).
4. **Verify Manual ↔ Mudra parity** — every row has both a Mudra and a Manual cell. `"—"` is the only acceptable Manual placeholder, and only when no Manual equivalent exists.
5. **No collisions** — no two rows share the same `manual` value (keyboard collision) or the same effective `mudra` value.

#### Anti-patterns (will fail review)

- ❌ Emitting a row with `mode: "pressure"` when the app does not subscribe to `pressure`.
- ❌ Mixing two motion modes (e.g., `nav_direction` AND `imu_acc`) in the same array.
- ❌ A row with `manual: null` or `manual: ""` — use `"—"` if no fallback exists.
- ❌ Two rows with `manual: "Space"` — keyboard collision.
- ❌ Renaming a canonical signal in `mode` (e.g., `"squeeze"` instead of `"pressure"`).
- ❌ `action: "Press Space"` — that's a control, not a behavior. Use `action: "Fire"`.

### Forbidden — never emit

- Any branding string other than literal `Created by Mudra` (preserved verbatim; no "Powered by", "Built with", "Mudra Studio" as a replacement — note "Mudra Studio" *does* appear as the `.ob-brand-mark` line above the app name, but never replaces the `.ob-brand-footer` line).
- Any CTA label other than `Continue`.
- Removing the left brand column or removing the `.ob-x` close button.
- Hard-coded hex inside the locked block (use canonical CSS variables and `--on-primary`).
- `<img>`, `<video>`, or live 3D preview inside the modal (deferred to a future feature).

### Cross-row invariants (REQUIRED — verify before emitting)

- At least one of `mudra` / `manual` is non-empty on every row.
- No two rows share the same `manual` value.
- No two rows share the same effective `mudra` value.
- Every keyboard shortcut wired in this app's keyboard handler appears as `manual` on exactly one row.
- Every signal subscription this app makes appears as `mode` on at least one row.
- No row references a control the app does not actually wire up (no orphans).

### Process

When generating a new app:

1. Inventory every distinct user-triggerable action this app implements.
2. For each, look up its Mudra control in the signal subscriptions and its keyboard/mouse trigger in the keyboard handler.
3. Compose one `MUDRA_ONBOARDING_ACTIONS` row per action with a behavior-style `action` value and the correct `mode`.
4. Apply the app-aware filter and verify the cross-row invariants.
5. Paste the locked DOM, CSS, and JS verbatim. Fill the four content slots (`data-app-name`, `{APP_NAME_HEAD}`, `{APP_NAME_TAIL}`, `{APP_TAGLINE}`) and the actions array. **Touch nothing else in the block.**

The binding contracts live at `specs/008-strict-onboarding-templates/contracts/onboarding-block.md` and `specs/008-strict-onboarding-templates/contracts/actions-array.md`. They are the source of truth if anything here is ambiguous.

> **Migration note (v2.2.0, 2026-05-14):** the legacy `ACTIONS` variable name from feature 005 is renamed to `MUDRA_ONBOARDING_ACTIONS`. The legacy `mudra-ultimate-template.html` baseline's onboarding block is superseded; generated apps emit the feature-008 block above. The `Got it` CTA label is renamed to `Continue`.

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

  <div class="mudra-badge">Created by Mudra</div>

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
    // getDocs, enable, disable removed — not supported in the new Dart server

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

        // Note: new server sends NO connection_status frame — use status frame instead
        if (msg.type === "status") handleStatus(msg.data);
        if (msg.type === "error" && msg.data?.error === "client_already_connected") {
          setStatus(false, "Mudra Companion is already in use by another tab — please close it before continuing.");
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
        // battery is not a signal — read device.battery from status response
      };
    }

    function getActiveSignals() {
      const base = ["gesture", "pressure", "snc"]; // battery is NOT subscribable
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

    function handleStatus(data = {}) {
      // Read battery from get_status response (battery is not a subscribable signal)
      const dev = data.device || {};
      if (typeof dev.battery === "number") {
        state.battery = dev.battery;
        state.charging = Boolean(dev.charging);
        if (ui.batteryValue) ui.batteryValue.textContent = `${state.battery}% ${state.charging ? "(charging)" : ""}`;
      }
      // Update connection label based on band-connected predicate
      const bandConnected = Boolean(dev.firmware && dev.serial_number);
      setStatus(bandConnected, bandConnected ? `Mudra connected (${dev.hand || "?"})` : "WebSocket only — band not connected");
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
        const step = 3;  // gentle navigation default — low sensitivity
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

### preview/mudra-monitor.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mudra Device Monitor</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    :root {
      --bg: #f8f9fa;
      --card: #ffffff;
      --card-inner: #f1f5f9;
      --primary: #4f46e5;
      --accent: #06b6d4;
      --text: #1e293b;
      --text-secondary: #64748b;
      --success: #22c55e;
      --warning: #eab308;
      --error: #ef4444;
      --border: rgba(79, 70, 229, 0.15);
      --border-dim: rgba(100, 116, 139, 0.12);
      --glow: rgba(79, 70, 229, 0.08);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: 'Poppins', system-ui, sans-serif;
      overflow-x: hidden;
    }

    /* ── Top Bar ── */
    .topbar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 20px;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-dim);
    }
    .topbar-left { display: flex; align-items: center; gap: 14px; }
    .topbar-title { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.01em; }
    .topbar-title span { color: var(--primary); }
    .topbar-right { display: flex; align-items: center; gap: 10px; }

    .conn-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 999px;
      border: 1px solid var(--border-dim);
      background: rgba(0,0,0,0.02);
      font-size: 0.82rem; font-weight: 500;
    }
    .conn-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--warning);
      box-shadow: 0 0 0 3px rgba(234,179,8,0.15);
      transition: all 200ms;
    }
    .conn-dot.on { background: var(--success); box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }
    .conn-dot.err { background: var(--error); box-shadow: 0 0 0 3px rgba(239,68,68,0.18); }

    .battery-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 999px;
      border: 1px solid var(--border-dim);
      background: rgba(0,0,0,0.02);
      font-size: 0.82rem; font-weight: 500;
    }
    .battery-icon {
      width: 22px; height: 12px; border: 1.5px solid var(--text-secondary);
      border-radius: 2px; position: relative;
    }
    .battery-icon::after {
      content: ''; position: absolute; right: -4px; top: 2px;
      width: 2px; height: 6px; background: var(--text-secondary); border-radius: 0 1px 1px 0;
    }
    .battery-fill {
      height: 100%; border-radius: 1px;
      background: var(--success); transition: width 300ms;
    }
    .battery-fill.low { background: var(--error); }
    .battery-fill.mid { background: var(--warning); }

    /* ── Dashboard Grid ── */
    .dashboard {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto auto auto auto;
      gap: 12px;
      padding: 14px 20px 80px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .card-title {
      font-size: 0.78rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--text-secondary); margin-bottom: 10px;
      display: flex; align-items: center; gap: 8px;
    }
    .card-title .icon { color: var(--primary); font-size: 0.9rem; }

    /* ── Gesture Panel ── */
    .gesture-panel { grid-column: 1; grid-row: 1; }
    .gesture-current {
      text-align: center; padding: 16px 0 12px;
    }
    .gesture-type {
      font-size: 2rem; font-weight: 700; color: var(--primary);
      transition: transform 120ms; text-transform: uppercase;
    }
    .gesture-type.flash { animation: gestureFlash 300ms ease; }
    @keyframes gestureFlash {
      0% { transform: scale(1); filter: brightness(1); }
      30% { transform: scale(1.12); filter: brightness(1.4); }
      100% { transform: scale(1); filter: brightness(1); }
    }
    .gesture-conf { font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px; }
    .gesture-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 10px;
    }
    .gesture-btn {
      padding: 8px 4px; border-radius: 8px; font-size: 0.72rem; font-weight: 600;
      text-align: center; border: 1px solid var(--border-dim);
      background: var(--card-inner); color: var(--text-secondary);
      cursor: pointer; transition: all 150ms;
    }
    .gesture-btn:hover { border-color: var(--primary); color: var(--primary); }
    .gesture-btn.active {
      background: rgba(79,70,229,0.12); border-color: var(--primary); color: var(--primary);
    }
    .gesture-history {
      margin-top: 10px; max-height: 110px; overflow-y: auto;
      font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
      color: var(--text-secondary); line-height: 1.6;
    }
    .gesture-history-item { display: flex; justify-content: space-between; padding: 2px 0; }
    .gesture-history-item .type { color: var(--primary); font-weight: 500; }

    /* ── Pressure Panel ── */
    .pressure-panel { grid-column: 2; grid-row: 1; }
    .gauge-container { display: flex; align-items: center; justify-content: center; padding: 10px 0; }
    .gauge-svg { width: 180px; height: 110px; }
    .gauge-bg { fill: none; stroke: rgba(148,163,184,0.15); stroke-width: 14; stroke-linecap: round; }
    .gauge-fill { fill: none; stroke: url(#gaugeGrad); stroke-width: 14; stroke-linecap: round; transition: stroke-dashoffset 80ms linear; }
    .gauge-text { font-size: 2rem; font-weight: 700; fill: var(--primary); text-anchor: middle; font-family: 'Poppins', sans-serif; }
    .gauge-label { font-size: 0.7rem; fill: var(--text-secondary); text-anchor: middle; font-family: 'Poppins', sans-serif; }
    .pressure-raw {
      display: flex; justify-content: space-between; padding: 6px 10px;
      background: var(--card-inner); border-radius: 8px; margin-top: 8px;
      font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
    }
    .pressure-raw span:first-child { color: var(--text-secondary); }
    .pressure-raw span:last-child { color: var(--primary); font-weight: 500; }

    /* ── Button Panel ── */
    .button-panel { grid-column: 3; grid-row: 1; }
    .button-vis {
      display: flex; align-items: center; justify-content: center;
      padding: 20px 0;
    }
    .button-circle {
      width: 100px; height: 100px; border-radius: 50%;
      border: 3px solid var(--border-dim);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; font-weight: 700; color: var(--text-secondary);
      transition: all 200ms; background: var(--card-inner);
    }
    .button-circle.pressed {
      border-color: var(--primary); color: var(--primary);
      background: rgba(79,70,229,0.08);
      box-shadow: 0 0 30px rgba(79,70,229,0.2);
      transform: scale(0.95);
    }
    .button-stats {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 12px;
    }
    .button-stat {
      text-align: center; padding: 8px; border-radius: 8px;
      background: var(--card-inner); border: 1px solid var(--border-dim);
    }
    .button-stat-val { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
    .button-stat-label { font-size: 0.68rem; color: var(--text-secondary); margin-top: 2px; }

    /* ── SNC Panel (wide) ── */
    .snc-panel { grid-column: 1 / 3; grid-row: 2; }
    .snc-graph-wrap { position: relative; height: 150px; margin-top: 4px; }
    .snc-canvas { width: 100%; height: 100%; display: block; border-radius: 8px; background: var(--card-inner); }
    .snc-legend {
      display: flex; gap: 16px; margin-top: 8px; font-size: 0.75rem;
    }
    .snc-legend-item { display: flex; align-items: center; gap: 5px; }
    .snc-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .snc-stats {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;
    }
    .snc-stat {
      padding: 6px 8px; border-radius: 8px; background: var(--card-inner);
      border: 1px solid var(--border-dim); text-align: center;
    }
    .snc-stat-val { font-size: 1rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .snc-stat-label { font-size: 0.68rem; color: var(--text-secondary); margin-top: 2px; }

    /* ── Navigation / Motion Panel ── */
    .motion-panel { grid-column: 3; grid-row: 2; }
    .mode-tabs {
      display: flex; gap: 4px; margin-bottom: 10px;
    }
    .mode-tab {
      flex: 1; padding: 6px 8px; border-radius: 8px;
      font-size: 0.72rem; font-weight: 600; text-align: center;
      border: 1px solid var(--border-dim); background: transparent;
      color: var(--text-secondary); cursor: pointer; transition: all 150ms;
    }
    .mode-tab.active {
      background: rgba(79,70,229,0.1); border-color: var(--primary); color: var(--primary);
    }
    .motion-stage {
      position: relative; height: 160px; border-radius: 10px;
      border: 1px solid var(--border-dim); background: var(--card-inner);
      overflow: hidden;
    }
    .motion-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px);
      background-size: 20px 20px; pointer-events: none;
    }
    .motion-crosshair-h, .motion-crosshair-v {
      position: absolute; background: rgba(79,70,229,0.1);
    }
    .motion-crosshair-h { left: 0; right: 0; top: 50%; height: 1px; }
    .motion-crosshair-v { top: 0; bottom: 0; left: 50%; width: 1px; }
    .motion-dot {
      position: absolute; left: 50%; top: 50%;
      width: 16px; height: 16px; border-radius: 50%;
      background: var(--primary); transform: translate(-50%, -50%);
      box-shadow: 0 0 12px rgba(79,70,229,0.4);
      transition: left 60ms linear, top 60ms linear;
    }
    .motion-coords {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;
      font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
    }
    .coord-box {
      padding: 5px 8px; border-radius: 6px; background: var(--card-inner);
      border: 1px solid var(--border-dim); display: flex; justify-content: space-between;
    }
    .coord-box .label { color: var(--text-secondary); }
    .coord-box .val { color: var(--primary); font-weight: 500; }

    /* ── Nav Direction Panel ── */
    .navdir-display { display: none; text-align: center; padding: 10px 0; }
    .navdir-display.visible { display: block; }
    .navdir-arrows {
      display: grid; grid-template: 1fr 1fr 1fr / 1fr 1fr 1fr;
      width: 130px; height: 130px; margin: 0 auto; gap: 3px;
    }
    .navdir-cell {
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px; font-size: 1.2rem; color: var(--text-secondary);
      border: 1px solid var(--border-dim); background: var(--card-inner);
      transition: all 150ms;
    }
    .navdir-cell.center { border: none; background: transparent; font-size: 0.6rem; font-weight: 600; }
    .navdir-cell.active { background: rgba(79,70,229,0.15); border-color: var(--primary); color: var(--primary); }
    .navdir-label { margin-top: 8px; font-size: 0.85rem; font-weight: 600; color: var(--primary); }

    /* ── IMU Panel (wide) ── */
    .imu-panel { grid-column: 1 / 3; grid-row: 3; }
    .imu-graphs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .imu-graph-wrap { position: relative; }
    .imu-graph-label {
      font-size: 0.72rem; font-weight: 600; color: var(--text-secondary);
      margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.06em;
    }
    .imu-canvas { width: 100%; height: 120px; display: block; border-radius: 8px; background: var(--card-inner); }
    .imu-values {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 6px;
      font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
    }
    .imu-val-box {
      padding: 4px 6px; border-radius: 6px; background: var(--card-inner);
      border: 1px solid var(--border-dim); text-align: center;
    }
    .imu-val-box .axis { font-weight: 600; }
    .imu-legend {
      display: flex; gap: 14px; margin-top: 8px; font-size: 0.72rem;
    }

    /* ── Controls Panel ── */
    .controls-panel { grid-column: 3; grid-row: 3; }
    .ctrl-section { margin-bottom: 12px; }
    .ctrl-section-title {
      font-size: 0.72rem; font-weight: 600; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;
    }
    .ctrl-btns { display: flex; flex-wrap: wrap; gap: 6px; }
    .ctrl-btn {
      padding: 7px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 600;
      border: 1px solid var(--border-dim); background: var(--card-inner);
      color: var(--text-secondary); cursor: pointer; transition: all 150ms;
      font-family: 'Poppins', sans-serif;
    }
    .ctrl-btn:hover { border-color: var(--primary); color: var(--primary); }
    .ctrl-btn.active { background: rgba(79,70,229,0.1); border-color: var(--primary); color: var(--primary); }
    .ctrl-btn.primary-btn {
      background: var(--primary); color: #ffffff; border-color: var(--primary);
    }
    .ctrl-btn.primary-btn:hover { filter: brightness(1.1); }

    .toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 5px 0; font-size: 0.8rem;
    }
    .toggle-row .sig-name { flex: 1; }
    .toggle-row .sig-pkts {
      font-family: 'JetBrains Mono', monospace; font-size: 0.68rem;
      color: var(--text-secondary); margin-right: 10px; min-width: 50px; text-align: right;
    }
    .toggle-switch {
      width: 36px; height: 20px; border-radius: 10px; flex-shrink: 0;
      background: rgba(148,163,184,0.25); cursor: pointer;
      position: relative; transition: background 200ms;
    }
    .toggle-switch.on { background: var(--primary); }
    .toggle-switch::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; border-radius: 50%;
      background: white; transition: transform 200ms;
    }
    .toggle-switch.on::after { transform: translateX(16px); }
    .toggle-switch.conflict { background: var(--warning); }
    .toggle-switch.conflict::after { background: #fff; }

    .sub-group-label {
      font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--text-secondary); margin-top: 8px;
      padding-bottom: 3px; border-bottom: 1px solid var(--border-dim);
    }
    .sub-group-label:first-child { margin-top: 0; }
    .sub-conflict-warn {
      font-size: 0.7rem; color: var(--warning); margin-top: 6px;
      padding: 5px 8px; border-radius: 6px;
      background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.2);
      display: none;
    }
    .sub-conflict-warn.visible { display: block; }

    .kbd {
      display: inline-block; padding: 2px 6px; border-radius: 4px;
      background: rgba(148,163,184,0.12); border: 1px solid var(--border-dim);
      font-family: 'JetBrains Mono', monospace; font-size: 0.68rem;
      color: var(--text-secondary);
    }
    .shortcut-list { font-size: 0.75rem; color: var(--text-secondary); line-height: 1.8; }

    /* ── Raw Log ── */
    .log-panel { grid-column: 1 / 4; grid-row: 4; }
    .log-header { display: flex; justify-content: space-between; align-items: center; }
    .log-filters { display: flex; gap: 4px; }
    .log-filter {
      padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600;
      border: 1px solid var(--border-dim); background: transparent;
      color: var(--text-secondary); cursor: pointer; transition: all 150ms;
      font-family: 'Poppins', sans-serif;
    }
    .log-filter.active { background: rgba(79,70,229,0.1); border-color: var(--primary); color: var(--primary); }
    .log-pre {
      margin-top: 8px; min-height: 120px; max-height: 220px;
      overflow: auto; padding: 10px; border-radius: 10px;
      border: 1px solid var(--border-dim); background: #080b0d;
      font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
      line-height: 1.4; color: #b0c4ca;
    }
    .log-line { white-space: pre; }
    .log-line .ts { color: #5a6b73; }
    .log-line .sig { color: var(--primary); font-weight: 500; }
    .log-line .err { color: var(--error); }
    .log-line .cmd { color: var(--warning); }

    .pkt-counter {
      font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
      color: var(--text-secondary);
    }

    /* ── Badge ── */
    .mudra-badge {
      position: fixed; bottom: 12px; right: 16px;
      font-size: 11px; color: var(--text-secondary);
      opacity: 0.55; letter-spacing: 0.02em; pointer-events: none;
      font-family: inherit;
    }

    /* ── Responsive ── */
    @media (max-width: 1100px) {
      .dashboard {
        grid-template-columns: 1fr 1fr;
      }
      .snc-panel { grid-column: 1 / 3; }
      .motion-panel { grid-column: 1; grid-row: 3; }
      .imu-panel { grid-column: 1 / 3; grid-row: 4; }
      .controls-panel { grid-column: 2; grid-row: 3; }
      .log-panel { grid-column: 1 / 3; grid-row: 5; }
    }
    @media (max-width: 700px) {
      .dashboard { grid-template-columns: 1fr; }
      .snc-panel, .imu-panel, .log-panel { grid-column: 1; }
      .motion-panel, .controls-panel { grid-column: 1; }
      .imu-graphs { grid-template-columns: 1fr; }
    }

    /* scrollbar */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(79,70,229,0.2); border-radius: 3px; }
  </style>
</head>
<body>
<!-- ── Top Bar ── -->
<header class="topbar">
  <div class="topbar-left">
    <a href="/gallery" style="padding:4px 12px;background:rgba(79,70,229,0.1);color:#4f46e5;text-decoration:none;font-size:12px;font-family:system-ui,sans-serif;border-radius:6px;border:1px solid rgba(79,70,229,0.2);transition:background 0.2s;white-space:nowrap;"onmouseenter="this.style.background='rgba(79,70,229,0.2)'"onmouseleave="this.style.background='rgba(79,70,229,0.1)'">&larr; Gallery</a>
    <div class="topbar-title"><span>Mudra</span> Device Monitor</div>
    <div class="conn-pill">
      <span class="conn-dot" id="connDot"></span>
      <span id="connText">Connecting...</span>
    </div>
  </div>
  <div class="topbar-right">
    <div class="battery-pill" id="batteryPill" style="display:none">
      <div class="battery-icon"><div class="battery-fill" id="batteryFill" style="width:0%"></div></div>
      <span id="batteryText">--%</span>
    </div>
    <div class="pkt-counter"><span id="pktCount">0</span> packets</div>
  </div>
</header>

<!-- ── Dashboard ── -->
<main class="dashboard">

  <!-- Gesture Panel -->
  <section class="card gesture-panel">
    <div class="card-title"><span class="icon">&#9995;</span> Gestures</div>
    <div class="gesture-current">
      <div class="gesture-type" id="gestureType">NONE</div>
      <div class="gesture-conf" id="gestureConf">confidence: --</div>
    </div>
    <div class="gesture-grid">
      <div class="gesture-btn" data-gesture="tap">TAP</div>
      <div class="gesture-btn" data-gesture="double_tap">DBL TAP</div>
      <div class="gesture-btn" data-gesture="twist">TWIST</div>
      <div class="gesture-btn" data-gesture="double_twist">DBL TWIST</div>
    </div>
    <div class="gesture-history" id="gestureHistory"></div>
  </section>

  <!-- Pressure Panel -->
  <section class="card pressure-panel">
    <div class="card-title"><span class="icon">&#9899;</span> Pressure</div>
    <div class="gauge-container">
      <svg class="gauge-svg" viewBox="0 0 200 120">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#4f46e5"/>
          </linearGradient>
        </defs>
        <path class="gauge-bg" d="M 20 100 A 80 80 0 0 1 180 100"/>
        <path class="gauge-fill" id="gaugeFill" d="M 20 100 A 80 80 0 0 1 180 100"
              stroke-dasharray="251.33" stroke-dashoffset="251.33"/>
        <text class="gauge-text" x="100" y="92" id="gaugeText">0%</text>
        <text class="gauge-label" x="100" y="110">PRESSURE</text>
      </svg>
    </div>
    <div class="pressure-raw">
      <span>Raw Value</span><span id="pressureRaw">0</span>
    </div>
    <div class="pressure-raw" style="margin-top:4px">
      <span>Normalized</span><span id="pressureNorm">0.000</span>
    </div>
    <div class="pressure-raw" style="margin-top:4px">
      <span>Smoothed</span><span id="pressureSmooth">0.000</span>
    </div>
  </section>

  <!-- Button Panel -->
  <section class="card button-panel">
    <div class="card-title"><span class="icon">&#9673;</span> Air Touch Button</div>
    <div class="button-vis">
      <div class="button-circle" id="buttonCircle">RELEASED</div>
    </div>
    <div class="button-stats">
      <div class="button-stat">
        <div class="button-stat-val" id="btnPressCount">0</div>
        <div class="button-stat-label">Presses</div>
      </div>
      <div class="button-stat">
        <div class="button-stat-val" id="btnHoldTime">0.0s</div>
        <div class="button-stat-label">Last Hold</div>
      </div>
      <div class="button-stat">
        <div class="button-stat-val" id="btnState">IDLE</div>
        <div class="button-stat-label">State</div>
      </div>
    </div>
  </section>

  <!-- SNC Panel -->
  <section class="card snc-panel">
    <div class="card-title"><span class="icon">&#9876;</span> SNC — Surface Nerve Conductance</div>
    <div class="snc-graph-wrap">
      <canvas class="snc-canvas" id="sncCanvas"></canvas>
    </div>
    <div class="snc-legend">
      <div class="snc-legend-item"><div class="snc-legend-dot" style="background:#4f46e5"></div>Ulnar</div>
      <div class="snc-legend-item"><div class="snc-legend-dot" style="background:#a78bfa"></div>Median</div>
      <div class="snc-legend-item"><div class="snc-legend-dot" style="background:#f472b6"></div>Radial</div>
    </div>
    <div class="snc-stats">
      <div class="snc-stat">
        <div class="snc-stat-val" id="sncUlnar" style="color:#4f46e5">0.000</div>
        <div class="snc-stat-label">Ulnar</div>
      </div>
      <div class="snc-stat">
        <div class="snc-stat-val" id="sncMedian" style="color:#a78bfa">0.000</div>
        <div class="snc-stat-label">Median</div>
      </div>
      <div class="snc-stat">
        <div class="snc-stat-val" id="sncRadial" style="color:#f472b6">0.000</div>
        <div class="snc-stat-label">Radial</div>
      </div>
    </div>
  </section>

  <!-- Motion / Navigation Panel -->
  <section class="card motion-panel">
    <div class="card-title"><span class="icon">&#10146;</span> Motion & Navigation</div>
    <div class="mode-tabs">
      <div class="mode-tab active" data-mode="pointer">Pointer</div>
      <div class="mode-tab" data-mode="direction">Direction</div>
      <div class="mode-tab" data-mode="imu">IMU</div>
    </div>

    <!-- Pointer / IMU stage -->
    <div class="motion-stage" id="motionStage">
      <div class="motion-grid"></div>
      <div class="motion-crosshair-h"></div>
      <div class="motion-crosshair-v"></div>
      <div class="motion-dot" id="motionDot"></div>
    </div>
    <div class="motion-coords" id="motionCoords">
      <div class="coord-box"><span class="label">X</span><span class="val" id="coordX">0.0</span></div>
      <div class="coord-box"><span class="label">Y</span><span class="val" id="coordY">0.0</span></div>
    </div>

    <!-- Nav Direction display -->
    <div class="navdir-display" id="navdirDisplay">
      <div class="navdir-arrows">
        <div class="navdir-cell"></div>
        <div class="navdir-cell" data-dir="Up">&#9650;</div>
        <div class="navdir-cell"></div>
        <div class="navdir-cell" data-dir="Left">&#9664;</div>
        <div class="navdir-cell center" id="navdirCenter">NONE</div>
        <div class="navdir-cell" data-dir="Right">&#9654;</div>
        <div class="navdir-cell" data-dir="Roll Left">&#8630;</div>
        <div class="navdir-cell" data-dir="Down">&#9660;</div>
        <div class="navdir-cell" data-dir="Roll Right">&#8631;</div>
      </div>
      <div class="navdir-label" id="navdirLabel">None</div>
    </div>
  </section>

  <!-- IMU Panel -->
  <section class="card imu-panel">
    <div class="card-title"><span class="icon">&#9850;</span> IMU — Inertial Measurement Unit</div>
    <div class="imu-graphs">
      <div class="imu-graph-wrap">
        <div class="imu-graph-label">Accelerometer (m/s&sup2;)</div>
        <canvas class="imu-canvas" id="accCanvas"></canvas>
        <div class="imu-values" id="accValues">
          <div class="imu-val-box"><span class="axis" style="color:#4f46e5">X</span> <span id="accX">0.00</span></div>
          <div class="imu-val-box"><span class="axis" style="color:#a78bfa">Y</span> <span id="accY">0.00</span></div>
          <div class="imu-val-box"><span class="axis" style="color:#f472b6">Z</span> <span id="accZ">9.81</span></div>
        </div>
      </div>
      <div class="imu-graph-wrap">
        <div class="imu-graph-label">Gyroscope (deg/s)</div>
        <canvas class="imu-canvas" id="gyroCanvas"></canvas>
        <div class="imu-values" id="gyroValues">
          <div class="imu-val-box"><span class="axis" style="color:#4f46e5">X</span> <span id="gyroX">0.00</span></div>
          <div class="imu-val-box"><span class="axis" style="color:#a78bfa">Y</span> <span id="gyroY">0.00</span></div>
          <div class="imu-val-box"><span class="axis" style="color:#f472b6">Z</span> <span id="gyroZ">0.00</span></div>
        </div>
      </div>
    </div>
    <div class="imu-legend">
      <div class="snc-legend-item"><div class="snc-legend-dot" style="background:#4f46e5"></div>X Axis</div>
      <div class="snc-legend-item"><div class="snc-legend-dot" style="background:#a78bfa"></div>Y Axis</div>
      <div class="snc-legend-item"><div class="snc-legend-dot" style="background:#f472b6"></div>Z Axis</div>
    </div>
  </section>

  <!-- Controls Panel -->
  <section class="card controls-panel">
    <div class="card-title"><span class="icon">&#9881;</span> Controls & Simulation</div>

    <div class="ctrl-section">
      <div class="ctrl-section-title">Subscriptions</div>

      <div class="sub-group-label">Universal</div>
      <div class="toggle-row" data-signal="gesture">
        <span class="sig-name">gesture</span>
        <span class="sig-pkts" id="pkts-gesture">0</span>
        <div class="toggle-switch on" data-sub="gesture"></div>
      </div>
      <div class="toggle-row" data-signal="pressure">
        <span class="sig-name">pressure</span>
        <span class="sig-pkts" id="pkts-pressure">0</span>
        <div class="toggle-switch on" data-sub="pressure"></div>
      </div>
      <div class="toggle-row" data-signal="snc">
        <span class="sig-name">snc</span>
        <span class="sig-pkts" id="pkts-snc">0</span>
        <div class="toggle-switch on" data-sub="snc"></div>
      </div>
      <!-- battery removed — not a subscribable signal in new Dart server -->

      <div class="sub-group-label">Pointer Mode</div>
      <div class="toggle-row" data-signal="navigation">
        <span class="sig-name">navigation</span>
        <span class="sig-pkts" id="pkts-navigation">0</span>
        <div class="toggle-switch on" data-sub="navigation"></div>
      </div>
      <div class="toggle-row" data-signal="button">
        <span class="sig-name">button</span>
        <span class="sig-pkts" id="pkts-button">0</span>
        <div class="toggle-switch on" data-sub="button"></div>
      </div>

      <div class="sub-group-label">Direction Mode</div>
      <div class="toggle-row" data-signal="nav_direction">
        <span class="sig-name">nav_direction</span>
        <span class="sig-pkts" id="pkts-nav_direction">0</span>
        <div class="toggle-switch" data-sub="nav_direction"></div>
      </div>

      <div class="sub-group-label">IMU Mode</div>
      <div class="toggle-row" data-signal="imu_acc">
        <span class="sig-name">imu_acc</span>
        <span class="sig-pkts" id="pkts-imu_acc">0</span>
        <div class="toggle-switch" data-sub="imu_acc"></div>
      </div>
      <div class="toggle-row" data-signal="imu_gyro">
        <span class="sig-name">imu_gyro</span>
        <span class="sig-pkts" id="pkts-imu_gyro">0</span>
        <div class="toggle-switch" data-sub="imu_gyro"></div>
      </div>

      <div class="sub-conflict-warn" id="subConflictWarn">
        &#9888; Conflicting motion groups active — device behavior undefined.
      </div>
    </div>

    <div class="ctrl-section">
      <div class="ctrl-section-title">Commands</div>
      <div class="ctrl-btns">
        <button class="ctrl-btn primary-btn" id="cmdResubscribe">Resubscribe</button>
        <button class="ctrl-btn" id="cmdGetStatus">Status</button>
        <button class="ctrl-btn" id="cmdGetSubs">Subs</button>
        <button class="ctrl-btn" id="cmdGetDocs">Docs</button>
      </div>
    </div>

    <div class="ctrl-section">
      <div class="ctrl-section-title">Simulate Gestures</div>
      <div class="ctrl-btns">
        <button class="ctrl-btn" data-sim="tap">Tap</button>
        <button class="ctrl-btn" data-sim="double_tap">Dbl Tap</button>
        <button class="ctrl-btn" data-sim="twist">Twist</button>
        <button class="ctrl-btn" data-sim="double_twist">Dbl Twist</button>
      </div>
    </div>

    <div class="ctrl-section">
      <div class="ctrl-section-title">Keyboard Fallback</div>
      <div class="shortcut-list">
        <kbd class="kbd">Space</kbd> Tap gesture<br>
        <kbd class="kbd">Shift</kbd> Button hold<br>
        <kbd class="kbd">[</kbd> <kbd class="kbd">]</kbd> Pressure -/+<br>
        <kbd class="kbd">&#8592;&#8593;&#8595;&#8594;</kbd> Motion / Direction<br>
        <kbd class="kbd">1-4</kbd> Simulate gestures<br>
        <kbd class="kbd">M</kbd> Cycle motion mode
      </div>
    </div>
  </section>

  <!-- Raw Log -->
  <section class="card log-panel">
    <div class="log-header">
      <div class="card-title" style="margin-bottom:0"><span class="icon">&#9637;</span> Raw Data Stream</div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="log-filters">
          <button class="log-filter active" data-filter="all">All</button>
          <button class="log-filter" data-filter="gesture">Gesture</button>
          <button class="log-filter" data-filter="pressure">Pressure</button>
          <button class="log-filter" data-filter="imu">IMU</button>
          <button class="log-filter" data-filter="snc">SNC</button>
          <button class="log-filter" data-filter="nav">Nav</button>
          <button class="log-filter" data-filter="cmd">Commands</button>
        </div>
        <button class="ctrl-btn" id="clearLog" style="padding:4px 10px;font-size:0.7rem">Clear</button>
      </div>
    </div>
    <pre class="log-pre" id="logPre"></pre>
  </section>

</main>

<div class="mudra-badge">Created by Mudra</div>

<script>
// ═══════════════════════════════════════════════════════════════
//  Mudra Device Monitor — Full Signal Dashboard
// ═══════════════════════════════════════════════════════════════

const WS_URL = "ws://127.0.0.1:8766";
const MAX_LOG = 200;
const GRAPH_POINTS = 200;
const PRESSURE_SMOOTH_WINDOW = 5;

// ── State ──
let controlMode = "pointer";
let ws = null;
let reconnectTimer = null;
let packetCount = 0;
let logFilter = "all";
const pressureSamples = [];

// Subscription tracking
// battery is NOT a subscribable signal — removed from activeSubs and ALL_SIGNALS
const activeSubs = new Set(["gesture", "pressure", "snc", "navigation", "button"]);
const packetCounts = {};
const ALL_SIGNALS = ["gesture", "pressure", "snc", "navigation", "button", "nav_direction", "imu_acc", "imu_gyro"];
const MOTION_CONFLICTS = {
  navigation: ["nav_direction", "imu_acc", "imu_gyro"],
  button:     ["nav_direction", "imu_acc", "imu_gyro"],
  nav_direction: ["navigation", "button", "imu_acc", "imu_gyro"],
  imu_acc:    ["navigation", "button", "nav_direction"],
  imu_gyro:   ["navigation", "button", "nav_direction"],
};

const state = {
  gesture: { type: "none", timestamp: 0 },
  pressure: { value: 0, normalized: 0, smoothed: 0 },
  button: { state: "released", pressCount: 0, lastPressTime: 0, lastHoldDuration: 0 },
  nav: { x: 0, y: 0 },
  navDirection: "None",
  imuAcc: [0, 0, 9.81],
  imuGyro: [0, 0, 0],
  snc: [0, 0, 0],
  battery: { level: -1, charging: false } // populated from get_status, not subscription
};

const gestureHistory = [];

// Graph data ring buffers
const sncHistory = { ch0: [], ch1: [], ch2: [] };
const accHistory = { x: [], y: [], z: [] };
const gyroHistory = { x: [], y: [], z: [] };

for (let i = 0; i < GRAPH_POINTS; i++) {
  sncHistory.ch0.push(0); sncHistory.ch1.push(0); sncHistory.ch2.push(0);
  accHistory.x.push(0); accHistory.y.push(0); accHistory.z.push(9.81);
  gyroHistory.x.push(0); gyroHistory.y.push(0); gyroHistory.z.push(0);
}

const logEntries = [];

// ── DOM ──
const $ = id => document.getElementById(id);
const ui = {
  connDot: $("connDot"), connText: $("connText"),
  batteryPill: $("batteryPill"), batteryFill: $("batteryFill"), batteryText: $("batteryText"),
  pktCount: $("pktCount"),
  gestureType: $("gestureType"), gestureConf: $("gestureConf"), gestureHistory: $("gestureHistory"),
  gaugeFill: $("gaugeFill"), gaugeText: $("gaugeText"),
  pressureRaw: $("pressureRaw"), pressureNorm: $("pressureNorm"), pressureSmooth: $("pressureSmooth"),
  buttonCircle: $("buttonCircle"), btnPressCount: $("btnPressCount"),
  btnHoldTime: $("btnHoldTime"), btnState: $("btnState"),
  sncCanvas: $("sncCanvas"), sncUlnar: $("sncUlnar"), sncMedian: $("sncMedian"), sncRadial: $("sncRadial"),
  motionStage: $("motionStage"), motionDot: $("motionDot"),
  coordX: $("coordX"), coordY: $("coordY"), motionCoords: $("motionCoords"),
  navdirDisplay: $("navdirDisplay"), navdirCenter: $("navdirCenter"), navdirLabel: $("navdirLabel"),
  accCanvas: $("accCanvas"), gyroCanvas: $("gyroCanvas"),
  accX: $("accX"), accY: $("accY"), accZ: $("accZ"),
  gyroX: $("gyroX"), gyroY: $("gyroY"), gyroZ: $("gyroZ"),
  logPre: $("logPre"),
};

// ── Canvas contexts ──
let sncCtx, accCtx, gyroCtx;

function initCanvases() {
  const dpr = window.devicePixelRatio || 1;
  [ui.sncCanvas, ui.accCanvas, ui.gyroCanvas].forEach(c => {
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    c.getContext("2d").scale(dpr, dpr);
    c._w = rect.width;
    c._h = rect.height;
  });
  sncCtx = ui.sncCanvas.getContext("2d");
  accCtx = ui.accCanvas.getContext("2d");
  gyroCtx = ui.gyroCanvas.getContext("2d");
}

// ── Connection ──
function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  try { ws = new WebSocket(WS_URL); } catch { setConn("err", "Invalid URL"); return; }

  ws.onopen = () => {
    setConn("on", "Connected to Mudra Companion");
    subscribeAll();
  };
  ws.onclose = () => {
    setConn("off", "Disconnected — retrying...");
    scheduleReconnect();
  };
  ws.onerror = () => {
    setConn("err", "Connection error");
  };
  ws.onmessage = (e) => {
    const msg = parseMsg(e.data);
    if (!msg) return;
    packetCount++;
    ui.pktCount.textContent = packetCount;
    routeMessage(msg);
  };
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, 1500);
}

function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function parseMsg(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function setConn(status, text) {
  ui.connDot.className = "conn-dot" + (status === "on" ? " on" : status === "err" ? " err" : "");
  ui.connText.textContent = text;
}

// ── Subscriptions ──
function subscribeTo(signal) {
  send({ command: "subscribe", signal });
  activeSubs.add(signal);
  syncToggleUI(signal);
  checkConflicts();
  addLog("cmd", "subscribe", { signal });
}

function unsubscribeFrom(signal) {
  send({ command: "unsubscribe", signal });
  activeSubs.delete(signal);
  syncToggleUI(signal);
  checkConflicts();
  addLog("cmd", "unsubscribe", { signal });
}

function syncToggleUI(signal) {
  const toggle = document.querySelector(`.toggle-switch[data-sub="${signal}"]`);
  if (toggle) toggle.classList.toggle("on", activeSubs.has(signal));
}

function syncAllToggles() {
  ALL_SIGNALS.forEach(s => syncToggleUI(s));
  checkConflicts();
}

function checkConflicts() {
  const motionSigs = ["navigation", "button", "nav_direction", "imu_acc", "imu_gyro"];
  const activeMotion = motionSigs.filter(s => activeSubs.has(s));

  const hasPointer = activeMotion.some(s => s === "navigation" || s === "button");
  const hasDir = activeMotion.includes("nav_direction");
  const hasImu = activeMotion.some(s => s === "imu_acc" || s === "imu_gyro");
  const groupCount = [hasPointer, hasDir, hasImu].filter(Boolean).length;

  const warn = document.getElementById("subConflictWarn");
  warn.classList.toggle("visible", groupCount > 1);

  // Mark conflicting toggles
  motionSigs.forEach(sig => {
    const toggle = document.querySelector(`.toggle-switch[data-sub="${sig}"]`);
    if (!toggle) return;
    const conflicts = MOTION_CONFLICTS[sig] || [];
    const hasConflict = activeSubs.has(sig) && conflicts.some(c => activeSubs.has(c));
    toggle.classList.toggle("conflict", hasConflict);
  });
}

function getActiveSignals() {
  return [...activeSubs];
}

function subscribeAll() {
  activeSubs.forEach(s => send({ command: "subscribe", signal: s }));
  addLog("cmd", "subscribe", { signals: [...activeSubs] });
}

function unsubMotion() {
  ["navigation", "button", "nav_direction", "imu_acc", "imu_gyro"].forEach(s => {
    send({ command: "unsubscribe", signal: s });
    activeSubs.delete(s);
  });
  syncAllToggles();
}

function switchMode(mode) {
  if (mode === controlMode) return;
  unsubMotion();
  controlMode = mode;

  // Subscribe to the new mode's motion signals
  const modeSignals = {
    pointer: ["navigation", "button"],
    direction: ["nav_direction"],
    imu: ["imu_acc", "imu_gyro"],
  };
  (modeSignals[mode] || []).forEach(s => {
    activeSubs.add(s);
    send({ command: "subscribe", signal: s });
  });

  // Also re-subscribe universal ones (battery removed — not a subscribable signal)
  ["gesture", "pressure", "snc"].forEach(s => {
    if (activeSubs.has(s)) send({ command: "subscribe", signal: s });
  });

  syncAllToggles();
  updateModeUI();
  resetMotion();
}

function updatePacketCounts() {
  ALL_SIGNALS.forEach(s => {
    const el = document.getElementById(`pkts-${s}`);
    if (el) el.textContent = packetCounts[s] || 0;
  });
}

// ── Message Router ──
function routeMessage(msg) {
  const t = msg.type;
  const d = msg.data || {};

  // New server sends NO connection_status frame. Use status frame for band state.
  if (t === "status") {
    const dev = d.device || {};
    const bandOn = Boolean(dev.firmware && dev.serial_number);
    setConn(bandOn ? "on" : "ws-only", bandOn ? `Mudra connected (${dev.hand || "?"})` : "WebSocket only — band not connected");
    addLog("status", t, d);
    return;
  }
  if (t === "error" && d.error === "client_already_connected") {
    setConn("in-use", "Mudra Companion is already in use by another tab — please close it before continuing.");
    addLog("error", t, d);
    return;
  }

  // Track packet counts per signal
  packetCounts[t] = (packetCounts[t] || 0) + 1;

  if (t === "gesture") onGesture(d);
  else if (t === "pressure") onPressure(d);
  else if (t === "button") onButton(d);
  else if (t === "navigation") onNavigation(d);
  else if (t === "nav_direction") onNavDirection(d);
  else if (t === "imu_acc") onImuAcc(d);
  else if (t === "imu_gyro") onImuGyro(d);
  else if (t === "snc") onSnc(d);
  // battery is NOT a signal — handled in "status" branch above via d.device.battery

  addLog(categorize(t), t, d);
}

function categorize(t) {
  if (t === "gesture") return "gesture";
  if (t === "pressure") return "pressure";
  if (t === "imu_acc" || t === "imu_gyro") return "imu";
  if (t === "snc") return "snc";
  if (t === "navigation" || t === "nav_direction" || t === "button") return "nav";
  return "other";
}

// ── Signal Handlers ──
function onGesture(d) {
  state.gesture.type = d.type || "unknown";
  // Note: confidence field removed — new Dart server does not emit it
  state.gesture.timestamp = d.timestamp || Date.now();

  ui.gestureType.textContent = state.gesture.type.toUpperCase();
  if (ui.gestureConf) ui.gestureConf.textContent = state.gesture.type;
  flashEl(ui.gestureType, "flash");

  // highlight grid btn
  document.querySelectorAll(".gesture-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.gesture === state.gesture.type);
  });

  // history
  gestureHistory.unshift({
    type: state.gesture.type,
    conf: state.gesture.confidence,
    time: new Date().toLocaleTimeString()
  });
  if (gestureHistory.length > 30) gestureHistory.pop();
  renderGestureHistory();
}

function onPressure(d) {
  const raw = d.value ?? 0;
  const norm = clamp01(d.normalized ?? 0);
  pressureSamples.push(norm);
  if (pressureSamples.length > PRESSURE_SMOOTH_WINDOW) pressureSamples.shift();
  const smoothed = pressureSamples.reduce((a, b) => a + b, 0) / pressureSamples.length;

  state.pressure = { value: raw, normalized: norm, smoothed };

  const pct = Math.round(smoothed * 100);
  const arcLen = 251.33;
  ui.gaugeFill.style.strokeDashoffset = arcLen - (arcLen * smoothed);
  ui.gaugeText.textContent = `${pct}%`;
  ui.pressureRaw.textContent = raw;
  ui.pressureNorm.textContent = norm.toFixed(3);
  ui.pressureSmooth.textContent = smoothed.toFixed(3);
}

function onButton(d) {
  const s = d.state || "released";
  const prev = state.button.state;
  state.button.state = s;

  if (s === "pressed" && prev !== "pressed") {
    state.button.pressCount++;
    state.button.lastPressTime = Date.now();
  }
  if (s === "released" && prev === "pressed" && state.button.lastPressTime) {
    state.button.lastHoldDuration = (Date.now() - state.button.lastPressTime) / 1000;
  }

  ui.buttonCircle.textContent = s.toUpperCase();
  ui.buttonCircle.classList.toggle("pressed", s === "pressed");
  ui.btnPressCount.textContent = state.button.pressCount;
  ui.btnHoldTime.textContent = state.button.lastHoldDuration.toFixed(1) + "s";
  ui.btnState.textContent = s === "pressed" ? "HELD" : "IDLE";
}

function onNavigation(d) {
  if (controlMode !== "pointer") return;
  const dx = Number(d.delta_x || 0);
  const dy = Number(d.delta_y || 0);
  state.nav.x = clamp(state.nav.x + dx * 0.9, -120, 120);
  state.nav.y = clamp(state.nav.y + dy * 0.9, -90, 90);
  updateMotionDot();
}

function onNavDirection(d) {
  state.navDirection = d.direction || "None";
  ui.navdirCenter.textContent = state.navDirection;
  ui.navdirLabel.textContent = state.navDirection;

  document.querySelectorAll(".navdir-cell[data-dir]").forEach(c => {
    c.classList.toggle("active", c.dataset.dir === state.navDirection);
  });
}

function onImuAcc(d) {
  const v = Array.isArray(d.values) ? d.values : [0, 0, 9.81];
  state.imuAcc = [Number(v[0]||0), Number(v[1]||0), Number(v[2]||9.81)];

  pushRing(accHistory.x, state.imuAcc[0]);
  pushRing(accHistory.y, state.imuAcc[1]);
  pushRing(accHistory.z, state.imuAcc[2]);

  ui.accX.textContent = state.imuAcc[0].toFixed(2);
  ui.accY.textContent = state.imuAcc[1].toFixed(2);
  ui.accZ.textContent = state.imuAcc[2].toFixed(2);

  if (controlMode === "imu") projectImu();
}

function onImuGyro(d) {
  const v = Array.isArray(d.values) ? d.values : [0, 0, 0];
  state.imuGyro = [Number(v[0]||0), Number(v[1]||0), Number(v[2]||0)];

  pushRing(gyroHistory.x, state.imuGyro[0]);
  pushRing(gyroHistory.y, state.imuGyro[1]);
  pushRing(gyroHistory.z, state.imuGyro[2]);

  ui.gyroX.textContent = state.imuGyro[0].toFixed(2);
  ui.gyroY.textContent = state.imuGyro[1].toFixed(2);
  ui.gyroZ.textContent = state.imuGyro[2].toFixed(2);

  if (controlMode === "imu") projectImu();
}

function onSnc(d) {
  const v = Array.isArray(d.values) ? d.values : [0, 0, 0];
  state.snc = [Number(v[0]||0), Number(v[1]||0), Number(v[2]||0)];

  pushRing(sncHistory.ch0, state.snc[0]);
  pushRing(sncHistory.ch1, state.snc[1]);
  pushRing(sncHistory.ch2, state.snc[2]);

  ui.sncUlnar.textContent = state.snc[0].toFixed(3);
  ui.sncMedian.textContent = state.snc[1].toFixed(3);
  ui.sncRadial.textContent = state.snc[2].toFixed(3);
}

function onBattery(d) {
  if (typeof d.level !== "number") return;
  state.battery.level = d.level;
  state.battery.charging = !!d.charging;

  ui.batteryPill.style.display = "inline-flex";
  ui.batteryFill.style.width = d.level + "%";
  ui.batteryFill.className = "battery-fill" + (d.level <= 15 ? " low" : d.level <= 40 ? " mid" : "");
  ui.batteryText.textContent = d.level + "%" + (d.charging ? " &#9889;" : "");
}

// ── Motion helpers ──
function projectImu() {
  const x = clamp(state.imuAcc[0] * 12 + state.imuGyro[2] * 0.15, -120, 120);
  const y = clamp(-state.imuAcc[1] * 12 + state.imuGyro[0] * 0.15, -90, 90);
  state.nav.x = x;
  state.nav.y = y;
  updateMotionDot();
}

function updateMotionDot() {
  const stage = ui.motionStage;
  const w = stage.offsetWidth;
  const h = stage.offsetHeight;
  const px = 50 + (state.nav.x / 120) * 45;
  const py = 50 + (state.nav.y / 90) * 45;
  ui.motionDot.style.left = clamp(px, 5, 95) + "%";
  ui.motionDot.style.top = clamp(py, 5, 95) + "%";
  ui.coordX.textContent = state.nav.x.toFixed(1);
  ui.coordY.textContent = state.nav.y.toFixed(1);
}

function resetMotion() {
  state.nav.x = 0; state.nav.y = 0;
  state.imuAcc = [0, 0, 9.81]; state.imuGyro = [0, 0, 0];
  state.navDirection = "None";
  updateMotionDot();
  ui.navdirCenter.textContent = "NONE";
  ui.navdirLabel.textContent = "None";
  document.querySelectorAll(".navdir-cell[data-dir]").forEach(c => c.classList.remove("active"));
}

function updateModeUI() {
  document.querySelectorAll(".mode-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.mode === controlMode);
  });
  const showStage = controlMode !== "direction";
  ui.motionStage.style.display = showStage ? "block" : "none";
  ui.motionCoords.style.display = showStage ? "grid" : "none";
  ui.navdirDisplay.classList.toggle("visible", controlMode === "direction");
}

// ── Graphs ──
function drawGraph(ctx, canvas, datasets, yRange) {
  const w = canvas._w;
  const h = canvas._h;
  ctx.clearRect(0, 0, w, h);

  const [yMin, yMax] = yRange;
  const range = yMax - yMin;

  // grid lines
  ctx.strokeStyle = "rgba(148,163,184,0.06)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const gy = (h / 4) * i;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  }

  // zero line
  const zeroY = h - ((0 - yMin) / range) * h;
  ctx.strokeStyle = "rgba(148,163,184,0.12)";
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, zeroY); ctx.lineTo(w, zeroY); ctx.stroke();

  datasets.forEach(({ data, color }) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((data[i] - yMin) / range) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

function renderGraphs() {
  if (!sncCtx) return;

  drawGraph(sncCtx, ui.sncCanvas, [
    { data: sncHistory.ch0, color: "#4f46e5" },
    { data: sncHistory.ch1, color: "#a78bfa" },
    { data: sncHistory.ch2, color: "#f472b6" }
  ], [-1, 1]);

  drawGraph(accCtx, ui.accCanvas, [
    { data: accHistory.x, color: "#4f46e5" },
    { data: accHistory.y, color: "#a78bfa" },
    { data: accHistory.z, color: "#f472b6" }
  ], [-20, 20]);

  drawGraph(gyroCtx, ui.gyroCanvas, [
    { data: gyroHistory.x, color: "#4f46e5" },
    { data: gyroHistory.y, color: "#a78bfa" },
    { data: gyroHistory.z, color: "#f472b6" }
  ], [-250, 250]);
}

// ── Gesture History ──
function renderGestureHistory() {
  ui.gestureHistory.innerHTML = gestureHistory.slice(0, 15).map(g =>
    `<div class="gesture-history-item"><span class="type">${g.type}</span><span>${(g.conf * 100).toFixed(0)}%</span><span>${g.time}</span></div>`
  ).join("");
}

// ── Log ──
function addLog(category, type, data) {
  const ts = new Date().toLocaleTimeString("en-US", { hour12: false, fractionalSecondDigits: 2 });
  logEntries.unshift({ ts, category, type, data });
  if (logEntries.length > MAX_LOG) logEntries.pop();
  renderLog();
}

function renderLog() {
  const filtered = logFilter === "all"
    ? logEntries
    : logEntries.filter(e => e.category === logFilter);

  ui.logPre.innerHTML = filtered.slice(0, 80).map(e => {
    const cls = e.category === "cmd" ? "cmd" : e.category === "status" ? "err" : "sig";
    const d = typeof e.data === "object" ? JSON.stringify(e.data) : String(e.data);
    return `<div class="log-line"><span class="ts">${e.ts}</span>  <span class="${cls}">[${e.type}]</span>  ${d}</div>`;
  }).join("");
}

// ── Event Bindings ──
// Mode tabs
document.querySelectorAll(".mode-tab").forEach(tab => {
  tab.addEventListener("click", () => switchMode(tab.dataset.mode));
});

// Simulate gesture buttons (both in gesture panel & controls panel)
document.querySelectorAll("[data-sim]").forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.sim;
    send({ command: "trigger_gesture", data: { type } });
    onGesture({ type, timestamp: Date.now() });
  });
});
document.querySelectorAll(".gesture-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.gesture;
    send({ command: "trigger_gesture", data: { type } });
    onGesture({ type, timestamp: Date.now() });
  });
});

// Subscription toggles
document.querySelectorAll(".toggle-switch[data-sub]").forEach(toggle => {
  toggle.addEventListener("click", () => {
    const signal = toggle.dataset.sub;
    if (activeSubs.has(signal)) {
      unsubscribeFrom(signal);
    } else {
      subscribeTo(signal);
    }
  });
});

// Command buttons
$("cmdResubscribe").addEventListener("click", () => {
  // Unsubscribe all, then resubscribe everything currently toggled on
  ALL_SIGNALS.forEach(s => send({ command: "unsubscribe", signal: s }));
  activeSubs.forEach(s => send({ command: "subscribe", signal: s }));
  addLog("cmd", "resubscribe", { signals: [...activeSubs] });
});
$("cmdGetStatus").addEventListener("click", () => {
  send({ command: "get_status" });
  addLog("cmd", "get_status", {});
});
$("cmdGetSubs").addEventListener("click", () => {
  send({ command: "get_subscriptions" });
  addLog("cmd", "get_subscriptions", {});
});
// get_docs removed — not supported in new Dart server

// Log filters
document.querySelectorAll(".log-filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".log-filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    logFilter = btn.dataset.filter;
    renderLog();
  });
});
$("clearLog").addEventListener("click", () => {
  logEntries.length = 0;
  renderLog();
});

// ── Keyboard Fallback ──
document.addEventListener("keydown", (e) => {
  if (e.repeat) return;

  if (e.code === "Space") {
    e.preventDefault();
    send({ command: "trigger_gesture", data: { type: "tap" } });
    onGesture({ type: "tap"});
  }
  if (e.key === "Shift") {
    onButton({ state: "pressed" });
  }
  if (e.key === "[") {
    onPressure({ value: Math.max(0, state.pressure.value - 8), normalized: clamp01(state.pressure.smoothed - 0.08) });
  }
  if (e.key === "]") {
    onPressure({ value: Math.min(100, state.pressure.value + 8), normalized: clamp01(state.pressure.smoothed + 0.08) });
  }
  if (e.key === "1") { send({ command: "trigger_gesture", data: { type: "tap" } }); onGesture({ type: "tap"}); }
  if (e.key === "2") { send({ command: "trigger_gesture", data: { type: "double_tap" } }); onGesture({ type: "double_tap"}); }
  if (e.key === "3") { send({ command: "trigger_gesture", data: { type: "twist" } }); onGesture({ type: "twist"}); }
  if (e.key === "4") { send({ command: "trigger_gesture", data: { type: "double_twist" } }); onGesture({ type: "double_twist"}); }
  if (e.key === "m" || e.key === "M") {
    const modes = ["pointer", "direction", "imu"];
    switchMode(modes[(modes.indexOf(controlMode) + 1) % modes.length]);
  }

  if (e.key.startsWith("Arrow")) {
    e.preventDefault();
    const step = 3;  // gentle navigation default — low sensitivity
    if (controlMode === "pointer") {
      if (e.key === "ArrowLeft") onNavigation({ delta_x: -step, delta_y: 0 });
      if (e.key === "ArrowRight") onNavigation({ delta_x: step, delta_y: 0 });
      if (e.key === "ArrowUp") onNavigation({ delta_x: 0, delta_y: -step });
      if (e.key === "ArrowDown") onNavigation({ delta_x: 0, delta_y: step });
    } else if (controlMode === "direction") {
      const map = { ArrowLeft: "Left", ArrowRight: "Right", ArrowUp: "Up", ArrowDown: "Down" };
      onNavDirection({ direction: map[e.key] || "None" });
    } else {
      const ax = state.imuAcc[0] + (e.key === "ArrowRight" ? 0.5 : e.key === "ArrowLeft" ? -0.5 : 0);
      const ay = state.imuAcc[1] + (e.key === "ArrowDown" ? 0.5 : e.key === "ArrowUp" ? -0.5 : 0);
      onImuAcc({ values: [ax, ay, 9.81] });
      onImuGyro({ values: [ay * 18, ax * 18, ax * 9] });
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") onButton({ state: "released" });
});

// ── Stage drag fallback ──
let stageDrag = false;
ui.motionStage.addEventListener("pointerdown", (e) => { stageDrag = true; ui.motionStage.setPointerCapture(e.pointerId); });
ui.motionStage.addEventListener("pointerup", () => { stageDrag = false; });
ui.motionStage.addEventListener("pointermove", (e) => {
  if (!stageDrag) return;
  const rect = ui.motionStage.getBoundingClientRect();
  const xn = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const yn = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  if (controlMode === "pointer") {
    state.nav.x = clamp(xn * 120, -120, 120);
    state.nav.y = clamp(yn * 90, -90, 90);
    updateMotionDot();
  } else if (controlMode === "imu") {
    onImuAcc({ values: [xn * 2, -yn * 2, 9.81] });
    onImuGyro({ values: [yn * 30, xn * 30, xn * 15] });
  }
});

// ── Utilities ──
function pushRing(arr, val) {
  arr.push(val);
  if (arr.length > GRAPH_POINTS) arr.shift();
}

function flashEl(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function clamp01(v) { return Number.isFinite(v) ? clamp(v, 0, 1) : 0; }

// ── Render Loop ──
let graphFrame = 0;
function frame() {
  graphFrame++;
  if (graphFrame % 2 === 0) renderGraphs(); // ~30fps graphs
  if (graphFrame % 30 === 0) updatePacketCounts(); // ~2fps packet count update
  requestAnimationFrame(frame);
}

// ── Init ──
window.addEventListener("load", () => {
  initCanvases();
  updateModeUI();
  syncAllToggles();
  connect();
  frame();
});

window.addEventListener("resize", () => {
  initCanvases();
});
</script>
</body>
</html>

```

### preview/space-invaders.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Space Invaders - Mudra Edition v2</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #f8f9fa;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: 'Courier New', monospace;
            color: #1e293b;
            overflow: hidden;
        }

        h1 {
            color: #4f46e5;
            margin: 20px 0;
            text-shadow: 0 0 10px rgba(79, 70, 229, 0.5);
            font-size: 32px;
        }

        #gameCanvas {
            border: 2px solid #4f46e5;
            box-shadow: 0 0 20px rgba(79, 70, 229, 0.3);
            background: #ffffff;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        }

        #mudraHud {
            position: fixed;
            top: 10px;
            right: 10px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            z-index: 10;
        }

        .hud-card {
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(79, 70, 229, 0.25);
            border-radius: 8px;
            padding: 8px 12px;
            min-width: 180px;
        }

        .hud-status {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .hud-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #eab308;
            box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.15);
            transition: background 150ms ease, box-shadow 150ms ease;
        }

        .hud-dot.connected {
            background: #22c55e;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
        }

        .hud-label {
            color: #64748b;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .hud-value {
            color: #4f46e5;
            font-weight: 700;
        }

        .hud-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 4px;
        }

        .hud-bar {
            height: 4px;
            border-radius: 2px;
            background: rgba(148, 163, 184, 0.22);
            margin-top: 4px;
            overflow: hidden;
        }

        .hud-bar > span {
            display: block;
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #06b6d4, #4f46e5);
            transition: width 75ms linear;
        }

        .hud-actions {
            display: flex;
            gap: 4px;
            margin-top: 6px;
        }

        .hud-btn {
            border: none;
            border-radius: 5px;
            padding: 4px 8px;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            background: #4f46e5;
            color: #ffffff;
            font-family: inherit;
        }

        .hud-btn.secondary {
            background: transparent;
            color: #64748b;
            border: 1px solid rgba(148, 163, 184, 0.3);
            font-weight: 600;
        }

        #instructions {
            margin-top: 15px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            max-width: 800px;
        }

        .mudra-badge {
            position: fixed;
            bottom: 12px;
            right: 12px;
            font-size: 11px;
            color: #64748b;
            opacity: 0.7;
            font-family: inherit;
            letter-spacing: 0.02em;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <a href="/gallery" style="position:fixed;top:12px;left:12px;z-index:9999;padding:6px 14px;background:rgba(255,255,255,0.8);color:#4f46e5;text-decoration:none;font-size:13px;font-family:system-ui,sans-serif;border-radius:8px;backdrop-filter:blur(8px);border:1px solid rgba(79,70,229,0.2);transition:background 0.2s;"onmouseenter="this.style.background='rgba(255,255,255,0.95)'"onmouseleave="this.style.background='rgba(255,255,255,0.8)'">&larr; Gallery</a>
    <h1>SPACE INVADERS - MUDRA EDITION</h1>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <div id="instructions">
        <p><strong>KEYBOARD:</strong> Arrow keys / A D - Move | SPACE - Shoot | S - Shield | P - Pause | 1-4 - Power level</p>
        <p><strong>MUDRA:</strong> Hand tilt - Move | Tap gesture - Shoot | Pressure - Power control</p>
    </div>

    <!-- Mudra Telemetry HUD -->
    <div id="mudraHud">
        <div class="hud-card">
            <div class="hud-status">
                <span class="hud-dot" id="hudDot"></span>
                <span id="hudStatusText">Connecting...</span>
            </div>
            <div class="hud-actions">
                <button class="hud-btn" id="btnSimTap">Sim Tap</button>
                <button class="hud-btn secondary" id="btnResub">Resub</button>
                <button class="hud-btn secondary" id="btnGetStatus">Status</button>
            </div>
        </div>
        <div class="hud-card">
            <div class="hud-row">
                <span class="hud-label">Gesture</span>
                <span class="hud-value" id="hudGesture">none</span>
            </div>
            <div class="hud-row">
                <span class="hud-label">Navigation</span>
                <span class="hud-value" id="hudDirection">dx:0</span>
            </div>
            <div class="hud-row">
                <span class="hud-label">Pressure</span>
                <span class="hud-value" id="hudPressure">0%</span>
            </div>
            <div class="hud-bar"><span id="hudPressureBar"></span></div>
            <div class="hud-row">
                <span class="hud-label">Battery</span>
                <span class="hud-value" id="hudBattery">--</span>
            </div>
        </div>
    </div>

    <div class="mudra-badge">Created by Mudra</div>

    <script>
        // ─── Canvas ───
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const COLORS = {
            black: '#f8f9fa',
            cardBg: '#1e293b',
            primary: '#4f46e5',
            accent: '#06b6d4',
            success: '#22c55e',
            warning: '#eab308',
            error: '#ef4444',
            text: '#1e293b',
            textSecondary: '#64748b',
            textMuted: '#94a3b8'
        };

        // ─── Sprites ───
        const SPRITES = {
            squid: [
                `  ####
 ##  ##
########
## ## ##
 #    # `,
                `  ####
 ##  ##
########
## ## ##
#  ##  #`
            ],
            crab: [
                ` #    #
  #  #
 ######
## ## ##
########
 #    # `,
                ` #    #
 #    #
 ######
## ## ##
########
# #  # #`
            ],
            octopus: [
                `   ##
  ####
 ######
## ## ##
########
 # ## # `,
                `   ##
  ####
 ######
## ## ##
########
#  ##  #`
            ],
            player: `   ##
   ##
 ######
########
## ## ##`,
            ufo: `  ####
 ##  ##
########
 #  #  #`,
            shield: `##########
####  ####
###    ###
##      ##`
        };

        function parseSprite(pattern) {
            const lines = pattern.trim().split('\n');
            const pixels = [];
            for (let y = 0; y < lines.length; y++) {
                for (let x = 0; x < lines[y].length; x++) {
                    if (lines[y][x] === '#') pixels.push({x, y});
                }
            }
            return {pixels, width: Math.max(...lines.map(l => l.length)), height: lines.length};
        }

        function drawSprite(sprite, x, y, color, pixelSize = 3) {
            ctx.fillStyle = color;
            for (let pixel of sprite.pixels) {
                ctx.fillRect(x + pixel.x * pixelSize, y + pixel.y * pixelSize, pixelSize, pixelSize);
            }
        }

        const parsedSprites = {
            squid: SPRITES.squid.map(s => parseSprite(s)),
            crab: SPRITES.crab.map(s => parseSprite(s)),
            octopus: SPRITES.octopus.map(s => parseSprite(s)),
            player: parseSprite(SPRITES.player),
            ufo: parseSprite(SPRITES.ufo),
            shield: parseSprite(SPRITES.shield)
        };

        // ─── Game State ───
        let gameState = {
            state: 'menu',
            score: 0,
            level: 1,
            lives: 3,
            paused: false,
            introTimer: 10 * 60,
            isBossLevel: false
        };

        // ─── Mudra Connection (Protocol-safe) ───
        const WS_URL = "ws://127.0.0.1:8766";
        const PRESSURE_WINDOW = 5;
        const pressureSamples = [];
        let reconnectTimer;

        const mudra = {
            connected: false,
            deviceReady: false,
            ws: null,
            gesture: "none",
            gestureTimestamp: 0,
            navDeltaDisplay: "0",
            pressure: 0,
            smoothPressure: 0,
            battery: null,
            charging: false,
            // Game-facing signals
            deltaX: 0,           // accumulated navigation delta, consumed each frame
            shootTriggered: false,
            shieldTriggered: false
        };

        // HUD elements
        const hud = {
            dot: document.getElementById('hudDot'),
            statusText: document.getElementById('hudStatusText'),
            gesture: document.getElementById('hudGesture'),
            direction: document.getElementById('hudDirection'),
            pressure: document.getElementById('hudPressure'),
            pressureBar: document.getElementById('hudPressureBar'),
            battery: document.getElementById('hudBattery')
        };

        function connectMudra() {
            try {
                mudra.ws = new WebSocket(WS_URL);

                mudra.ws.onopen = () => {
                    mudra.connected = true;
                    setMudraStatus(true, "Connected");
                    subscribeSignals();
                };

                mudra.ws.onmessage = (event) => {
                    let msg;
                    try { msg = JSON.parse(event.data); } catch { return; }

                    // Connection status from Companion
                    // connection_status removed — new server does not emit it

                    if (msg.type === "gesture") handleMudraGesture(msg.data);
                    if (msg.type === "navigation") handleMudraNavigation(msg.data);
                    if (msg.type === "pressure") handleMudraPressure(msg.data);
                    if (msg.type === "battery") handleMudraBattery(msg.data);
                };

                mudra.ws.onerror = () => {
                    mudra.connected = false;
                    mudra.deviceReady = false;
                    setMudraStatus(false, "Connection error");
                };

                mudra.ws.onclose = () => {
                    mudra.connected = false;
                    mudra.deviceReady = false;
                    setMudraStatus(false, "Disconnected. Reconnecting...");
                    scheduleReconnect();
                };
            } catch (e) {
                console.log('Mudra not available');
            }
        }

        function subscribeSignals() {
            // Pointer mode: navigation for continuous movement + gesture/pressure freely combine
            // (no nav_direction, no imu — signal-safe)
            const signals = ["gesture", "navigation", "pressure"];
            signals.forEach(signal => sendMudra({ command: "subscribe", signal }));
        }

        function sendMudra(payload) {
            if (!mudra.ws || mudra.ws.readyState !== WebSocket.OPEN) return;
            mudra.ws.send(JSON.stringify(payload));
        }

        function scheduleReconnect() {
            clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connectMudra, 1200);
        }

        function setMudraStatus(connected, text) {
            hud.dot.classList.toggle('connected', connected);
            hud.statusText.textContent = text;
        }

        // ─── Signal Handlers ───
        function handleMudraGesture(data = {}) {
            const type = data.type || "unknown";
            mudra.gesture = type;
            mudra.gestureTimestamp = Date.now();
            hud.gesture.textContent = type;
            pulseHud(hud.gesture);

            // Map gestures to game actions
            if (type === "tap") {
                mudra.shootTriggered = true;
            }
            if (type === "double_tap") {
                mudra.shieldTriggered = true;
            }
        }

        function handleMudraNavigation(data = {}) {
            const dx = Number(data.delta_x || 0);
            const dy = Number(data.delta_y || 0);
            // Accumulate deltas — consumed each frame in player.update()
            mudra.deltaX += dx * 3;
            hud.direction.textContent = `dx:${dx.toFixed(1)}`;
        }

        function handleMudraPressure(data = {}) {
            const normalized = clamp01(Number(data.normalized ?? 0));
            pressureSamples.push(normalized);
            if (pressureSamples.length > PRESSURE_WINDOW) pressureSamples.shift();
            mudra.smoothPressure = pressureSamples.reduce((s, v) => s + v, 0) / pressureSamples.length;
            mudra.pressure = normalized;

            hud.pressure.textContent = `${Math.round(mudra.smoothPressure * 100)}%`;
            hud.pressureBar.style.width = `${Math.round(mudra.smoothPressure * 100)}%`;
        }

        function handleMudraBattery(data = {}) {
            if (typeof data.level !== "number") return;
            mudra.battery = data.level;
            mudra.charging = Boolean(data.charging);
            hud.battery.textContent = `${mudra.battery}%${mudra.charging ? " ⚡" : ""}`;
        }

        function pulseHud(el) {
            el.style.transition = 'none';
            el.style.transform = 'scale(1.15)';
            void el.offsetWidth;
            el.style.transition = 'transform 150ms ease-out';
            el.style.transform = 'scale(1)';
        }

        // ─── HUD Buttons ───
        document.getElementById('btnSimTap').addEventListener('click', () => {
            sendMudra({ command: "trigger_gesture", data: { type: "tap" } });
            handleMudraGesture({ type: "tap" });
        });

        document.getElementById('btnResub').addEventListener('click', subscribeSignals);

        document.getElementById('btnGetStatus').addEventListener('click', () => {
            sendMudra({ command: "get_status" });
        });

        // ─── Audio ───
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        function playSound(freq, type = 'square', duration = 0.1, vol = 0.1) {
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gain.gain.setValueAtTime(vol, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            } catch (e) {}
        }

        // ─── Player ───
        class Player {
            constructor() {
                this.x = canvas.width / 2 - 15;
                this.y = canvas.height - 80;
                this.width = 30;
                this.height = 21;
                this.speed = 3;
                this.heat = 0;
                this.shieldActive = false;
                this.shieldTime = 0;
                this.keyboardPower = 0.5;
            }

            update(keys) {
                // Keyboard movement
                if (keys['arrowleft'] || keys['a']) this.x -= this.speed;
                if (keys['arrowright'] || keys['d']) this.x += this.speed;

                // Mudra navigation movement (continuous delta)
                if (mudra.connected && mudra.deltaX !== 0) {
                    this.x += mudra.deltaX;
                    mudra.deltaX = 0; // consume
                }

                this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

                if (this.heat > 0) this.heat = Math.max(0, this.heat - 0.5);

                if (this.shieldActive) {
                    this.shieldTime--;
                    if (this.shieldTime <= 0) this.shieldActive = false;
                }
            }

            draw() {
                const overheating = this.heat > 75;
                if (overheating && Math.floor(Date.now() / 100) % 2 === 0) {
                    drawSprite(parsedSprites.player, this.x, this.y, COLORS.error, 3);
                } else {
                    drawSprite(parsedSprites.player, this.x, this.y, COLORS.primary, 3);
                }

                if (this.shieldActive) {
                    ctx.strokeStyle = COLORS.primary;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 25, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            activateShield() {
                this.shieldActive = true;
                this.shieldTime = 180;
                playSound(800, 'sine', 0.2);
            }
        }

        // ─── Power Bar ───
        class PowerBar {
            constructor() {
                this.x = 10;
                this.y = canvas.height - 30;
                this.width = 200;
                this.height = 20;
            }

            draw(pressure) {
                ctx.fillStyle = COLORS.cardBg;
                ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

                const fillWidth = this.width * pressure;
                let color;
                if (pressure < 0.25) color = COLORS.textMuted;
                else if (pressure < 0.5) color = COLORS.success;
                else if (pressure < 0.75) color = COLORS.warning;
                else color = COLORS.error;

                ctx.fillStyle = color;
                ctx.fillRect(this.x, this.y, fillWidth, this.height);

                ctx.fillStyle = COLORS.text;
                ctx.font = '12px Courier New';
                ctx.fillText('POWER', this.x, this.y - 5);
            }
        }

        // ─── Bullet ───
        class Bullet {
            constructor(x, y, power) {
                this.x = x;
                this.y = y;
                this.speed = 10;
                this.power = power;
                this.active = true;
                this.damage = power < 0.25 ? 0.5 : power < 0.5 ? 1 : power < 0.75 ? 2 : 4;

                if (power < 0.25) this.color = COLORS.textMuted;
                else if (power < 0.5) this.color = COLORS.success;
                else if (power < 0.75) this.color = COLORS.warning;
                else this.color = COLORS.error;
            }

            update() {
                this.y -= this.speed;
                if (this.y < 0) this.active = false;
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - 2, this.y, 4, 15);
            }
        }

        // ─── Enemy ───
        class Enemy {
            constructor(x, y, type) {
                this.x = x;
                this.y = y;
                this.type = type;
                this.active = true;
                this.frame = 0;
                this.animTimer = 0;
                this.flashTimer = 0;

                if (type === 0) {
                    this.sprite = parsedSprites.squid;
                    this.color = COLORS.error;
                    this.points = 30;
                    this.maxHealth = 4;
                } else if (type === 1) {
                    this.sprite = parsedSprites.crab;
                    this.color = COLORS.warning;
                    this.points = 20;
                    this.maxHealth = 2;
                } else {
                    this.sprite = parsedSprites.octopus;
                    this.color = COLORS.success;
                    this.points = 10;
                    this.maxHealth = 1;
                }

                this.health = this.maxHealth;
                this.width = this.sprite[0].width * 3;
                this.height = this.sprite[0].height * 3;
            }

            takeDamage(damage) {
                this.health -= damage;
                this.flashTimer = 5;
                if (this.health <= 0) { this.active = false; return true; }
                return false;
            }

            update() {
                this.animTimer++;
                if (this.animTimer >= 30) { this.animTimer = 0; this.frame = 1 - this.frame; }
                if (this.flashTimer > 0) this.flashTimer--;
            }

            draw() {
                if (!this.active) return;
                const color = this.flashTimer > 0 ? COLORS.text : this.color;
                drawSprite(this.sprite[this.frame], this.x, this.y, color, 3);
            }
        }

        // ─── Boss ───
        class Boss {
            constructor(level) {
                this.x = canvas.width / 2 - 60;
                this.y = 60;
                this.width = 120;
                this.height = 90;
                this.maxHealth = 20 + Math.floor(level / 3) * 10;
                this.health = this.maxHealth;
                this.level = level;
                this.active = true;
                this.direction = 1;
                this.speed = 2;
                this.shootTimer = 0;
                this.frame = 0;
                this.animTimer = 0;
                this.flashTimer = 0;
            }

            get phase() {
                const pct = this.health / this.maxHealth;
                if (pct < 0.33) return 3;
                if (pct < 0.66) return 2;
                return 1;
            }

            update(playerX) {
                this.animTimer++;
                if (this.animTimer >= 20) { this.animTimer = 0; this.frame = 1 - this.frame; }

                this.x += this.speed * this.direction;
                if (this.x <= 50 || this.x >= canvas.width - this.width - 50) this.direction *= -1;

                if (this.phase === 3) {
                    const diff = (playerX - this.width / 2) - this.x;
                    this.x += Math.max(-4, Math.min(4, diff * 0.1));
                }
                this.x = Math.max(10, Math.min(canvas.width - this.width - 10, this.x));

                if (this.flashTimer > 0) this.flashTimer--;
            }

            takeDamage(damage) {
                this.health -= damage;
                this.flashTimer = 10;
                playSound(200, 'triangle', 0.1);
                return this.health <= 0;
            }

            draw() {
                const flash = this.flashTimer > 0 && this.flashTimer % 4 < 2;
                let color;
                if (flash) color = COLORS.text;
                else if (this.phase === 3) color = COLORS.error;
                else if (this.phase === 2) color = COLORS.warning;
                else color = '#c850ff';

                ctx.fillStyle = color;
                ctx.fillRect(this.x, this.y, this.width, this.height);

                ctx.fillStyle = COLORS.black;
                ctx.fillRect(this.x + 20, this.y + 25, 15, 15);
                ctx.fillRect(this.x + 85, this.y + 25, 15, 15);

                // Health bar
                const barWidth = 200;
                const barX = canvas.width / 2 - barWidth / 2;
                ctx.fillStyle = COLORS.cardBg;
                ctx.fillRect(barX - 2, 18, barWidth + 4, 16);

                const pct = this.health / this.maxHealth;
                ctx.fillStyle = this.phase === 3 ? COLORS.error : this.phase === 2 ? COLORS.warning : COLORS.success;
                ctx.fillRect(barX, 20, barWidth * pct, 12);

                ctx.fillStyle = '#c850ff';
                ctx.font = 'bold 12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(`BOSS LV.${Math.floor(this.level / 3)}`, canvas.width / 2, 15);
                ctx.textAlign = 'left';
            }
        }

        // ─── Shield ───
        class Shield {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.pixelSize = 4;
                this.width = parsedSprites.shield.width * this.pixelSize;
                this.height = parsedSprites.shield.height * this.pixelSize;
                this.health = 10;
                this.active = true;
            }

            takeDamage() {
                this.health--;
                if (this.health <= 0) this.active = false;
            }

            draw() {
                if (!this.active) return;
                drawSprite(parsedSprites.shield, this.x, this.y, COLORS.primary, 4);
                if (this.health < 10) {
                    ctx.fillStyle = COLORS.error;
                    ctx.fillRect(this.x, this.y - 5, (this.health / 10) * this.width, 3);
                }
            }
        }

        // ─── Game Manager ───
        let player = new Player();
        let powerBar = new PowerBar();
        let bullets = [];
        let enemies = [];
        let shields = [];
        let boss = null;
        let shootCooldown = 0;
        let keys = {};
        let menuCursorX = canvas.width / 2;

        function createEnemies() {
            enemies = [];
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 10; col++) {
                    const type = row === 0 ? 0 : row < 3 ? 1 : 2;
                    enemies.push(new Enemy(50 + col * 70, 80 + row * 40, type));
                }
            }
        }

        function createShields() {
            shields = [];
            for (let i = 0; i < 4; i++) {
                shields.push(new Shield(100 + i * 180, canvas.height - 150));
            }
        }

        function nextLevel() {
            gameState.level++;
            gameState.isBossLevel = gameState.level % 3 === 0;

            if (gameState.isBossLevel) {
                boss = new Boss(gameState.level);
                enemies = [];
                playSound(100, 'sawtooth', 0.5);
            } else {
                boss = null;
                createEnemies();
                playSound(800, 'sine', 0.3);
            }
        }

        function checkCollisions() {
            for (let bullet of bullets) {
                if (!bullet.active) continue;

                if (boss && boss.active) {
                    if (bullet.x > boss.x && bullet.x < boss.x + boss.width &&
                        bullet.y > boss.y && bullet.y < boss.y + boss.height) {
                        bullet.active = false;
                        if (boss.takeDamage(bullet.damage)) {
                            gameState.score += 500;
                            boss.active = false;
                            boss = null;
                            playSound(50, 'sawtooth', 1);
                        }
                    }
                }

                for (let enemy of enemies) {
                    if (!enemy.active) continue;
                    if (bullet.x > enemy.x && bullet.x < enemy.x + enemy.width &&
                        bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) {
                        bullet.active = false;
                        const destroyed = enemy.takeDamage(bullet.damage);
                        if (destroyed) {
                            gameState.score += enemy.points;
                            playSound(150, 'sawtooth', 0.1);
                        } else {
                            playSound(300, 'square', 0.05);
                        }
                    }
                }

                for (let shield of shields) {
                    if (!shield.active) continue;
                    if (bullet.x > shield.x && bullet.x < shield.x + shield.width &&
                        bullet.y > shield.y && bullet.y < shield.y + shield.height) {
                        bullet.active = false;
                        shield.takeDamage();
                    }
                }
            }
        }

        function drawHUD() {
            ctx.fillStyle = COLORS.text;
            ctx.font = '18px Courier New';
            ctx.fillText(`Score: ${gameState.score}`, 10, 30);
            ctx.fillText(`Level: ${gameState.level}`, 10, 55);

            const hearts = '\u2764\uFE0F'.repeat(gameState.lives);
            ctx.fillText(`Lives: ${hearts}`, canvas.width - 150, 30);

            if (!mudra.connected) {
                ctx.fillStyle = COLORS.textMuted;
                ctx.font = '12px Courier New';
                ctx.fillText('Power: 1=Low 2=Med 3=High 4=Max', canvas.width - 250, 55);
            }

            if (gameState.isBossLevel && boss && boss.active && Date.now() % 1000 < 500) {
                ctx.fillStyle = COLORS.error;
                ctx.font = 'bold 24px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('BOSS FIGHT!', canvas.width / 2, 55);
                ctx.textAlign = 'left';
            }
        }

        function drawMenu() {
            if (keys['arrowleft'] || keys['a']) menuCursorX -= 3;
            if (keys['arrowright'] || keys['d']) menuCursorX += 3;
            // Mudra navigation on menu
            if (mudra.deltaX !== 0) {
                menuCursorX += mudra.deltaX;
                mudra.deltaX = 0;
            }
            menuCursorX = Math.max(50, Math.min(canvas.width - 50, menuCursorX));

            ctx.fillStyle = COLORS.primary;
            ctx.font = 'bold 48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('SPACE INVADERS', canvas.width / 2, 150);

            ctx.font = 'bold 32px Courier New';
            ctx.fillStyle = '#c850ff';
            ctx.fillText('MUDRA EDITION', canvas.width / 2, 195);

            const time = Date.now() / 1000;
            const frame = Math.floor(time * 2) % 2;
            drawSprite(parsedSprites.squid[frame], 250, 250, COLORS.error, 4);
            drawSprite(parsedSprites.crab[frame], 360, 250, COLORS.warning, 4);
            drawSprite(parsedSprites.octopus[frame], 470, 250, COLORS.success, 4);

            drawSprite(parsedSprites.player, menuCursorX - 15, 340, COLORS.primary, 3);

            ctx.font = '24px Courier New';
            ctx.fillStyle = COLORS.text;
            ctx.fillText('Press SPACE or Tap to Start', canvas.width / 2, 400);

            ctx.font = '14px Courier New';
            ctx.fillStyle = COLORS.textMuted;
            ctx.fillText('Boss fights every 3 levels!', canvas.width / 2, 450);
            ctx.fillText('Heat management \u2022 Power tiers \u2022 Shield system', canvas.width / 2, 470);

            ctx.textAlign = 'left';
        }

        function drawIntro() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = COLORS.primary;
            ctx.font = 'bold 48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('GET READY!', canvas.width / 2, 150);

            ctx.font = '18px Courier New';
            ctx.fillStyle = COLORS.textSecondary;
            const tips = [
                'Move: Arrow Keys / A D / Mudra Hand Tilt',
                'Shoot: SPACE / Mudra Tap',
                'Shield: S / Mudra Double-Tap',
                'Pressure controls shot power!',
                `Starting in ${Math.ceil(gameState.introTimer / 60)}...`
            ];

            let y = 220;
            for (let tip of tips) {
                ctx.fillText(tip, canvas.width / 2, y);
                y += 35;
            }
            ctx.textAlign = 'left';
        }

        function drawPaused() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = COLORS.warning;
            ctx.font = 'bold 48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
        }

        function drawGameOver() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = COLORS.error;
            ctx.font = 'bold 48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, 250);

            ctx.font = '24px Courier New';
            ctx.fillStyle = COLORS.text;
            ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, 320);
            ctx.fillText(`Level: ${gameState.level}`, canvas.width / 2, 355);
            ctx.fillText('Press R or Tap to Restart', canvas.width / 2, 420);

            ctx.textAlign = 'left';
        }

        function drawStars() {
            ctx.fillStyle = COLORS.textMuted;
            for (let i = 0; i < 50; i++) {
                const x = (i * 137) % canvas.width;
                const y = (i * 211) % canvas.height;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        // ─── Game Loop ───
        function gameLoop() {
            ctx.fillStyle = COLORS.black;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawStars();

            // Consume Mudra gesture triggers
            const mudraShoot = mudra.shootTriggered;
            const mudraShield = mudra.shieldTriggered;
            mudra.shootTriggered = false;
            mudra.shieldTriggered = false;

            if (gameState.state === 'menu') {
                drawMenu();
                // Mudra tap or keyboard to start
                if (mudraShoot) {
                    gameState.state = 'intro';
                    gameState.introTimer = 10 * 60;
                    createEnemies();
                    createShields();
                    playSound(400, 'square', 0.2);
                }
            } else if (gameState.state === 'intro') {
                if (mudraShoot) {
                    gameState.state = 'playing';
                    playSound(600, 'square', 0.2);
                } else {
                    gameState.introTimer--;
                    if (gameState.introTimer <= 0) gameState.state = 'playing';
                }
                drawIntro();
            } else if (gameState.state === 'playing') {
                if (!gameState.paused) {
                    player.update(keys);

                    if (shootCooldown > 0) shootCooldown--;

                    // Determine power: Mudra pressure or keyboard power
                    const pressure = mudra.connected ? mudra.smoothPressure : player.keyboardPower;

                    // Shooting: keyboard space, mudra tap gesture, or high pressure
                    if ((keys[' '] || mudraShoot || (mudra.connected && mudra.pressure > 0.3)) && shootCooldown === 0) {
                        player.heat = Math.min(100, player.heat + pressure * 20);
                        bullets.push(new Bullet(player.x + player.width / 2, player.y, pressure));
                        const freq = pressure > 0.75 ? 550 : pressure > 0.5 ? 440 : pressure > 0.25 ? 330 : 220;
                        playSound(freq, 'square', 0.1);
                        shootCooldown = 20;
                    }

                    // Shield: keyboard S, mudra up-direction, or double-tap
                    if (mudraShield && !player.shieldActive) {
                        player.activateShield();
                    }

                    // Keyboard power control
                    if (keys['1']) player.keyboardPower = 0.2;
                    if (keys['2']) player.keyboardPower = 0.5;
                    if (keys['3']) player.keyboardPower = 0.7;
                    if (keys['4']) player.keyboardPower = 0.9;

                    bullets = bullets.filter(b => { b.update(); return b.active; });
                    for (let enemy of enemies) enemy.update();
                    if (boss && boss.active) boss.update(player.x + player.width / 2);
                    checkCollisions();
                    enemies = enemies.filter(e => e.active);

                    if (gameState.isBossLevel) {
                        if (!boss || !boss.active) nextLevel();
                    } else {
                        if (enemies.length === 0) nextLevel();
                    }

                    if (player.heat >= 100) {
                        gameState.lives--;
                        if (gameState.lives <= 0) {
                            gameState.state = 'gameover';
                        } else {
                            player = new Player();
                            bullets = [];
                        }
                        playSound(100, 'sawtooth', 0.5);
                    }
                }

                for (let shield of shields) shield.draw();
                player.draw();
                for (let bullet of bullets) bullet.draw();

                if (boss && boss.active) {
                    boss.draw();
                } else {
                    for (let enemy of enemies) enemy.draw();
                }

                powerBar.draw(mudra.connected ? mudra.smoothPressure : player.keyboardPower);
                drawHUD();

                if (gameState.paused) drawPaused();
            } else if (gameState.state === 'gameover') {
                drawGameOver();
                if (mudraShoot) {
                    gameState = {
                        state: 'menu', score: 0, level: 1, lives: 3,
                        paused: false, introTimer: 10 * 60, isBossLevel: false
                    };
                    player = new Player();
                    bullets = [];
                    enemies = [];
                    boss = null;
                }
            }

            requestAnimationFrame(gameLoop);
        }

        // ─── Keyboard Input ───
        window.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;

            if (gameState.state === 'menu' && e.key === ' ') {
                gameState.state = 'intro';
                gameState.introTimer = 10 * 60;
                createEnemies();
                createShields();
            }

            if (gameState.state === 'intro' && e.key === ' ') {
                gameState.state = 'playing';
                playSound(600, 'square', 0.2);
            }

            if (gameState.state === 'gameover' && e.key.toLowerCase() === 'r') {
                gameState = {
                    state: 'menu', score: 0, level: 1, lives: 3,
                    paused: false, introTimer: 10 * 60, isBossLevel: false
                };
                player = new Player();
                bullets = [];
                enemies = [];
                boss = null;
            }

            if (e.key.toLowerCase() === 'p' && gameState.state === 'playing') {
                gameState.paused = !gameState.paused;
            }

            if (e.key.toLowerCase() === 's' && gameState.state === 'playing' && !player.shieldActive) {
                player.activateShield();
            }
        });

        window.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });

        // ─── Utilities ───
        function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
        function clamp01(v) { return Number.isFinite(v) ? clamp(v, 0, 1) : 0; }

        // ─── Start ───
        connectMudra();
        gameLoop();
    </script>
</body>
</html>

```

### preview/neural-pong.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Neural Pong — Mudra Studio</title>
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

  .game-area { flex: 1; position: relative; overflow: hidden; background: var(--canvas-bg); }
  canvas { display: block; width: 100%; height: 100%; }

  .scoreboard { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 24px; z-index: 10; pointer-events: none; }
  .score-col { text-align: center; }
  .score { font-size: 48px; font-weight: 700; color: var(--primary); font-variant-numeric: tabular-nums; text-shadow: 0 0 20px rgba(79,70,229,0.3); min-width: 50px; }
  .score-divider { font-size: 28px; color: var(--text-secondary); opacity: 0.5; }
  .score-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em; }

  .overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); z-index: 20; transition: opacity 200ms; }
  .overlay.hidden { opacity: 0; pointer-events: none; }
  .overlay-title { font-size: 36px; font-weight: 700; color: var(--primary); margin-bottom: 8px; }
  .overlay-sub { font-size: 14px; color: var(--text-secondary); }

  .toolbar { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }
    .score { font-size: 32px; } .hint { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> Neural Pong</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <button class="btn" id="simTap">Simulate Tap</button>
    <button class="btn" id="simTwist">Simulate Twist</button>
  </div>
</div>

<div class="game-area">
  <div class="scoreboard">
    <div class="score-col"><div class="score" id="playerScore">0</div><div class="score-label">Player</div></div>
    <div class="score-divider">:</div>
    <div class="score-col"><div class="score" id="aiScore">0</div><div class="score-label">AI</div></div>
  </div>
  <canvas id="canvas"></canvas>
  <div class="overlay" id="overlay">
    <div class="overlay-title" id="overlayTitle">Neural Pong</div>
    <div class="overlay-sub" id="overlaySub">Tap gesture or press Space to serve</div>
  </div>
</div>

<div class="toolbar">
  <button class="btn" id="serveBtn">Serve</button>
  <button class="btn" id="pauseBtn">Pause</button>
  <button class="btn" id="resetBtn">Reset Score</button>
  <span class="hint">Arrow Up/Down move &middot; Space serve &middot; P pause &middot; Twist reset</span>
</div>

<div class="mudra-badge">Created by Mudra</div>

<script>
/* ── Mudra Protocol Connection (v2) ────────────────────────── */
const WS_URL = 'ws://127.0.0.1:8766';
const SIGNALS = ['navigation', 'gesture'];

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
        // connection_status removed — new server does not emit it
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
let simAutoServe = null;
function startSim() {
  if (simTimer) return;
  simulating = true;
  let t = 0;
  simTimer = setInterval(() => {
    t += 0.05;
    const dy = Math.sin(t * 0.6) * 4 + (Math.random() - 0.5) * 2;
    emit('navigation', { delta_x: 0, delta_y: dy, timestamp: Date.now() });
  }, 50);
  clearTimeout(simAutoServe);
  simAutoServe = setTimeout(() => { if (simulating && gameState === 'waiting') serve(); }, 3000);
}

function stopSim() { clearInterval(simTimer); simTimer = null; simulating = false; clearTimeout(simAutoServe); }

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
let W = 0, H = 0;

function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  canvas.width = r.width * devicePixelRatio;
  canvas.height = r.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  W = r.width; H = r.height;
  if (playerY === 0) { playerY = H / 2; aiY = H / 2; }
}
resize();
window.addEventListener('resize', resize);

/* ── Game Constants ────────────────────────────────────────── */
const PADDLE_W = 12, PADDLE_H = 80, BALL_R = 8, PAD_X = 24;
const AI_SPEED = 3.8, SPEED_INIT = 4.5, SPEED_MAX = 9;

/* ── Game State ────────────────────────────────────────────── */
let playerY = 0, aiY = 0;
let bx = 0, by = 0, bvx = 0, bvy = 0;
let pScore = 0, aScore = 0;
let gameState = 'waiting'; // waiting | playing | paused
let trail = [];

const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const overlayEl = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySub = document.getElementById('overlaySub');

function showOverlay(t, s) { overlayTitle.textContent = t; overlaySub.textContent = s; overlayEl.classList.remove('hidden'); }

function serve() {
  if (gameState === 'playing') return;
  gameState = 'playing';
  overlayEl.classList.add('hidden');
  bx = W / 2; by = H / 2;
  const a = (Math.random() - 0.5) * Math.PI * 0.4;
  const dir = Math.random() < 0.5 ? 1 : -1;
  bvx = Math.cos(a) * SPEED_INIT * dir;
  bvy = Math.sin(a) * SPEED_INIT;
  trail = [];
}

function scored(who) {
  if (who === 'player') { pScore++; playerScoreEl.textContent = pScore; }
  else { aScore++; aiScoreEl.textContent = aScore; }
  gameState = 'waiting'; bvx = 0; bvy = 0; trail = [];
  bx = W / 2; by = H / 2;
  showOverlay(who === 'player' ? 'You Scored!' : 'AI Scored!', 'Tap or Space to serve');
  if (simulating) { clearTimeout(simAutoServe); simAutoServe = setTimeout(() => { if (gameState === 'waiting') serve(); }, 3000); }
}

function togglePause() {
  if (gameState === 'playing') { gameState = 'paused'; showOverlay('Paused', 'Double-tap or P to resume'); }
  else if (gameState === 'paused') { gameState = 'playing'; overlayEl.classList.add('hidden'); }
}

function resetScore() {
  pScore = 0; aScore = 0;
  playerScoreEl.textContent = '0'; aiScoreEl.textContent = '0';
  gameState = 'waiting'; bvx = 0; bvy = 0; trail = [];
  bx = W / 2; by = H / 2;
  showOverlay('Score Reset', 'Tap or Space to serve');
}

/* ── Signal Handlers ───────────────────────────────────────── */
on('navigation', (d) => {
  playerY += (d.delta_y || 0) * 2.5;
  playerY = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, playerY));
});

on('gesture', (d) => {
  const t = d.type || '';
  if (t === 'tap') { if (gameState === 'waiting') serve(); }
  if (t === 'double_tap') togglePause();
  if (t === 'twist') resetScore();
});

/* ── Keyboard Fallback ─────────────────────────────────────── */
const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); if (gameState === 'waiting') serve(); else triggerGesture('tap'); }
  if (e.code === 'KeyP') togglePause();
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

/* ── Touch fallback ────────────────────────────────────────── */
let touchY = null;
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); touchY = e.touches[0].clientY; if (gameState === 'waiting') serve(); }, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (touchY !== null) { const dy = e.touches[0].clientY - touchY; playerY += dy; playerY = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, playerY)); touchY = e.touches[0].clientY; }
}, { passive: false });
canvas.addEventListener('touchend', () => { touchY = null; });

/* ── Buttons ───────────────────────────────────────────────── */
document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));
document.getElementById('simTwist').addEventListener('click', () => triggerGesture('twist'));
document.getElementById('serveBtn').addEventListener('click', () => { if (gameState === 'waiting') serve(); });
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resetBtn').addEventListener('click', resetScore);

/* ── Rounded-rect helper ───────────────────────────────────── */
function rrect(x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ── Game Loop ─────────────────────────────────────────────── */
function loop() {
  if (!W || !H) { requestAnimationFrame(loop); return; }

  /* Keyboard paddle */
  if (keys['ArrowUp']) { playerY -= 6; playerY = Math.max(PADDLE_H / 2, playerY); }
  if (keys['ArrowDown']) { playerY += 6; playerY = Math.min(H - PADDLE_H / 2, playerY); }

  if (gameState === 'playing') {
    bx += bvx; by += bvy;

    /* Walls */
    if (by - BALL_R < 0) { by = BALL_R; bvy = Math.abs(bvy); }
    if (by + BALL_R > H) { by = H - BALL_R; bvy = -Math.abs(bvy); }

    /* Player paddle hit */
    if (bx - BALL_R < PAD_X + PADDLE_W && bx + BALL_R > PAD_X && by > playerY - PADDLE_H / 2 && by < playerY + PADDLE_H / 2 && bvx < 0) {
      bvx = Math.abs(bvx);
      bvy = ((by - playerY) / (PADDLE_H / 2)) * 5;
      const sp = Math.min(SPEED_MAX, Math.sqrt(bvx * bvx + bvy * bvy) + 0.25);
      const mag = Math.sqrt(bvx * bvx + bvy * bvy);
      bvx *= sp / mag; bvy *= sp / mag;
    }

    /* AI paddle hit */
    const ax = W - PAD_X - PADDLE_W;
    if (bx + BALL_R > ax && bx - BALL_R < ax + PADDLE_W && by > aiY - PADDLE_H / 2 && by < aiY + PADDLE_H / 2 && bvx > 0) {
      bvx = -Math.abs(bvx);
      bvy = ((by - aiY) / (PADDLE_H / 2)) * 5;
      const sp = Math.min(SPEED_MAX, Math.sqrt(bvx * bvx + bvy * bvy) + 0.25);
      const mag = Math.sqrt(bvx * bvx + bvy * bvy);
      bvx *= sp / mag; bvy *= sp / mag;
    }

    /* Scoring */
    if (bx < -BALL_R * 2) scored('ai');
    if (bx > W + BALL_R * 2) scored('player');

    /* AI tracking */
    const target = bvx > 0 ? by : H / 2;
    const diff = target - aiY;
    if (Math.abs(diff) > 2) aiY += Math.sign(diff) * Math.min(AI_SPEED, Math.abs(diff));
    aiY = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, aiY));

    trail.push({ x: bx, y: by });
    if (trail.length > 20) trail.shift();
  }

  /* ── Draw ── */
  ctx.clearRect(0, 0, W, H);

  /* Center dashed line */
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.setLineDash([]);

  const pri = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  const acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

  /* Ball trail */
  for (let i = 0; i < trail.length; i++) {
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, BALL_R * (0.3 + 0.7 * i / trail.length), 0, Math.PI * 2);
    ctx.fillStyle = pri;
    ctx.globalAlpha = (i / trail.length) * 0.4;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* Ball */
  ctx.beginPath();
  ctx.arc(bx, by, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = pri; ctx.shadowColor = pri; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0;

  /* Player paddle */
  ctx.beginPath(); rrect(PAD_X, playerY - PADDLE_H / 2, PADDLE_W, PADDLE_H, 6);
  ctx.fillStyle = pri; ctx.shadowColor = pri; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;

  /* AI paddle */
  ctx.beginPath(); rrect(W - PAD_X - PADDLE_W, aiY - PADDLE_H / 2, PADDLE_W, PADDLE_H, 6);
  ctx.fillStyle = acc; ctx.shadowColor = acc; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;

  requestAnimationFrame(loop);
}

/* ── Init ──────────────────────────────────────────────────── */
connect();
loop();
</script>
</body>
</html>

```

### preview/gesture-assistant.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gesture Assistant — Mudra Studio</title>
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
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

  .main { flex: 1; display: flex; overflow: hidden; }

  /* ── Phrase Display ── */
  .phrase-panel { flex: 1; display: flex; flex-direction: column; align-items: center; overflow: hidden; }
  .category-tabs { display: flex; gap: 8px; padding: 12px 16px; flex-shrink: 0; flex-wrap: wrap; justify-content: center; }
  .cat-tab { padding: 5px 14px; border-radius: 20px; font-size: 12px; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text-secondary); transition: all 150ms; }
  .cat-tab.active { background: var(--primary); color: #ffffff; border-color: transparent; font-weight: 600; }

  .phrase-hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; }
  .phrase-text { font-size: 48px; font-weight: 700; color: var(--primary); text-align: center; transition: opacity 150ms, transform 150ms; min-height: 64px; text-shadow: 0 0 30px rgba(79,70,229,0.2); }
  .phrase-text.speaking { animation: pulse 0.6s ease infinite; }
  @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  .phrase-index { font-size: 12px; color: var(--text-secondary); }
  .recording-indicator { font-size: 12px; color: var(--error); opacity: 0; transition: opacity 150ms; display: flex; align-items: center; gap: 6px; }
  .recording-indicator.active { opacity: 1; }
  .rec-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--error); animation: blink 0.8s infinite; }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  .phrase-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 16px; max-width: 600px; width: 100%; flex-shrink: 0; }
  .phrase-card { padding: 12px 8px; border-radius: 10px; text-align: center; font-size: 14px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text); transition: all 150ms; }
  .phrase-card.selected { border-color: var(--primary); background: rgba(79,70,229,0.08); color: var(--primary); box-shadow: 0 0 12px rgba(79,70,229,0.1); }
  .phrase-card:hover { border-color: var(--accent); }

  /* ── Gesture Log ── */
  .gesture-log { width: 240px; background: var(--card); border-left: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
  .log-header { padding: 12px 14px; font-size: 12px; font-weight: 600; color: var(--text-secondary); border-bottom: 1px solid var(--border); text-transform: uppercase; letter-spacing: 0.06em; }
  .log-list { flex: 1; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 4px; }
  .log-entry { font-size: 11px; padding: 6px 10px; background: var(--surface); border-radius: 6px; color: var(--text-secondary); display: flex; justify-content: space-between; }
  .log-name { color: var(--primary); font-weight: 600; }
  .log-time { font-family: monospace; font-size: 10px; opacity: 0.6; }

  .toolbar { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }
    .gesture-log { display: none; }
    .phrase-grid { grid-template-columns: repeat(2, 1fr); }
    .phrase-text { font-size: 32px; }
    .hint { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> Gesture Assistant</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <button class="btn" id="simTap">Simulate Tap</button>
    <button class="btn" id="simDTap">Simulate Double-Tap</button>
  </div>
</div>

<div class="main">
  <div class="phrase-panel">
    <div class="category-tabs" id="catTabs"></div>
    <div class="phrase-hero">
      <div class="phrase-text" id="phraseText">Hello</div>
      <div class="phrase-index" id="phraseIndex">1 / 8</div>
      <div class="recording-indicator" id="recInd"><span class="rec-dot"></span> Recording Mode</div>
    </div>
    <div class="phrase-grid" id="phraseGrid"></div>
  </div>
  <div class="gesture-log">
    <div class="log-header">Gesture Log</div>
    <div class="log-list" id="logList"></div>
  </div>
</div>

<div class="toolbar">
  <button class="btn" id="speakBtn">Speak</button>
  <button class="btn" id="nextBtn">Next</button>
  <button class="btn" id="prevBtn">Prev</button>
  <span class="hint">Space speak &middot; Arrow Right/Left cycle &middot; Shift hold for recording</span>
</div>

<div class="mudra-badge">Created by Mudra</div>

<script>
/* ── Mudra Protocol Connection (v2) ────────────────────────── */
const WS_URL = 'ws://127.0.0.1:8766';
const SIGNALS = ['gesture', 'button'];

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
        // connection_status removed — new server does not emit it
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
    if (Math.random() < 0.006) {
      const g = ['tap', 'double_tap', 'twist', 'double_twist'];
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
    }
    if (Math.random() < 0.002) {
      emit('button', { state: 'pressed', timestamp: Date.now() });
      setTimeout(() => emit('button', { state: 'released', timestamp: Date.now() }), 800 + Math.random() * 600);
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


/* ── Phrase Data ───────────────────────────────────────────── */
const categories = {
  'Basic': ['Hello', 'Yes', 'No', 'Thank you', 'Help', 'Water', 'I need...', 'Goodbye'],
  'Questions': ['How are you?', 'Where is it?', 'What time?', 'Who is there?', 'Why?', 'When?', 'How much?', 'Can you help?'],
  'Actions': ['Stop', 'Go', 'Wait', 'Come here', 'Sit down', 'Stand up', 'Turn around', 'Look here'],
};

let currentCat = 'Basic';
let selectedIdx = 0;

const catTabsEl = document.getElementById('catTabs');
const phraseGridEl = document.getElementById('phraseGrid');
const phraseTextEl = document.getElementById('phraseText');
const phraseIndexEl = document.getElementById('phraseIndex');
const recIndEl = document.getElementById('recInd');
const logListEl = document.getElementById('logList');

/* ── Build Categories ──────────────────────────────────────── */
function buildTabs() {
  catTabsEl.innerHTML = '';
  Object.keys(categories).forEach(cat => {
    const tab = document.createElement('div');
    tab.className = 'cat-tab' + (cat === currentCat ? ' active' : '');
    tab.textContent = cat;
    tab.addEventListener('click', () => switchCategory(cat));
    catTabsEl.appendChild(tab);
  });
}

function buildGrid() {
  phraseGridEl.innerHTML = '';
  const phrases = categories[currentCat];
  phrases.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'phrase-card' + (i === selectedIdx ? ' selected' : '');
    card.textContent = p;
    card.addEventListener('click', () => { selectedIdx = i; updateDisplay(); });
    phraseGridEl.appendChild(card);
  });
}

function switchCategory(cat) {
  currentCat = cat; selectedIdx = 0;
  buildTabs(); buildGrid(); updateDisplay();
}

function updateDisplay() {
  const phrases = categories[currentCat];
  phraseTextEl.textContent = phrases[selectedIdx];
  phraseIndexEl.textContent = (selectedIdx + 1) + ' / ' + phrases.length;
  const cards = phraseGridEl.children;
  for (let i = 0; i < cards.length; i++) cards[i].classList.toggle('selected', i === selectedIdx);
}

function speakPhrase() {
  if (!('speechSynthesis' in window)) return;
  const phrases = categories[currentCat];
  const text = phrases[selectedIdx];
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.9; utter.pitch = 1;
  phraseTextEl.classList.add('speaking');
  utter.onend = () => phraseTextEl.classList.remove('speaking');
  window.speechSynthesis.speak(utter);
}

function nextPhrase() {
  const phrases = categories[currentCat];
  selectedIdx = (selectedIdx + 1) % phrases.length;
  updateDisplay();
}

function prevPhrase() {
  const phrases = categories[currentCat];
  selectedIdx = (selectedIdx - 1 + phrases.length) % phrases.length;
  updateDisplay();
}

function toggleCategory() {
  const cats = Object.keys(categories);
  const idx = (cats.indexOf(currentCat) + 1) % cats.length;
  switchCategory(cats[idx]);
}

/* ── Gesture Log ───────────────────────────────────────────── */
function addLog(name) {
  const el = document.createElement('div');
  el.className = 'log-entry';
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const nameSpan = document.createElement('span');
  nameSpan.className = 'log-name';
  nameSpan.textContent = name;
  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = time;
  el.appendChild(nameSpan);
  el.appendChild(timeSpan);
  logListEl.prepend(el);
  if (logListEl.children.length > 50) logListEl.removeChild(logListEl.lastChild);
}

/* ── Signal Handlers ───────────────────────────────────────── */
on('gesture', (d) => {
  const t = d.type || '';
  addLog(t.replace('_', ' '));
  if (t === 'tap') speakPhrase();
  if (t === 'double_tap') nextPhrase();
  if (t === 'twist') prevPhrase();
  if (t === 'double_twist') toggleCategory();
});

on('button', (d) => {
  if (d.state === 'pressed') { recIndEl.classList.add('active'); addLog('button pressed'); }
  if (d.state === 'released') { recIndEl.classList.remove('active'); addLog('button released'); }
});

/* ── Keyboard Fallback ─────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); speakPhrase(); triggerGesture('tap'); }
  if (e.code === 'ArrowRight') { nextPhrase(); }
  if (e.code === 'ArrowLeft') { prevPhrase(); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    if (!e.repeat) emit('button', { state: 'pressed', timestamp: Date.now() });
  }
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    emit('button', { state: 'released', timestamp: Date.now() });
  }
});

/* ── Buttons ───────────────────────────────────────────────── */
document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));
document.getElementById('simDTap').addEventListener('click', () => triggerGesture('double_tap'));
document.getElementById('speakBtn').addEventListener('click', speakPhrase);
document.getElementById('nextBtn').addEventListener('click', nextPhrase);
document.getElementById('prevBtn').addEventListener('click', prevPhrase);

/* ── Init ──────────────────────────────────────────────────── */
buildTabs();
buildGrid();
updateDisplay();
connect();
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

<div class="mudra-badge">Created by Mudra</div>

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
        // connection_status removed — new server does not emit it
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

### preview/music-sequencer.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Neural Music Sequencer — Mudra Studio</title>
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
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

  /* Transport bar */
  .transport { display: flex; align-items: center; gap: 14px; padding: 10px 16px; background: var(--card); border-bottom: 1px solid var(--border); flex-shrink: 0; flex-wrap: wrap; }
  .play-btn { width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--primary); background: transparent; color: var(--primary); font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 150ms; flex-shrink: 0; }
  .play-btn:hover { background: rgba(79,70,229,0.1); }
  .play-btn.playing { background: var(--primary); color: #ffffff; }
  .bpm-display { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700; color: var(--primary); min-width: 75px; }
  .bpm-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
  .meter { display: flex; align-items: center; gap: 8px; margin-left: auto; }
  .meter-label { font-size: 12px; color: var(--text-secondary); }
  .meter-bar { width: 80px; height: 8px; background: var(--surface); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
  .meter-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 999px; transition: width 75ms linear; width: 50%; }
  .meter-val { font-size: 12px; color: var(--text-secondary); min-width: 32px; text-align: right; font-variant-numeric: tabular-nums; }

  /* Sequencer grid */
  .sequencer { flex: 1; display: flex; flex-direction: column; padding: 16px; gap: 6px; overflow: auto; justify-content: center; }
  .row { display: flex; align-items: center; gap: 0; }
  .row-label { width: 60px; font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: right; padding-right: 10px; flex-shrink: 0; }
  .cells { display: flex; gap: 3px; flex: 1; }
  .cell { flex: 1; min-width: 24px; aspect-ratio: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; cursor: pointer; transition: all 100ms; position: relative; }
  .cell.on { background: rgba(79,70,229,0.2); border-color: var(--primary); }
  .cell.cursor { box-shadow: 0 0 0 2px var(--accent); z-index: 1; }
  .cell.playhead { box-shadow: inset 0 0 10px rgba(79,70,229,0.3); }
  .cell.on.playhead { background: var(--primary); border-color: var(--primary); box-shadow: 0 0 10px rgba(79,70,229,0.4); }
  .cell.beat4 { margin-left: 5px; }

  /* Bottom bar */
  .bottom-bar { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; }
    .transport { padding: 8px 10px; gap: 8px; }
    .sequencer { padding: 10px; gap: 4px; }
    .row-label { width: 42px; font-size: 10px; padding-right: 6px; }
    .cell { min-width: 16px; border-radius: 3px; }
    .bpm-display { font-size: 16px; }
    .meter-bar { width: 50px; }
    .bottom-bar { gap: 8px; padding: 8px 10px; }
    .hint { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> Neural Sequencer</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <button class="btn" id="simTap">Simulate Tap</button>
  </div>
</div>

<div class="transport">
  <button class="play-btn" id="playBtn" title="Play / Pause">&#9654;</button>
  <div>
    <div class="bpm-display" id="bpmDisplay">120 BPM</div>
    <div class="bpm-label">Tempo</div>
  </div>
  <div class="meter">
    <span class="meter-label">Velocity</span>
    <div class="meter-bar"><div class="meter-fill" id="velFill"></div></div>
    <span class="meter-val" id="velVal">50%</span>
  </div>
</div>

<div class="sequencer" id="sequencer"></div>

<div class="bottom-bar">
  <span class="hint">Space = toggle step &middot; Enter = play/pause &middot; Arrows = move cursor &middot; [ ] velocity &middot; C = clear row</span>
</div>

<div class="mudra-badge">Created by Mudra</div>

<script>
/* ── Mudra Protocol Connection (v2) ────────────────────────── */
const WS_URL = 'ws://127.0.0.1:8766';
const SIGNALS = ['gesture', 'navigation', 'pressure'];

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
        // connection_status removed — new server does not emit it
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
    /* simulate pressure for velocity */
    const n = Math.max(0, Math.min(1, 0.4 + 0.25 * Math.sin(t * 0.6) + (Math.random() - 0.5) * 0.1));
    emit('pressure', { value: Math.round(n * 100), normalized: n, timestamp: Date.now() });
    /* simulate navigation */
    if (Math.random() < 0.04) {
      emit('navigation', { delta_x: Math.round((Math.random() - 0.5) * 6), delta_y: Math.round((Math.random() - 0.5) * 4), timestamp: Date.now() });
    }
    /* occasional gesture */
    if (Math.random() < 0.005) {
      const g = ['tap', 'double_tap', 'twist', 'double_twist'];
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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


/* ── Sequencer State ───────────────────────────────────────── */
const instruments = ['Kick', 'Snare', 'HiHat', 'Clap'];
const STEPS = 16;
const grid = Array.from({ length: 4 }, () => new Array(STEPS).fill(false));
const velocities = Array.from({ length: 4 }, () => new Array(STEPS).fill(0.5));
let playing = false, step = 0, bpm = 120;
let cursorRow = 0, cursorCol = 0;
let velocity = 0.5;
let audioCtx = null;
let stepTimeout = null;

/* Pre-fill a starter beat */
grid[0][0] = true; grid[0][4] = true; grid[0][8] = true; grid[0][12] = true;
grid[1][4] = true; grid[1][12] = true;
grid[2][0] = true; grid[2][2] = true; grid[2][4] = true; grid[2][6] = true;
grid[2][8] = true; grid[2][10] = true; grid[2][12] = true; grid[2][14] = true;

/* ── Build UI ──────────────────────────────────────────────── */
const sequencerEl = document.getElementById('sequencer');

function buildGrid() {
  sequencerEl.textContent = '';
  instruments.forEach((name, r) => {
    const row = document.createElement('div');
    row.className = 'row';
    const label = document.createElement('div');
    label.className = 'row-label';
    label.textContent = name;
    row.appendChild(label);
    const cellsDiv = document.createElement('div');
    cellsDiv.className = 'cells';
    for (let c = 0; c < STEPS; c++) {
      const cell = document.createElement('div');
      let cls = 'cell';
      if (grid[r][c]) cls += ' on';
      if (r === cursorRow && c === cursorCol) cls += ' cursor';
      if (c === step && playing) cls += ' playhead';
      if (c % 4 === 0 && c > 0) cls += ' beat4';
      cell.className = cls;
      cell.dataset.r = r;
      cell.dataset.c = c;
      if (grid[r][c]) {
        cell.style.opacity = 0.3 + velocities[r][c] * 0.7;
      }
      cell.addEventListener('click', () => { toggleCell(r, c); });
      cellsDiv.appendChild(cell);
    }
    row.appendChild(cellsDiv);
    sequencerEl.appendChild(row);
  });
}

function updateGrid() {
  const allCells = document.querySelectorAll('.cell');
  allCells.forEach(cell => {
    const r = +cell.dataset.r, c = +cell.dataset.c;
    let cls = 'cell';
    if (grid[r][c]) cls += ' on';
    if (r === cursorRow && c === cursorCol) cls += ' cursor';
    if (c === step && playing) cls += ' playhead';
    if (c % 4 === 0 && c > 0) cls += ' beat4';
    cell.className = cls;
    if (grid[r][c]) {
      cell.style.opacity = 0.3 + velocities[r][c] * 0.7;
    } else {
      cell.style.opacity = '';
    }
  });
}

function toggleCell(r, c) {
  grid[r][c] = !grid[r][c];
  if (grid[r][c]) velocities[r][c] = velocity;
  updateGrid();
}

/* ── Web Audio Drum Sounds ─────────────────────────────────── */
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(instrument, vel) {
  if (!audioCtx) return;
  const v = vel;
  const now = audioCtx.currentTime;

  if (instrument === 0) {
    /* Kick: low frequency sine with quick decay */
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    gain.gain.setValueAtTime(v * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + 0.25);
  } else if (instrument === 1) {
    /* Snare: noise burst with bandpass filter */
    const bufSize = audioCtx.sampleRate * 0.12;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 3000; filter.Q.value = 1;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(v * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    src.start(now); src.stop(now + 0.14);
  } else if (instrument === 2) {
    /* HiHat: high frequency noise with very short decay */
    const bufSize = audioCtx.sampleRate * 0.04;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 7000;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(v * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    src.connect(hp); hp.connect(gain); gain.connect(audioCtx.destination);
    src.start(now); src.stop(now + 0.05);
  } else {
    /* Clap: noise with bandpass and quick double-hit envelope */
    const bufSize = audioCtx.sampleRate * 0.15;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 2000; filter.Q.value = 0.8;
    const gain = audioCtx.createGain();
    /* double-hit envelope */
    gain.gain.setValueAtTime(v * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    gain.gain.setValueAtTime(v * 0.35, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    src.start(now); src.stop(now + 0.15);
  }
}

/* ── Sequencer Transport ───────────────────────────────────── */
function tick() {
  if (!playing) return;
  for (let r = 0; r < 4; r++) {
    if (grid[r][step]) playSound(r, velocities[r][step]);
  }
  updateGrid();
  step = (step + 1) % STEPS;
  const interval = (60 / bpm / 4) * 1000;
  stepTimeout = setTimeout(tick, interval);
}

function togglePlay() {
  initAudio();
  playing = !playing;
  const btn = document.getElementById('playBtn');
  if (playing) {
    btn.classList.add('playing');
    btn.textContent = '\u23F8';
    step = 0;
    tick();
  } else {
    btn.classList.remove('playing');
    btn.textContent = '\u25B6';
    clearTimeout(stepTimeout);
    updateGrid();
  }
}

buildGrid();

/* ── Signal Handlers ───────────────────────────────────────── */
on('gesture', (d) => {
  const type = d.type || 'unknown';
  if (type === 'tap') toggleCell(cursorRow, cursorCol);
  if (type === 'double_tap') togglePlay();
  if (type === 'twist') {
    /* clear current row */
    for (let c = 0; c < STEPS; c++) grid[cursorRow][c] = false;
    updateGrid();
  }
  if (type === 'double_twist') {
    /* clear all */
    for (let r = 0; r < 4; r++) for (let c = 0; c < STEPS; c++) grid[r][c] = false;
    updateGrid();
  }
});

let navAccX = 0, navAccY = 0;
const NAV_THRESH = 6;

on('navigation', (d) => {
  navAccX += (d.delta_x || 0);
  navAccY += (d.delta_y || 0);
  let changed = false;
  if (Math.abs(navAccX) >= NAV_THRESH) {
    cursorCol = Math.max(0, Math.min(STEPS - 1, cursorCol + (navAccX > 0 ? 1 : -1)));
    navAccX = 0;
    changed = true;
  }
  if (Math.abs(navAccY) >= NAV_THRESH) {
    cursorRow = Math.max(0, Math.min(3, cursorRow + (navAccY > 0 ? 1 : -1)));
    navAccY = 0;
    changed = true;
  }
  if (changed) updateGrid();
});

on('pressure', (d) => {
  velocity = Math.max(0, Math.min(1, d.normalized ?? d.value / 100));
  /* update the velocity for the cell under the cursor if it is active */
  if (grid[cursorRow][cursorCol]) {
    velocities[cursorRow][cursorCol] = velocity;
    updateGrid();
  }
  document.getElementById('velFill').style.width = Math.round(velocity * 100) + '%';
  document.getElementById('velVal').textContent = Math.round(velocity * 100) + '%';
});

/* ── Keyboard Fallback ─────────────────────────────────────── */
let kbVelocity = 0.5;
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); toggleCell(cursorRow, cursorCol); }
  if (e.code === 'Enter') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') { e.preventDefault(); cursorCol = Math.min(STEPS - 1, cursorCol + 1); updateGrid(); }
  if (e.code === 'ArrowLeft') { e.preventDefault(); cursorCol = Math.max(0, cursorCol - 1); updateGrid(); }
  if (e.code === 'ArrowDown') { e.preventDefault(); cursorRow = Math.min(3, cursorRow + 1); updateGrid(); }
  if (e.code === 'ArrowUp') { e.preventDefault(); cursorRow = Math.max(0, cursorRow - 1); updateGrid(); }
  if (e.code === 'KeyC') {
    for (let c = 0; c < STEPS; c++) grid[cursorRow][c] = false;
    updateGrid();
  }
  if (e.key === ']') {
    kbVelocity = Math.min(1, kbVelocity + 0.08);
    emit('pressure', { value: Math.round(kbVelocity * 100), normalized: kbVelocity, timestamp: Date.now() });
  }
  if (e.key === '[') {
    kbVelocity = Math.max(0, kbVelocity - 0.08);
    emit('pressure', { value: Math.round(kbVelocity * 100), normalized: kbVelocity, timestamp: Date.now() });
  }
});

/* ── Buttons ───────────────────────────────────────────────── */
document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));
document.getElementById('playBtn').addEventListener('click', togglePlay);

/* ── Start ─────────────────────────────────────────────────── */
connect();
</script>
</body>
</html>

```

### preview/emg-visualizer.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EMG Signal Visualizer — Mudra Studio</title>
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  :root {
    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;
    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;
    --warning: #eab308; --error: #ef4444;
    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);
    --wave-bg: #f1f5f9; --grid-line: rgba(148,163,184,0.06);
    --ch0: #4f46e5; --ch1: #06b6d4; --ch2: #eab308;
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

  /* Waveform panels */
  .wave-area { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 0; position: relative; }
  .wave-panel { flex: 1; position: relative; background: var(--wave-bg); border-bottom: 1px solid var(--border); min-height: 0; }
  .wave-panel:last-child { border-bottom: none; }
  .wave-label { position: absolute; top: 8px; left: 12px; font-size: 11px; font-weight: 600; z-index: 5; padding: 2px 10px; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); }
  .wave-label.ch0 { color: var(--ch0); }
  .wave-label.ch1 { color: var(--ch1); }
  .wave-label.ch2 { color: var(--ch2); }
  .wave-canvas { display: block; width: 100%; height: 100%; }

  .frozen-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 18px; font-weight: 700; color: var(--warning); letter-spacing: 2px; opacity: 0; transition: opacity 200ms; pointer-events: none; z-index: 10; text-shadow: 0 0 20px rgba(234,179,8,0.3); }
  .frozen-badge.show { opacity: 1; }

  .view-badge { position: absolute; top: 8px; right: 12px; font-size: 11px; color: var(--primary); font-weight: 600; z-index: 5; padding: 2px 10px; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); }

  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }
  .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 12px; }
  .channel-legend { display: flex; gap: 12px; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-secondary); }
  .legend-dot { width: 8px; height: 8px; border-radius: 3px; }
  .legend-dot.ch0 { background: var(--ch0); }
  .legend-dot.ch1 { background: var(--ch1); }
  .legend-dot.ch2 { background: var(--ch2); }
  .meter { display: flex; align-items: center; gap: 8px; }
  .meter-bar { width: 60px; height: 8px; background: var(--surface); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
  .meter-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 999px; transition: width 75ms linear; width: 50%; }
  .meter-label { font-size: 11px; color: var(--text-secondary); }
  .meter-val { font-size: 12px; color: var(--text-secondary); min-width: 36px; text-align: right; font-variant-numeric: tabular-nums; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }
    .hint { display: none; } .channel-legend { gap: 6px; }
    .meter-bar { width: 40px; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> EMG Signal Visualizer</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <button class="btn" id="simFreeze">Freeze</button>
    <button class="btn" id="simClear">Clear</button>
    <button class="btn" id="simView">Toggle View</button>
  </div>
</div>

<div class="wave-area" id="waveArea">
  <div class="wave-panel" id="panel0">
    <div class="wave-label ch0">Ch 0 — Ulnar</div>
    <canvas class="wave-canvas" id="canvas0"></canvas>
  </div>
  <div class="wave-panel" id="panel1">
    <div class="wave-label ch1">Ch 1 — Median</div>
    <canvas class="wave-canvas" id="canvas1"></canvas>
  </div>
  <div class="wave-panel" id="panel2">
    <div class="wave-label ch2">Ch 2 — Radial</div>
    <canvas class="wave-canvas" id="canvas2"></canvas>
  </div>
  <div class="frozen-badge" id="frozenBadge">FROZEN</div>
  <div class="view-badge" id="viewBadge">LINE</div>
</div>

<div class="toolbar">
  <div class="toolbar-left">
    <div class="channel-legend">
      <div class="legend-item"><div class="legend-dot ch0"></div>Ulnar</div>
      <div class="legend-item"><div class="legend-dot ch1"></div>Median</div>
      <div class="legend-item"><div class="legend-dot ch2"></div>Radial</div>
    </div>
    <div class="meter">
      <span class="meter-label">Scale</span>
      <div class="meter-bar"><div class="meter-fill" id="scaleFill"></div></div>
      <span class="meter-val" id="scaleVal">1.0x</span>
    </div>
  </div>
  <span class="hint">Space freeze &middot; C clear &middot; V toggle view &middot; [ ] scale</span>
</div>

<div class="mudra-badge">Created by Mudra</div>

<script>
/* ── Mudra Protocol Connection (v2) ────────────────────────── */
const WS_URL = 'ws://127.0.0.1:8766';
const SIGNALS = ['snc', 'gesture', 'pressure'];

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
        // connection_status removed — new server does not emit it
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
    // Generate realistic SNC data with varying amplitude and frequency
    const burstEnvelope = 0.5 + 0.5 * Math.sin(t * 0.15);
    emit('snc', {
      values: [
        burstEnvelope * (0.4 * Math.sin(t * 3.7 + Math.sin(t * 0.8)) + 0.15 * Math.sin(t * 11.3) + (Math.random() - 0.5) * 0.2),
        burstEnvelope * (0.35 * Math.cos(t * 4.1 + Math.cos(t * 0.6)) + 0.12 * Math.sin(t * 13.7) + (Math.random() - 0.5) * 0.18),
        burstEnvelope * (0.3 * Math.sin(t * 5.3 + Math.sin(t * 1.1)) + 0.1 * Math.cos(t * 9.1) + (Math.random() - 0.5) * 0.15)
      ],
      frequency: 1000, timestamp: Date.now()
    });
    // Gentle pressure
    const n = Math.max(0, Math.min(1, 0.5 + 0.2 * Math.sin(t * 0.3)));
    emit('pressure', { value: Math.round(n * 100), normalized: n, timestamp: Date.now() });
    // Occasional gestures
    if (Math.random() < 0.002) {
      const g = ['tap', 'double_tap', 'twist', 'double_twist'];
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
    }
  }, 16); // Higher frequency for SNC data
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


/* ── Waveform State ────────────────────────────────────────── */
const BUF_LEN = 500;
const buffers = [new Float32Array(BUF_LEN), new Float32Array(BUF_LEN), new Float32Array(BUF_LEN)];
let frozen = false;
let viewMode = 'line'; // 'line' or 'bar'
let vScale = 1.0; // vertical scale, 0.2 to 3.0

const canvases = [
  document.getElementById('canvas0'),
  document.getElementById('canvas1'),
  document.getElementById('canvas2')
];
const ctxs = canvases.map(c => c.getContext('2d'));

function resizeCanvases() {
  canvases.forEach((c, i) => {
    const panel = c.parentElement;
    const r = panel.getBoundingClientRect();
    c.width = r.width * devicePixelRatio;
    c.height = r.height * devicePixelRatio;
    ctxs[i].setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  });
}
resizeCanvases();
window.addEventListener('resize', resizeCanvases);

/* ── Signal Handlers ───────────────────────────────────────── */
on('snc', (d) => {
  if (frozen) return;
  const vals = d.values || [0, 0, 0];
  for (let ch = 0; ch < 3; ch++) {
    buffers[ch].copyWithin(0, 1);
    buffers[ch][BUF_LEN - 1] = vals[ch];
  }
});

on('gesture', (d) => {
  const type = d.type || 'unknown';
  if (type === 'tap') {
    frozen = !frozen;
    document.getElementById('frozenBadge').classList.toggle('show', frozen);
  }
  if (type === 'double_tap') {
    // Clear waveforms
    for (let ch = 0; ch < 3; ch++) buffers[ch].fill(0);
  }
  if (type === 'twist') {
    viewMode = viewMode === 'line' ? 'bar' : 'line';
    document.getElementById('viewBadge').textContent = viewMode === 'line' ? 'LINE' : 'BAR';
  }
});

on('pressure', (d) => {
  const p = Math.max(0, Math.min(1, d.normalized ?? d.value / 100));
  // Map pressure to vertical scale: 0.2x to 3.0x
  vScale = 0.2 + p * 2.8;
  document.getElementById('scaleVal').textContent = vScale.toFixed(1) + 'x';
  document.getElementById('scaleFill').style.width = Math.round(p * 100) + '%';
});

/* ── Render Loop ───────────────────────────────────────────── */
const channelColors = ['--ch0', '--ch1', '--ch2'];

function getColor(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function drawLine(ctx, buf, w, h, color) {
  const gridColor = getColor('--grid-line') || 'rgba(148,163,184,0.06)';
  // Grid
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const gy = h * i / 4;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  }
  // Centerline
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

  // Waveform
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  for (let i = 0; i < BUF_LEN; i++) {
    const x = (i / (BUF_LEN - 1)) * w;
    const v = buf[i] * vScale;
    const y = h / 2 - v * (h * 0.4);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawBar(ctx, buf, w, h, color) {
  const gridColor = getColor('--grid-line') || 'rgba(148,163,184,0.06)';
  // Grid
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const gy = h * i / 4;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  }
  // Centerline
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

  // Bars
  const numBars = 80;
  const barW = w / numBars - 1;
  const step = Math.floor(BUF_LEN / numBars);

  for (let i = 0; i < numBars; i++) {
    const idx = i * step;
    const v = buf[idx] * vScale;
    const barH = Math.abs(v) * h * 0.4;
    const x = i * (barW + 1);
    const y = v >= 0 ? h / 2 - barH : h / 2;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5 + Math.min(0.5, Math.abs(v) * 2);
    ctx.fillRect(x, y, barW, barH);
  }
  ctx.globalAlpha = 1;
}

function render() {
  const bgColor = getColor('--wave-bg') || '#0a0f12';
  canvases.forEach((c, ch) => {
    const r = c.parentElement.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    const ctx = ctxs[ch];
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    const color = getColor(channelColors[ch]);
    if (viewMode === 'line') {
      drawLine(ctx, buffers[ch], w, h, color);
    } else {
      drawBar(ctx, buffers[ch], w, h, color);
    }
  });
  requestAnimationFrame(render);
}

/* ── Keyboard Fallback ─────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); triggerGesture('tap'); }
  if (e.code === 'KeyC') triggerGesture('double_tap');
  if (e.code === 'KeyV') triggerGesture('twist');
  if (e.key === ']') {
    vScale = Math.min(3, vScale + 0.2);
    const p = (vScale - 0.2) / 2.8;
    emit('pressure', { value: Math.round(p * 100), normalized: p, timestamp: Date.now() });
  }
  if (e.key === '[') {
    vScale = Math.max(0.2, vScale - 0.2);
    const p = (vScale - 0.2) / 2.8;
    emit('pressure', { value: Math.round(p * 100), normalized: p, timestamp: Date.now() });
  }
});

/* ── Buttons ───────────────────────────────────────────────── */
document.getElementById('simFreeze').addEventListener('click', () => triggerGesture('tap'));
document.getElementById('simClear').addEventListener('click', () => triggerGesture('double_tap'));
document.getElementById('simView').addEventListener('click', () => triggerGesture('twist'));

/* ── Init ──────────────────────────────────────────────────── */
connect();
render();
</script>
</body>
</html>

```

### preview/gesture-speech.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gesture-to-Speech — Mudra Studio</title>
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
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

  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  /* Category tabs */
  .tab-bar { display: flex; gap: 0; background: var(--card); border-bottom: 1px solid var(--border); flex-shrink: 0; overflow-x: auto; }
  .tab { flex: 1; padding: 10px 16px; font-size: 13px; font-weight: 600; text-align: center; cursor: pointer; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: all 150ms; white-space: nowrap; min-width: 90px; }
  .tab.active { color: var(--primary); border-bottom-color: var(--primary); background: var(--surface); }
  .tab:hover { color: var(--text); }

  /* Current phrase display */
  .phrase-display { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 20px 16px; flex-shrink: 0; }
  .current-phrase { font-size: 32px; font-weight: 700; text-align: center; transition: all 200ms; min-height: 48px; }
  .current-phrase.speaking { color: var(--primary); transform: scale(1.05); }
  .speaking-indicator { display: flex; align-items: center; gap: 6px; margin-top: 10px; height: 20px; }
  .speaking-indicator .wave { width: 3px; height: 8px; background: var(--primary); border-radius: 2px; animation: wave 0.6s ease-in-out infinite; opacity: 0; }
  .speaking-indicator.active .wave { opacity: 1; }
  .speaking-indicator .wave:nth-child(2) { animation-delay: 0.1s; height: 14px; }
  .speaking-indicator .wave:nth-child(3) { animation-delay: 0.2s; height: 18px; }
  .speaking-indicator .wave:nth-child(4) { animation-delay: 0.3s; height: 12px; }
  .speaking-indicator .wave:nth-child(5) { animation-delay: 0.4s; height: 8px; }
  @keyframes wave { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1.5); } }

  .recording-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--error); margin-right: 6px; opacity: 0; transition: opacity 150ms; }
  .recording-dot.active { opacity: 1; animation: pulse-rec 1s ease-in-out infinite; }
  @keyframes pulse-rec { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }

  /* Phrase grid */
  .phrase-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; padding: 0 16px 16px; overflow-y: auto; align-content: start; }
  .phrase-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 12px; text-align: center; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 150ms; position: relative; }
  .phrase-card.active { border-color: var(--primary); background: rgba(79,70,229,0.08); box-shadow: 0 0 12px rgba(79,70,229,0.12); }
  .phrase-card.speaking { animation: pulse-speak 0.5s ease; }
  @keyframes pulse-speak { 0% { transform: scale(1); } 50% { transform: scale(1.06); box-shadow: 0 0 20px rgba(79,70,229,0.25); } 100% { transform: scale(1); } }
  .phrase-card:hover { border-color: var(--accent); }
  .phrase-card.custom { border-style: dashed; }
  .phrase-card .delete-x { position: absolute; top: 4px; right: 8px; font-size: 10px; color: var(--text-secondary); opacity: 0; cursor: pointer; }
  .phrase-card.custom:hover .delete-x { opacity: 0.6; }

  /* Bottom bar */
  .bottom-bar { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; }
    .phrase-display { padding: 16px 12px 8px; }
    .current-phrase { font-size: 24px; }
    .phrase-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 0 10px 10px; }
    .bottom-bar { gap: 8px; padding: 8px 10px; }
    .hint { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> Gesture-to-Speech</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <span class="recording-dot" id="recDot"></span>
    <button class="btn" id="simTap">Simulate Tap</button>
    <button class="btn" id="simTwist">Simulate Twist</button>
  </div>
</div>

<div class="main">
  <div class="tab-bar" id="tabBar"></div>
  <div class="phrase-display">
    <div class="current-phrase" id="currentPhrase">Hello</div>
    <div class="speaking-indicator" id="speakingInd">
      <div class="wave"></div><div class="wave"></div><div class="wave"></div><div class="wave"></div><div class="wave"></div>
    </div>
  </div>
  <div class="phrase-grid" id="phraseGrid"></div>
</div>

<div class="bottom-bar">
  <span class="hint">Space = speak &middot; &larr;&rarr; category &middot; &uarr;&darr; phrase &middot; Shift = button hold</span>
</div>

<div class="mudra-badge">Created by Mudra</div>

<script>
/* ── Mudra Protocol Connection (v2) ────────────────────────── */
const WS_URL = 'ws://127.0.0.1:8766';
const SIGNALS = ['gesture', 'button', 'navigation'];

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
        // connection_status removed — new server does not emit it
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
    /* simulate navigation deltas */
    const dx = Math.round(Math.sin(t * 0.3) * 2);
    const dy = Math.round(Math.cos(t * 0.5) * 1.5);
    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
      emit('navigation', { delta_x: dx, delta_y: dy, timestamp: Date.now() });
    }
    /* occasional button press/release */
    if (Math.random() < 0.003) {
      emit('button', { state: 'pressed', timestamp: Date.now() });
      setTimeout(() => emit('button', { state: 'released', timestamp: Date.now() }), 600);
    }
    /* occasional gesture */
    if (Math.random() < 0.006) {
      const g = ['tap', 'double_tap', 'twist', 'double_twist'];
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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


/* ── Phrase Categories ─────────────────────────────────────── */
const categories = {
  Greetings: ['Hello', 'Good morning', 'Nice to meet you', 'Goodbye'],
  Needs: ['Water please', 'I need help', 'Yes', 'No', 'Thank you'],
  Responses: ['I agree', 'Not sure', 'Can you repeat?', 'One moment'],
  Custom: []
};
const categoryNames = Object.keys(categories);
let currentCategory = 0;
let currentPhraseIdx = 0;
let isSpeaking = false;

/* ── UI Elements ───────────────────────────────────────────── */
const tabBar = document.getElementById('tabBar');
const phraseGrid = document.getElementById('phraseGrid');
const currentPhraseEl = document.getElementById('currentPhrase');
const speakingInd = document.getElementById('speakingInd');
const recDot = document.getElementById('recDot');

/* nav accumulator for smoother scrolling through navigation deltas */
let navAccX = 0, navAccY = 0;
const NAV_THRESHOLD = 8;

function renderTabs() {
  tabBar.innerHTML = '';
  categoryNames.forEach((name, i) => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (i === currentCategory ? ' active' : '');
    tab.textContent = name + (name === 'Custom' && categories.Custom.length ? ' (' + categories.Custom.length + ')' : '');
    tab.addEventListener('click', () => { currentCategory = i; currentPhraseIdx = 0; renderAll(); });
    tabBar.appendChild(tab);
  });
}

function renderPhrases() {
  phraseGrid.innerHTML = '';
  const phrases = categories[categoryNames[currentCategory]];
  if (phrases.length === 0 && categoryNames[currentCategory] === 'Custom') {
    const empty = document.createElement('div');
    empty.style.cssText = 'grid-column: 1/-1; text-align:center; color:var(--text-secondary); font-size:13px; padding:30px 0;';
    empty.textContent = 'No custom phrases yet. Double-tap to add one.';
    phraseGrid.appendChild(empty);
    return;
  }
  phrases.forEach((phrase, i) => {
    const card = document.createElement('div');
    const isCustom = categoryNames[currentCategory] === 'Custom';
    card.className = 'phrase-card' + (i === currentPhraseIdx ? ' active' : '') + (isCustom ? ' custom' : '');
    card.textContent = phrase;
    card.addEventListener('click', () => { currentPhraseIdx = i; renderAll(); speakPhrase(phrase); });
    if (isCustom) {
      const x = document.createElement('span');
      x.className = 'delete-x';
      x.textContent = '\u2715';
      x.addEventListener('click', (e) => { e.stopPropagation(); categories.Custom.splice(i, 1); if (currentPhraseIdx >= categories.Custom.length) currentPhraseIdx = Math.max(0, categories.Custom.length - 1); renderAll(); });
      card.appendChild(x);
    }
    phraseGrid.appendChild(card);
  });
}

function renderAll() {
  renderTabs();
  renderPhrases();
  const phrases = categories[categoryNames[currentCategory]];
  if (phrases.length > 0 && currentPhraseIdx < phrases.length) {
    currentPhraseEl.textContent = phrases[currentPhraseIdx];
  } else {
    currentPhraseEl.textContent = '\u2014';
  }
}

function speakPhrase(text) {
  if (!text) return;
  currentPhraseEl.textContent = text;
  currentPhraseEl.classList.add('speaking');
  speakingInd.classList.add('active');
  isSpeaking = true;

  /* animate the active card */
  const cards = phraseGrid.querySelectorAll('.phrase-card');
  if (cards[currentPhraseIdx]) {
    cards[currentPhraseIdx].classList.remove('speaking');
    void cards[currentPhraseIdx].offsetWidth;
    cards[currentPhraseIdx].classList.add('speaking');
  }

  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9; u.pitch = 1;
    u.onend = () => {
      currentPhraseEl.classList.remove('speaking');
      speakingInd.classList.remove('active');
      isSpeaking = false;
    };
    speechSynthesis.speak(u);
  } else {
    setTimeout(() => {
      currentPhraseEl.classList.remove('speaking');
      speakingInd.classList.remove('active');
      isSpeaking = false;
    }, 1000);
  }
}

renderAll();

/* ── Signal Handlers ───────────────────────────────────────── */
on('gesture', (d) => {
  const type = d.type || 'unknown';
  const phrases = categories[categoryNames[currentCategory]];

  if (type === 'tap') {
    /* speak the currently highlighted phrase */
    if (phrases.length > 0 && currentPhraseIdx < phrases.length) {
      speakPhrase(phrases[currentPhraseIdx]);
    }
  }
  if (type === 'double_tap') {
    /* add a custom phrase */
    const text = prompt('Enter a custom phrase:');
    if (text && text.trim()) {
      categories.Custom.push(text.trim());
      /* switch to Custom tab */
      currentCategory = categoryNames.indexOf('Custom');
      currentPhraseIdx = categories.Custom.length - 1;
      renderAll();
    }
  }
  if (type === 'twist') {
    /* delete last custom phrase */
    if (categories.Custom.length > 0) {
      categories.Custom.pop();
      if (categoryNames[currentCategory] === 'Custom') {
        currentPhraseIdx = Math.max(0, categories.Custom.length - 1);
      }
      renderAll();
    }
  }
  if (type === 'double_twist') {
    /* clear all custom phrases */
    categories.Custom.length = 0;
    if (categoryNames[currentCategory] === 'Custom') {
      currentPhraseIdx = 0;
    }
    renderAll();
  }
});

on('button', (d) => {
  if (d.state === 'pressed') {
    recDot.classList.add('active');
  } else {
    recDot.classList.remove('active');
  }
});

on('navigation', (d) => {
  navAccX += (d.delta_x || 0);
  navAccY += (d.delta_y || 0);

  /* horizontal: cycle categories */
  if (Math.abs(navAccX) >= NAV_THRESHOLD) {
    const dir = navAccX > 0 ? 1 : -1;
    currentCategory = (currentCategory + dir + categoryNames.length) % categoryNames.length;
    currentPhraseIdx = 0;
    navAccX = 0;
    renderAll();
  }

  /* vertical: cycle phrases within category */
  if (Math.abs(navAccY) >= NAV_THRESHOLD) {
    const phrases = categories[categoryNames[currentCategory]];
    if (phrases.length > 0) {
      const dir = navAccY > 0 ? 1 : -1;
      currentPhraseIdx = (currentPhraseIdx + dir + phrases.length) % phrases.length;
      navAccY = 0;
      renderAll();
    } else {
      navAccY = 0;
    }
  }
});

/* ── Keyboard Fallback ─────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    triggerGesture('tap');
  }
  if (e.code === 'ArrowRight') {
    e.preventDefault();
    currentCategory = (currentCategory + 1) % categoryNames.length;
    currentPhraseIdx = 0;
    renderAll();
  }
  if (e.code === 'ArrowLeft') {
    e.preventDefault();
    currentCategory = (currentCategory - 1 + categoryNames.length) % categoryNames.length;
    currentPhraseIdx = 0;
    renderAll();
  }
  if (e.code === 'ArrowDown') {
    e.preventDefault();
    const phrases = categories[categoryNames[currentCategory]];
    if (phrases.length > 0) {
      currentPhraseIdx = (currentPhraseIdx + 1) % phrases.length;
      renderAll();
    }
  }
  if (e.code === 'ArrowUp') {
    e.preventDefault();
    const phrases = categories[categoryNames[currentCategory]];
    if (phrases.length > 0) {
      currentPhraseIdx = (currentPhraseIdx - 1 + phrases.length) % phrases.length;
      renderAll();
    }
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    emit('button', { state: 'pressed', timestamp: Date.now() });
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    emit('button', { state: 'released', timestamp: Date.now() });
  }
});

/* ── Buttons ───────────────────────────────────────────────── */
document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));
document.getElementById('simTwist').addEventListener('click', () => triggerGesture('twist'));

/* ── Start ─────────────────────────────────────────────────── */
connect();
</script>
</body>
</html>

```

### preview/smart-home.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Smart Home Control — Mudra Studio</title>
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  :root {
    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;
    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;
    --warning: #eab308; --error: #ef4444;
    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);
    --device-bg: #f1f5f9; --device-on: rgba(79,70,229,0.06);
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

  /* Room tabs */
  .room-tabs { display: flex; gap: 4px; padding: 10px 16px 0; flex-shrink: 0; overflow-x: auto; }
  .room-tab { padding: 8px 18px; border-radius: 10px 10px 0 0; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 150ms; background: var(--surface); border: 1px solid var(--border); border-bottom: none; color: var(--text-secondary); white-space: nowrap; }
  .room-tab.active { background: var(--card); color: var(--primary); border-color: var(--primary); }
  .room-tab:hover { color: var(--primary); }

  /* Devices grid */
  .devices-area { flex: 1; overflow-y: auto; padding: 16px; }
  .room-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .device-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
  .device-card { background: var(--device-bg); border: 2px solid var(--border); border-radius: 14px; padding: 16px; cursor: pointer; transition: all 200ms; position: relative; }
  .device-card.selected { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(79,70,229,0.15); }
  .device-card.on { background: var(--device-on); }
  .device-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .device-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: var(--surface); border: 1px solid var(--border); }
  .device-toggle { width: 36px; height: 20px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); position: relative; transition: background 200ms; cursor: pointer; flex-shrink: 0; }
  .device-toggle.on { background: var(--primary); border-color: var(--primary); }
  .device-toggle::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: var(--text); top: 1px; left: 1px; transition: transform 200ms; }
  .device-toggle.on::after { transform: translateX(16px); }
  .device-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
  .device-status { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
  .dimmer-wrap { height: 6px; background: var(--surface); border-radius: 3px; overflow: hidden; border: 1px solid var(--border); }
  .dimmer-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 3px; transition: width 100ms; }
  .dimmer-val { font-size: 20px; font-weight: 800; color: var(--primary); font-variant-numeric: tabular-nums; margin-top: 4px; }

  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }
  .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 12px; }
  .meter { display: flex; align-items: center; gap: 8px; }
  .meter-bar { width: 80px; height: 8px; background: var(--surface); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
  .meter-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 999px; transition: width 75ms linear; width: 0%; }
  .meter-val { font-size: 12px; color: var(--text-secondary); min-width: 32px; text-align: right; font-variant-numeric: tabular-nums; }
  .info-text { font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
  .info-text b { color: var(--primary); font-weight: 600; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }
    .device-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
    .hint { display: none; } .meter-bar { width: 50px; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> Smart Home Control</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <button class="btn" id="simTap">Toggle Device</button>
    <button class="btn" id="simAllOff">All Off</button>
  </div>
</div>

<div class="room-tabs" id="roomTabs"></div>

<div class="devices-area" id="devicesArea">
  <div class="room-label" id="roomLabel">Living Room</div>
  <div class="device-grid" id="deviceGrid"></div>
</div>

<div class="toolbar">
  <div class="toolbar-left">
    <div class="meter">
      <span class="meter-val" id="pressVal">0%</span>
      <div class="meter-bar"><div class="meter-fill" id="pressFill"></div></div>
    </div>
    <span class="info-text">Room: <b id="infoRoom">Living Room</b></span>
    <span class="info-text">Device: <b id="infoDevice">--</b></span>
  </div>
  <span class="hint">Arrows navigate &middot; Space toggle &middot; A all off &middot; [ ] dimmer</span>
</div>

<div class="mudra-badge">Created by Mudra</div>

<script>
/* ── Mudra Protocol Connection (v2) ────────────────────────── */
const WS_URL = 'ws://127.0.0.1:8766';
const SIGNALS = ['gesture', 'navigation', 'pressure'];

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
        // connection_status removed — new server does not emit it
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
  let t = 0, actionTimer = 0;
  simTimer = setInterval(() => {
    t += 0.05;
    // Gentle pressure
    const n = Math.max(0, Math.min(1, 0.4 + 0.3 * Math.sin(t * 0.4) + (Math.random() - 0.5) * 0.05));
    emit('pressure', { value: Math.round(n * 100), normalized: n, timestamp: Date.now() });
    // Navigation to cycle rooms/devices
    actionTimer += 60;
    if (actionTimer >= 3000) {
      actionTimer = 0;
      if (Math.random() < 0.4) {
        emit('navigation', { delta_x: Math.random() < 0.5 ? 8 : -8, delta_y: 0, timestamp: Date.now() });
      } else {
        emit('navigation', { delta_x: 0, delta_y: Math.random() < 0.5 ? 8 : -8, timestamp: Date.now() });
      }
    }
    // Occasional gestures
    if (Math.random() < 0.003) {
      const g = ['tap', 'double_tap', 'twist', 'double_twist'];
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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


/* ── Smart Home Data ───────────────────────────────────────── */
const rooms = [
  {
    name: 'Living Room', icon: '\uD83D\uDECB',
    devices: [
      { name: 'Main Light', icon: '\uD83D\uDCA1', on: true, dimmer: 75 },
      { name: 'TV', icon: '\uD83D\uDCFA', on: false, dimmer: 80 },
      { name: 'AC', icon: '\u2744\uFE0F', on: true, dimmer: 22 },
      { name: 'Speaker', icon: '\uD83D\uDD0A', on: false, dimmer: 60 }
    ]
  },
  {
    name: 'Bedroom', icon: '\uD83D\uDECF',
    devices: [
      { name: 'Ceiling Light', icon: '\uD83D\uDCA1', on: false, dimmer: 50 },
      { name: 'Fan', icon: '\uD83C\uDF2C\uFE0F', on: true, dimmer: 70 },
      { name: 'Lamp', icon: '\uD83D\uDD6F', on: true, dimmer: 40 }
    ]
  },
  {
    name: 'Kitchen', icon: '\uD83C\uDF73',
    devices: [
      { name: 'Light', icon: '\uD83D\uDCA1', on: true, dimmer: 100 },
      { name: 'Coffee Maker', icon: '\u2615', on: false, dimmer: 0 },
      { name: 'Oven', icon: '\uD83C\uDF56', on: false, dimmer: 0 }
    ]
  },
  {
    name: 'Office', icon: '\uD83D\uDCBB',
    devices: [
      { name: 'Desk Lamp', icon: '\uD83D\uDCA1', on: true, dimmer: 85 },
      { name: 'Monitor', icon: '\uD83D\uDDA5', on: true, dimmer: 70 },
      { name: 'Heater', icon: '\uD83D\uDD25', on: false, dimmer: 50 }
    ]
  }
];

let currentRoom = 0;
let currentDevice = 0;
let navAccX = 0, navAccY = 0;
const NAV_THRESHOLD = 5;

const roomTabsEl = document.getElementById('roomTabs');
const deviceGridEl = document.getElementById('deviceGrid');
const roomLabelEl = document.getElementById('roomLabel');
const pressVal = document.getElementById('pressVal');
const pressFill = document.getElementById('pressFill');

/* ── Build Room Tabs ───────────────────────────────────────── */
rooms.forEach(function(room, i) {
  const tab = document.createElement('div');
  tab.className = 'room-tab' + (i === 0 ? ' active' : '');
  tab.id = 'rtab' + i;
  tab.textContent = room.icon + ' ' + room.name;
  tab.addEventListener('click', function() { selectRoom(i); });
  roomTabsEl.appendChild(tab);
});

function selectRoom(idx) {
  currentRoom = idx;
  currentDevice = 0;
  rooms.forEach(function(_, i) {
    document.getElementById('rtab' + i).classList.toggle('active', i === idx);
  });
  roomLabelEl.textContent = rooms[idx].name;
  document.getElementById('infoRoom').textContent = rooms[idx].name;
  renderDevices();
}

function renderDevices() {
  while (deviceGridEl.firstChild) deviceGridEl.removeChild(deviceGridEl.firstChild);
  const devs = rooms[currentRoom].devices;
  devs.forEach(function(dev, i) {
    const card = document.createElement('div');
    card.className = 'device-card' + (dev.on ? ' on' : '') + (i === currentDevice ? ' selected' : '');
    card.id = 'dcard' + i;
    card.addEventListener('click', function() { selectDevice(i); });

    const top = document.createElement('div');
    top.className = 'device-card-top';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'device-icon';
    iconDiv.textContent = dev.icon;

    const toggle = document.createElement('div');
    toggle.className = 'device-toggle' + (dev.on ? ' on' : '');
    toggle.id = 'dtoggle' + i;

    top.appendChild(iconDiv);
    top.appendChild(toggle);
    card.appendChild(top);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'device-name';
    nameDiv.textContent = dev.name;
    card.appendChild(nameDiv);

    const statusDiv = document.createElement('div');
    statusDiv.className = 'device-status';
    statusDiv.id = 'dstatus' + i;
    statusDiv.textContent = dev.on ? 'On \u2014 ' + dev.dimmer + '%' : 'Off';
    card.appendChild(statusDiv);

    const dimWrap = document.createElement('div');
    dimWrap.className = 'dimmer-wrap';
    const dimFill = document.createElement('div');
    dimFill.className = 'dimmer-fill';
    dimFill.id = 'dfill' + i;
    dimFill.style.width = (dev.on ? dev.dimmer : 0) + '%';
    dimWrap.appendChild(dimFill);
    card.appendChild(dimWrap);

    const valDiv = document.createElement('div');
    valDiv.className = 'dimmer-val';
    valDiv.id = 'dval' + i;
    valDiv.textContent = dev.on ? dev.dimmer + '%' : '--';
    card.appendChild(valDiv);

    deviceGridEl.appendChild(card);
  });
  updateDeviceInfo();
}

function selectDevice(idx) {
  const devs = rooms[currentRoom].devices;
  if (idx < 0 || idx >= devs.length) return;
  currentDevice = idx;
  devs.forEach(function(_, i) {
    const card = document.getElementById('dcard' + i);
    if (card) card.classList.toggle('selected', i === idx);
  });
  updateDeviceInfo();
}

function updateDeviceInfo() {
  const dev = rooms[currentRoom].devices[currentDevice];
  if (dev) {
    document.getElementById('infoDevice').textContent = dev.name;
  }
}

function updateDeviceCard(idx) {
  const dev = rooms[currentRoom].devices[idx];
  if (!dev) return;
  const card = document.getElementById('dcard' + idx);
  if (!card) return;
  card.classList.toggle('on', dev.on);
  const toggle = document.getElementById('dtoggle' + idx);
  if (toggle) toggle.classList.toggle('on', dev.on);
  const status = document.getElementById('dstatus' + idx);
  if (status) status.textContent = dev.on ? 'On \u2014 ' + dev.dimmer + '%' : 'Off';
  const fill = document.getElementById('dfill' + idx);
  if (fill) fill.style.width = (dev.on ? dev.dimmer : 0) + '%';
  const val = document.getElementById('dval' + idx);
  if (val) val.textContent = dev.on ? dev.dimmer + '%' : '--';
}

function toggleDevice(idx) {
  const dev = rooms[currentRoom].devices[idx];
  if (!dev) return;
  dev.on = !dev.on;
  updateDeviceCard(idx);
}

function allDevicesOff() {
  rooms.forEach(function(room) {
    room.devices.forEach(function(dev) { dev.on = false; });
  });
  renderDevices();
}

renderDevices();

/* ── Signal Handlers ───────────────────────────────────────── */
on('navigation', (d) => {
  const dx = d.delta_x || 0;
  const dy = d.delta_y || 0;
  navAccX += dx;
  navAccY += dy;

  if (Math.abs(navAccX) > NAV_THRESHOLD) {
    if (navAccX > 0) {
      selectRoom((currentRoom + 1) % rooms.length);
    } else {
      selectRoom((currentRoom - 1 + rooms.length) % rooms.length);
    }
    navAccX = 0; navAccY = 0;
  }
  if (Math.abs(navAccY) > NAV_THRESHOLD) {
    const devs = rooms[currentRoom].devices;
    if (navAccY > 0) {
      selectDevice((currentDevice + 1) % devs.length);
    } else {
      selectDevice((currentDevice - 1 + devs.length) % devs.length);
    }
    navAccX = 0; navAccY = 0;
  }
});

on('gesture', (d) => {
  const type = d.type || 'unknown';
  if (type === 'tap') {
    toggleDevice(currentDevice);
  }
  if (type === 'double_tap') {
    allDevicesOff();
  }
  if (type === 'twist') {
    selectRoom((currentRoom + 1) % rooms.length);
  }
});

on('pressure', (d) => {
  const p = Math.max(0, Math.min(1, d.normalized ?? d.value / 100));
  pressVal.textContent = Math.round(p * 100) + '%';
  pressFill.style.width = Math.round(p * 100) + '%';
  // Adjust dimmer of selected device
  const dev = rooms[currentRoom].devices[currentDevice];
  if (dev && dev.on) {
    dev.dimmer = Math.round(p * 100);
    updateDeviceCard(currentDevice);
  }
});

/* ── Keyboard Fallback ─────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowRight') { e.preventDefault(); emit('navigation', { delta_x: 10, delta_y: 0, timestamp: Date.now() }); }
  if (e.code === 'ArrowLeft') { e.preventDefault(); emit('navigation', { delta_x: -10, delta_y: 0, timestamp: Date.now() }); }
  if (e.code === 'ArrowDown') { e.preventDefault(); emit('navigation', { delta_x: 0, delta_y: 10, timestamp: Date.now() }); }
  if (e.code === 'ArrowUp') { e.preventDefault(); emit('navigation', { delta_x: 0, delta_y: -10, timestamp: Date.now() }); }
  if (e.code === 'Space') { e.preventDefault(); triggerGesture('tap'); }
  if (e.code === 'KeyA') triggerGesture('double_tap');
  if (e.key === ']') {
    const dev = rooms[currentRoom].devices[currentDevice];
    if (dev && dev.on) {
      dev.dimmer = Math.min(100, dev.dimmer + 5);
      updateDeviceCard(currentDevice);
      emit('pressure', { value: dev.dimmer, normalized: dev.dimmer / 100, timestamp: Date.now() });
    }
  }
  if (e.key === '[') {
    const dev = rooms[currentRoom].devices[currentDevice];
    if (dev && dev.on) {
      dev.dimmer = Math.max(0, dev.dimmer - 5);
      updateDeviceCard(currentDevice);
      emit('pressure', { value: dev.dimmer, normalized: dev.dimmer / 100, timestamp: Date.now() });
    }
  }
});

/* ── Buttons ───────────────────────────────────────────────── */
document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));
document.getElementById('simAllOff').addEventListener('click', () => triggerGesture('double_tap'));

/* ── Init ──────────────────────────────────────────────────── */
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
        // connection_status removed — new server does not emit it
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
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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

### preview/neural-snake.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Neural Snake — Mudra Studio</title>
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  :root {
    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;
    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;
    --warning: #eab308; --error: #ef4444;
    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);
    --grid-line: rgba(79,70,229,0.06); --game-bg: #f0fdfa;
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

  .score-bar { display: flex; align-items: center; justify-content: center; gap: 32px; padding: 8px 16px; flex-shrink: 0; }
  .score-item { text-align: center; }
  .score-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
  .score-value { font-size: 24px; font-weight: 800; color: var(--primary); font-variant-numeric: tabular-nums; }

  .game-wrap { flex: 1; display: flex; justify-content: center; align-items: center; padding: 0 12px 12px; position: relative; }
  canvas { background: var(--game-bg); border: 1px solid var(--border); border-radius: 12px; max-width: 100%; max-height: 100%; }

  .boost-indicator { position: absolute; top: 16px; right: 24px; background: rgba(79,70,229,0.12); border: 1px solid var(--primary); color: var(--primary); padding: 5px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; letter-spacing: 1px; opacity: 0; transition: opacity 200ms; z-index: 15; }
  .boost-indicator.show { opacity: 1; }

  .overlay { position: fixed; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(0,0,0,0.8); z-index: 90; opacity: 0; pointer-events: none; transition: opacity 300ms; }
  .overlay.show { opacity: 1; pointer-events: auto; }
  .overlay h2 { font-size: 36px; font-weight: 800; margin-bottom: 8px; }
  .overlay h2 em { font-style: normal; color: var(--primary); }
  .overlay p { color: var(--text-secondary); font-size: 16px; }

  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }
  .sig-row { display: flex; gap: 14px; }
  .sig { font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
  .sig b { color: var(--primary); font-weight: 600; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }
    .hint { display: none; } .score-bar { gap: 20px; padding: 6px 12px; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> Neural Snake</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <button class="btn" id="simTap">Simulate Tap</button>
    <button class="btn" id="simRestart">Restart</button>
  </div>
</div>

<div class="score-bar">
  <div class="score-item"><div class="score-label">Score</div><div class="score-value" id="score">0</div></div>
  <div class="score-item"><div class="score-label">Speed</div><div class="score-value" id="speed">1x</div></div>
  <div class="score-item"><div class="score-label">High Score</div><div class="score-value" id="highScore">0</div></div>
</div>

<div class="game-wrap">
  <canvas id="canvas" width="400" height="400"></canvas>
  <div class="boost-indicator" id="boostInd">BOOST</div>
</div>

<div class="overlay" id="overlay">
  <h2>Game <em>Over</em></h2>
  <p id="overMsg">Score: 0 — Restarting in 3s...</p>
</div>

<div class="toolbar">
  <span class="hint">Arrows steer &middot; Space boost &middot; R restart &middot; G toggle grid</span>
  <div class="sig-row">
    <div class="sig">dX: <b id="vDx">0</b></div>
    <div class="sig">dY: <b id="vDy">0</b></div>
    <div class="sig">Dir: <b id="vDir">RIGHT</b></div>
  </div>
</div>

<div class="mudra-badge">Created by Mudra</div>

<script>
/* ── Mudra Protocol Connection (v2) ────────────────────────── */
const WS_URL = 'ws://127.0.0.1:8766';
const SIGNALS = ['navigation', 'gesture'];

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
        // connection_status removed — new server does not emit it
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
    // Navigate toward food
    if (!gameOver && food) {
      const head = snake[0];
      let dx = food.x - head.x;
      let dy = food.y - head.y;
      // Add occasional random deviation
      if (Math.random() < 0.15) {
        dx += (Math.random() - 0.5) * 8;
        dy += (Math.random() - 0.5) * 8;
      }
      emit('navigation', { delta_x: dx * 0.8, delta_y: dy * 0.8, timestamp: Date.now() });
    }
    // Occasional gestures
    if (Math.random() < 0.003) {
      const g = ['tap', 'double_tap', 'twist', 'double_twist'];
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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


/* ── Game Setup ────────────────────────────────────────────── */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const GRID = 20;
const CELL = canvas.width / GRID;

let snake, dir, nextDir, food, score, highScore = 0, gameOver, boosted, boostEnd;
let showGrid = true;
const baseInterval = 150;
let lastTick = 0;

// Accumulate navigation deltas to determine direction
let navAccX = 0, navAccY = 0;
const NAV_THRESHOLD = 3;

function init() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
  score = 0; gameOver = false; boosted = false; boostEnd = 0;
  navAccX = 0; navAccY = 0;
  placeFood();
  document.getElementById('score').textContent = '0';
  document.getElementById('speed').textContent = '1x';
  document.getElementById('overlay').classList.remove('show');
}

function placeFood() {
  let attempts = 0;
  do {
    food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    attempts++;
  } while (snake.some(s => s.x === food.x && s.y === food.y) && attempts < 200);
}

function tick(now) {
  requestAnimationFrame(tick);
  if (gameOver) { draw(); return; }
  const interval = boosted && now < boostEnd ? baseInterval / 2 : baseInterval;
  if (now - lastTick < interval) { draw(); return; }
  lastTick = now;

  if (boosted && now >= boostEnd) { boosted = false; document.getElementById('boostInd').classList.remove('show'); document.getElementById('speed').textContent = '1x'; }

  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver = true;
    if (score > highScore) { highScore = score; document.getElementById('highScore').textContent = String(highScore); }
    document.getElementById('overlay').classList.add('show');
    document.getElementById('overMsg').textContent = 'Score: ' + score + ' \u2014 Restarting in 3s...';
    setTimeout(init, 3000);
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById('score').textContent = String(score);
    placeFood();
  } else {
    snake.pop();
  }
  draw();
}

function draw() {
  const w = canvas.width, h = canvas.height;
  // Background
  const cs = getComputedStyle(document.documentElement);
  ctx.fillStyle = cs.getPropertyValue('--game-bg').trim() || '#0a0f12';
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  if (showGrid) {
    ctx.strokeStyle = cs.getPropertyValue('--grid-line').trim() || 'rgba(79,70,229,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(w, i * CELL); ctx.stroke();
    }
  }

  // Food
  const primary = cs.getPropertyValue('--accent').trim() || '#06b6d4';
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Snake
  const headColor = cs.getPropertyValue('--primary').trim() || '#4f46e5';
  snake.forEach((s, i) => {
    const alpha = 1 - (i / snake.length) * 0.5;
    if (i === 0) {
      ctx.fillStyle = headColor;
    } else {
      ctx.fillStyle = `rgba(79,70,229,${alpha})`;
    }
    const pad = i === 0 ? 1 : 2;
    ctx.beginPath();
    ctx.roundRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 4);
    ctx.fill();
  });
}

/* ── Signal Handlers ───────────────────────────────────────── */
on('navigation', (d) => {
  const dx = d.delta_x || 0;
  const dy = d.delta_y || 0;
  document.getElementById('vDx').textContent = dx.toFixed(1);
  document.getElementById('vDy').textContent = dy.toFixed(1);

  navAccX += dx;
  navAccY += dy;

  // Determine direction from accumulated deltas
  if (Math.abs(navAccX) > NAV_THRESHOLD || Math.abs(navAccY) > NAV_THRESHOLD) {
    let nd = null;
    if (Math.abs(navAccX) > Math.abs(navAccY)) {
      nd = navAccX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      nd = navAccY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
    // Prevent 180-degree reversal
    if (nd && !(nd.x === -dir.x && nd.y === -dir.y)) {
      nextDir = nd;
      const names = { '1,0': 'RIGHT', '-1,0': 'LEFT', '0,1': 'DOWN', '0,-1': 'UP' };
      document.getElementById('vDir').textContent = names[nd.x + ',' + nd.y] || '';
    }
    navAccX = 0;
    navAccY = 0;
  }
});

on('gesture', (d) => {
  const type = d.type || 'unknown';
  if (type === 'tap') {
    boosted = true;
    boostEnd = performance.now() + 2000;
    document.getElementById('boostInd').classList.add('show');
    document.getElementById('speed').textContent = '2x';
  }
  if (type === 'double_tap') init();
  if (type === 'twist') {
    showGrid = !showGrid;
  }
});

/* ── Keyboard Fallback ─────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowRight') { e.preventDefault(); emit('navigation', { delta_x: 10, delta_y: 0, timestamp: Date.now() }); }
  if (e.code === 'ArrowLeft') { e.preventDefault(); emit('navigation', { delta_x: -10, delta_y: 0, timestamp: Date.now() }); }
  if (e.code === 'ArrowDown') { e.preventDefault(); emit('navigation', { delta_x: 0, delta_y: 10, timestamp: Date.now() }); }
  if (e.code === 'ArrowUp') { e.preventDefault(); emit('navigation', { delta_x: 0, delta_y: -10, timestamp: Date.now() }); }
  if (e.code === 'Space') { e.preventDefault(); triggerGesture('tap'); }
  if (e.code === 'KeyR') triggerGesture('double_tap');
  if (e.code === 'KeyG') triggerGesture('twist');
});

/* ── Buttons ───────────────────────────────────────────────── */
document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));
document.getElementById('simRestart').addEventListener('click', () => triggerGesture('double_tap'));

/* ── Init ──────────────────────────────────────────────────── */
init();
connect();
requestAnimationFrame(tick);
</script>
</body>
</html>

```

### preview/presentation-controller.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Presentation Controller — Mudra Studio</title>
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  :root {
    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;
    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;
    --warning: #eab308; --error: #ef4444;
    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);
    --slide-bg: #f8fafc;
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

  .slide-container { flex: 1; position: relative; overflow: hidden; background: var(--slide-bg); }
  .slide { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px 60px; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s; text-align: center; }
  .slide.active { transform: translateX(0); opacity: 1; }
  .slide.left { transform: translateX(-100%); opacity: 0; }
  .slide.right { transform: translateX(100%); opacity: 0; }
  .slide h1 { font-size: clamp(28px, 5vw, 52px); font-weight: 800; margin-bottom: 16px; line-height: 1.15; }
  .slide h1 em { font-style: normal; color: var(--primary); }
  .slide p { font-size: clamp(14px, 2vw, 18px); color: var(--text-secondary); max-width: 600px; line-height: 1.7; }
  .slide .tag { display: inline-block; background: rgba(79,70,229,0.1); color: var(--primary); padding: 4px 14px; border-radius: 20px; font-size: 13px; margin-bottom: 14px; font-weight: 600; border: 1px solid rgba(79,70,229,0.15); }
  .slide ul { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; }
  .slide ul li { background: var(--surface); border: 1px solid var(--border); padding: 10px 18px; border-radius: 10px; font-size: 14px; color: var(--text-secondary); }

  .laser { position: fixed; border-radius: 50%; background: var(--error); box-shadow: 0 0 16px var(--error), 0 0 40px rgba(239,68,68,0.35); pointer-events: none; z-index: 90; opacity: 0; transition: opacity 0.15s; transform: translate(-50%, -50%); }

  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }
  .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 12px; }
  .nav-dots { display: flex; gap: 6px; }
  .nav-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); cursor: pointer; transition: background 150ms, border-color 150ms; }
  .nav-dot.active { background: var(--primary); border-color: var(--primary); }
  .slide-counter { font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums; min-width: 48px; text-align: center; }
  .meter { display: flex; align-items: center; gap: 8px; }
  .meter-bar { width: 80px; height: 8px; background: var(--surface); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
  .meter-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 999px; transition: width 75ms linear; width: 0%; }
  .meter-val { font-size: 12px; color: var(--text-secondary); min-width: 32px; text-align: right; font-variant-numeric: tabular-nums; }
  .laser-badge { font-size: 11px; color: var(--error); font-weight: 600; opacity: 0; transition: opacity 150ms; }
  .laser-badge.active { opacity: 1; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }
    .slide { padding: 24px 20px; } .meter-bar { width: 50px; } .hint { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> Presentation Controller</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <button class="btn" id="simTap">Simulate Tap</button>
    <button class="btn" id="simTwist">Simulate Twist</button>
  </div>
</div>

<div class="slide-container" id="slideContainer">
  <div class="slide active" id="slide0">
    <div class="tag">Welcome</div>
    <h1>Present with <em>Neural Input</em></h1>
    <p>Control your presentations using the Mudra wristband. No clicker, no remote — just natural gestures from your hand.</p>
  </div>
  <div class="slide right" id="slide1">
    <div class="tag">The Problem</div>
    <h1>Clickers Are <em>Outdated</em></h1>
    <p>Physical remotes get lost, run out of batteries, and limit your movement. Neural input frees you from hardware constraints entirely.</p>
  </div>
  <div class="slide right" id="slide2">
    <div class="tag">Technology</div>
    <h1>How <em>Mudra</em> Works</h1>
    <p>The Mudra wristband reads surface nerve signals (sEMG) from your wrist, detecting micro-gestures with millisecond latency and zero physical movement required.</p>
  </div>
  <div class="slide right" id="slide3">
    <div class="tag">Gestures</div>
    <h1>Gesture <em>Controls</em></h1>
    <p>Intuitive mapping of neural gestures to presentation actions. All customizable via the API.</p>
    <ul>
      <li>Tap: Next Slide</li>
      <li>Twist: Previous</li>
      <li>Double Tap: Laser Pointer</li>
      <li>Double Twist: Reset</li>
    </ul>
  </div>
  <div class="slide right" id="slide4">
    <div class="tag">Get Started</div>
    <h1>Join the <em>Waitlist</em></h1>
    <p>Be among the first developers to build with neural input APIs. Visit mudrastudio.dev to register for early access and start building the future of hands-free interaction.</p>
  </div>
</div>

<div class="laser" id="laser"></div>

<div class="toolbar">
  <div class="toolbar-left">
    <div class="nav-dots" id="navDots"></div>
    <span class="slide-counter" id="slideCounter">1 / 5</span>
    <span class="laser-badge" id="laserBadge">LASER</span>
  </div>
  <div class="toolbar-right">
    <div class="meter">
      <span class="meter-val" id="pressVal">0%</span>
      <div class="meter-bar"><div class="meter-fill" id="pressFill"></div></div>
    </div>
    <span class="hint">Arrow keys &middot; Space tap &middot; L laser &middot; [ ] size</span>
  </div>
</div>

<div class="mudra-badge">Created by Mudra</div>

<script>
/* ── Mudra Protocol Connection (v2) ────────────────────────── */
const WS_URL = 'ws://127.0.0.1:8766';
const SIGNALS = ['gesture', 'navigation', 'pressure'];

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
        // connection_status removed — new server does not emit it
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
  let t = 0, autoSlideTimer = 0;
  simTimer = setInterval(() => {
    t += 0.05;
    // Simulate pressure
    const n = Math.max(0, Math.min(1, 0.3 + 0.25 * Math.sin(t * 0.5) + (Math.random() - 0.5) * 0.08));
    emit('pressure', { value: Math.round(n * 100), normalized: n, timestamp: Date.now() });
    // Simulate navigation (move laser in circles when laser mode active)
    if (laserMode) {
      emit('navigation', { delta_x: Math.cos(t * 1.2) * 3, delta_y: Math.sin(t * 1.2) * 3, timestamp: Date.now() });
    }
    // Auto-advance slides every ~5s
    autoSlideTimer += 60;
    if (autoSlideTimer >= 5000) {
      autoSlideTimer = 0;
      emit('gesture', { type: 'tap', timestamp: Date.now() });
    }
    // Occasional random gestures
    if (Math.random() < 0.002) {
      const g = ['tap', 'double_tap', 'twist', 'double_twist'];
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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


/* ── Slide Logic ───────────────────────────────────────────── */
const TOTAL = 5;
let current = 0;
let laserMode = false;
let laserX = 50, laserY = 50;
let pressure = 0;

const laserEl = document.getElementById('laser');
const laserBadge = document.getElementById('laserBadge');
const pressVal = document.getElementById('pressVal');
const pressFill = document.getElementById('pressFill');
const slideCounter = document.getElementById('slideCounter');
const navDotsEl = document.getElementById('navDots');

// Build nav dots
for (let i = 0; i < TOTAL; i++) {
  const d = document.createElement('div');
  d.className = 'nav-dot' + (i === 0 ? ' active' : '');
  d.id = 'ndot' + i;
  d.addEventListener('click', () => goTo(i));
  navDotsEl.appendChild(d);
}

function goTo(idx) {
  if (idx < 0 || idx >= TOTAL || idx === current) return;
  const dir = idx > current ? 1 : -1;
  document.getElementById('slide' + current).className = 'slide ' + (dir > 0 ? 'left' : 'right');
  document.getElementById('slide' + idx).className = 'slide active';
  document.getElementById('ndot' + current).classList.remove('active');
  document.getElementById('ndot' + idx).classList.add('active');
  current = idx;
  slideCounter.textContent = (current + 1) + ' / ' + TOTAL;
}

function nextSlide() { goTo(current + 1 < TOTAL ? current + 1 : current); }
function prevSlide() { goTo(current - 1 >= 0 ? current - 1 : current); }

/* ── Signal Handlers ───────────────────────────────────────── */
on('gesture', (d) => {
  const type = d.type || 'unknown';
  if (type === 'tap') nextSlide();
  if (type === 'twist') prevSlide();
  if (type === 'double_tap') {
    laserMode = !laserMode;
    laserEl.style.opacity = laserMode ? '1' : '0';
    laserBadge.classList.toggle('active', laserMode);
  }
  if (type === 'double_twist') goTo(0);
});

on('navigation', (d) => {
  if (!laserMode) return;
  laserX = Math.max(2, Math.min(98, laserX + (d.delta_x || 0) * 0.5));
  laserY = Math.max(2, Math.min(98, laserY + (d.delta_y || 0) * 0.5));
  laserEl.style.left = laserX + '%';
  laserEl.style.top = laserY + '%';
});

on('pressure', (d) => {
  pressure = Math.max(0, Math.min(1, d.normalized ?? d.value / 100));
  pressVal.textContent = Math.round(pressure * 100) + '%';
  pressFill.style.width = Math.round(pressure * 100) + '%';
  // Laser pointer size scales with pressure
  const size = 8 + pressure * 24;
  laserEl.style.width = size + 'px';
  laserEl.style.height = size + 'px';
});

/* ── Keyboard Fallback ─────────────────────────────────────── */
let kbPressure = 0.3;
document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowRight') { e.preventDefault(); triggerGesture('tap'); }
  if (e.code === 'ArrowLeft') { e.preventDefault(); triggerGesture('twist'); }
  if (e.code === 'Space') { e.preventDefault(); triggerGesture('tap'); }
  if (e.code === 'KeyL') {
    triggerGesture('double_tap');
  }
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
document.getElementById('simTwist').addEventListener('click', () => triggerGesture('twist'));

/* ── Mouse/Touch for Laser ─────────────────────────────────── */
const slideContainer = document.getElementById('slideContainer');
slideContainer.addEventListener('mousemove', (e) => {
  if (!laserMode) return;
  const r = slideContainer.getBoundingClientRect();
  laserX = ((e.clientX - r.left) / r.width) * 100;
  laserY = ((e.clientY - r.top) / r.height) * 100;
  laserEl.style.left = laserX + '%';
  laserEl.style.top = laserY + '%';
});
slideContainer.addEventListener('touchmove', (e) => {
  if (!laserMode) return;
  e.preventDefault();
  const r = slideContainer.getBoundingClientRect();
  laserX = ((e.touches[0].clientX - r.left) / r.width) * 100;
  laserY = ((e.touches[0].clientY - r.top) / r.height) * 100;
  laserEl.style.left = laserX + '%';
  laserEl.style.top = laserY + '%';
}, { passive: false });

/* ── Init ──────────────────────────────────────────────────── */
laserEl.style.left = '50%';
laserEl.style.top = '50%';
laserEl.style.width = '12px';
laserEl.style.height = '12px';
connect();
</script>
</body>
</html>

```

### preview/generative-art.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Generative Art Engine — Mudra Studio</title>
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  :root {
    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;
    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;
    --warning: #eab308; --error: #ef4444;
    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);
    --canvas-bg: #f0f4f8;
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

  canvas { flex: 1; display: block; background: var(--canvas-bg); }

  /* Overlay info */
  .info-overlay { position: fixed; top: 60px; left: 16px; z-index: 50; pointer-events: none; display: flex; flex-direction: column; gap: 6px; }
  .info-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 8px; background: var(--card); border: 1px solid var(--border); font-size: 11px; color: var(--text-secondary); backdrop-filter: blur(8px); }
  .info-pill .label { opacity: 0.6; }
  .info-pill .value { color: var(--primary); font-weight: 600; font-variant-numeric: tabular-nums; }

  .meter-mini { display: flex; align-items: center; gap: 6px; }
  .meter-mini-bar { width: 50px; height: 4px; background: var(--surface); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
  .meter-mini-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 999px; transition: width 80ms; width: 0%; }

  .toolbar { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 100; flex-shrink: 0; flex-wrap: wrap; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 200; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }
    .info-overlay { top: 52px; left: 8px; }
    .hint { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> Generative Art Engine</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <button class="btn" id="simTap">Simulate Tap</button>
    <button class="btn" id="simTwist">Simulate Twist</button>
  </div>
</div>

<canvas id="canvas"></canvas>

<div class="info-overlay">
  <div class="info-pill"><span class="label">Pattern</span><span class="value" id="patternName">Circles</span></div>
  <div class="info-pill"><span class="label">Palette</span><span class="value" id="paletteName">Teal</span></div>
  <div class="info-pill meter-mini">
    <span class="label">Density</span>
    <div class="meter-mini-bar"><div class="meter-mini-fill" id="densityFill"></div></div>
    <span class="value" id="densityVal">0%</span>
  </div>
</div>

<div class="toolbar">
  <button class="btn" id="switchBtn">Switch Pattern</button>
  <button class="btn" id="clearBtn">Clear</button>
  <button class="btn" id="paletteBtn">Toggle Palette</button>
  <span class="hint">Arrows tilt &middot; R rotate &middot; [ ] density &middot; Space pattern &middot; C clear</span>
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
        // connection_status removed — new server does not emit it
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
    t += 0.04;
    /* Gentle IMU oscillation */
    emit('imu_acc', {
      values: [
        Math.sin(t * 0.3) * 2 + (Math.random() - 0.5) * 0.3,
        Math.cos(t * 0.4) * 1.8 + (Math.random() - 0.5) * 0.3,
        9.8 + Math.sin(t * 0.2) * 0.4
      ],
      frequency: 100, timestamp: Date.now()
    });
    emit('imu_gyro', {
      values: [
        Math.sin(t * 0.5) * 20 + (Math.random() - 0.5) * 5,
        Math.cos(t * 0.6) * 15 + (Math.random() - 0.5) * 5,
        Math.sin(t * 0.25) * 40 + (Math.random() - 0.5) * 8
      ],
      frequency: 100, timestamp: Date.now()
    });
    /* Varying pressure */
    const n = 0.35 + 0.3 * Math.sin(t * 0.3) + (Math.random() - 0.5) * 0.05;
    emit('pressure', { value: Math.round(n * 100), normalized: Math.max(0, Math.min(1, n)), timestamp: Date.now() });
    /* Occasional gestures */
    if (Math.random() < 0.003) {
      const g = ['tap', 'double_tap', 'twist', 'double_twist'];
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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


/* ── Canvas Setup ──────────────────────────────────────────── */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;

function resize() {
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width * devicePixelRatio;
  canvas.height = r.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  W = r.width; H = r.height;
}
resize();
window.addEventListener('resize', resize);

/* ── Art State ─────────────────────────────────────────────── */
const PATTERNS = ['Circles', 'Lines', 'Spirals', 'Grid'];
const PALETTES = [
  { name: 'Teal',    colors: ['#4f46e5', '#06b6d4', '#14b8a6', '#0d9488', '#5eead4'] },
  { name: 'Warm',    colors: ['#f97316', '#ef4444', '#eab308', '#f59e0b', '#ec4899'] },
  { name: 'Purple',  colors: ['#a855f7', '#8b5cf6', '#6366f1', '#c084fc', '#818cf8'] },
  { name: 'Green',   colors: ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#34d399'] },
];

let patternIdx = 0;
let paletteIdx = 0;
let accX = 0, accY = 0;
let gyroZ = 0;
let pressure = 0.35;
let frameT = 0;
let rotation = 0;

const patternNameEl = document.getElementById('patternName');
const paletteNameEl = document.getElementById('paletteName');
const densityFillEl = document.getElementById('densityFill');
const densityValEl = document.getElementById('densityVal');

function switchPattern() {
  patternIdx = (patternIdx + 1) % PATTERNS.length;
  patternNameEl.textContent = PATTERNS[patternIdx];
}

function clearCanvas() {
  const s = getComputedStyle(document.documentElement);
  const bg = s.getPropertyValue('--canvas-bg').trim() || '#050809';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
}

function togglePalette() {
  paletteIdx = (paletteIdx + 1) % PALETTES.length;
  paletteNameEl.textContent = PALETTES[paletteIdx].name;
}

function pickColor() {
  const pal = PALETTES[paletteIdx].colors;
  return pal[Math.floor(Math.random() * pal.length)];
}

/* ── Signal Handlers ───────────────────────────────────────── */
on('imu_acc', (d) => {
  const v = d.values || [0, 0, 9.8];
  accX = v[0]; accY = v[1];
});

on('imu_gyro', (d) => {
  const v = d.values || [0, 0, 0];
  gyroZ = v[2];
});

on('pressure', (d) => {
  pressure = Math.max(0, Math.min(1, d.normalized ?? d.value / 100));
  densityFillEl.style.width = Math.round(pressure * 100) + '%';
  densityValEl.textContent = Math.round(pressure * 100) + '%';
});

on('gesture', (d) => {
  const t = d.type || '';
  if (t === 'tap') switchPattern();
  if (t === 'double_tap') clearCanvas();
  if (t === 'twist') togglePalette();
});

/* ── Keyboard Fallback ─────────────────────────────────────── */
const keys = {};
let kbPressure = 0.35;
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); switchPattern(); triggerGesture('tap'); }
  if (e.code === 'KeyC') { clearCanvas(); }
  if (e.key === ']') {
    kbPressure = Math.min(1, kbPressure + 0.06);
    emit('pressure', { value: Math.round(kbPressure * 100), normalized: kbPressure, timestamp: Date.now() });
  }
  if (e.key === '[') {
    kbPressure = Math.max(0, kbPressure - 0.06);
    emit('pressure', { value: Math.round(kbPressure * 100), normalized: kbPressure, timestamp: Date.now() });
  }
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

/* ── Buttons ───────────────────────────────────────────────── */
document.getElementById('simTap').addEventListener('click', () => triggerGesture('tap'));
document.getElementById('simTwist').addEventListener('click', () => triggerGesture('twist'));
document.getElementById('switchBtn').addEventListener('click', switchPattern);
document.getElementById('clearBtn').addEventListener('click', clearCanvas);
document.getElementById('paletteBtn').addEventListener('click', togglePalette);

/* ── Generative Art Loop ───────────────────────────────────── */
function drawFrame() {
  if (!W || !H) { requestAnimationFrame(drawFrame); return; }

  frameT += 0.016;

  /* Keyboard tilt fallback */
  if (keys['ArrowLeft']) accX -= 0.15;
  if (keys['ArrowRight']) accX += 0.15;
  if (keys['ArrowUp']) accY -= 0.15;
  if (keys['ArrowDown']) accY += 0.15;
  if (keys['KeyR']) gyroZ += 2;

  /* Fade background slightly for trail effect */
  const s = getComputedStyle(document.documentElement);
  const bgColor = s.getPropertyValue('--canvas-bg').trim() || '#050809';
  ctx.fillStyle = bgColor;
  ctx.globalAlpha = 0.03;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  /* Rotation from gyro Z */
  rotation += (gyroZ / 360) * 0.02;

  /* Particle count based on pressure (density) */
  const count = Math.floor(2 + pressure * 14);
  const cx = W / 2, cy = H / 2;

  /* Direction from accelerometer */
  const dirX = accX * 0.15;
  const dirY = accY * 0.15;

  for (let i = 0; i < count; i++) {
    const color = pickColor();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    const alpha = 0.3 + pressure * 0.6;
    ctx.globalAlpha = alpha;

    const pat = PATTERNS[patternIdx];

    if (pat === 'Circles') {
      const angle = frameT * 0.5 + (i / count) * Math.PI * 2 + rotation;
      const radius = 40 + Math.sin(frameT * 0.3 + i) * 80 + pressure * 100;
      const x = cx + Math.cos(angle) * radius + dirX * 60;
      const y = cy + Math.sin(angle) * radius + dirY * 60;
      const size = 2 + pressure * 6 + Math.random() * 3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    else if (pat === 'Lines') {
      const x1 = cx + dirX * 100 + (Math.random() - 0.5) * W * 0.6;
      const y1 = cy + dirY * 100 + (Math.random() - 0.5) * H * 0.6;
      const len = 20 + pressure * 60;
      const angle = rotation + frameT * 0.2 + Math.random() * 0.5;
      const x2 = x1 + Math.cos(angle) * len;
      const y2 = y1 + Math.sin(angle) * len;
      ctx.lineWidth = 1 + pressure * 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    else if (pat === 'Spirals') {
      const baseAngle = frameT * 0.3 + (i / count) * Math.PI * 2;
      const spiralT = frameT * 2 + i * 0.8;
      for (let s = 0; s < 12; s++) {
        const a = baseAngle + s * 0.3 + rotation;
        const r = 10 + s * (5 + pressure * 8);
        const x = cx + Math.cos(a) * r + dirX * 50;
        const y = cy + Math.sin(a) * r + dirY * 50;
        const sz = 1.5 + pressure * 3;
        ctx.globalAlpha = alpha * (1 - s / 12);
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    else if (pat === 'Grid') {
      const cols = 6 + Math.floor(pressure * 10);
      const rows = 4 + Math.floor(pressure * 6);
      const gw = W * 0.7, gh = H * 0.7;
      const ox = (W - gw) / 2, oy = (H - gh) / 2;
      if (i < cols * rows) {
        const col = i % cols, row = Math.floor(i / cols);
        if (row < rows) {
          const x = ox + (col / (cols - 1)) * gw + Math.sin(frameT + col * 0.3 + rotation) * (10 + dirX * 15);
          const y = oy + (row / (rows - 1)) * gh + Math.cos(frameT + row * 0.3 + rotation) * (10 + dirY * 15);
          const sz = 3 + pressure * 5;
          ctx.beginPath();
          ctx.arc(x, y, sz, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(drawFrame);
}

/* ── Init ──────────────────────────────────────────────────── */
clearCanvas();
connect();
drawFrame();
</script>
</body>
</html>

```

### preview/ar-menu.html

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AR Menu Navigator — Mudra Studio</title>
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  :root {
    --bg: #f8f9fa; --card: #ffffff; --primary: #4f46e5; --accent: #06b6d4;
    --text: #1e293b; --text-secondary: #64748b; --success: #22c55e;
    --warning: #eab308; --error: #ef4444;
    --border: rgba(148,163,184,0.18); --surface: rgba(0,0,0,0.04);
    --glass: rgba(241,245,249,0.75); --glass-border: rgba(79,70,229,0.15);
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

  .ar-viewport { flex: 1; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--bg);
    background-image:
      linear-gradient(rgba(79,70,229,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,70,229,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .breadcrumb { position: absolute; top: 16px; left: 16px; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); z-index: 10; }
  .bc-item { cursor: pointer; } .bc-item:hover { color: var(--primary); }
  .bc-sep { opacity: 0.4; }
  .bc-current { color: var(--primary); font-weight: 600; }

  .pressure-meter { position: absolute; top: 16px; right: 16px; z-index: 10; display: flex; align-items: center; gap: 8px; }
  .pm-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
  .pm-bar { width: 70px; height: 5px; background: var(--surface); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
  .pm-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary)); border-radius: 999px; transition: width 80ms; width: 0%; }
  .pm-val { font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; min-width: 28px; text-align: right; }

  .menu-container { transition: transform 300ms cubic-bezier(0.25,0.46,0.45,0.94); }
  .menu-panel { display: flex; flex-direction: column; gap: 6px; min-width: 220px; }
  .menu-item { padding: 14px 18px; border-radius: 12px; background: var(--glass); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--glass-border); font-size: 14px; font-weight: 500; color: var(--text); cursor: default; transition: all 200ms; display: flex; align-items: center; gap: 10px; }
  .mi-emoji { font-size: 18px; }
  .mi-label { flex: 1; }
  .mi-arrow { font-size: 12px; color: var(--text-secondary); opacity: 0.5; }
  .menu-item.highlighted { border-color: var(--primary); background: rgba(79,70,229,0.08); box-shadow: 0 0 20px rgba(79,70,229,0.1); }
  .menu-item.highlighted .mi-label { color: var(--primary); }

  .toolbar { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 16px; background: var(--card); border-top: 1px solid var(--border); z-index: 200; flex-shrink: 0; flex-wrap: wrap; }
  .hint { font-size: 11px; color: var(--text-secondary); opacity: 0.6; }

  .mudra-badge { position: fixed; bottom: 12px; right: 12px; font-size: 11px; color: var(--text-secondary); opacity: 0.7; letter-spacing: 0.02em; pointer-events: none; z-index: 300; }

  @media (max-width: 640px) {
    .header { padding: 8px 10px; } .toolbar { gap: 8px; padding: 8px 10px; }
    .menu-panel { min-width: 170px; }
    .menu-item { padding: 10px 14px; font-size: 13px; }
    .hint { display: none; }
    .pressure-meter { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="brand"><span>Mudra</span> AR Menu Navigator</div>
    <span class="dot" id="dot"></span>
    <span class="conn-label" id="connLabel">Connecting&hellip;</span>
  </div>
  <div class="header-right">
    <a href="/gallery" class="btn" style="text-decoration:none;">&#8592; Gallery</a>
    <button class="btn" id="simTap">Simulate Tap</button>
    <button class="btn" id="simTwist">Simulate Twist</button>
  </div>
</div>

<div class="ar-viewport" id="viewport">
  <div class="breadcrumb" id="breadcrumb"></div>
  <div class="pressure-meter">
    <span class="pm-label">Scale</span>
    <div class="pm-bar"><div class="pm-fill" id="pressFill"></div></div>
    <span class="pm-val" id="pressVal">0%</span>
  </div>
  <div class="menu-container" id="menuContainer"></div>
</div>

<div class="toolbar">
  <button class="btn" id="selectBtn">Select</button>
  <button class="btn" id="backBtn">Back</button>
  <button class="btn" id="homeBtn">Home</button>
  <span class="hint">Arrows navigate &middot; Space select &middot; Backspace back &middot; [ ] pressure</span>
</div>

<div class="mudra-badge">Created by Mudra</div>

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
        // connection_status removed — new server does not emit it
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
  let t = 0, navAcc = 0;
  simTimer = setInterval(() => {
    t += 0.05;
    navAcc += 0.02;
    if (navAcc > 1) {
      navAcc = 0;
      emit('navigation', { delta_x: 0, delta_y: 6, timestamp: Date.now() });
    }
    const n = 0.3 + 0.25 * Math.sin(t * 0.4) + (Math.random() - 0.5) * 0.05;
    emit('pressure', { value: Math.round(n * 100), normalized: Math.max(0, Math.min(1, n)), timestamp: Date.now() });
    if (Math.random() < 0.004) {
      const g = ['tap', 'double_tap', 'twist', 'double_twist'];
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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


/* ── Menu Data ─────────────────────────────────────────────── */
const menuTree = {
  label: 'Home',
  items: [
    { label: 'Maps', emoji: '\u{1F5FA}\uFE0F', children: [
      { label: 'Navigate' }, { label: 'Search Places' }, { label: 'Saved Locations' }, { label: 'Traffic' }
    ]},
    { label: 'Music', emoji: '\u{1F3B5}', children: [
      { label: 'Now Playing' }, { label: 'Playlists' }, { label: 'Search' }
    ]},
    { label: 'Messages', emoji: '\u{1F4AC}', children: [
      { label: 'Inbox' }, { label: 'Compose' }, { label: 'Starred' }, { label: 'Archive' }
    ]},
    { label: 'Camera', emoji: '\u{1F4F7}', children: [
      { label: 'Photo' }, { label: 'Video' }, { label: 'Gallery' }
    ]},
    { label: 'Settings', emoji: '\u2699\uFE0F', children: [
      { label: 'Display' }, { label: 'Gestures' }, { label: 'Connectivity' }, { label: 'About' }
    ]},
  ]
};

/* ── Menu State ────────────────────────────────────────────── */
let menuPath = [];
let currentItems = menuTree.items;
let highlightIdx = 0;
let pressure = 0.3;
let navAccY = 0;

const containerEl = document.getElementById('menuContainer');
const breadcrumbEl = document.getElementById('breadcrumb');
const pressFillEl = document.getElementById('pressFill');
const pressValEl = document.getElementById('pressVal');

function renderMenu() {
  /* Clear old panel */
  while (containerEl.firstChild) containerEl.removeChild(containerEl.firstChild);

  const panel = document.createElement('div');
  panel.className = 'menu-panel';

  currentItems.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'menu-item' + (i === highlightIdx ? ' highlighted' : '');

    const emo = document.createElement('span');
    emo.className = 'mi-emoji';
    emo.textContent = item.emoji || '\u2022';

    const lab = document.createElement('span');
    lab.className = 'mi-label';
    lab.textContent = item.label;

    el.appendChild(emo);
    el.appendChild(lab);

    if (item.children) {
      const arr = document.createElement('span');
      arr.className = 'mi-arrow';
      arr.textContent = '\u25B6';
      el.appendChild(arr);
    }

    el.addEventListener('click', () => { highlightIdx = i; selectItem(); });
    panel.appendChild(el);
  });

  containerEl.appendChild(panel);
  applyScale();
  renderBreadcrumb();
}

function renderBreadcrumb() {
  while (breadcrumbEl.firstChild) breadcrumbEl.removeChild(breadcrumbEl.firstChild);

  const home = document.createElement('span');
  home.className = 'bc-item';
  home.textContent = 'Home';
  home.addEventListener('click', goHome);
  breadcrumbEl.appendChild(home);

  menuPath.forEach((entry, i) => {
    const sep = document.createElement('span');
    sep.className = 'bc-sep';
    sep.textContent = ' \u203A ';
    breadcrumbEl.appendChild(sep);

    const crumb = document.createElement('span');
    crumb.textContent = entry.node.label;
    if (i === menuPath.length - 1) {
      crumb.className = 'bc-current';
    } else {
      crumb.className = 'bc-item';
      crumb.addEventListener('click', () => {
        menuPath = menuPath.slice(0, i + 1);
        currentItems = menuPath[menuPath.length - 1].node.children;
        highlightIdx = 0;
        renderMenu();
      });
    }
    breadcrumbEl.appendChild(crumb);
  });
}

function applyScale() {
  const scale = 0.75 + pressure * 0.5;
  containerEl.style.transform = 'scale(' + scale + ')';
}

function moveHighlight(dir) {
  highlightIdx = (highlightIdx + dir + currentItems.length) % currentItems.length;
  const items = containerEl.querySelectorAll('.menu-item');
  items.forEach((el, i) => el.classList.toggle('highlighted', i === highlightIdx));
}

function selectItem() {
  const item = currentItems[highlightIdx];
  if (item && item.children) {
    menuPath.push({ node: item, selectedIdx: highlightIdx });
    currentItems = item.children;
    highlightIdx = 0;
    renderMenu();
  }
}

function goBack() {
  if (menuPath.length === 0) return;
  const prev = menuPath.pop();
  currentItems = menuPath.length === 0 ? menuTree.items : menuPath[menuPath.length - 1].node.children;
  highlightIdx = prev.selectedIdx;
  renderMenu();
}

function goHome() {
  menuPath = [];
  currentItems = menuTree.items;
  highlightIdx = 0;
  renderMenu();
}

/* ── Signal Handlers ───────────────────────────────────────── */
on('navigation', (d) => {
  navAccY += (d.delta_y || 0);
  if (Math.abs(navAccY) > 12) {
    moveHighlight(navAccY > 0 ? 1 : -1);
    navAccY = 0;
  }
});

on('gesture', (d) => {
  const t = d.type || '';
  if (t === 'tap') selectItem();
  if (t === 'twist') goBack();
  if (t === 'double_tap') goHome();
});

on('pressure', (d) => {
  pressure = Math.max(0, Math.min(1, d.normalized ?? d.value / 100));
  pressFillEl.style.width = Math.round(pressure * 100) + '%';
  pressValEl.textContent = Math.round(pressure * 100) + '%';
  applyScale();
});

/* ── Keyboard Fallback ─────────────────────────────────────── */
let kbPressure = 0.3;
document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowDown') moveHighlight(1);
  if (e.code === 'ArrowUp') moveHighlight(-1);
  if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); selectItem(); }
  if (e.code === 'ArrowLeft' || e.code === 'Backspace') { e.preventDefault(); goBack(); }
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
document.getElementById('simTwist').addEventListener('click', () => triggerGesture('twist'));
document.getElementById('selectBtn').addEventListener('click', selectItem);
document.getElementById('backBtn').addEventListener('click', goBack);
document.getElementById('homeBtn').addEventListener('click', goHome);

/* ── Init ──────────────────────────────────────────────────── */
renderMenu();
connect();
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

<div class="mudra-badge">Created by Mudra</div>

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
        // connection_status removed — new server does not emit it
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
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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
        // connection_status removed — new server does not emit it
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
      emit('gesture', { type: g[Math.floor(Math.random() * g.length)]+ Math.random() * 0.3, timestamp: Date.now() });
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

### preview/waterful-ring-toss.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Waterful Ring Toss</title>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f8f9fa;
      --card: #ffffff;
      --primary: #4f46e5;
      --accent: #06b6d4;
      --text: #1e293b;
      --text-secondary: #64748b;
      --success: #22c55e;
      --warning: #eab308;
      --error: #ef4444;
      --red-plastic: #e63946;
      --red-plastic-dark: #cc2233;
      --red-plastic-light: #ff5566;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Poppins', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      overflow: hidden;
      user-select: none;
      position: relative;
    }

    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg);
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.01) 2px, rgba(0,0,0,0.01) 4px),
        repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.01) 2px, rgba(0,0,0,0.01) 4px);
      pointer-events: none;
      z-index: 1;
    }

    .game-container {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .game-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 380px;
      padding: 20px 20px 12px;
    }

    .game-title {
      font-family: 'Fredoka', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: 0.05em;
      text-shadow: 0 0 20px rgba(79, 70, 229, 0.5);
    }

    .score-display {
      font-size: 16px;
      color: var(--text-secondary);
      font-weight: 500;
      background: rgba(0,0,0,0.04);
      padding: 6px 14px;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.06);
    }

    .score-display span {
      color: var(--primary);
      font-weight: 700;
      font-size: 18px;
    }

    .toy-frame {
      position: relative;
      width: 360px;
      height: 540px;
      border-radius: 24px;
      overflow: visible;
      filter: drop-shadow(0 20px 60px rgba(0,0,0,0.6));
      transform-style: preserve-3d;
    }

    .toy-shell {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 24px;
      background: var(--bg);
        linear-gradient(135deg,
          var(--red-plastic-light) 0%,
          var(--red-plastic) 30%,
          var(--red-plastic-dark) 100%);
      box-shadow:
        inset -2px -2px 4px rgba(255, 255, 255, 0.2),
        inset 2px 2px 6px rgba(0, 0, 0, 0.4);
    }

    .toy-shell::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 24px;
      background: var(--bg);
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 1px,
          rgba(0, 0, 0, 0.02) 1px,
          rgba(0, 0, 0, 0.02) 2px
        );
      pointer-events: none;
    }

    .toy-cap-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 48px;
      background: var(--bg);
        linear-gradient(180deg,
          var(--red-plastic-light) 0%,
          var(--red-plastic) 60%,
          var(--red-plastic-dark) 100%);
      border-radius: 24px 24px 0 0;
      z-index: 10;
      box-shadow:
        inset 0 2px 4px rgba(255, 255, 255, 0.3),
        inset 0 -2px 6px rgba(0, 0, 0, 0.3),
        0 2px 8px rgba(0,0,0,0.3);
    }

    .screw {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--bg);
        radial-gradient(circle at 30% 30%,
          #666 0%,
          #444 50%,
          #222 100%);
      box-shadow:
        inset 1px 1px 2px rgba(0,0,0,0.5),
        0 1px 2px rgba(255,255,255,0.2);
    }

    .screw::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 1px;
      background: #111;
      box-shadow: 0 0 1px rgba(0,0,0,0.8);
    }

    .screw-tl { top: 12px; left: 20px; }
    .screw-tr { top: 12px; right: 20px; }

    .toy-base {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 90px;
      background: var(--bg);
        linear-gradient(180deg,
          var(--red-plastic) 0%,
          var(--red-plastic-dark) 60%,
          #aa1122 100%);
      border-radius: 0 0 24px 24px;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      box-shadow:
        inset 0 4px 8px rgba(0, 0, 0, 0.4),
        inset 0 -2px 4px rgba(255, 255, 255, 0.2),
        0 -2px 8px rgba(0,0,0,0.3);
    }

    .screw-bl { bottom: 12px; left: 20px; }
    .screw-br { bottom: 12px; right: 20px; }

    .toy-label {
      font-family: 'Fredoka', sans-serif;
      background: var(--bg);
        linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
      border: 2px solid #94a3b8;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #f0f0f0;
      text-transform: uppercase;
      line-height: 1.3;
      box-shadow:
        inset 1px 1px 2px rgba(0,0,0,0.08),
        inset -1px -1px 2px rgba(0,0,0,0.5),
        0 2px 4px rgba(0,0,0,0.3);
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    }

    .toy-label small {
      display: block;
      font-size: 9px;
      color: var(--accent);
      font-weight: 500;
      letter-spacing: 0.15em;
    }

    .emg-button {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: var(--bg);
        radial-gradient(circle at 35% 35%,
          #ffffff 0%,
          #e8e8e8 40%,
          #d0d0d0 70%,
          #b8b8b8 100%);
      border: 3px solid #999;
      cursor: pointer;
      transition: all 0.08s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow:
        0 4px 8px rgba(0,0,0,0.4),
        inset 0 1px 2px rgba(255,255,255,0.8),
        inset 0 -2px 4px rgba(0,0,0,0.15);
      position: relative;
    }

    .emg-button::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(circle at 40% 40%,
        rgba(79, 70, 229, 0.2) 0%,
        rgba(79, 70, 229, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.1s;
    }

    .emg-button.active {
      transform: scale(0.9);
      box-shadow:
        0 1px 3px rgba(0,0,0,0.4),
        inset 0 2px 6px rgba(0,0,0,0.3),
        inset 0 -1px 2px rgba(255,255,255,0.4);
      background: var(--bg);
        radial-gradient(circle at 65% 65%,
          #ffffff 0%,
          #e0e0e0 40%,
          #c8c8c8 70%,
          #b0b0b0 100%);
    }

    .emg-button.active::after {
      opacity: 1;
    }

    .water-chamber {
      position: absolute;
      top: 48px;
      left: 12px;
      right: 12px;
      bottom: 90px;
      background: var(--bg);
        linear-gradient(180deg,
          rgba(173, 216, 230, 0.12) 0%,
          rgba(100, 180, 220, 0.18) 50%,
          rgba(80, 160, 200, 0.24) 100%);
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      overflow: hidden;
      box-shadow:
        inset 2px 2px 8px rgba(0, 0, 0, 0.1),
        inset -2px -2px 8px rgba(0, 0, 0, 0.2),
        inset 0 0 40px rgba(100, 180, 220, 0.08);
    }

    .water-chamber::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 40%;
      height: 100%;
      background: linear-gradient(90deg,
        rgba(0, 0, 0, 0.1) 0%,
        rgba(0, 0, 0, 0.04) 30%,
        transparent 100%);
      pointer-events: none;
      z-index: 100;
    }

    .water-chamber::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg);
        radial-gradient(ellipse at 30% 20%, rgba(173, 216, 230, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 70% 60%, rgba(100, 180, 220, 0.1) 0%, transparent 40%);
      pointer-events: none;
      z-index: 1;
      animation: caustics 8s ease-in-out infinite;
    }

    @keyframes caustics {
      0%, 100% { opacity: 0.6; transform: translateY(0) scale(1); }
      50% { opacity: 0.9; transform: translateY(-5px) scale(1.05); }
    }

    canvas#gameCanvas {
      width: 100%;
      height: 100%;
      display: block;
      position: relative;
      z-index: 2;
    }

    .emg-meter {
      position: absolute;
      bottom: 98px;
      left: 50%;
      transform: translateX(-50%);
      width: 220px;
      height: 8px;
      background: var(--bg);
        linear-gradient(90deg,
          rgba(0,0,0,0.4) 0%,
          rgba(0,0,0,0.3) 100%);
      border-radius: 4px;
      z-index: 20;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.3);
      box-shadow:
        inset 0 1px 3px rgba(0,0,0,0.5),
        0 1px 2px rgba(0,0,0,0.08);
    }

    .emg-meter-fill {
      height: 100%;
      width: 0%;
      background: var(--bg);
        linear-gradient(90deg,
          var(--accent) 0%,
          var(--primary) 50%,
          #fff 100%);
      border-radius: 4px;
      transition: width 0.05s;
      box-shadow:
        0 0 8px rgba(79, 70, 229, 0.6),
        0 0 4px rgba(79, 70, 229, 0.8);
      position: relative;
    }

    .emg-meter-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(180deg,
        rgba(255,255,255,0.6) 0%,
        transparent 100%);
      border-radius: 4px 4px 0 0;
    }

    .status-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-top: 12px;
      background: rgba(0,0,0,0.03);
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--error);
      transition: background 0.3s;
      box-shadow: 0 0 8px currentColor;
    }

    .status-dot.connected {
      background: var(--success);
      animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .status-text {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .instructions {
      max-width: 360px;
      text-align: center;
      padding: 12px;
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.6;
      background: rgba(0,0,0,0.02);
      border-radius: 12px;
      margin-top: 4px;
    }

    .instructions kbd {
      background: var(--card);
      border: 1px solid #333;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 11px;
      font-family: 'Poppins', monospace;
      color: var(--primary);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .mudra-badge {
      position: fixed;
      bottom: 12px;
      right: 12px;
      font-size: 11px;
      color: var(--text-secondary);
      opacity: 0.5;
      font-family: inherit;
      letter-spacing: 0.02em;
      z-index: 100;
    }

  </style>
</head>
<body>
  <a href="/gallery" style="position:fixed;top:12px;left:12px;z-index:9999;padding:6px 14px;background:rgba(255,255,255,0.8);color:#4f46e5;text-decoration:none;font-size:13px;font-family:system-ui,sans-serif;border-radius:8px;backdrop-filter:blur(8px);border:1px solid rgba(79,70,229,0.2);transition:background 0.2s;"onmouseenter="this.style.background='rgba(255,255,255,0.95)'"onmouseleave="this.style.background='rgba(255,255,255,0.8)'">&larr; Gallery</a>
  <div class="game-container">
    <div class="game-header">
      <div class="game-title">WATERFUL RING TOSS</div>
      <div class="score-display">Score: <span id="scoreValue">0</span> / <span id="totalPegs">3</span></div>
    </div>

    <div class="toy-frame" id="toyFrame">
      <div class="toy-shell"></div>
      <div class="toy-cap-top">
        <div class="screw screw-tl"></div>
        <div class="screw screw-tr"></div>
      </div>
      <div class="water-chamber">
        <canvas id="gameCanvas"></canvas>
      </div>
      <div class="emg-meter">
        <div class="emg-meter-fill" id="emgMeterFill"></div>
      </div>
      <div class="toy-base">
        <div class="screw screw-bl"></div>
        <div class="screw screw-br"></div>
        <div class="toy-label">
          <small>MUDRA</small>
          RING TOSS
        </div>
        <div class="emg-button" id="emgButton"></div>
      </div>
    </div>

    <div class="status-bar">
      <div class="status-dot" id="statusDot"></div>
      <div class="status-text" id="statusText">Connecting to Mudra...</div>
    </div>

    <div class="instructions">
      Squeeze to jet water. Land rings on pegs to score!<br>
      <kbd>Space</kbd> = full jet, <kbd>[</kbd><kbd>]</kbd> = adjust pressure, <kbd>R</kbd> = reset.
    </div>
  </div>

  <div class="mudra-badge">Created by Mudra</div>

  <script>
    // ==========================================
    // WATERFUL RING TOSS v2 — Pressure + Gesture
    // Uses Mudra pressure signal for analog jet control
    // and gesture signal for twist/shake mechanic.
    // ==========================================

    const WS_URL = "ws://127.0.0.1:8766";
    const PRESSURE_WINDOW = 5; // smoothing window for pressure samples

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const emgMeterFill = document.getElementById('emgMeterFill');
    const emgButton = document.getElementById('emgButton');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const scoreValue = document.getElementById('scoreValue');
    const toyFrame = document.getElementById('toyFrame');

    // High-DPI canvas setup
    function resizeCanvas() {
      const container = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ==========================================
    // Game Constants
    // ==========================================
    const W = () => canvas.width / (window.devicePixelRatio || 1);
    const H = () => canvas.height / (window.devicePixelRatio || 1);

    const RING_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899'];

    // ==========================================
    // Water Velocity Field
    // ==========================================
    const NOZZLE_X_RATIO = 0.75;
    const NOZZLE_DIAMETER = 0.08;
    const JET_SPREAD_RATE = 0.12;
    const GRAVITY_ACCEL = 0.02;
    const DRAG_COEFF = 0.06;
    const ADDED_MASS_RATIO = 1.2;

    function noise2d(x, y) {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    }
    function smoothNoise(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = noise2d(ix, iy), b = noise2d(ix + 1, iy);
      const c = noise2d(ix, iy + 1), d = noise2d(ix + 1, iy + 1);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
    function fbmNoise(x, y) {
      return smoothNoise(x, y) * 0.5 + smoothNoise(x * 2, y * 2) * 0.3 + smoothNoise(x * 4, y * 4) * 0.2;
    }

    let frameCount = 0;

    function getFlowVelocity(px, py, jetStrength) {
      const w = W(), h = H();
      if (jetStrength < 0.01) return { vx: 0, vy: 0 };

      const nozzleX = w * NOZZLE_X_RATIO;
      const nozzleY = h;
      const nozzleD = w * NOZZLE_DIAMETER;

      const dy = nozzleY - py;
      const dx = px - nozzleX;

      if (dy < 1) return { vx: 0, vy: 0 };

      const potentialCore = nozzleD * 6;
      let centerlineSpeed;
      if (dy < potentialCore) {
        centerlineSpeed = jetStrength * 3.5;
      } else {
        centerlineSpeed = jetStrength * 3.5 * potentialCore / dy;
      }

      const sigma = Math.max(nozzleD, JET_SPREAD_RATE * dy + w * 0.08);
      const gaussianFalloff = Math.exp(-(dx * dx) / (2 * sigma * sigma));

      let flowVy = -centerlineSpeed * gaussianFalloff;

      const entrainmentStrength = centerlineSpeed * 0.08;
      const inwardPull = Math.max(0, 1 - gaussianFalloff) * Math.sign(-dx || 1);
      let flowVx = inwardPull * entrainmentStrength * (1 - Math.abs(dx) / (w * 0.6));

      // Smooth recirculation cell
      const cellCenterX = w * 0.45;
      const cellCenterY = h * 0.45;
      const cellRadiusX = w * 0.45;
      const cellRadiusY = h * 0.48;

      const nx2 = (px - cellCenterX) / cellRadiusX;
      const ny2 = (py - cellCenterY) / cellRadiusY;
      const distFromCenter = Math.sqrt(nx2 * nx2 + ny2 * ny2);

      const circulationEnvelope = Math.min(1, distFromCenter * 1.5) *
                                   Math.exp(-Math.max(0, distFromCenter - 1.2) * 3);
      const circStrength = jetStrength * 2.5 * circulationEnvelope;

      flowVx += circStrength * (ny2);
      flowVy += circStrength * (-nx2);

      if (px < w * 0.15) {
        flowVy += jetStrength * 1.0;
      }
      if (py > h * 0.82) {
        flowVx += jetStrength * 1.4 * (1 - (py - h * 0.82) / (h * 0.18));
      }
      if (py < h * 0.15) {
        const topProximity = 1 - py / (h * 0.15);
        flowVx -= jetStrength * 1.0 * topProximity;
        flowVy += jetStrength * 0.7 * topProximity;
      }

      const time = frameCount * 0.03;
      const localSpeed = Math.sqrt(flowVx * flowVx + flowVy * flowVy);
      const turbScale = 0.18 * localSpeed;
      const tnx = (fbmNoise(px * 0.015, py * 0.015 + time) - 0.5) * 2;
      const tny = (fbmNoise(px * 0.015 + 50, py * 0.015 + 50 + time) - 0.5) * 2;
      flowVx += tnx * turbScale;
      flowVy += tny * turbScale;

      return { vx: flowVx, vy: flowVy };
    }

    // ==========================================
    // Pressure Signal State (replaces EMG pipeline)
    // ==========================================
    let pressureValue = 0;    // smoothed 0-1 from Mudra pressure signal
    let smoothedEMG = 0;      // game-facing variable (kept for compatibility with physics)
    let isConnected = false;
    let ws = null;
    let reconnectTimer = null;

    // Pressure smoothing (5-sample moving average, same as template)
    const pressureSamples = [];

    const PRESSURE_DEAD_ZONE = 0.18; // ignore resting baseline (~15%)

    function handlePressure(data) {
      const raw = clamp01(Number(data.normalized ?? 0));
      // Dead zone: cut off resting noise, rescale remainder to 0-1
      const adjusted = raw < PRESSURE_DEAD_ZONE ? 0 : (raw - PRESSURE_DEAD_ZONE) / (1 - PRESSURE_DEAD_ZONE);
      pressureSamples.push(adjusted);
      if (pressureSamples.length > PRESSURE_WINDOW) pressureSamples.shift();
      pressureValue = pressureSamples.reduce((sum, s) => sum + s, 0) / pressureSamples.length;
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function clamp01(v) { return Number.isFinite(v) ? clamp(v, 0, 1) : 0; }

    // ==========================================
    // Mudra WebSocket Connection
    // (Protocol-safe: reconnect, parseMessage, per-signal subscribe)
    // ==========================================
    function connect() {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          setStatus(true, "Connected to Mudra Companion");
          // Subscribe to pressure (analog jet control)
          send({ command: "subscribe", signal: "pressure" });
        };

        ws.onmessage = (event) => {
          const msg = parseMessage(event.data);
          if (!msg) return;

          // connection_status removed — new server does not emit it

          if (msg.type === "pressure" && msg.data) {
            handlePressure(msg.data);
          }
        };

        ws.onerror = () => {
          setStatus(false, "Connection error — use keyboard to play");
        };

        ws.onclose = () => {
          setStatus(false, "Disconnected — reconnecting...");
          scheduleReconnect();
        };
      } catch (e) {
        setStatus(false, "No Mudra — use keyboard to play");
      }
    }

    function send(payload) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify(payload));
    }

    function parseMessage(raw) {
      try { return JSON.parse(raw); }
      catch { return null; }
    }

    function setStatus(connected, text) {
      isConnected = connected;
      statusDot.classList.toggle("connected", connected);
      statusText.textContent = text;
    }

    function scheduleReconnect() {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 1200);
    }

    connect();

    // ==========================================
    // Keyboard/Mouse Fallback
    // ==========================================
    let keyHeld = false;
    let keyPressure = 0; // keyboard-simulated pressure (0-1)

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        keyHeld = true;
        keyPressure = 1.0;
        emgButton.classList.add('active');
      }
      // [ and ] adjust pressure in steps
      if (e.key === ']') {
        keyPressure = clamp01(keyPressure + 0.08);
        keyHeld = keyPressure > 0;
        if (keyHeld) emgButton.classList.add('active');
      }
      if (e.key === '[') {
        keyPressure = clamp01(keyPressure - 0.08);
        keyHeld = keyPressure > 0;
        if (!keyHeld) emgButton.classList.remove('active');
      }
      // R key = reset
      if (e.code === 'KeyR') initGame();
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        keyHeld = false;
        keyPressure = 0;
        emgButton.classList.remove('active');
      }
    });

    emgButton.addEventListener('mousedown', () => {
      keyHeld = true;
      keyPressure = 1.0;
      emgButton.classList.add('active');
    });

    document.addEventListener('mouseup', () => {
      keyHeld = false;
      keyPressure = 0;
      emgButton.classList.remove('active');
    });

    emgButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      keyHeld = true;
      keyPressure = 1.0;
      emgButton.classList.add('active');
    });

    document.addEventListener('touchend', () => {
      keyHeld = false;
      keyPressure = 0;
      emgButton.classList.remove('active');
    });

    // ==========================================
    // Particle Effects System
    // ==========================================
    class SplashParticle {
      constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx + (Math.random() - 0.5) * 2;
        this.vy = vy - Math.random() * 3;
        this.size = Math.random() * 3 + 1;
        this.alpha = 0.8;
        this.gravity = 0.15;
      }

      update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
        this.size *= 0.97;
        return this.alpha > 0;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        grad.addColorStop(0, 'rgba(200, 230, 255, 0.9)');
        grad.addColorStop(1, 'rgba(150, 210, 240, 0.3)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }
    }

    let splashParticles = [];

    function createSplash(x, y, intensity = 1) {
      const count = Math.floor(5 + intensity * 10);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 * intensity;
        splashParticles.push(new SplashParticle(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        ));
      }
    }

    // ==========================================
    // Game Objects
    // ==========================================
    class Peg {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 35;
        this.ringCount = 0;
        this.maxRings = 3;
        this.glowAlpha = 0;
        this.celebrationPhase = 0;
      }

      draw() {
        const w = W(), h = H();
        const px = this.x * w;
        const py = this.y * h;

        ctx.save();

        const postGrad = ctx.createLinearGradient(
          px - this.width / 2, py - this.height,
          px + this.width / 2, py - this.height
        );
        postGrad.addColorStop(0, 'rgba(150, 170, 190, 0.9)');
        postGrad.addColorStop(0.4, 'rgba(200, 220, 240, 1)');
        postGrad.addColorStop(0.6, 'rgba(220, 235, 250, 1)');
        postGrad.addColorStop(1, 'rgba(160, 180, 200, 0.85)');

        ctx.fillStyle = postGrad;
        ctx.fillRect(px - this.width / 2, py - this.height, this.width, this.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(px - this.width / 2, py - this.height, 1, this.height);

        const ballRadius = 6;
        const ballGrad = ctx.createRadialGradient(
          px - 2, py - this.height - 2, 0,
          px, py - this.height, ballRadius
        );
        ballGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        ballGrad.addColorStop(0.3, 'rgba(230, 240, 250, 1)');
        ballGrad.addColorStop(0.7, 'rgba(180, 210, 230, 1)');
        ballGrad.addColorStop(1, 'rgba(140, 170, 190, 0.9)');

        ctx.beginPath();
        ctx.arc(px, py - this.height, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px - 1.5, py - this.height - 1.5, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        if (this.ringCount > 0) {
          this.glowAlpha = Math.min(1, this.glowAlpha + 0.05);
          this.celebrationPhase += 0.1;
        } else {
          this.glowAlpha = Math.max(0, this.glowAlpha - 0.05);
        }

        if (this.glowAlpha > 0) {
          const pulseSize = 14 + Math.sin(this.celebrationPhase) * 3;
          ctx.beginPath();
          ctx.arc(px, py - this.height, pulseSize, 0, Math.PI * 2);
          const grd = ctx.createRadialGradient(px, py - this.height, 2, px, py - this.height, pulseSize);
          grd.addColorStop(0, `rgba(79, 70, 229, ${this.glowAlpha * 0.7})`);
          grd.addColorStop(0.5, `rgba(79, 70, 229, ${this.glowAlpha * 0.3})`);
          grd.addColorStop(1, 'rgba(79, 70, 229, 0)');
          ctx.fillStyle = grd;
          ctx.fill();
        }

        ctx.restore();
      }
    }

    class Ring {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = 0;
        this.radius = 12;
        this.innerRadius = 7;
        this.color = color;
        this.angle = Math.random() * Math.PI * 2;
        this.angularVel = (Math.random() - 0.5) * 0.02;
        this.scored = false;
        this.onPeg = null;
        this.settled = false;
        this.settleTimer = 0;
        this.mass = 0.8 + Math.random() * 0.6;
        this.dragArea = 0.8 + Math.random() * 0.4;
        this.vortexPhase = Math.random() * Math.PI * 2;
        this.lastY = y;
      }

      update(jetForce) {
        const w = W(), h = H();
        const floorY = h - this.radius - 2;
        const prevY = this.y;

        if (this.settled) {
          const flow = getFlowVelocity(this.x, this.y, jetForce);
          const flowSpeed = Math.sqrt(flow.vx * flow.vx + flow.vy * flow.vy);
          if (flowSpeed > 1.5 + this.mass * 0.8) {
            this.settled = false;
            this.scored = false;
            if (this.onPeg) {
              this.onPeg.ringCount = Math.max(0, this.onPeg.ringCount - 1);
              this.onPeg = null;
            }
            this.settleTimer = 0;
            this.vx = flow.vx * 0.3;
            this.vy = flow.vy * 0.3;
            updateScore();
            createSplash(this.x, this.y, 0.8);
          }
          return;
        }

        const flow = getFlowVelocity(this.x, this.y, jetForce);

        const relVx = flow.vx - this.vx;
        const relVy = flow.vy - this.vy;
        const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy);

        const flowAngle = Math.atan2(relVy, relVx);
        const attackAngle = Math.abs(this.angle - flowAngle) % Math.PI;
        const effectiveCd = 0.6 + 0.7 * Math.abs(Math.sin(attackAngle));

        const dragMag = DRAG_COEFF * effectiveCd * this.dragArea * relSpeed;
        const effectiveMass = this.mass * (1 + ADDED_MASS_RATIO);

        this.vx += (dragMag * relVx) / effectiveMass;
        this.vy += (dragMag * relVy) / effectiveMass;

        this.vy += GRAVITY_ACCEL * this.mass;

        if (relSpeed > 0.3) {
          const diameter = this.radius * 2;
          const sheddingFreq = 0.2 * relSpeed / (diameter * 0.05);
          this.vortexPhase += sheddingFreq * 0.016;

          const lateralMag = Math.sin(this.vortexPhase) * relSpeed * 0.04 / effectiveMass;
          if (relSpeed > 0.01) {
            this.vx += lateralMag * (-relVy / relSpeed);
            this.vy += lateralMag * (relVx / relSpeed);
          }
        }

        const froudeNum = relSpeed / Math.sqrt(Math.max(GRAVITY_ACCEL, 0.01) * this.radius * 2);

        if (froudeNum > 0.67) {
          const torque = relSpeed * 0.008 * Math.sign(relVx);
          this.angularVel += torque / effectiveMass;
        } else {
          if (relSpeed > 0.05) {
            const angleDiff = flowAngle - this.angle;
            const normDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
            this.angularVel += normDiff * 0.015;
          }
          this.angularVel += Math.sin(frameCount * 0.08 + this.vortexPhase) * 0.003;
        }
        this.angularVel = Math.max(-0.15, Math.min(0.15, this.angularVel));
        this.angularVel *= 0.92;
        this.angle += this.angularVel;

        this.vx *= 0.995;
        this.vy *= 0.995;

        this.vy = Math.max(-8, Math.min(8, this.vy));
        this.vx = Math.max(-6, Math.min(6, this.vx));

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < this.radius) {
          this.x = this.radius;
          this.vx = Math.abs(this.vx) * 0.3;
          this.angularVel *= 0.5;
          createSplash(this.x, this.y, 0.5);
        }
        if (this.x > w - this.radius) {
          this.x = w - this.radius;
          this.vx = -Math.abs(this.vx) * 0.3;
          this.angularVel *= 0.5;
          createSplash(this.x, this.y, 0.5);
        }
        if (this.y < this.radius + 2) {
          this.y = this.radius + 2;
          this.vy = Math.abs(this.vy) * 0.2;
          this.angularVel *= 0.5;
          createSplash(this.x, this.y, 0.6);
        }
        if (this.y > floorY) {
          this.y = floorY;
          this.vy = -Math.abs(this.vy) * 0.15;
          this.vx *= 0.9;
          this.angularVel *= 0.4;
          if (Math.abs(this.vy) > 1) {
            createSplash(this.x, this.y, Math.abs(this.vy) * 0.2);
          }
        }

        this.lastY = prevY;
        this.checkPegCollisions();
      }

      checkPegCollisions() {
        const w = W(), h = H();

        for (const peg of pegs) {
          if (peg.ringCount >= peg.maxRings) continue;

          const pegX = peg.x * w;
          const pegTopY = peg.y * h - peg.height;
          const pegBottomY = peg.y * h;

          const stackY = pegTopY + 8 - peg.ringCount * 7;

          const dx = this.x - pegX;
          const dy = this.y - stackY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const isNearPeg = Math.abs(dx) < this.innerRadius + 2;
          const isAbovePeg = this.y < stackY + 5;
          const isFalling = this.vy > 0;

          if (isNearPeg && isAbovePeg && isFalling && dist < this.radius + 8) {
            this.onPeg = peg;
            this.vx *= 0.8;
            this.x += (pegX - this.x) * 0.05;
            this.settleTimer++;

            if (this.settleTimer > 20) {
              this.settled = true;
              peg.ringCount++;
              this.scored = true;
              this.x = pegX;
              this.y = stackY;
              this.vx = 0;
              this.vy = 0;
              this.angularVel = 0;
              updateScore();
              createSplash(pegX, stackY, 1.2);
              screenShake(3);
            }
          } else if (this.onPeg === peg && !isNearPeg) {
            this.onPeg = null;
            this.settleTimer = 0;
          } else {
            if (Math.abs(dx) < (this.radius + peg.width / 2 + 2) &&
                this.y > pegTopY && this.y < pegBottomY) {
              this.vx = dx > 0 ? 1.5 : -1.5;
              this.vy -= 0.2;
              this.angularVel *= 0.3;
              createSplash(this.x, this.y, 0.4);
            }
          }
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const maxTilt = Math.PI * 0.19;
        const visualAngle = this.settled ? 0 : Math.sin(this.angle) * maxTilt;
        ctx.rotate(visualAngle);

        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.ellipse(3, 3, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.globalAlpha = 1;

        const outerGrad = ctx.createLinearGradient(
          -this.radius, -this.radius * 0.4,
          this.radius, this.radius * 0.4
        );

        const baseColor = this.color;
        const darkColor = this.adjustColorBrightness(baseColor, -40);
        const lightColor = this.adjustColorBrightness(baseColor, 40);

        outerGrad.addColorStop(0, darkColor);
        outerGrad.addColorStop(0.4, baseColor);
        outerGrad.addColorStop(0.6, lightColor);
        outerGrad.addColorStop(1, darkColor);

        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = outerGrad;
        ctx.fill();

        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.5, -this.radius * 0.25, this.radius * 0.4, this.radius * 0.15, 0, 0, Math.PI * 2);
        const specGrad = ctx.createRadialGradient(
          -this.radius * 0.5, -this.radius * 0.25, 0,
          -this.radius * 0.5, -this.radius * 0.25, this.radius * 0.4
        );
        specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = specGrad;
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();

        const holeGrad = ctx.createRadialGradient(0, 0, this.innerRadius * 0.3, 0, 0, this.innerRadius);
        holeGrad.addColorStop(0, 'rgba(60, 120, 160, 0.3)');
        holeGrad.addColorStop(0.7, 'rgba(100, 160, 200, 0.2)');
        holeGrad.addColorStop(1, 'rgba(140, 200, 230, 0.1)');

        ctx.beginPath();
        ctx.ellipse(0, 0, this.innerRadius, this.innerRadius * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = holeGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.innerRadius, this.innerRadius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.9;
        ctx.restore();
      }

      adjustColorBrightness(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    class Bubble {
      constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size || (Math.random() * 4 + 1);
        this.vy = -(Math.random() * 2 + 1);
        this.vx = (Math.random() - 0.5) * 0.5;
        this.alpha = 0.6;
        this.wobble = Math.random() * Math.PI * 2;
      }

      update() {
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.wobble) * 0.3;
        this.wobble += 0.08;
        this.alpha -= 0.008;
        this.size *= 0.998;
        return this.alpha > 0 && this.y > 0;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const bubbleGrad = ctx.createRadialGradient(
          this.x - this.size * 0.3, this.y - this.size * 0.3, 0,
          this.x, this.y, this.size
        );
        bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        bubbleGrad.addColorStop(0.5, 'rgba(200, 230, 255, 0.3)');
        bubbleGrad.addColorStop(1, 'rgba(173, 216, 230, 0.2)');
        ctx.fillStyle = bubbleGrad;
        ctx.fill();

        ctx.strokeStyle = `rgba(200, 230, 255, ${this.alpha * 0.6})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.35, this.y - this.size * 0.35, this.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        ctx.restore();
      }
    }

    // ==========================================
    // Screen Shake Effect
    // ==========================================
    let shakeIntensity = 0;
    let shakeDecay = 0.9;

    function screenShake(intensity) {
      shakeIntensity = intensity;
    }

    // ==========================================
    // Game State
    // ==========================================
    let pegs = [];
    let rings = [];
    let bubbles = [];
    let score = 0;
    let jetStrength = 0;

    // Air pump tank
    let airTank = 1.0;
    const AIR_DRAIN_RATE = 0.002;
    const AIR_REFILL_RATE = 0.008;

    function initGame() {
      const w = W(), h = H();
      pegs = [];
      rings = [];
      bubbles = [];
      splashParticles = [];
      score = 0;
      scoreValue.textContent = '0';

      pegs.push(new Peg(0.3, 0.35));
      pegs.push(new Peg(0.7, 0.28));
      pegs.push(new Peg(0.5, 0.45));

      const colors = [...RING_COLORS];
      const masses = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55];
      const dragAreas = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05];
      for (let i = masses.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [masses[i], masses[j]] = [masses[j], masses[i]];
        [dragAreas[i], dragAreas[j]] = [dragAreas[j], dragAreas[i]];
      }
      for (let i = 0; i < 6; i++) {
        const rx = w * 0.15 + Math.random() * w * 0.7;
        const ry = h * 0.75 + Math.random() * h * 0.15;
        const ring = new Ring(rx, ry, colors[i % colors.length]);
        ring.mass = masses[i];
        ring.dragArea = dragAreas[i];
        rings.push(ring);
      }

      document.getElementById('totalPegs').textContent = rings.length;
    }

    function updateScore() {
      score = pegs.reduce((sum, p) => sum + p.ringCount, 0);
      scoreValue.textContent = score;
    }

    // ==========================================
    // Water Jet Rendering
    // ==========================================
    function drawWaterJets(force) {
      if (force < 0.02) return;

      const w = W(), h = H();
      const bottomY = h;
      const nozzleX = w * NOZZLE_X_RATIO;
      const nozzleD = w * NOZZLE_DIAMETER;
      const jetHeight = force * h * 0.95;

      if (force > 0.1) {
        ctx.save();
        ctx.globalAlpha = force * 0.6;
        const foamGrad = ctx.createRadialGradient(nozzleX, bottomY, 0, nozzleX, bottomY, nozzleD * 2);
        foamGrad.addColorStop(0, 'rgba(200, 230, 255, 0.8)');
        foamGrad.addColorStop(0.5, 'rgba(150, 210, 240, 0.4)');
        foamGrad.addColorStop(1, 'rgba(150, 210, 240, 0)');
        ctx.fillStyle = foamGrad;
        ctx.beginPath();
        ctx.arc(nozzleX, bottomY, nozzleD * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = force * 0.3;

      const gradient = ctx.createLinearGradient(nozzleX, bottomY, nozzleX, bottomY - jetHeight);
      gradient.addColorStop(0, 'rgba(150, 210, 240, 0.7)');
      gradient.addColorStop(0.2, 'rgba(150, 210, 240, 0.5)');
      gradient.addColorStop(0.5, 'rgba(150, 210, 240, 0.25)');
      gradient.addColorStop(0.8, 'rgba(150, 210, 240, 0.08)');
      gradient.addColorStop(1, 'rgba(150, 210, 240, 0)');

      ctx.beginPath();
      const baseHalfWidth = nozzleD * 0.5 * force;
      ctx.moveTo(nozzleX - baseHalfWidth, bottomY);

      const steps = 28;
      const time = Date.now() / 180;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = bottomY - jetHeight * t;
        const spread = baseHalfWidth + JET_SPREAD_RATE * jetHeight * t * force;
        const wave = Math.sin(t * 7 + time) * spread * 0.2 * force;
        ctx.lineTo(nozzleX - spread + wave, y);
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const y = bottomY - jetHeight * t;
        const spread = baseHalfWidth + JET_SPREAD_RATE * jetHeight * t * force;
        const wave = Math.sin(t * 7 + time + 1.5) * spread * 0.2 * force;
        ctx.lineTo(nozzleX + spread + wave, y);
      }

      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      if (force > 0.3) {
        ctx.save();
        ctx.globalAlpha = force * 0.15;
        for (let i = 0; i < 3; i++) {
          const shimmerY = bottomY - jetHeight * (0.3 + i * 0.2);
          const shimmerGrad = ctx.createRadialGradient(nozzleX, shimmerY, 0, nozzleX, shimmerY, baseHalfWidth * 3);
          shimmerGrad.addColorStop(0, 'rgba(200, 240, 255, 0.6)');
          shimmerGrad.addColorStop(1, 'rgba(200, 240, 255, 0)');
          ctx.fillStyle = shimmerGrad;
          ctx.fillRect(nozzleX - baseHalfWidth * 3, shimmerY - 3, baseHalfWidth * 6, 6);
        }
        ctx.restore();
      }

      if (force > 0.3) {
        ctx.save();
        ctx.globalAlpha = force * 0.08;
        for (let side = 0; side < 2; side++) {
          const sx = side === 0 ? w * 0.05 : w * 0.95;
          const streakGrad = ctx.createLinearGradient(sx, h * 0.1, sx, h * 0.8);
          streakGrad.addColorStop(0, 'rgba(130, 190, 220, 0)');
          streakGrad.addColorStop(0.3, 'rgba(130, 190, 220, 0.3)');
          streakGrad.addColorStop(1, 'rgba(130, 190, 220, 0)');
          ctx.fillStyle = streakGrad;
          ctx.fillRect(sx - 3, h * 0.1, 6, h * 0.7);
        }
        ctx.restore();
      }

      const bubbleCount = Math.floor(force * 8);
      for (let b = 0; b < bubbleCount; b++) {
        if (Math.random() < 0.7) {
          const t = Math.random();
          const spreadAtT = baseHalfWidth + JET_SPREAD_RATE * jetHeight * t * force;
          const jx = nozzleX + (Math.random() - 0.5) * spreadAtT * 2;
          const jy = bottomY - t * jetHeight * 0.8;
          bubbles.push(new Bubble(jx, jy, Math.random() * 2.5 + 0.8));
        }
      }
    }

    // ==========================================
    // Water Surface
    // ==========================================
    function drawWaterSurface() {
      const w = W(), h = H();
      const waterY = h * 0.06;
      const time = Date.now() / 1000;

      ctx.save();

      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, waterY);

      for (let x = 0; x <= w; x += 3) {
        const wave = Math.sin(x * 0.03 + time * 2) * 1.5 +
                     Math.sin(x * 0.05 + time * 3) * 0.8 +
                     (jetStrength > 0.1 ? Math.sin(x * 0.08 + time * 5) * jetStrength * 3 : 0);
        ctx.lineTo(x, waterY + wave);
      }

      ctx.lineTo(w, h);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, waterY, 0, h);
      gradient.addColorStop(0, 'rgba(80, 160, 220, 0.12)');
      gradient.addColorStop(0.5, 'rgba(60, 130, 200, 0.08)');
      gradient.addColorStop(1, 'rgba(40, 100, 180, 0.15)');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = 'rgba(150, 210, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, waterY);
      for (let x = 0; x <= w; x += 3) {
        const wave = Math.sin(x * 0.03 + time * 2) * 1.5 +
                     Math.sin(x * 0.05 + time * 3) * 0.8 +
                     (jetStrength > 0.1 ? Math.sin(x * 0.08 + time * 5) * jetStrength * 3 : 0);
        ctx.lineTo(x, waterY + wave);
      }
      ctx.stroke();

      ctx.globalAlpha = 0.04;
      for (let i = 0; i < 5; i++) {
        const cx = w * (0.15 + i * 0.18);
        const cy = h * (0.2 + Math.sin(time * 0.5 + i) * 0.1);
        const r = w * 0.12;
        const causticGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        causticGrad.addColorStop(0, 'rgba(150, 220, 255, 1)');
        causticGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = causticGrad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      ctx.restore();
    }

    // ==========================================
    // Main Game Loop
    // ==========================================
    const FIXED_DT = 1 / 60;
    const MAX_SUBSTEPS = 60;
    let lastTime = 0;

    function gameLoop(timestamp) {
      if (!timestamp) timestamp = performance.now();
      const w = W(), h = H();

      let realDt = lastTime ? (timestamp - lastTime) / 1000 : FIXED_DT;
      lastTime = timestamp;
      realDt = Math.min(realDt, MAX_SUBSTEPS * FIXED_DT);

      const subSteps = Math.max(1, Math.round(realDt / FIXED_DT));

      let shakeX = 0, shakeY = 0;
      if (shakeIntensity > 0.1) {
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= shakeDecay;
      } else {
        shakeIntensity = 0;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);
      ctx.clearRect(-shakeX, -shakeY, w + Math.abs(shakeX) * 2, h + Math.abs(shakeY) * 2);

      const waterBg = ctx.createLinearGradient(0, 0, 0, h);
      waterBg.addColorStop(0, '#0a1628');
      waterBg.addColorStop(0.3, '#0d1f3c');
      waterBg.addColorStop(0.7, '#0f2847');
      waterBg.addColorStop(1, '#132d4f');
      ctx.fillStyle = waterBg;
      ctx.fillRect(-shakeX, -shakeY, w + Math.abs(shakeX) * 2, h + Math.abs(shakeY) * 2);

      // --- Physics sub-stepping ---
      for (let step = 0; step < subSteps; step++) {
        frameCount++;

        // Determine effective pressure input:
        // Mudra pressure signal takes priority; keyboard fallback when no signal
        const mudraPressure = pressureValue; // from Mudra pressure signal (0-1)
        const effectiveInput = mudraPressure > 0.01 ? mudraPressure : keyPressure;

        // Smooth the input for game use
        if (effectiveInput > 0.01) {
          smoothedEMG += (effectiveInput - smoothedEMG) * 0.2;
        } else {
          smoothedEMG *= 0.93;
          if (smoothedEMG < 0.005) smoothedEMG = 0;
        }

        // Air pump tank mechanic
        const releaseAmount = 1.0 - smoothedEMG;
        airTank -= smoothedEMG * AIR_DRAIN_RATE;
        airTank += releaseAmount * AIR_REFILL_RATE;
        airTank = Math.max(0, Math.min(1.0, airTank));

        jetStrength = smoothedEMG * airTank;

        // Ring-ring repulsion
        for (let i = 0; i < rings.length; i++) {
          for (let j = i + 1; j < rings.length; j++) {
            const a = rings[i], b = rings[j];
            if (a.settled || b.settled) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = a.radius + b.radius;
            if (dist < minDist && dist > 0) {
              const push = (minDist - dist) * 0.15 / dist;
              a.vx -= dx * push;
              a.vy -= dy * push;
              b.vx += dx * push;
              b.vy += dy * push;
            }
          }
        }

        for (const ring of rings) {
          ring.update(jetStrength);
        }
      }

      // Update meter (shows air tank level)
      emgMeterFill.style.width = (airTank * 100) + '%';

      // Button visual feedback
      if (smoothedEMG > 0.05) {
        emgButton.classList.add('active');
      } else if (!keyHeld) {
        emgButton.classList.remove('active');
      }

      // --- Rendering ---
      drawWaterSurface();
      drawWaterJets(jetStrength);

      splashParticles = splashParticles.filter(p => p.update());
      for (const particle of splashParticles) {
        particle.draw();
      }

      bubbles = bubbles.filter(b => b.update());
      for (const bubble of bubbles) {
        bubble.draw();
      }

      for (const peg of pegs) {
        peg.draw();
      }

      for (const ring of rings) {
        ring.draw();
      }

      if (Math.random() < 0.03) {
        const bx = Math.random() * w;
        const by = h * 0.85 + Math.random() * h * 0.15;
        bubbles.push(new Bubble(bx, by, Math.random() * 2 + 0.5));
      }

      ctx.restore();

      requestAnimationFrame(gameLoop);
    }

    // ==========================================
    // Start
    // ==========================================
    initGame();
    gameLoop(performance.now());

    // Fallback for backgrounded tabs
    let lastKnownFrame = 0;
    setInterval(() => {
      if (frameCount === lastKnownFrame) {
        gameLoop(performance.now());
      }
      lastKnownFrame = frameCount;
    }, 32);
  </script>
</body>
</html>

```

### preview/runner.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intent Runner: The Ghost Trail</title>
    <style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: #f8f9fa;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    overflow: hidden;
    color: #1e293b;
}

#game-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

#game-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

/* HUD Styles */
#hud {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: none;
    z-index: 10;
}

.hud-left, .hud-right {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.hud-center {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.hud-item {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.7);
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.08);
}

.hud-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(30, 41, 59, 0.6);
}

.hud-value {
    font-size: 18px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
}

.hud-value.glow {
    color: #4f46e5;
    text-shadow: 0 0 10px #4f46e5, 0 0 20px #4f46e5;
}

.intent-lead {
    border: 1px solid rgba(0, 255, 255, 0.3);
    background: rgba(0, 255, 255, 0.1);
}

#lives-container {
    display: flex;
    gap: 10px;
    font-size: 28px;
}

.heart {
    color: #ff4757;
    text-shadow: 0 0 10px #ff4757;
    transition: all 0.3s ease;
}

.heart.lost {
    color: #333;
    text-shadow: none;
    transform: scale(0.8);
}

/* Connection Status */
#connection-status {
    position: absolute;
    bottom: 20px;
    left: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: rgba(30, 41, 59, 0.6);
    z-index: 10;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.status-dot.connected {
    background: #2ed573;
    box-shadow: 0 0 10px #2ed573;
}

.status-dot.disconnected {
    background: #ff4757;
    box-shadow: 0 0 10px #ff4757;
}

/* Delta Flash */
#delta-flash {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    color: #4f46e5;
    text-shadow: 0 0 20px #4f46e5, 0 0 40px #4f46e5;
    opacity: 0;
    pointer-events: none;
    z-index: 20;
    transition: opacity 0.1s ease;
}

#delta-flash.show {
    opacity: 1;
    animation: flashPulse 0.8s ease-out forwards;
}

@keyframes flashPulse {
    0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
    50% {
        opacity: 0.8;
        transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
    }
}

/* Screens */
.screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(10, 10, 15, 0.95);
    z-index: 100;
    transition: opacity 0.5s ease;
}

.screen.hidden {
    opacity: 0;
    pointer-events: none;
}

/* Title Screen */
#title-screen h1 {
    font-size: 72px;
    font-weight: 300;
    letter-spacing: 8px;
    text-transform: uppercase;
    background: linear-gradient(135deg, #4f46e5, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
}

#title-screen h2 {
    font-size: 24px;
    font-weight: 300;
    color: rgba(30, 41, 59, 0.6);
    letter-spacing: 4px;
    margin-bottom: 30px;
}

.tagline {
    font-size: 16px;
    color: rgba(30, 41, 59, 0.4);
    margin-bottom: 40px;
}

.controls-info {
    margin-bottom: 30px;
}

/* Threshold Setting */
.threshold-setting {
    margin-bottom: 30px;
    padding: 20px 30px;
    background: rgba(0, 255, 255, 0.05);
    border: 1px solid rgba(0, 255, 255, 0.2);
    border-radius: 12px;
    min-width: 300px;
}

.threshold-setting label {
    display: block;
    font-size: 14px;
    color: rgba(30, 41, 59, 0.7);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.slider-container {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
}

#threshold-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    outline: none;
    cursor: pointer;
}

#threshold-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #4f46e5;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    transition: transform 0.2s ease;
}

#threshold-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
}

#threshold-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #4f46e5;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

#threshold-value {
    font-family: 'Courier New', monospace;
    font-size: 18px;
    font-weight: bold;
    color: #4f46e5;
    min-width: 45px;
    text-align: right;
}

#pressure-indicator {
    position: relative;
    height: 24px;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 10px;
}

#pressure-bar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #4f46e5, #a855f7);
    border-radius: 12px;
    transition: width 0.05s ease;
}

#pressure-bar.triggered {
    background: linear-gradient(90deg, #2ed573, #4f46e5);
}

#threshold-marker {
    position: absolute;
    top: 0;
    height: 100%;
    width: 3px;
    background: #fff;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
    left: 30%;
    transition: left 0.1s ease;
}

.threshold-hint {
    font-size: 11px;
    color: rgba(30, 41, 59, 0.4);
    font-style: italic;
}

.controls-info p {
    margin: 10px 0;
    font-size: 14px;
    color: rgba(30, 41, 59, 0.7);
}

.key {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    margin-right: 10px;
}

.ghost-key {
    background: rgba(0, 255, 255, 0.2);
    border: 1px solid #4f46e5;
    color: #4f46e5;
}

.physical-key {
    background: rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.15);
    color: #1e293b;
}

.game-btn {
    padding: 15px 50px;
    font-size: 18px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    border: 2px solid #4f46e5;
    background: transparent;
    color: #4f46e5;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 20px;
}

.game-btn:hover {
    background: #4f46e5;
    color: #1e293b;
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
}

#title-connection-status {
    margin-top: 30px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: rgba(30, 41, 59, 0.5);
}

/* Countdown */
#countdown {
    background: rgba(10, 10, 15, 0.8);
}

#countdown-number {
    font-size: 200px;
    font-weight: bold;
    color: #4f46e5;
    text-shadow: 0 0 50px #4f46e5;
    animation: countdownPulse 1s ease-in-out infinite;
}

@keyframes countdownPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
}

/* End Screen */
#end-screen h1 {
    font-size: 48px;
    margin-bottom: 30px;
    color: #1e293b;
}

.stats-container {
    display: flex;
    gap: 60px;
    margin-bottom: 30px;
}

.stats-column {
    min-width: 250px;
}

.stats-column h3 {
    font-size: 18px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid;
}

.ghost-title {
    color: #4f46e5;
    border-color: #4f46e5 !important;
}

.physical-title {
    color: #1e293b;
    border-color: rgba(0, 0, 0, 0.15) !important;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.stat-label {
    color: rgba(30, 41, 59, 0.6);
    font-size: 14px;
}

.stat-value {
    font-family: 'Courier New', monospace;
    font-weight: bold;
}

.advantage-summary {
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 12px;
    padding: 25px 40px;
    margin-bottom: 25px;
}

.advantage-summary h3 {
    color: #4f46e5;
    margin-bottom: 20px;
    text-align: center;
    font-size: 20px;
}

.advantage-stats {
    display: flex;
    gap: 40px;
}

.advantage-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 120px;
}

.advantage-value {
    font-size: 32px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    color: #4f46e5;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.advantage-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(30, 41, 59, 0.5);
    margin-top: 5px;
}

.summary-message {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
    max-width: 500px;
    text-align: center;
    line-height: 1.6;
    margin-bottom: 20px;
}

/* Message Flash */
#message-flash {
    position: absolute;
    bottom: 30%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 24px;
    font-weight: bold;
    color: #ff4757;
    text-shadow: 0 0 20px rgba(255, 71, 87, 0.8);
    opacity: 0;
    pointer-events: none;
    z-index: 15;
    text-align: center;
    white-space: nowrap;
}

#message-flash.show {
    animation: messageFlash 2s ease-out forwards;
}

@keyframes messageFlash {
    0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
    80% { opacity: 1; }
    100% { opacity: 0; }
}

/* Screen shake */
.shake {
    animation: shake 0.3s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-10px); }
    40% { transform: translateX(10px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
}
    </style>
</head>
<body>
    <a href="/gallery" style="position:fixed;top:12px;left:12px;z-index:9999;padding:6px 14px;background:rgba(255,255,255,0.8);color:#4f46e5;text-decoration:none;font-size:13px;font-family:system-ui,sans-serif;border-radius:8px;backdrop-filter:blur(8px);border:1px solid rgba(79,70,229,0.2);transition:background 0.2s;"onmouseenter="this.style.background='rgba(255,255,255,0.95)'"onmouseleave="this.style.background='rgba(255,255,255,0.8)'">&larr; Gallery</a>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>

        <!-- HUD -->
        <div id="hud">
            <div class="hud-left">
                <div class="hud-item">
                    <span class="hud-label">Distance</span>
                    <span id="distance-value" class="hud-value">0m</span>
                </div>
                <div class="hud-item">
                    <span class="hud-label">Speed</span>
                    <span id="speed-value" class="hud-value">8.0 m/s</span>
                </div>
                <div class="hud-item intent-lead">
                    <span class="hud-label">Intent Lead</span>
                    <span id="lead-value" class="hud-value glow">+0.0m</span>
                </div>
            </div>
            <div class="hud-center">
                <div id="lives-container">
                    <span class="heart">♥</span>
                    <span class="heart">♥</span>
                    <span class="heart">♥</span>
                </div>
            </div>
            <div class="hud-right">
                <div class="hud-item">
                    <span class="hud-label">Mudra Avg</span>
                    <span id="mudra-avg" class="hud-value">--ms</span>
                </div>
                <div class="hud-item">
                    <span class="hud-label">Mouse Avg</span>
                    <span id="mouse-avg" class="hud-value">--ms</span>
                </div>
                <div class="hud-item">
                    <span class="hud-label">Obstacles</span>
                    <span id="obstacles-value" class="hud-value">0</span>
                </div>
            </div>
        </div>

        <!-- Connection Status -->
        <div id="connection-status">
            <span id="mudra-status" class="status-dot disconnected"></span>
            <span id="mudra-status-text">Mudra: Disconnected</span>
        </div>

        <!-- Delta Flash -->
        <div id="delta-flash"></div>

        <!-- Title Screen -->
        <div id="title-screen" class="screen">
            <h1>Intent Runner</h1>
            <h2>The Ghost Trail</h2>
            <p class="tagline">See the gap between thought and action</p>
            <div class="controls-info">
                <p><span class="key ghost-key">Mudra SNC</span> = Ghost (Intent)</p>
                <p><span class="key physical-key">Mouse Click</span> = Runner (Action)</p>
            </div>
            <div class="threshold-setting">
                <label for="threshold-slider">SNC Threshold</label>
                <div class="slider-container">
                    <input type="range" id="threshold-slider" min="0.1" max="0.9" step="0.05" value="0.3">
                    <span id="threshold-value">0.30</span>
                </div>
                <div id="pressure-indicator">
                    <div id="pressure-bar"></div>
                    <div id="threshold-marker"></div>
                </div>
                <span class="threshold-hint">Flex to test - bar shows live SNC magnitude</span>
            </div>
            <button id="start-btn" class="game-btn">Start Run</button>
            <div id="title-connection-status">
                <span id="title-mudra-dot" class="status-dot disconnected"></span>
                <span id="title-mudra-text">Mudra: Connecting...</span>
            </div>
        </div>

        <!-- Countdown -->
        <div id="countdown" class="screen hidden">
            <span id="countdown-number">3</span>
        </div>

        <!-- End Screen -->
        <div id="end-screen" class="screen hidden">
            <h1 id="end-title">Run Complete</h1>
            <div class="stats-container">
                <div class="stats-column">
                    <h3 class="ghost-title">Intent (Mudra)</h3>
                    <div class="stat-item">
                        <span class="stat-label">Average Reaction</span>
                        <span id="end-mudra-avg" class="stat-value">--ms</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Fastest Reaction</span>
                        <span id="end-mudra-fastest" class="stat-value">--ms</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Obstacles Cleared</span>
                        <span id="end-mudra-cleared" class="stat-value">0</span>
                    </div>
                </div>
                <div class="stats-column">
                    <h3 class="physical-title">Action (Mouse)</h3>
                    <div class="stat-item">
                        <span class="stat-label">Average Reaction</span>
                        <span id="end-mouse-avg" class="stat-value">--ms</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Fastest Reaction</span>
                        <span id="end-mouse-fastest" class="stat-value">--ms</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Obstacles Cleared</span>
                        <span id="end-mouse-cleared" class="stat-value">0</span>
                    </div>
                </div>
            </div>
            <div class="advantage-summary">
                <h3>Intent Advantage</h3>
                <div class="advantage-stats">
                    <div class="advantage-item">
                        <span class="advantage-value" id="total-time-saved">0ms</span>
                        <span class="advantage-label">Total Time Saved</span>
                    </div>
                    <div class="advantage-item">
                        <span class="advantage-value" id="distance-equivalent">0m</span>
                        <span class="advantage-label">Distance Equivalent</span>
                    </div>
                    <div class="advantage-item">
                        <span class="advantage-value" id="ghost-saves">0</span>
                        <span class="advantage-label">Ghost Saves</span>
                    </div>
                    <div class="advantage-item">
                        <span class="advantage-value" id="avg-delta">0ms</span>
                        <span class="advantage-label">Avg Delta/Obstacle</span>
                    </div>
                </div>
            </div>
            <p id="summary-message" class="summary-message"></p>
            <button id="restart-btn" class="game-btn">Run Again</button>
        </div>
    </div>

    <script>
// Intent Runner: The Ghost Trail
// A visualization of the gap between neural intent and physical action

class IntentRunner {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Game state
        this.gameStatus = 'idle'; // 'idle', 'countdown', 'running', 'ended'
        this.lives = 3;
        this.distance = 0;
        this.speed = 8; // m/s
        this.baseSpeed = 8;
        this.maxSpeed = 16;
        this.speedIncrement = 0.5;
        this.speedIncrementInterval = 10; // seconds
        this.lastSpeedIncrement = 0;

        // Timing
        this.totalAdvantage = 0; // cumulative ms saved
        this.ghostLead = 0; // visual distance in pixels
        this.reactions = [];
        this.ghostSaves = 0;

        // Obstacles
        this.obstacles = [];
        this.obstacleInterval = 2500; // ms
        this.minObstacleInterval = 800;
        this.lastObstacleSpawn = 0;
        this.obstaclesPassed = 0;

        // Finish line
        this.finishDistance = 500; // meters
        this.finishLineX = null; // Will be set when close to finish
        this.victory = false;

        // Runners
        this.runnerY = 0;
        this.groundY = 0;
        this.runnerX = 200;
        this.ghostOffset = 0;

        // Jump state
        this.physicalJumping = false;
        this.physicalJumpVelocity = 0;
        this.physicalJumpHeight = 0;
        this.ghostJumping = false;
        this.ghostJumpVelocity = 0;
        this.ghostJumpHeight = 0;
        this.jumpForce = 18;
        this.gravity = 0.8;

        // Animation
        this.runFrame = 0;
        this.frameCount = 0;
        this.physicalStumble = 0; // Stumble animation timer
        this.ghostStumble = 0;

        // Input tracking
        this.currentObstacle = null;
        this.mudraTime = null;
        this.mouseTime = null;
        this.reactionWindowOpen = false;

        // Mudra connection
        this.mudraConnected = false;
        this.ws = null;

        // Pressure detection
        this.pressureThreshold = 0.3; // Trigger jump when pressure exceeds this
        this.pressureActive = false; // Prevents repeated triggers while held
        this.lastPressure = 0; // For spike detection
        this.lastPressureTime = 0; // Timestamp of last pressure reading

        // Stats
        this.mudraReactions = [];
        this.mouseReactions = [];
        this.ghostCleared = 0;
        this.physicalCleared = 0;

        // Visual effects
        this.particles = [];
        this.speedLines = [];
        this.screenShake = 0;
        this.deltaFlashTimeout = null;

        // Grid for background
        this.gridOffset = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input handlers
        document.addEventListener('click', (e) => this.handleMouseClick(e));
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleMouseClick(e);
            }
        });

        // UI handlers
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());

        // Threshold slider
        const thresholdSlider = document.getElementById('threshold-slider');
        const thresholdValue = document.getElementById('threshold-value');
        const thresholdMarker = document.getElementById('threshold-marker');

        thresholdSlider.addEventListener('input', (e) => {
            this.pressureThreshold = parseFloat(e.target.value);
            thresholdValue.textContent = this.pressureThreshold.toFixed(2);
            thresholdMarker.style.left = `${this.pressureThreshold * 100}%`;
        });

        // Initialize marker position
        thresholdMarker.style.left = `${this.pressureThreshold * 100}%`;

        // Connect to Mudra
        this.connectMudra();

        // Start render loop
        this.lastTime = performance.now();
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height * 0.7;
        this.runnerY = this.groundY;
    }

    connectMudra() {
        try {
            this.ws = new WebSocket('ws://127.0.0.1:8766');

            this.ws.onopen = () => {
                console.log('Connected to Mudra Companion');
                // Subscribe to SNC (neuromuscular EMG) events
                this.ws.send(JSON.stringify({
                    command: 'subscribe',
                    signal: 'snc'
                }));
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Log all messages for debugging
                    console.log('Mudra message:', data.type, data.data);

                    if (data.type === 'connection_status' && data.data?.status === 'connected') {
                        this.setMudraConnected(true);
                    } else if (data.type === 'snc') {
                        // Handle SNC (neuromuscular EMG) signal
                        // SNC data is typically an array of values in range -1 to 1
                        const rawData = data.data;
                        let magnitude = 0;

                        // Try to extract numeric values from various formats
                        let values = [];

                        if (typeof rawData === 'number') {
                            values = [rawData];
                        } else if (Array.isArray(rawData)) {
                            // Flatten if nested array
                            values = rawData.flat().filter(v => typeof v === 'number');
                        } else if (typeof rawData === 'object' && rawData !== null) {
                            // Try to find array or number in object
                            const possibleKeys = ['value', 'values', 'data', 'snc', 'magnitude', 'samples'];
                            for (const key of possibleKeys) {
                                if (rawData[key] !== undefined) {
                                    const val = rawData[key];
                                    if (Array.isArray(val)) {
                                        values = val.flat().filter(v => typeof v === 'number');
                                    } else if (typeof val === 'number') {
                                        values = [val];
                                    }
                                    if (values.length > 0) break;
                                }
                            }
                            // If still empty, try all numeric values in object
                            if (values.length === 0) {
                                values = Object.values(rawData).filter(v => typeof v === 'number');
                            }
                        }

                        // Calculate magnitude from values
                        if (values.length > 0) {
                            // RMS (root mean square) for EMG signal
                            const sumSquares = values.reduce((sum, v) => sum + v * v, 0);
                            magnitude = Math.sqrt(sumSquares / values.length);
                        }

                        // SNC is in range -1 to 1, so magnitude should be 0 to 1
                        // But clamp just in case
                        magnitude = Math.max(0, Math.min(1, magnitude));

                        // Update live indicator on title screen
                        this.updatePressureIndicator(magnitude);

                        // Store for tracking
                        this.lastPressure = magnitude;
                        this.lastPressureTime = performance.now();

                        if (magnitude > this.pressureThreshold && !this.pressureActive) {
                            // Signal exceeded threshold - trigger jump
                            this.pressureActive = true;
                            this.handleMudraInput(performance.now());
                        } else if (magnitude <= this.pressureThreshold) {
                            // Signal dropped - allow next trigger
                            this.pressureActive = false;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing Mudra message:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('Mudra connection closed');
                this.setMudraConnected(false);
                // Attempt reconnection after 3 seconds
                setTimeout(() => this.connectMudra(), 3000);
            };

            this.ws.onerror = (error) => {
                console.error('Mudra WebSocket error:', error);
                this.setMudraConnected(false);
            };
        } catch (e) {
            console.error('Failed to connect to Mudra:', e);
            this.setMudraConnected(false);
        }
    }

    setMudraConnected(connected) {
        this.mudraConnected = connected;
        const dots = document.querySelectorAll('.status-dot');
        const texts = [
            document.getElementById('mudra-status-text'),
            document.getElementById('title-mudra-text')
        ];

        dots.forEach(dot => {
            dot.classList.toggle('connected', connected);
            dot.classList.toggle('disconnected', !connected);
        });

        texts.forEach(text => {
            if (text) {
                text.textContent = connected ? 'Mudra: Connected' : 'Mudra: Disconnected';
            }
        });
    }

    updatePressureIndicator(pressure) {
        const pressureBar = document.getElementById('pressure-bar');
        if (pressureBar) {
            // Clamp pressure to 0-1 range and convert to percentage
            const clampedPressure = Math.max(0, Math.min(1, pressure));
            pressureBar.style.width = `${clampedPressure * 100}%`;

            // Add visual feedback when threshold is exceeded
            if (pressure > this.pressureThreshold) {
                pressureBar.classList.add('triggered');
            } else {
                pressureBar.classList.remove('triggered');
            }
        }
    }

    handleMudraInput(timestamp) {
        if (this.gameStatus !== 'running') return;
        if (this.ghostJumping) return; // Already jumping

        // Record reaction time if in reaction window
        if (this.reactionWindowOpen && this.currentObstacle && !this.currentObstacle.ghostJumped) {
            const reactionTime = timestamp - this.currentObstacle.reactionWindowStart;
            this.mudraReactions.push(reactionTime);
            this.mudraTime = timestamp;
            this.currentObstacle.ghostJumped = true;
        }

        // Trigger ghost jump
        this.ghostJumping = true;
        this.ghostJumpVelocity = this.jumpForce;

        // Add particles for ghost jump
        this.addJumpParticles(this.runnerX + this.ghostOffset, this.runnerY, true);
    }

    handleMouseClick(e) {
        if (this.gameStatus !== 'running') return;
        if (this.physicalJumping) return; // Already jumping

        const timestamp = performance.now();

        // Record reaction time if in reaction window
        if (this.reactionWindowOpen && this.currentObstacle && !this.currentObstacle.physicalJumped) {
            const reactionTime = timestamp - this.currentObstacle.reactionWindowStart;
            this.mouseReactions.push(reactionTime);
            this.mouseTime = timestamp;
            this.currentObstacle.physicalJumped = true;

            // Calculate delta if both inputs received
            if (this.mudraTime !== null) {
                const delta = this.mouseTime - this.mudraTime;
                if (delta > 0) {
                    this.totalAdvantage += delta;
                    this.reactions.push({
                        mudraTime: this.mudraTime,
                        mouseTime: this.mouseTime,
                        delta: delta
                    });
                    this.showDeltaFlash(delta);
                }
            }
        }

        // Trigger physical jump
        this.physicalJumping = true;
        this.physicalJumpVelocity = this.jumpForce;

        // Add particles for physical jump
        this.addJumpParticles(this.runnerX, this.runnerY, false);
    }

    showDeltaFlash(delta) {
        const flash = document.getElementById('delta-flash');
        flash.textContent = `+${Math.round(delta)}ms`;
        flash.classList.remove('show');
        void flash.offsetWidth; // Force reflow
        flash.classList.add('show');

        if (this.deltaFlashTimeout) {
            clearTimeout(this.deltaFlashTimeout);
        }
        this.deltaFlashTimeout = setTimeout(() => {
            flash.classList.remove('show');
        }, 800);
    }

    addJumpParticles(x, y, isGhost) {
        const color = isGhost ? { r: 0, g: 255, b: 255 } : { r: 255, g: 255, b: 255 };
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -5 - 2,
                life: 1,
                color: color,
                isGhost: isGhost
            });
        }
    }

    startGame() {
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('countdown').classList.remove('hidden');
        this.gameStatus = 'countdown';

        let count = 3;
        const countdownEl = document.getElementById('countdown-number');

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.textContent = count;
            } else if (count === 0) {
                countdownEl.textContent = 'GO!';
            } else {
                clearInterval(countdownInterval);
                document.getElementById('countdown').classList.add('hidden');
                this.gameStatus = 'running';
                this.lastObstacleSpawn = performance.now();
                this.lastSpeedIncrement = performance.now();
            }
        }, 1000);
    }

    restartGame() {
        // Reset all state
        this.lives = 3;
        this.distance = 0;
        this.speed = this.baseSpeed;
        this.totalAdvantage = 0;
        this.ghostLead = 0;
        this.reactions = [];
        this.ghostSaves = 0;
        this.obstacles = [];
        this.obstaclesPassed = 0;
        this.obstacleInterval = 2500;
        this.mudraReactions = [];
        this.mouseReactions = [];
        this.ghostCleared = 0;
        this.physicalCleared = 0;
        this.particles = [];
        this.speedLines = [];
        this.physicalJumping = false;
        this.physicalJumpHeight = 0;
        this.ghostJumping = false;
        this.ghostJumpHeight = 0;
        this.physicalStumble = 0;
        this.ghostStumble = 0;
        this.currentObstacle = null;
        this.mudraTime = null;
        this.mouseTime = null;
        this.reactionWindowOpen = false;
        this.finishLineX = null;
        this.victory = false;

        // Reset UI
        this.updateLivesDisplay();
        document.getElementById('end-screen').classList.add('hidden');

        this.startGame();
    }

    endGame(isVictory = false) {
        this.gameStatus = 'ended';
        this.victory = isVictory;
        this.showEndScreen();
    }

    showEndScreen() {
        const endScreen = document.getElementById('end-screen');
        const endTitle = document.getElementById('end-title');

        // Update title based on victory or defeat
        if (endTitle) {
            endTitle.textContent = this.victory ? 'Victory!' : 'Run Complete';
            endTitle.style.color = this.victory ? '#2ed573' : '#fff';
        }

        // Calculate stats
        const mudraAvg = this.mudraReactions.length > 0
            ? Math.round(this.mudraReactions.reduce((a, b) => a + b, 0) / this.mudraReactions.length)
            : '--';
        const mouseAvg = this.mouseReactions.length > 0
            ? Math.round(this.mouseReactions.reduce((a, b) => a + b, 0) / this.mouseReactions.length)
            : '--';
        const mudraFastest = this.mudraReactions.length > 0
            ? Math.round(Math.min(...this.mudraReactions))
            : '--';
        const mouseFastest = this.mouseReactions.length > 0
            ? Math.round(Math.min(...this.mouseReactions))
            : '--';

        // Update stats display
        document.getElementById('end-mudra-avg').textContent = mudraAvg !== '--' ? `${mudraAvg}ms` : '--ms';
        document.getElementById('end-mouse-avg').textContent = mouseAvg !== '--' ? `${mouseAvg}ms` : '--ms';
        document.getElementById('end-mudra-fastest').textContent = mudraFastest !== '--' ? `${mudraFastest}ms` : '--ms';
        document.getElementById('end-mouse-fastest').textContent = mouseFastest !== '--' ? `${mouseFastest}ms` : '--ms';
        document.getElementById('end-mudra-cleared').textContent = this.ghostCleared;
        document.getElementById('end-mouse-cleared').textContent = this.physicalCleared;

        // Advantage summary
        const avgSpeed = (this.baseSpeed + this.speed) / 2;
        const distanceEquiv = (this.totalAdvantage / 1000) * avgSpeed;
        const avgDelta = this.reactions.length > 0
            ? Math.round(this.reactions.reduce((a, b) => a + b.delta, 0) / this.reactions.length)
            : 0;

        document.getElementById('total-time-saved').textContent = `${Math.round(this.totalAdvantage)}ms`;
        document.getElementById('distance-equivalent').textContent = `${distanceEquiv.toFixed(1)}m`;
        document.getElementById('ghost-saves').textContent = this.ghostSaves;
        document.getElementById('avg-delta').textContent = `${avgDelta}ms`;

        // Summary message
        let message = '';
        if (this.victory) {
            message = `You crossed the finish line! `;
            if (this.reactions.length > 0 && avgDelta > 0) {
                message += `Your intent was ${avgDelta}ms faster on average, saving ${distanceEquiv.toFixed(1)} meters.`;
            }
        } else if (this.reactions.length > 0 && avgDelta > 0) {
            message = `Your intent was ${avgDelta}ms faster on average. Over this run, thinking beat doing by ${distanceEquiv.toFixed(1)} meters.`;
        } else if (!this.mudraConnected) {
            message = `Mudra wasn't connected. Connect to see the gap between thought and action.`;
        } else {
            message = `Keep practicing! Try to react with both intent and action to see the difference.`;
        }
        document.getElementById('summary-message').textContent = message;

        endScreen.classList.remove('hidden');
    }

    updateLivesDisplay() {
        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, i) => {
            heart.classList.toggle('lost', i >= this.lives);
        });
    }

    spawnObstacle() {
        const obstacle = {
            x: this.canvas.width + 100,
            width: 30 + Math.random() * 20,
            height: 60 + Math.random() * 30,
            reactionWindowStart: null,
            ghostJumped: false,
            physicalJumped: false,
            ghostCleared: false,
            physicalCleared: false,
            ghostHit: false,
            physicalHit: false,
            processed: false
        };
        this.obstacles.push(obstacle);
    }

    update(deltaTime) {
        if (this.gameStatus !== 'running') return;

        const now = performance.now();

        // Update distance
        this.distance += this.speed * (deltaTime / 1000);

        // Check for finish line
        const pixelsPerMeter = 50;
        const distanceToFinish = this.finishDistance - this.distance;

        // Spawn finish line when close (within screen width + buffer)
        if (distanceToFinish > 0 && distanceToFinish < 30 && this.finishLineX === null) {
            this.finishLineX = this.canvas.width + distanceToFinish * pixelsPerMeter;
        }

        // Update finish line position
        if (this.finishLineX !== null) {
            this.finishLineX -= this.speed * pixelsPerMeter * (deltaTime / 1000);

            // Check if runner crossed finish line
            if (this.finishLineX < this.runnerX) {
                this.endGame(true); // Victory!
                return;
            }
        }

        // Stop spawning obstacles when close to finish
        const shouldSpawnObstacles = distanceToFinish > 50; // Stop spawning 50m before finish

        // Update speed over time
        if (now - this.lastSpeedIncrement > this.speedIncrementInterval * 1000) {
            if (this.speed < this.maxSpeed) {
                this.speed = Math.min(this.speed + this.speedIncrement, this.maxSpeed);
                // Also decrease obstacle interval
                this.obstacleInterval = Math.max(
                    this.minObstacleInterval,
                    this.obstacleInterval - 100
                );
            }
            this.lastSpeedIncrement = now;
        }

        // Update ghost lead based on total advantage
        // Convert ms to distance: distance = time(s) * speed(m/s) * pixels_per_meter
        this.ghostLead = (this.totalAdvantage / 1000) * this.speed * pixelsPerMeter;
        this.ghostOffset = Math.min(this.ghostLead, 300); // Cap visual offset

        // Spawn obstacles (but not near finish line)
        if (now - this.lastObstacleSpawn > this.obstacleInterval && shouldSpawnObstacles) {
            this.spawnObstacle();
            this.lastObstacleSpawn = now;
        }

        // Update obstacles
        const obstacleSpeed = this.speed * pixelsPerMeter * (deltaTime / 1000);

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= obstacleSpeed;

            // Open reaction window when obstacle enters reaction zone
            const reactionZone = this.runnerX + 400;
            if (obs.x <= reactionZone && obs.reactionWindowStart === null) {
                obs.reactionWindowStart = now;
                this.currentObstacle = obs;
                this.reactionWindowOpen = true;
                this.mudraTime = null;
                this.mouseTime = null;
            }

            // Check collisions
            const ghostX = this.runnerX + this.ghostOffset;
            const runnerWidth = 40;
            const runnerHeight = 60;
            const jumpThreshold = obs.height - 10;

            // Ghost collision check - is ghost overlapping obstacle?
            const ghostOverlapping = obs.x < ghostX + runnerWidth && obs.x + obs.width > ghostX;
            if (ghostOverlapping && !obs.ghostCleared && !obs.ghostHit) {
                if (this.ghostJumpHeight >= jumpThreshold) {
                    // Ghost jumped high enough - cleared!
                    obs.ghostCleared = true;
                    this.ghostCleared++;
                } else {
                    // Ghost hit the obstacle
                    obs.ghostHit = true;
                    this.ghostStumble = 30; // Stumble animation frames
                }
            }

            // Physical runner collision check - is runner overlapping obstacle?
            const physicalOverlapping = obs.x < this.runnerX + runnerWidth && obs.x + obs.width > this.runnerX;
            if (physicalOverlapping && !obs.physicalCleared && !obs.physicalHit) {
                if (this.physicalJumpHeight >= jumpThreshold) {
                    // Runner jumped high enough - cleared!
                    obs.physicalCleared = true;
                    this.physicalCleared++;
                } else {
                    // Runner hit the obstacle!
                    obs.physicalHit = true;
                    obs.processed = true;
                    this.lives--;
                    this.updateLivesDisplay();
                    this.screenShake = 15;
                    this.physicalStumble = 30; // Stumble animation frames

                    // Check if ghost saved (ghost cleared but physical didn't)
                    if (obs.ghostCleared) {
                        this.ghostSaves++;
                        this.showMessage("Intent cleared it. Body didn't.");
                    }

                    if (this.lives <= 0) {
                        this.endGame();
                        return;
                    }
                }
            }

            // Close reaction window and count obstacle when it passes
            if (obs.x + obs.width < this.runnerX && !obs.processed) {
                obs.processed = true;
                this.obstaclesPassed++;
                this.reactionWindowOpen = false;
                this.currentObstacle = null;
            }

            // Remove off-screen obstacles
            if (obs.x + obs.width < -100) {
                this.obstacles.splice(i, 1);
            }
        }

        // Update jumps
        if (this.physicalJumping) {
            this.physicalJumpHeight += this.physicalJumpVelocity;
            this.physicalJumpVelocity -= this.gravity;

            if (this.physicalJumpHeight <= 0) {
                this.physicalJumpHeight = 0;
                this.physicalJumping = false;
                this.physicalJumpVelocity = 0;
            }
        }

        if (this.ghostJumping) {
            this.ghostJumpHeight += this.ghostJumpVelocity;
            this.ghostJumpVelocity -= this.gravity;

            if (this.ghostJumpHeight <= 0) {
                this.ghostJumpHeight = 0;
                this.ghostJumping = false;
                this.ghostJumpVelocity = 0;
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update speed lines
        if (Math.random() < 0.3) {
            this.speedLines.push({
                x: this.canvas.width,
                y: Math.random() * this.canvas.height,
                length: 50 + Math.random() * 100,
                speed: this.speed * 10
            });
        }

        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            this.speedLines[i].x -= this.speedLines[i].speed * (deltaTime / 1000);
            if (this.speedLines[i].x + this.speedLines[i].length < 0) {
                this.speedLines.splice(i, 1);
            }
        }

        // Update grid offset for scrolling effect
        this.gridOffset = (this.gridOffset + obstacleSpeed) % 100;

        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }

        // Update stumble timers
        if (this.physicalStumble > 0) this.physicalStumble--;
        if (this.ghostStumble > 0) this.ghostStumble--;

        // Update animation frame
        this.frameCount++;
        if (this.frameCount % 6 === 0) {
            this.runFrame = (this.runFrame + 1) % 4;
        }

        // Update HUD
        this.updateHUD();
    }

    showMessage(text) {
        let flash = document.getElementById('message-flash');
        if (!flash) {
            flash = document.createElement('div');
            flash.id = 'message-flash';
            document.getElementById('game-container').appendChild(flash);
        }
        flash.textContent = text;
        flash.classList.remove('show');
        void flash.offsetWidth;
        flash.classList.add('show');
    }

    updateHUD() {
        document.getElementById('distance-value').textContent = `${Math.floor(this.distance)}m / ${this.finishDistance}m`;
        document.getElementById('speed-value').textContent = `${this.speed.toFixed(1)} m/s`;
        document.getElementById('lead-value').textContent = `+${(this.ghostLead / 50).toFixed(1)}m`;
        document.getElementById('obstacles-value').textContent = this.obstaclesPassed;

        if (this.mudraReactions.length > 0) {
            const avg = Math.round(this.mudraReactions.reduce((a, b) => a + b, 0) / this.mudraReactions.length);
            document.getElementById('mudra-avg').textContent = `${avg}ms`;
        }

        if (this.mouseReactions.length > 0) {
            const avg = Math.round(this.mouseReactions.reduce((a, b) => a + b, 0) / this.mouseReactions.length);
            document.getElementById('mouse-avg').textContent = `${avg}ms`;
        }
    }

    render() {
        const ctx = this.ctx;

        // Apply screen shake
        ctx.save();
        if (this.screenShake > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
        }

        // Clear canvas
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid background
        this.drawGrid();

        // Draw speed lines
        this.drawSpeedLines();

        // Draw ground
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(this.canvas.width, this.groundY);
        ctx.stroke();

        // Draw obstacles
        this.drawObstacles();

        // Draw finish line
        if (this.finishLineX !== null) {
            this.drawFinishLine();
        }

        // Draw tether between runners
        if (this.ghostOffset > 10) {
            this.drawTether();
        }

        // Draw ghost runner (behind, but visually ahead)
        this.drawRunner(
            this.runnerX + this.ghostOffset,
            this.groundY - this.ghostJumpHeight,
            true
        );

        // Draw physical runner
        this.drawRunner(
            this.runnerX,
            this.groundY - this.physicalJumpHeight,
            false
        );

        // Draw particles
        this.drawParticles();

        ctx.restore();
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 1;

        // Vertical lines (moving for parallax)
        for (let x = -this.gridOffset; x < this.canvas.width + 100; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, this.groundY - 200);
            ctx.lineTo(x, this.groundY);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = this.groundY - 200; y <= this.groundY; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    drawSpeedLines() {
        const ctx = this.ctx;
        const intensity = (this.speed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed);

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + intensity * 0.2})`;
        ctx.lineWidth = 1;

        for (const line of this.speedLines) {
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x + line.length, line.y);
            ctx.stroke();
        }
    }

    drawObstacles() {
        const ctx = this.ctx;

        for (const obs of this.obstacles) {
            // Main obstacle
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(obs.x, this.groundY - obs.height, obs.width, obs.height);

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(obs.x, this.groundY - obs.height, obs.width, 5);

            // Glow
            ctx.shadowColor = '#ff4757';
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'transparent';
            ctx.fillRect(obs.x, this.groundY - obs.height, obs.width, obs.height);
            ctx.shadowBlur = 0;
        }
    }

    drawFinishLine() {
        const ctx = this.ctx;
        const x = this.finishLineX;
        const flagHeight = 150;
        const flagWidth = 80;
        const poleHeight = flagHeight + 50;

        // Draw pole
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 3, this.groundY - poleHeight, 6, poleHeight);

        // Draw checkered flag
        const squareSize = 10;
        for (let row = 0; row < flagHeight / squareSize; row++) {
            for (let col = 0; col < flagWidth / squareSize; col++) {
                const isWhite = (row + col) % 2 === 0;
                ctx.fillStyle = isWhite ? '#fff' : '#000';
                ctx.fillRect(
                    x + 3 + col * squareSize,
                    this.groundY - poleHeight + row * squareSize,
                    squareSize,
                    squareSize
                );
            }
        }

        // Draw "FINISH" text
        ctx.font = 'bold 24px Courier New';
        ctx.fillStyle = '#2ed573';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#2ed573';
        ctx.shadowBlur = 20;
        ctx.fillText('FINISH', x + flagWidth / 2, this.groundY - poleHeight - 20);
        ctx.shadowBlur = 0;

        // Draw finish line on ground
        ctx.strokeStyle = '#2ed573';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(x, this.groundY - 200);
        ctx.lineTo(x, this.groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Distance remaining indicator
        const distanceToFinish = Math.max(0, this.finishDistance - this.distance);
        if (distanceToFinish > 0 && distanceToFinish < 100) {
            ctx.font = 'bold 18px Courier New';
            ctx.fillStyle = '#2ed573';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.ceil(distanceToFinish)}m to go!`, x, this.groundY + 40);
        }
    }

    drawTether() {
        const ctx = this.ctx;
        const startX = this.runnerX + 20;
        const startY = this.groundY - this.physicalJumpHeight - 30;
        const endX = this.runnerX + this.ghostOffset + 20;
        const endY = this.groundY - this.ghostJumpHeight - 30;

        // Create gradient for tether
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw distance label
        const midX = (startX + endX) / 2;
        const midY = Math.min(startY, endY) - 20;
        const leadDistance = (this.ghostLead / 50).toFixed(1);

        ctx.font = 'bold 14px Courier New';
        ctx.fillStyle = '#4f46e5';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#4f46e5';
        ctx.shadowBlur = 10;
        ctx.fillText(`+${leadDistance}m`, midX, midY);
        ctx.shadowBlur = 0;
    }

    drawRunner(x, y, isGhost) {
        const ctx = this.ctx;
        const width = 40;
        const height = 60;

        // Check if stumbling
        const isStumbling = isGhost ? this.ghostStumble > 0 : this.physicalStumble > 0;

        ctx.save();

        // Apply stumble effect (red tint and wobble)
        if (isStumbling) {
            const wobble = Math.sin(this.frameCount * 0.5) * 5;
            ctx.translate(wobble, 0);
        }

        if (isGhost) {
            // Ghost effect
            ctx.globalAlpha = isStumbling ? 0.4 : 0.7;
            ctx.shadowColor = isStumbling ? '#ff4757' : '#4f46e5';
            ctx.shadowBlur = 30;

            // Motion blur effect
            for (let i = 3; i > 0; i--) {
                ctx.globalAlpha = 0.1 * i;
                this.drawRunnerBody(x - i * 8, y, width, height, isGhost, isStumbling);
            }

            ctx.globalAlpha = isStumbling ? 0.4 : 0.7;
        }

        this.drawRunnerBody(x, y, width, height, isGhost, isStumbling);

        ctx.restore();
    }

    drawRunnerBody(x, y, width, height, isGhost, isStumbling = false) {
        const ctx = this.ctx;
        const color = isStumbling ? '#ff4757' : (isGhost ? '#4f46e5' : '#1e293b');
        const secondaryColor = isStumbling ? '#ff6b7a' : (isGhost ? '#a855f7' : '#cccccc');

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(x, y - height, width * 0.6, height * 0.5);

        // Head
        ctx.beginPath();
        ctx.arc(x + width * 0.3, y - height - 10, 12, 0, Math.PI * 2);
        ctx.fill();

        // Legs (animated)
        const legOffset = Math.sin(this.runFrame * Math.PI / 2) * 15;

        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        // Back leg
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y - height * 0.5);
        ctx.lineTo(x + width * 0.3 - legOffset, y);
        ctx.stroke();

        // Front leg
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y - height * 0.5);
        ctx.lineTo(x + width * 0.3 + legOffset, y);
        ctx.stroke();

        // Arms (animated opposite to legs)
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 4;

        // Back arm
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y - height * 0.7);
        ctx.lineTo(x + width * 0.3 + legOffset * 0.7, y - height * 0.4);
        ctx.stroke();

        // Front arm
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y - height * 0.7);
        ctx.lineTo(x + width * 0.3 - legOffset * 0.7, y - height * 0.4);
        ctx.stroke();
    }

    drawParticles() {
        const ctx = this.ctx;

        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;

            if (p.isGhost) {
                ctx.shadowColor = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
                ctx.shadowBlur = 10;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
    }

    gameLoop() {
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new IntentRunner();
});
    </script>
</body>
</html>

```

### preview/mudra-duel.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mudra Duel v4 — Rock Paper Scissors</title>
  <style>
    :root {
      --bg: #f8f9fa;
      --card: #ffffff;
      --primary: #4f46e5;
      --accent: #06b6d4;
      --text: #1e293b;
      --text-secondary: #64748b;
      --success: #22c55e;
      --warning: #eab308;
      --error: #ef4444;
      --pink: #ff3d8a;
      --yellow: #ffd700;
      --purple: #a855f7;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: Poppins, system-ui, sans-serif;
      overflow-x: hidden;
    }

    .app {
      width: min(1100px, 100%);
      margin: 0 auto;
      padding: 20px;
      display: grid;
      gap: 14px;
    }

    .card {
      background: var(--card);
      border: 1px solid rgba(79,70,229,0.18);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.34);
    }

    h1, h2, h3, p { margin: 0; }
    .title { font-size: 1.24rem; font-weight: 700; }
    .muted { color: var(--text-secondary); margin-top: 6px; font-size: 0.92rem; }

    .header-row {
      display: flex; justify-content: space-between; align-items: center;
      gap: 12px; flex-wrap: wrap; margin-top: 12px;
    }
    .status-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .status {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 0.88rem; padding: 7px 12px; border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.08);
      background: rgba(0,0,0,0.02);
    }
    .dot {
      width: 9px; height: 9px; border-radius: 50%;
      background: var(--warning);
      box-shadow: 0 0 0 4px rgba(234,179,8,0.15);
      transition: background 150ms ease;
    }
    .dot.connected {
      background: var(--success);
      box-shadow: 0 0 0 4px rgba(34,197,94,0.18);
    }

    button, .btn {
      border: none; border-radius: 10px; padding: 10px 18px;
      font-weight: 700; cursor: pointer; font-size: 0.92rem;
      background: var(--primary); color: #ffffff;
      transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
    }
    button:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.25); }
    button:active { transform: translateY(0); }
    button:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
    .btn-secondary {
      background: transparent; color: var(--text);
      border: 1px solid rgba(148,163,184,0.3); font-weight: 600;
    }
    .btn-danger { background: rgba(239,68,68,0.15); color: var(--error); border: 1px solid rgba(239,68,68,0.3); }
    .btn-success { background: var(--success); color: #ffffff; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }

    .screen { display: none; animation: fadeUp 400ms ease; }
    .screen.active { display: block; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo {
      font-size: 2.4rem; font-weight: 800; letter-spacing: -0.5px;
      background: linear-gradient(90deg, var(--primary), var(--pink), var(--yellow));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .tagline { color: var(--text-secondary); font-size: 1rem; margin-top: 4px; }

    .rules-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 28px 0; }
    .rule-card {
      background: rgba(0,0,0,0.03); border: 1px solid rgba(79,70,229,0.1);
      border-radius: 14px; padding: 20px; text-align: center;
      transition: border-color 200ms ease, transform 200ms ease;
    }
    .rule-card:hover { border-color: rgba(79,70,229,0.3); transform: translateY(-2px); }
    .rule-icon { font-size: 2.8rem; margin-bottom: 8px; }
    .rule-name { font-weight: 700; color: var(--primary); font-size: 1.05rem; }
    .rule-beats { color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px; }

    .settings-grid { display: grid; gap: 12px; margin: 16px 0; }
    .setting-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid rgba(148,163,184,0.1);
    }
    .setting-row:last-child { border-bottom: none; }
    .setting-label { font-size: 0.92rem; }
    select {
      padding: 8px 14px; border-radius: 8px;
      background: rgba(0,0,0,0.06); border: 1px solid rgba(148,163,184,0.2);
      color: var(--text); font-size: 0.88rem; font-family: inherit;
    }

    .cal-progress { display: flex; justify-content: center; gap: 24px; margin: 20px 0; }
    .cal-step {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      opacity: 0.35; transition: opacity 300ms ease, transform 200ms ease;
    }
    .cal-step.active { opacity: 1; transform: scale(1.08); }
    .cal-step.done { opacity: 1; }
    .step-circle {
      width: 52px; height: 52px; border-radius: 50%;
      border: 2px solid rgba(148,163,184,0.25);
      display: grid; place-items: center; font-size: 1.5rem;
      background: rgba(0,0,0,0.05); transition: all 300ms ease;
    }
    .cal-step.active .step-circle {
      border-color: var(--primary);
      box-shadow: 0 0 20px rgba(79,70,229,0.25);
    }
    .cal-step.done .step-circle { background: var(--success); border-color: var(--success); }
    .step-name { font-size: 0.78rem; color: var(--text-secondary); }

    .cal-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .gesture-prompt { text-align: center; padding: 30px 20px; }
    .prompt-icon {
      font-size: 5rem; margin-bottom: 12px;
      animation: breathe 2s ease-in-out infinite;
    }
    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.04); opacity: 0.85; }
    }
    .prompt-text { font-size: 1.3rem; font-weight: 700; }
    .prompt-hint { color: var(--text-secondary); font-size: 0.88rem; margin-top: 6px; }

    .sample-dots { display: flex; justify-content: center; gap: 8px; margin: 16px 0; }
    .sdot {
      width: 16px; height: 16px; border-radius: 50%;
      background: rgba(0,0,0,0.08); transition: all 300ms ease;
    }
    .sdot.recorded { background: var(--success); box-shadow: 0 0 8px rgba(34,197,94,0.5); }
    .sdot.recording { background: var(--pink); animation: rec-pulse 500ms infinite; }
    @keyframes rec-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.35); } }

    .sample-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 10px; margin: 3px 0;
      background: rgba(0,0,0,0.04); border-radius: 8px; font-size: 0.82rem;
    }
    .sample-info { display: flex; align-items: center; gap: 8px; }
    .quality-tag { font-size: 0.72rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .quality-tag.excellent { background: var(--success); color: #000; }
    .quality-tag.good { background: var(--primary); color: #000; }
    .quality-tag.ok { background: var(--yellow); color: #000; }
    .remove-btn {
      background: transparent; border: none; color: var(--error);
      cursor: pointer; padding: 2px 6px; font-size: 1rem; opacity: 0.6;
      transition: opacity 150ms;
    }
    .remove-btn:hover { opacity: 1; transform: none; box-shadow: none; }

    .record-btn { padding: 16px 44px; font-size: 1.1rem; border-radius: 50px; }
    .record-btn.recording {
      background: linear-gradient(90deg, var(--pink), #ff6b6b);
      animation: rec-glow 1s infinite;
    }
    @keyframes rec-glow {
      0%,100% { box-shadow: 0 0 16px rgba(255,61,138,0.35); }
      50% { box-shadow: 0 0 32px rgba(255,61,138,0.7); }
    }

    .sensor-card {
      background: rgba(0,0,0,0.03); border-radius: 12px; padding: 12px;
      border: 1px solid rgba(148,163,184,0.1);
    }
    .sensor-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
    }
    .sensor-title {
      font-size: 0.78rem; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: 1px;
    }
    .sensor-vals { display: flex; gap: 12px; font-family: 'Menlo', monospace; font-size: 0.82rem; }
    .sv-x { color: #ff6b6b; } .sv-y { color: #4ecdc4; } .sv-z { color: #ffe66d; }
    .sensor-canvas { width: 100%; height: 70px; background: rgba(0,0,0,0.04); border-radius: 8px; }
    .snc-wave-canvas { width: 100%; height: 70px; border-radius: 6px; background: rgba(0,0,0,0.04); }
    .snc-legend { display: flex; justify-content: center; gap: 14px; margin-top: 5px; font-size: 0.72rem; }
    .snc-legend-item { display: flex; align-items: center; gap: 4px; }
    .snc-legend-color { width: 12px; height: 3px; border-radius: 2px; }

    .live-recog { text-align: center; padding: 10px; }
    .live-icon { font-size: 2rem; margin-bottom: 4px; }
    .live-scores {
      display: flex; justify-content: space-around; margin-top: 8px;
      font-size: 0.78rem; flex-wrap: wrap; gap: 4px;
    }

    /* Training progress */
    .train-panel {
      margin-top: 14px; padding: 12px; background: rgba(0,0,0,0.04);
      border-radius: 10px; text-align: center; display: none;
    }
    .train-panel.active { display: block; }
    .train-label { font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 8px; }
    .train-bar { height: 6px; background: rgba(0,0,0,0.06); border-radius: 999px; overflow: hidden; }
    .train-fill {
      height: 100%; width: 0%;
      background: linear-gradient(90deg, var(--purple), var(--primary));
      border-radius: 999px; transition: width 50ms linear;
    }
    .train-stats { font-size: 0.78rem; color: var(--primary); margin-top: 6px; font-weight: 600; }

    .val-content { max-width: 520px; margin: 0 auto; text-align: center; }
    .val-icon { font-size: 4.5rem; margin-bottom: 12px; }
    .val-text { font-size: 1.4rem; font-weight: 700; }
    .val-result { margin: 16px 0; font-size: 1.1rem; min-height: 28px; }

    .detect-window {
      background: rgba(0,0,0,0.4); border-radius: 14px;
      padding: 14px; margin: 16px auto; max-width: 480px;
    }
    .detect-labels { display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--text-secondary); }
    .detect-bar {
      height: 8px; background: rgba(0,0,0,0.06);
      border-radius: 999px; overflow: hidden; margin-top: 8px;
    }
    .detect-fill {
      height: 100%; width: 0%;
      background: linear-gradient(90deg, var(--accent), var(--primary));
      border-radius: 999px; transition: width 80ms linear;
    }

    .arena {
      display: flex; justify-content: space-between; align-items: center;
      max-width: 800px; margin: 0 auto; padding: 32px 16px;
    }
    .player-side { flex: 1; text-align: center; }
    .player-label {
      font-size: 1rem; color: var(--text-secondary); text-transform: uppercase;
      letter-spacing: 2px; margin-bottom: 12px;
    }
    .player-gesture {
      width: 160px; height: 160px; border-radius: 50%;
      background: rgba(0,0,0,0.03); border: 3px solid rgba(148,163,184,0.2);
      display: grid; place-items: center; font-size: 4.5rem;
      margin: 0 auto 12px; transition: all 350ms ease;
    }
    .player-gesture.win { border-color: var(--success); box-shadow: 0 0 28px rgba(34,197,94,0.35); }
    .player-gesture.lose { border-color: var(--error); box-shadow: 0 0 28px rgba(239,68,68,0.35); }
    .player-gesture.draw { border-color: var(--yellow); box-shadow: 0 0 28px rgba(255,215,0,0.35); }
    .player-name { font-size: 1rem; font-weight: 600; }

    .vs-col { display: flex; flex-direction: column; align-items: center; padding: 0 24px; }
    .vs-text {
      font-size: 1.8rem; font-weight: 800;
      background: linear-gradient(180deg, var(--primary), var(--pink));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .countdown-num {
      font-size: 6rem; font-weight: 800;
      background: linear-gradient(90deg, var(--primary), var(--pink));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      animation: cd-pulse 900ms ease-in-out;
    }
    @keyframes cd-pulse {
      0% { transform: scale(1.4); opacity: 0; }
      50% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.85); opacity: 0.85; }
    }

    .game-status { font-size: 1.3rem; text-align: center; margin: 16px 0; min-height: 36px; }
    .result-text {
      font-size: 2.4rem; font-weight: 800; text-transform: uppercase;
      animation: pop-in 400ms ease;
    }
    @keyframes pop-in { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .result-text.win { color: var(--success); }
    .result-text.lose { color: var(--error); }
    .result-text.draw { color: var(--yellow); }

    .score-row { display: flex; justify-content: center; gap: 48px; margin: 16px 0; }
    .score-item { text-align: center; }
    .score-label { font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
    .score-value { font-size: 2.6rem; font-weight: 800; color: var(--primary); }

    .final-result { font-size: 3.2rem; font-weight: 800; margin: 24px 0; text-align: center; }
    .final-result.victory {
      background: linear-gradient(90deg, var(--success), var(--primary));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .final-result.defeat { color: var(--error); }

    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px; max-width: 600px; margin: 28px auto;
    }
    .stat-card {
      background: rgba(0,0,0,0.03); border: 1px solid rgba(79,70,229,0.1);
      border-radius: 12px; padding: 16px; text-align: center;
    }
    .stat-val { font-size: 1.8rem; font-weight: 700; color: var(--primary); }
    .stat-lbl { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }

    .gesture-usage { display: flex; justify-content: center; gap: 28px; margin: 24px 0; }
    .usage-item { text-align: center; }
    .usage-icon { font-size: 2.2rem; margin-bottom: 4px; }
    .usage-count { font-size: 1.1rem; font-weight: 600; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.8);
      display: none; place-items: center; z-index: 100;
    }
    .modal-overlay.active { display: grid; }
    .modal {
      background: var(--card);
      border-radius: 18px; padding: 24px; max-width: 500px; width: 90%;
      border: 1px solid rgba(79,70,229,0.18);
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .modal h3 { margin-bottom: 16px; font-size: 1.3rem; }
    .modal-buttons { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }

    .toast {
      position: fixed; bottom: 28px; left: 50%; z-index: 200;
      transform: translateX(-50%) translateY(80px);
      padding: 12px 24px; border-radius: 12px;
      background: rgba(0,0,0,0.92); color: var(--text);
      font-size: 0.92rem; border: 1px solid rgba(148,163,184,0.15);
      transition: transform 300ms ease; pointer-events: none;
    }
    .toast.show { transform: translateX(-50%) translateY(0); }
    .toast.success { border-left: 4px solid var(--success); }
    .toast.error { border-left: 4px solid var(--error); }
    .toast.info { border-left: 4px solid var(--primary); }

    .folder-import-banner {
      background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.10));
      border: 1px solid rgba(139,92,246,0.3);
      border-radius: 14px; padding: 14px 18px; margin-bottom: 14px;
      display: none; animation: fadeSlideIn 0.4s ease;
    }
    .folder-import-banner h4 { margin: 0 0 6px; font-size: 0.95rem; color: var(--purple); }
    .folder-import-banner p { margin: 0 0 10px; font-size: 0.84rem; color: var(--text-secondary); }
    .folder-import-banner .file-list { margin: 0 0 10px; padding: 0; list-style: none; }
    .folder-import-banner .file-list li {
      font-size: 0.82rem; padding: 4px 8px; margin: 3px 0;
      background: rgba(139,92,246,0.08); border-radius: 6px;
      cursor: pointer; transition: background 0.15s;
    }
    .folder-import-banner .file-list li:hover { background: rgba(139,92,246,0.18); }
    .folder-import-banner .file-list li.selected { background: rgba(139,92,246,0.25); border: 1px solid var(--purple); }
    .folder-import-actions { display: flex; gap: 8px; }
    @keyframes fadeSlideIn { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }

    .mudra-badge {
      position: fixed; bottom: 12px; right: 12px;
      font-size: 11px; color: var(--text-secondary);
      opacity: 0.7; font-family: inherit; letter-spacing: 0.02em; pointer-events: none;
    }

    .fab {
      position: fixed; bottom: 20px; width: 46px; height: 46px;
      border-radius: 50%; border: none; cursor: pointer;
      font-size: 1.1rem; font-weight: 700; z-index: 50;
      display: grid; place-items: center; transition: transform 200ms ease; padding: 0;
    }
    .fab:hover { transform: scale(1.1); box-shadow: none; }
    .fab-help { right: 20px; background: var(--primary); color: #ffffff; }
    .fab-debug { right: 76px; background: var(--purple); color: #fff; }

    .debug-panel {
      position: fixed; bottom: 78px; right: 20px; width: 280px;
      background: rgba(0,0,0,0.92); border: 1px solid rgba(148,163,184,0.15);
      border-radius: 12px; padding: 14px; font-family: 'Menlo', monospace;
      font-size: 0.72rem; color: var(--text-secondary);
      display: none; z-index: 100; max-height: 360px; overflow-y: auto;
    }
    .debug-panel.active { display: block; }
    .debug-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .debug-title { color: var(--primary); font-weight: 700; }
    .debug-close { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.8rem; padding: 0; }
    .debug-close:hover { transform: none; box-shadow: none; }
    .debug-sep { border: none; border-top: 1px solid rgba(148,163,184,0.12); margin: 8px 0; }

    .preset-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; background: rgba(0,0,0,0.03);
      border-radius: 10px; margin-bottom: 8px; cursor: pointer;
      border: 1px solid transparent; transition: all 200ms ease;
    }
    .preset-item:hover { background: rgba(79,70,229,0.08); border-color: rgba(79,70,229,0.25); }
    .preset-name { font-weight: 600; }
    .preset-date { font-size: 0.72rem; color: var(--text-secondary); }
    .preset-actions { display: flex; gap: 8px; align-items: center; }
    .preset-load { color: var(--success); font-size: 0.78rem; }
    .profile-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; background: rgba(0,0,0,0.03);
      border-radius: 10px; margin-bottom: 8px; cursor: pointer;
      border: 1px solid transparent; transition: all 200ms ease;
    }
    .profile-item:hover { background: rgba(79,70,229,0.08); border-color: rgba(79,70,229,0.25); }
    .profile-name { font-weight: 600; font-size: 0.95rem; }
    .profile-meta { font-size: 0.72rem; color: var(--text-secondary); }
    .profile-play { color: var(--success); font-size: 0.82rem; font-weight: 600; }
    .btn-danger-sm { background: transparent; border: 1px solid var(--error); color: var(--error); width:26px; height:26px; padding:0; border-radius:6px; font-size:0.9rem; display:grid; place-items:center; cursor:pointer; }
    .btn-danger-sm:hover { background: var(--error); color: #fff; transform: none; box-shadow: none; }
    .btn-edit-sm { background: transparent; border: 1px solid var(--primary); color: var(--primary); width:26px; height:26px; padding:0; border-radius:6px; font-size:0.8rem; display:grid; place-items:center; cursor:pointer; }
    .btn-edit-sm:hover { background: rgba(79,70,229,0.15); transform: none; box-shadow: none; }
    .hand-btn {
      flex: 1; padding: 8px 12px; border-radius: 10px; font-size: 0.88rem; font-weight: 600;
      background: rgba(0,0,0,0.03); border: 2px solid rgba(148,163,184,0.15);
      color: var(--text-secondary); cursor: pointer; transition: all 200ms ease;
    }
    .hand-btn:hover { border-color: rgba(79,70,229,0.3); transform: none; box-shadow: none; }
    .hand-btn.selected { border-color: var(--primary); color: var(--primary); background: rgba(79,70,229,0.08); }
    .hand-btn[data-hand="left"] .hand-emoji { transform: scaleX(-1); display: inline-block; }

    input[type="text"] {
      width: 100%; padding: 10px 14px; border-radius: 8px;
      background: rgba(0,0,0,0.06); border: 1px solid rgba(148,163,184,0.2);
      color: var(--text); font-size: 0.95rem; font-family: inherit;
    }

    @media (max-width: 768px) {
      .rules-grid { grid-template-columns: 1fr; }
      .cal-layout { grid-template-columns: 1fr; }
      .arena { flex-direction: column; gap: 16px; }
      .vs-col { padding: 16px 0; }
      .player-gesture { width: 120px; height: 120px; font-size: 3rem; }
      .cal-progress { gap: 14px; }
      .step-circle { width: 44px; height: 44px; font-size: 1.2rem; }
    }

    .pulse { animation: pulse-anim 150ms ease; }
    @keyframes pulse-anim { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }

    /* Debug Mode */
    .debug-gesture-btn {
      flex: 1; padding: 14px 8px; border-radius: 12px; font-size: 1rem;
      background: rgba(0,0,0,0.03); border: 2px solid rgba(148,163,184,0.15);
      color: var(--text); cursor: pointer; transition: all 200ms ease;
    }
    .debug-gesture-btn:hover { border-color: rgba(79,70,229,0.4); background: rgba(79,70,229,0.08); transform: translateY(-2px); box-shadow: none; }
    .debug-gesture-btn.correct { border-color: var(--success); background: rgba(34,197,94,0.12); }
    .debug-gesture-btn.incorrect { border-color: var(--error); background: rgba(239,68,68,0.08); }
    .debug-gesture-btn.selected-correct { border-color: var(--success); background: rgba(34,197,94,0.2); box-shadow: 0 0 16px rgba(34,197,94,0.3); }
    .debug-prob-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 0.82rem; }
    .debug-prob-label { width: 90px; text-align: left; display: flex; align-items: center; gap: 6px; }
    .debug-prob-bar-bg { flex: 1; height: 8px; background: rgba(0,0,0,0.06); border-radius: 999px; overflow: hidden; }
    .debug-prob-bar-fill { height: 100%; border-radius: 999px; transition: width 150ms ease; }
    .debug-prob-pct { width: 40px; text-align: right; color: var(--primary); font-family: 'Menlo', monospace; font-size: 0.78rem; }
    .debug-capture-recording { background: linear-gradient(90deg, var(--purple), var(--pink)) !important; color: #fff !important; }
    @keyframes rec-glow { 0%,100% { box-shadow: 0 0 8px rgba(168,85,247,0.3); } 50% { box-shadow: 0 0 20px rgba(168,85,247,0.6); } }
    .debug-capture-recording { animation: rec-glow 1s infinite; }
    #debugReviewPanel { animation: fadeUp 300ms ease; }
    .debug-stats-row { display: flex; justify-content: space-around; text-align: center; padding-top: 16px; border-top: 1px solid rgba(148,163,184,0.1); margin-top: 20px; }
    .debug-stat-val { font-size: 1.4rem; font-weight: 700; }
    .debug-stat-lbl { font-size: 0.78rem; color: var(--text-secondary); }
  </style>
</head>
<body>
  <a href="/gallery" style="position:fixed;top:12px;left:12px;z-index:9999;padding:6px 14px;background:rgba(255,255,255,0.8);color:#4f46e5;text-decoration:none;font-size:13px;font-family:system-ui,sans-serif;border-radius:8px;backdrop-filter:blur(8px);border:1px solid rgba(79,70,229,0.2);transition:background 0.2s;"onmouseenter="this.style.background='rgba(255,255,255,0.95)'"onmouseleave="this.style.background='rgba(255,255,255,0.8)'">&larr; Gallery</a>
  <main class="app">
    <section class="card">
      <h1 class="logo">MUDRA DUEL</h1>
      <p class="tagline">Gesture-Powered Rock Paper Scissors</p>
      <div class="header-row">
        <div class="status-row">
          <div class="status"><span class="dot" id="wsDot"></span><span id="wsText">Connecting...</span></div>
          <div class="status"><span class="dot" id="deviceDot"></span><span id="deviceText">Device: Unknown</span></div>
          <div class="status"><span class="dot" id="trainerDot"></span><span id="trainerText">Trainer: Checking...</span></div>
          <div class="status"><span class="dot" id="storageDot"></span><span id="storageText">Storage: Checking...</span></div>
        </div>
      </div>
    </section>

    <!-- WELCOME -->
    <div id="screen-welcome" class="screen active">
      <section class="card" style="text-align:center;">
        <div style="font-size:4rem; margin-bottom:8px;">&#x1F91C;&#x1F91B;</div>
        <h2 style="font-size:1.6rem; margin-bottom:10px;">Ready to Duel?</h2>
        <p class="muted" style="max-width:520px; margin:0 auto 24px;">
          Use your Mudra Band to play Rock Paper Scissors with real gestures.
          Calibrate 3 gestures, train a model with sklearn, then battle the AI.
        </p>
        <div class="rules-grid">
          <div class="rule-card"><div class="rule-icon">&#x270A;</div><div class="rule-name">Rock</div><div class="rule-beats">Beats Scissors</div></div>
          <div class="rule-card"><div class="rule-icon">&#x270B;</div><div class="rule-name">Paper</div><div class="rule-beats">Beats Rock</div></div>
          <div class="rule-card"><div class="rule-icon">&#x270C;</div><div class="rule-name">Scissors</div><div class="rule-beats">Beats Paper</div></div>
        </div>
        <div class="card" style="max-width:400px; margin:0 auto 24px; text-align:left;">
          <h3 style="margin-bottom:12px;">Game Settings</h3>
          <div class="settings-grid">
            <div class="setting-row"><span class="setting-label">Rounds to Win</span>
              <select id="optRounds"><option value="2">Best of 3</option><option value="3" selected>Best of 5</option><option value="5">Best of 9</option><option value="0">Endless</option></select></div>
            <div class="setting-row"><span class="setting-label">Detection Window</span>
              <select id="optDetection"><option value="1000">1 second</option><option value="1500" selected>1.5 seconds</option><option value="2000">2 seconds</option></select></div>
            <div class="setting-row"><span class="setting-label">Samples per Gesture</span>
              <select id="optSamples"><option value="3">3 samples</option><option value="4">4 samples</option><option value="5" selected>5 samples</option><option value="6">6 samples</option></select></div>
          </div>
        </div>
        <!-- New Calibration: profile name + hand -->
        <div class="card" style="max-width:400px; margin:0 auto 16px; text-align:left;">
          <h3 style="margin-bottom:12px;">New Calibration</h3>
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
            <input type="text" id="profileNameInput" placeholder="Profile name" style="flex:1;">
            <button id="btnStartCal">Calibrate</button>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="hand-btn" id="btnHandLeft" data-hand="left">🫲 Left Hand</button>
            <button class="hand-btn selected" id="btnHandRight" data-hand="right">🫱 Right Hand</button>
          </div>
        </div>

        <!-- Folder profile files auto-detect banner -->
        <div id="folderImportBanner" class="folder-import-banner" style="max-width:400px; margin:0 auto 14px;">
          <h4>📂 Profile files found</h4>
          <p id="folderImportDesc">Data files were found in the project folder. Select one to import:</p>
          <ul class="file-list" id="folderFileList"></ul>
          <div class="folder-import-actions">
            <button class="btn-primary" id="btnFolderImport" style="font-size:0.82rem; padding:6px 16px;" disabled>Import Selected</button>
            <button class="btn-secondary" id="btnFolderDismiss" style="font-size:0.82rem; padding:6px 12px;">Dismiss</button>
          </div>
        </div>

        <!-- Saved Profiles: quick start -->
        <div id="savedProfilesSection" class="card" style="max-width:400px; margin:0 auto 16px; text-align:left; display:none;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3>Saved Profiles</h3>
            <button id="btnPlayAll" class="btn-success" style="padding:6px 14px; font-size:0.85rem; display:none;">Play All Combined</button>
          </div>
          <div id="savedProfilesList" style="max-height:200px; overflow-y:auto;"></div>
        </div>

        <div class="actions" style="justify-content:center; gap:8px;">
          <button class="btn-secondary" id="btnQuickPlay">Quick Play (Demo)</button>
          <button class="btn-secondary" id="btnExportData" style="font-size:0.82rem;">Export Data</button>
          <button class="btn-secondary" id="btnImportData" style="font-size:0.82rem;">Import Data</button>
          <input type="file" id="importFileInput" accept=".json" style="display:none;">
        </div>
      </section>
    </div>

    <!-- CALIBRATION -->
    <div id="screen-cal" class="screen">
      <section class="card">
        <div style="text-align:center; margin-bottom:16px;">
          <h2 style="font-size:1.5rem;">Gesture Training</h2>
          <p class="muted">Record samples, then train a model to recognize your gestures</p>
          <div id="calProfileBadge" style="margin-top:8px; display:inline-block; padding:4px 14px; border-radius:20px; background:rgba(79,70,229,0.1); border:1px solid rgba(79,70,229,0.25); font-size:0.82rem; color:var(--primary);"></div>
        </div>
        <div class="cal-progress" id="calProgress"></div>
      </section>

      <div class="cal-layout">
        <section class="card gesture-prompt">
          <div class="prompt-icon" id="calIcon">&#x270A;</div>
          <div class="prompt-text" id="calText">Make a fist (Rock)</div>
          <div class="prompt-hint" id="calHint">Closed fist — also your ready position</div>
          <div class="sample-dots" id="sampleDots"></div>
          <div id="sampleList" style="margin:8px 0; max-height:110px; overflow-y:auto;"></div>
          <div style="margin-top:12px;">
            <button class="record-btn" id="btnRecord">Record Sample</button>
            <button class="btn-secondary" id="btnAddMore" style="display:none; margin-left:8px;">+ Add More</button>
          </div>
          <p class="muted" style="margin-top:8px; font-size:0.82rem;">Click button, wait for countdown, then HOLD the gesture steady</p>

          <!-- Training panel -->
          <div class="train-panel" id="trainPanel">
            <div class="train-label" id="trainLabel">Training neural network...</div>
            <div class="train-bar"><div class="train-fill" id="trainFill"></div></div>
            <div class="train-stats" id="trainStats"></div>
          </div>

          <div style="margin-top:16px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button class="btn-secondary" id="btnResetGesture">Reset Gesture</button>
            <button id="btnNextGesture" disabled>Next Gesture</button>
          </div>
          <div id="trainNowRow" style="margin-top:12px; display:none; text-align:center;">
            <button id="btnTrainNow" class="btn-success" style="width:100%;">🚀 Train Model & Play</button>
          </div>
          <div id="profileSavedNote" style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(148,163,184,0.1); display:none; text-align:center; color:var(--success); font-size:0.85rem;">
            ✓ Profile auto-saved
          </div>
        </section>

        <section class="card" style="display:grid; gap:12px;">
          <div class="sensor-card">
            <div class="sensor-header">
              <span class="sensor-title">Accelerometer</span>
              <div class="sensor-vals"><span class="sv-x" id="calAccX">0.00</span><span class="sv-y" id="calAccY">0.00</span><span class="sv-z" id="calAccZ">0.00</span></div>
            </div>
            <canvas id="canvasAcc" class="sensor-canvas"></canvas>
          </div>
          <div class="sensor-card">
            <div class="sensor-header">
              <span class="sensor-title">Gyroscope</span>
              <div class="sensor-vals"><span class="sv-x" id="calGyroX">0.00</span><span class="sv-y" id="calGyroY">0.00</span><span class="sv-z" id="calGyroZ">0.00</span></div>
            </div>
            <canvas id="canvasGyro" class="sensor-canvas"></canvas>
          </div>
          <div class="sensor-card">
            <div class="sensor-header"><span class="sensor-title">SNC (Muscle Activity)</span></div>
            <canvas id="canvasSnc" class="snc-wave-canvas"></canvas>
            <div class="snc-legend">
              <div class="snc-legend-item"><div class="snc-legend-color" style="background:#00d4ff;"></div><span>CH1</span></div>
              <div class="snc-legend-item"><div class="snc-legend-color" style="background:#22c55e;"></div><span>CH2</span></div>
              <div class="snc-legend-item"><div class="snc-legend-color" style="background:#ff6b6b;"></div><span>CH3</span></div>
            </div>
          </div>
          <div class="sensor-card">
            <div class="sensor-header"><span class="sensor-title">Live Recognition</span></div>
            <div class="live-recog">
              <div class="live-icon" id="liveIcon">-</div>
              <div style="font-size:0.85rem; color:var(--text-secondary);">
                Detected: <span id="liveName" style="color:var(--primary);">None</span>
              </div>
              <div class="live-scores">
                <span>Rock: <span id="liveRock" style="color:var(--primary);">-</span></span>
                <span>Paper: <span id="livePaper" style="color:var(--primary);">-</span></span>
                <span>Scissors: <span id="liveScissors" style="color:var(--primary);">-</span></span>
              </div>
            </div>
          </div>
          <div style="text-align:center;">
            <button class="btn-secondary" id="btnSkipCal" style="font-size:0.82rem;">Skip Calibration (Test Mode)</button>
          </div>
        </section>
      </div>
    </div>

    <!-- VALIDATION -->
    <div id="screen-val" class="screen">
      <section class="card">
        <div class="val-content">
          <h2 style="font-size:1.5rem; margin-bottom:8px;">Gesture Validation</h2>
          <p class="muted" style="margin-bottom:24px;">Perform each gesture when prompted to verify the trained model.</p>
          <div class="val-icon" id="valIcon">&#x2753;</div>
          <div class="val-text" id="valText">Perform: Rock</div>
          <div class="val-result" id="valResult"></div>
          <div class="detect-window">
            <div class="detect-labels">
              <span>Detected: <span id="valDetected">Waiting...</span></span>
              <span>Confidence: <span id="valConf">0%</span></span>
            </div>
            <div class="detect-bar"><div class="detect-fill" id="valBar"></div></div>
          </div>
          <div class="actions" style="justify-content:center; margin-top:16px;">
            <button class="btn-secondary" id="btnRecalibrate">Add Samples</button>
            <button id="btnStartGame" disabled>Start Game!</button>
            <button class="btn-success" id="btnStartAnyway" style="display:none;">Start Anyway</button>
          </div>
          <p id="valNote" class="muted" style="margin-top:8px; font-size:0.82rem; display:none;">Recognition may be less accurate with failed validation</p>
        </div>
      </section>
    </div>

    <!-- GAME -->
    <div id="screen-game" class="screen">
      <section class="card">
        <div class="score-row">
          <div class="score-item"><div class="score-label">You</div><div class="score-value" id="scorePlayer">0</div></div>
          <div class="score-item"><div class="score-label">AI</div><div class="score-value" id="scoreAi">0</div></div>
        </div>
        <div class="arena">
          <div class="player-side">
            <div class="player-label">You</div>
            <div class="player-gesture" id="pGesture">&#x2753;</div>
            <div class="player-name" id="pName">Ready</div>
          </div>
          <div class="vs-col">
            <div class="countdown-num" id="cdNum"></div>
            <div class="vs-text" id="vsText">VS</div>
          </div>
          <div class="player-side">
            <div class="player-label">AI</div>
            <div class="player-gesture" id="aGesture">&#x2753;</div>
            <div class="player-name" id="aName">Ready</div>
          </div>
        </div>
        <div class="game-status" id="gameStatus">Get ready for the next round!</div>
        <div class="detect-window" id="gameDetectWin" style="display:none;">
          <div class="detect-labels"><span>Make your gesture!</span><span id="gameDetectTime">1.5s</span></div>
          <div class="detect-bar"><div class="detect-fill" id="gameDetectBar"></div></div>
        </div>
        <!-- Correction panel (hidden until user clicks Wrong?) -->
        <div id="gameCorrectionPanel" style="display:none; margin-top:12px; padding:14px; background:rgba(0,0,0,0.25); border-radius:12px; text-align:center;">
          <div style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:10px;">What gesture were you making?</div>
          <div style="display:flex; gap:10px; justify-content:center;">
            <button class="debug-gesture-btn game-correct-btn" data-gesture="rock"><div style="font-size:1.8rem;">&#x270A;</div><div style="font-size:0.78rem; margin-top:2px;">Rock</div></button>
            <button class="debug-gesture-btn game-correct-btn" data-gesture="paper"><div style="font-size:1.8rem;">&#x270B;</div><div style="font-size:0.78rem; margin-top:2px;">Paper</div></button>
            <button class="debug-gesture-btn game-correct-btn" data-gesture="scissors"><div style="font-size:1.8rem;">&#x270C;</div><div style="font-size:0.78rem; margin-top:2px;">Scissors</div></button>
          </div>
        </div>
        <div class="actions" style="justify-content:center; margin-top:20px;">
          <button id="btnNextRound" style="display:none;">Next Round</button>
          <button class="btn-secondary" id="btnWrongGesture" style="display:none;">Wrong?</button>
          <button class="btn-secondary" id="btnQuitGame">Quit Game</button>
        </div>
      </section>
    </div>

    <!-- RESULTS -->
    <div id="screen-results" class="screen">
      <section class="card" style="text-align:center;">
        <h2 style="font-size:1.2rem; color:var(--text-secondary);">Match Complete!</h2>
        <div class="final-result" id="finalResult">VICTORY!</div>
        <div class="score-row">
          <div class="score-item"><div class="score-label">Your Score</div><div class="score-value" id="finalPlayer">0</div></div>
          <div class="score-item"><div class="score-label">AI Score</div><div class="score-value" id="finalAi">0</div></div>
        </div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-val" id="statRounds">0</div><div class="stat-lbl">Rounds Played</div></div>
          <div class="stat-card"><div class="stat-val" id="statAccuracy">0%</div><div class="stat-lbl">Gesture Accuracy</div></div>
          <div class="stat-card"><div class="stat-val" id="statAvgTime">0ms</div><div class="stat-lbl">Avg Response</div></div>
          <div class="stat-card"><div class="stat-val" id="statStreak">0</div><div class="stat-lbl">Best Streak</div></div>
        </div>
        <h3 style="margin-bottom:12px;">Gesture Usage</h3>
        <div class="gesture-usage">
          <div class="usage-item"><div class="usage-icon">&#x270A;</div><div class="usage-count" id="usageRock">0</div></div>
          <div class="usage-item"><div class="usage-icon">&#x270B;</div><div class="usage-count" id="usagePaper">0</div></div>
          <div class="usage-item"><div class="usage-icon">&#x270C;</div><div class="usage-count" id="usageScissors">0</div></div>
        </div>
        <div class="actions" style="justify-content:center; margin-top:28px;">
          <button id="btnPlayAgain">Play Again</button>
          <button class="btn-secondary" id="btnRecalResults">Add Samples</button>
          <button class="btn-secondary" id="btnMainMenu">Main Menu</button>
        </div>
      </section>
    </div>

    <!-- DEBUG MODE -->
    <div id="screen-debug" class="screen">
      <section class="card">
        <div style="text-align:center; margin-bottom:16px;">
          <h2 style="font-size:1.5rem;">Debug Mode</h2>
          <p class="muted">Test predictions, correct mistakes, improve your model</p>
          <div id="debugProfileBadge" style="margin-top:8px; display:inline-block; padding:4px 14px; border-radius:20px; background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.25); font-size:0.82rem; color:var(--purple);"></div>
        </div>
      </section>

      <div class="cal-layout">
        <!-- LEFT: Prediction + Controls -->
        <section class="card" style="text-align:center;">
          <!-- Live prediction -->
          <div id="debugLivePrediction">
            <div id="debugLiveIcon" style="font-size:5rem; margin-bottom:8px;">?</div>
            <div style="font-size:1.3rem; font-weight:700;"><span id="debugLiveName">Waiting for data...</span></div>
            <div style="font-size:0.88rem; color:var(--text-secondary); margin-top:4px;">
              Confidence: <span id="debugLiveConf" style="color:var(--primary);">0%</span>
            </div>
            <div id="debugProbBars" style="margin:16px 0;"></div>
          </div>

          <!-- Capture button -->
          <div id="debugCaptureRow" style="margin:16px 0;">
            <button id="btnDebugCapture" style="width:100%; padding:14px; font-size:1.05rem;">Capture Gesture</button>
            <p class="muted" style="margin-top:8px; font-size:0.82rem;">Hold your gesture, then click (or press Space)</p>
          </div>

          <!-- Review panel (hidden) -->
          <div id="debugReviewPanel" style="display:none;">
            <div style="padding:16px; background:rgba(0,0,0,0.25); border-radius:12px; margin-bottom:12px;">
              <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:8px;">Model predicted:</div>
              <div style="font-size:3rem;" id="debugReviewIcon">?</div>
              <div style="font-size:1.2rem; font-weight:700;" id="debugReviewName">Unknown</div>
              <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">Confidence: <span id="debugReviewConf">0%</span></div>
            </div>
            <div style="font-size:0.92rem; color:var(--text-secondary); margin-bottom:10px;">What gesture were you actually making?</div>
            <div style="display:flex; gap:10px; justify-content:center;">
              <button class="debug-gesture-btn" data-gesture="rock"><div style="font-size:2rem;">&#x270A;</div><div style="font-size:0.82rem; margin-top:4px;">Rock</div></button>
              <button class="debug-gesture-btn" data-gesture="paper"><div style="font-size:2rem;">&#x270B;</div><div style="font-size:0.82rem; margin-top:4px;">Paper</div></button>
              <button class="debug-gesture-btn" data-gesture="scissors"><div style="font-size:2rem;">&#x270C;</div><div style="font-size:0.82rem; margin-top:4px;">Scissors</div></button>
            </div>
          </div>

          <!-- Stats -->
          <div class="debug-stats-row">
            <div><div class="debug-stat-val" style="color:var(--primary);" id="debugStatCaptures">0</div><div class="debug-stat-lbl">Captures</div></div>
            <div><div class="debug-stat-val" style="color:var(--success);" id="debugStatCorrect">0</div><div class="debug-stat-lbl">Correct</div></div>
            <div><div class="debug-stat-val" style="color:var(--warning);" id="debugStatAccuracy">-</div><div class="debug-stat-lbl">Accuracy</div></div>
            <div><div class="debug-stat-val" style="color:var(--purple);" id="debugStatNew">0</div><div class="debug-stat-lbl">New Samples</div></div>
          </div>

          <!-- Retrain button (hidden) -->
          <div id="debugRetrainRow" style="display:none; margin-top:14px;">
            <button id="btnDebugRetrain" class="btn-success" style="width:100%;">Retrain with <span id="debugRetrainCount">0</span> new samples</button>
          </div>

          <!-- Training progress -->
          <div class="train-panel" id="debugTrainPanel">
            <div class="train-label" id="debugTrainLabel">Training...</div>
            <div class="train-bar"><div class="train-fill" id="debugTrainFill"></div></div>
            <div class="train-stats" id="debugTrainStats"></div>
          </div>

          <!-- Navigation -->
          <div style="margin-top:16px; display:flex; gap:10px; justify-content:center;">
            <button class="btn-secondary" id="btnDebugBack">Back to Menu</button>
            <button id="btnDebugPlay">Play Game</button>
          </div>
        </section>

        <!-- RIGHT: Sensor data -->
        <section class="card" style="display:grid; gap:12px;">
          <div class="sensor-card">
            <div class="sensor-header">
              <span class="sensor-title">Accelerometer</span>
              <div class="sensor-vals">
                <span class="sv-x" id="dbgModeAccX">0.00</span>
                <span class="sv-y" id="dbgModeAccY">0.00</span>
                <span class="sv-z" id="dbgModeAccZ">0.00</span>
              </div>
            </div>
            <canvas id="canvasAccDebug" class="sensor-canvas"></canvas>
          </div>
          <div class="sensor-card">
            <div class="sensor-header">
              <span class="sensor-title">Gyroscope</span>
              <div class="sensor-vals">
                <span class="sv-x" id="dbgModeGyroX">0.00</span>
                <span class="sv-y" id="dbgModeGyroY">0.00</span>
                <span class="sv-z" id="dbgModeGyroZ">0.00</span>
              </div>
            </div>
            <canvas id="canvasGyroDebug" class="sensor-canvas"></canvas>
          </div>
          <div class="sensor-card">
            <div class="sensor-header"><span class="sensor-title">SNC (Muscle Activity)</span></div>
            <canvas id="canvasSncDebug" class="snc-wave-canvas"></canvas>
            <div class="snc-legend">
              <div class="snc-legend-item"><div class="snc-legend-color" style="background:#00d4ff;"></div><span>CH1</span></div>
              <div class="snc-legend-item"><div class="snc-legend-color" style="background:#22c55e;"></div><span>CH2</span></div>
              <div class="snc-legend-item"><div class="snc-legend-color" style="background:#ff6b6b;"></div><span>CH3</span></div>
            </div>
          </div>
          <div class="sensor-card" style="text-align:center;">
            <div class="sensor-header"><span class="sensor-title">Training Data</span></div>
            <div style="display:flex; justify-content:space-around; padding:8px 0;">
              <div><div style="font-size:1.5rem;">&#x270A;</div><div style="font-size:0.82rem; color:var(--text-secondary);">Rock</div><div style="font-size:1rem; font-weight:700; color:var(--primary);" id="debugSamplesRock">0</div></div>
              <div><div style="font-size:1.5rem;">&#x270B;</div><div style="font-size:0.82rem; color:var(--text-secondary);">Paper</div><div style="font-size:1rem; font-weight:700; color:var(--primary);" id="debugSamplesPaper">0</div></div>
              <div><div style="font-size:1.5rem;">&#x270C;</div><div style="font-size:0.82rem; color:var(--text-secondary);">Scissors</div><div style="font-size:1rem; font-weight:700; color:var(--primary);" id="debugSamplesScissors">0</div></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>

  <div class="toast" id="toast"></div>

  <!-- Help Modal -->
  <div class="modal-overlay" id="helpModal"><div class="modal">
    <h3>How to Play</h3>
    <div style="color:var(--text-secondary); line-height:1.6; font-size:0.92rem;">
      <h4 style="color:var(--text); margin:12px 0 6px;">With Mudra Band:</h4>
      <ol style="padding-left:18px;">
        <li>Connect your Mudra Band</li>
        <li>Click "Start Calibration"</li>
        <li>Record 3-5 samples per gesture (Rock, Paper, Scissors)</li>
        <li>Model trains automatically after all gestures</li>
        <li>Validate, then play!</li>
      </ol>
      <h4 style="color:var(--text); margin:12px 0 6px;">Demo Mode:</h4>
      <ol style="padding-left:18px;">
        <li>Click "Quick Play (Demo)"</li>
        <li>During detection: <strong>R</strong>=Rock, <strong>P</strong>=Paper, <strong>S</strong>=Scissors</li>
      </ol>
      <h4 style="color:var(--text); margin:12px 0 6px;">Keyboard:</h4>
      <ul style="padding-left:18px;">
        <li><strong>Space</strong> &mdash; Record gesture during calibration</li>
        <li><strong>Enter</strong> &mdash; Next round</li>
        <li><strong>?</strong> &mdash; Show this help</li>
      </ul>
    </div>
    <div class="modal-buttons"><button id="btnCloseHelp">Got it!</button></div>
  </div></div>

  <!-- Presets Modal -->
  <div class="modal-overlay" id="presetsModal"><div class="modal" style="max-width:540px;">
    <h3>Calibration Presets</h3>
    <div id="presetsList" style="max-height:280px; overflow-y:auto; margin:12px 0;">
      <div style="text-align:center; color:var(--text-secondary); padding:16px;">No presets saved yet</div>
    </div>
    <div class="modal-buttons"><button class="btn-secondary" id="btnClosePresets">Cancel</button></div>
  </div></div>

  <!-- Save Preset Modal -->
  <div class="modal-overlay" id="savePresetModal"><div class="modal">
    <h3>Save Calibration Preset</h3>
    <div style="margin:16px 0;">
      <label style="display:block; margin-bottom:6px; color:var(--text-secondary); font-size:0.88rem;">Preset Name</label>
      <input type="text" id="presetNameInput" placeholder="e.g., My Gestures, Left Hand...">
    </div>
    <div class="modal-buttons">
      <button class="btn-secondary" id="btnCloseSavePreset">Cancel</button>
      <button id="btnDoSavePreset">Save Preset</button>
    </div>
  </div></div>

  <!-- Debug Panel -->
  <div class="debug-panel" id="debugPanel">
    <div class="debug-head"><span class="debug-title">NN Debug</span><button class="debug-close" id="btnCloseDebug">X</button></div>
    <div>Rock: <span id="dbgRock">-</span></div>
    <div>Paper: <span id="dbgPaper">-</span></div>
    <div>Scissors: <span id="dbgScissors">-</span></div>
    <hr class="debug-sep">
    <div>Detected: <span id="dbgDetected" style="color:var(--success);">-</span></div>
    <div>Confidence: <span id="dbgConf">-</span></div>
    <hr class="debug-sep">
    <div>Model: <span id="dbgModel">not trained</span></div>
    <div>Train Acc: <span id="dbgTrainAcc">-</span></div>
    <hr class="debug-sep">
    <div style="margin-top:6px;"><strong>Readings:</strong></div>
    <div>Acc: <span id="dbgAcc">-</span></div>
    <div>Gyro: <span id="dbgGyro">-</span></div>
    <div>SNC: <span id="dbgSnc">-</span></div>
  </div>

  <button class="fab fab-debug" id="fabDebug">D</button>
  <button class="fab fab-help" id="fabHelp">?</button>
  <div class="mudra-badge">Created by Mudra</div>

  <script>
    // ============================================================
    // MUDRA DUEL v2 — Neural Network Gesture Recognition
    // Signals: imu_acc + imu_gyro + snc + gesture
    // 3 gestures: rock, paper, scissors (no idle)
    // ============================================================

    const WS_URL = "ws://127.0.0.1:8766";
    const SNC_BUF = 500;
    const GESTURES = ["rock", "paper", "scissors"];
    const ICONS = { rock: "\u{270A}", paper: "\u{270B}", scissors: "\u{270C}" };
    const INFO = {
      rock:     { name: "Rock",     hint: "Closed fist — thumb outside or tucked.", icon: "\u{270A}" },
      paper:    { name: "Paper",    hint: "Open hand, ALL fingers fully extended and spread wide.", icon: "\u{270B}" },
      scissors: { name: "Scissors", hint: "Index + middle finger in V shape, other fingers CLOSED.", icon: "\u{270C}" }
    };

    let ws, reconnTimer;

    const S = {
      wsConnected: false, deviceConnected: false,
      curGestIdx: 0,
      gestureData: { rock: { samples: [] }, paper: { samples: [] }, scissors: { samples: [] } },
      isRecording: false,
      recBuf: { imu: [], snc: [] },
      samplesReq: 5,
      accHist: { x:[], y:[], z:[] }, gyroHist: { x:[], y:[], z:[] },
      sncBufs: [[], [], []],
      curAcc: [0,0,0], curGyro: [0,0,0], curSnc: [0,0,0],
      imuSeq: 0, sncSeq: 0,  // incremented on each new WebSocket reading
      inferBuf: { imu: [], snc: [] }, // rolling buffer for live inference (~1.5s)
      pScore: 0, aScore: 0, roundsToWin: 3, detectionMs: 1500,
      isPlaying: false, roundHistory: [],
      usage: { rock:0, paper:0, scissors:0 },
      respTimes: [], streak: 0, bestStreak: 0,
      totalDetect: 0, successDetect: 0,
      valIdx: 0, valPassed: 0,
      quickMode: false,
      modelTrained: false,
      trainAccuracy: 0,
      profileName: "",
      hand: "right",
      currentProfileId: null,
      // Debug mode
      debugCaptures: 0,
      debugCorrect: 0,
      debugNewSamples: 0,
      debugIsCapturing: false,
      debugCapturedResult: null,
      debugPhase: 'live'  // 'live' | 'capturing' | 'review'
    };

    let quickPlayGesture = null;

    // ============ MODEL (sklearn-trained, JS inference) ============
    // Features: acc(mean3+std3+mag2=8) + gyro(mean3+std3=6) + snc(mean3+std3+rms3+min3+max3+range3=18) = 32
    const FEAT_DIM = 32;
    const TRAINER_URL = "http://127.0.0.1:8767";

    const Model = {
      type: null,    // 'mlp' or 'rf'
      scaler: null,  // { mean: number[], std: number[] }
      mlp: null,     // { layers: number[][][], biases: number[][], activation: string }
      rf: null,      // { trees: TreeNode[][], n_classes: number }
      meta: null,    // { model_type, cv_results, best_cv_score, train_accuracy }

      // Scale input using the same StandardScaler as training
      scale(input) {
        if (!this.scaler) return Array.from(input);
        return Array.from(input).map((v, i) =>
          (v - this.scaler.mean[i]) / (this.scaler.std[i] + 1e-8)
        );
      },

      // MLP forward pass — supports arbitrary layer sizes from sklearn
      mlpForward(x) {
        let cur = x;
        for (let l = 0; l < this.mlp.layers.length; l++) {
          const W = this.mlp.layers[l];  // [prevSize][nextSize]
          const b = this.mlp.biases[l];  // [nextSize]
          const next = new Array(b.length).fill(0);
          for (let j = 0; j < b.length; j++) {
            let sum = b[j];
            for (let i = 0; i < cur.length; i++) sum += cur[i] * W[i][j];
            next[j] = sum;
          }
          // Apply activation (ReLU for hidden layers, none for output)
          if (l < this.mlp.layers.length - 1) {
            const act = this.mlp.activation || 'relu';
            if (act === 'relu') {
              for (let j = 0; j < next.length; j++) next[j] = Math.max(0, next[j]);
            } else if (act === 'tanh') {
              for (let j = 0; j < next.length; j++) next[j] = Math.tanh(next[j]);
            } else if (act === 'logistic') {
              for (let j = 0; j < next.length; j++) next[j] = 1 / (1 + Math.exp(-next[j]));
            }
          }
          cur = next;
        }
        return softmax(cur);
      },

      // Random Forest inference — traverse all trees, average probabilities
      rfForward(x) {
        const nClasses = this.rf.n_classes || 3;
        const avgProbs = new Array(nClasses).fill(0);
        for (const tree of this.rf.trees) {
          let nodeIdx = 0;
          while (tree[nodeIdx].left !== -1) {
            const node = tree[nodeIdx];
            nodeIdx = x[node.feature] <= node.threshold ? node.left : node.right;
          }
          const probs = tree[nodeIdx].probs;
          for (let c = 0; c < nClasses; c++) avgProbs[c] += probs[c];
        }
        const n = this.rf.trees.length;
        for (let c = 0; c < nClasses; c++) avgProbs[c] /= n;
        return avgProbs;
      },

      predict(input) {
        const x = this.scale(input);
        let probs;
        if (this.type === 'mlp') probs = this.mlpForward(x);
        else if (this.type === 'rf') probs = this.rfForward(x);
        else return { gesture: null, probs: [0.33, 0.33, 0.33] };

        let bestIdx = 0;
        for (let i = 1; i < probs.length; i++) { if (probs[i] > probs[bestIdx]) bestIdx = i; }
        return { gesture: GESTURES[bestIdx], confidence: probs[bestIdx], probs };
      },

      // Load model from trainer response
      load(resp) {
        this.type = resp.inference;
        this.scaler = resp.scaler || null;
        this.meta = {
          model_type: resp.model_type,
          cv_results: resp.cv_results,
          best_cv_score: resp.best_cv_score,
          train_accuracy: resp.train_accuracy
        };
        if (resp.inference === 'mlp' && resp.mlp) {
          this.mlp = resp.mlp;
          this.rf = null;
        } else if (resp.inference === 'rf' && resp.rf) {
          this.rf = resp.rf;
          this.mlp = null;
        }
      },

      serialize() {
        return { type: this.type, scaler: this.scaler, mlp: this.mlp, rf: this.rf, meta: this.meta };
      },

      deserialize(data) {
        this.type = data.type;
        this.scaler = data.scaler;
        this.mlp = data.mlp || null;
        this.rf = data.rf || null;
        this.meta = data.meta || null;
      },

      clear() {
        this.type = null; this.scaler = null; this.mlp = null; this.rf = null; this.meta = null;
      }
    };

    function softmax(logits) {
      const max = Math.max(...logits);
      const exps = logits.map(l => Math.exp(l - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      return exps.map(e => e / sum);
    }

    // Fallback: in-browser MLP training (no Python server needed)
    const FallbackNN = {
      train(features, labels, nClasses, onProgress) {
        const nFeats = features[0].length;
        const h1Size = 32, h2Size = 16;
        const w1 = xavierInit(nFeats, h1Size), b1 = new Float64Array(h1Size);
        const w2 = xavierInit(h1Size, h2Size), b2 = new Float64Array(h2Size);
        const w3 = xavierInit(h2Size, nClasses), b3 = new Float64Array(nClasses);

        // Compute normalization
        const mean = new Float64Array(nFeats), std = new Float64Array(nFeats);
        for (const f of features) { for (let i = 0; i < nFeats; i++) mean[i] += f[i]; }
        for (let i = 0; i < nFeats; i++) mean[i] /= features.length;
        for (const f of features) { for (let i = 0; i < nFeats; i++) std[i] += (f[i] - mean[i])**2; }
        for (let i = 0; i < nFeats; i++) std[i] = Math.sqrt(std[i] / features.length);

        // Augment
        const augFeats = [], augLabels = [];
        for (let s = 0; s < features.length; s++) {
          augFeats.push(features[s]); augLabels.push(labels[s]);
          for (let a = 0; a < 25; a++) {
            const noisy = features[s].map((v, i) => v + (Math.random()+Math.random()+Math.random()-1.5)*0.33*(Math.abs(v)*0.05+0.02));
            augFeats.push(noisy); augLabels.push(labels[s]);
          }
        }

        const normalize = (f) => f.map((v, i) => (v - mean[i]) / (std[i] + 1e-8));
        const epochs = 400;

        for (let ep = 0; ep < epochs; ep++) {
          // Shuffle
          for (let i = augFeats.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [augFeats[i], augFeats[j]] = [augFeats[j], augFeats[i]];
            [augLabels[i], augLabels[j]] = [augLabels[j], augLabels[i]];
          }
          const lr = 0.05 * (1 - ep / epochs * 0.8);
          for (let s = 0; s < augFeats.length; s++) {
            const x = normalize(augFeats[s]);
            // Forward
            const h1 = new Float64Array(h1Size);
            for (let j = 0; j < h1Size; j++) { let sum = b1[j]; for (let i = 0; i < nFeats; i++) sum += x[i] * w1[i*h1Size+j]; h1[j] = Math.max(0, sum); }
            const h2 = new Float64Array(h2Size);
            for (let j = 0; j < h2Size; j++) { let sum = b2[j]; for (let i = 0; i < h1Size; i++) sum += h1[i] * w2[i*h2Size+j]; h2[j] = Math.max(0, sum); }
            const logits = new Float64Array(nClasses);
            for (let j = 0; j < nClasses; j++) { let sum = b3[j]; for (let i = 0; i < h2Size; i++) sum += h2[i] * w3[i*nClasses+j]; logits[j] = sum; }
            const probs = softmax(Array.from(logits));
            // Backprop
            const dL = probs.map((p, j) => p - (j === augLabels[s] ? 1 : 0));
            const dH2 = new Float64Array(h2Size);
            for (let i = 0; i < h2Size; i++) { let sum = 0; for (let j = 0; j < nClasses; j++) { w3[i*nClasses+j] -= lr*h2[i]*dL[j]; sum += w3[i*nClasses+j]*dL[j]; } dH2[i] = h2[i]>0?sum:0; }
            for (let j = 0; j < nClasses; j++) b3[j] -= lr*dL[j];
            const dH1 = new Float64Array(h1Size);
            for (let i = 0; i < h1Size; i++) { let sum = 0; for (let j = 0; j < h2Size; j++) { w2[i*h2Size+j] -= lr*h1[i]*dH2[j]; sum += w2[i*h2Size+j]*dH2[j]; } dH1[i] = h1[i]>0?sum:0; }
            for (let j = 0; j < h2Size; j++) b2[j] -= lr*dH2[j];
            for (let i = 0; i < nFeats; i++) { for (let j = 0; j < h1Size; j++) w1[i*h1Size+j] -= lr*x[i]*dH1[j]; }
            for (let j = 0; j < h1Size; j++) b1[j] -= lr*dH1[j];
          }
          if (ep % 10 === 0 && onProgress) onProgress(ep, epochs);
        }

        // Convert to sklearn-like format for Model.load()
        const layers = [[], []];
        // w1: flat[nFeats*h1Size] → [nFeats][h1Size]
        for (let i = 0; i < nFeats; i++) { layers[0].push([]); for (let j = 0; j < h1Size; j++) layers[0][i].push(w1[i*h1Size+j]); }
        // w2: flat → [h1Size][h2Size]
        for (let i = 0; i < h1Size; i++) { layers[0+1] = layers[1] || []; }
        layers[1] = [];
        for (let i = 0; i < h1Size; i++) { layers[1].push([]); for (let j = 0; j < h2Size; j++) layers[1][i].push(w2[i*h2Size+j]); }
        // w3: flat → [h2Size][nClasses]
        layers[2] = [];
        for (let i = 0; i < h2Size; i++) { layers[2].push([]); for (let j = 0; j < nClasses; j++) layers[2][i].push(w3[i*nClasses+j]); }

        return {
          inference: 'mlp',
          model_type: 'mlp_fallback',
          scaler: { mean: Array.from(mean), std: Array.from(std) },
          mlp: { layers, biases: [Array.from(b1), Array.from(b2), Array.from(b3)], activation: 'relu' },
          cv_results: { mlp_fallback: { mean: 0, std: 0 } },
          best_cv_score: 0,
          train_accuracy: 0
        };
      }
    };

    function xavierInit(fanIn, fanOut) {
      const limit = Math.sqrt(6 / (fanIn + fanOut));
      const w = new Float64Array(fanIn * fanOut);
      for (let i = 0; i < w.length; i++) w[i] = (Math.random() * 2 - 1) * limit;
      return w;
    }

    // ============ FEATURE EXTRACTION ============

    function extractFeatures(accData, gyroData, sncData) {
      const f = new Float64Array(FEAT_DIM);
      let idx = 0;

      // Acc: mean(3) + std(3) + mag_mean(1) + mag_std(1) = 8
      const accS = stats3D(accData);
      f[idx++] = accS.mean[0]; f[idx++] = accS.mean[1]; f[idx++] = accS.mean[2];
      f[idx++] = accS.std[0];  f[idx++] = accS.std[1];  f[idx++] = accS.std[2];
      // Magnitude (captures gravity direction regardless of coordinate frame)
      const mags = (accData||[]).map(d => Math.sqrt((d[0]||0)**2 + (d[1]||0)**2 + (d[2]||0)**2));
      const magMean = mags.length ? mags.reduce((a,b) => a+b, 0) / mags.length : 0;
      const magStd = mags.length > 1 ? Math.sqrt(mags.reduce((a,v) => a + (v-magMean)**2, 0) / mags.length) : 0;
      f[idx++] = magMean; f[idx++] = magStd;

      // Gyro: mean(3) + std(3) = 6
      const gyroS = stats3D(gyroData);
      f[idx++] = gyroS.mean[0]; f[idx++] = gyroS.mean[1]; f[idx++] = gyroS.mean[2];
      f[idx++] = gyroS.std[0];  f[idx++] = gyroS.std[1];  f[idx++] = gyroS.std[2];

      // SNC: mean(3) + std(3) + rms(3) + min(3) + max(3) + range(3) = 18
      // SNC is the KEY signal for hand pose — extract rich features
      const sncS = statsRich3D(sncData);
      f[idx++] = sncS.mean[0]; f[idx++] = sncS.mean[1]; f[idx++] = sncS.mean[2];
      f[idx++] = sncS.std[0];  f[idx++] = sncS.std[1];  f[idx++] = sncS.std[2];
      f[idx++] = sncS.rms[0];  f[idx++] = sncS.rms[1];  f[idx++] = sncS.rms[2];
      f[idx++] = sncS.min[0];  f[idx++] = sncS.min[1];  f[idx++] = sncS.min[2];
      f[idx++] = sncS.max[0];  f[idx++] = sncS.max[1];  f[idx++] = sncS.max[2];
      f[idx++] = sncS.max[0] - sncS.min[0]; f[idx++] = sncS.max[1] - sncS.min[1]; f[idx++] = sncS.max[2] - sncS.min[2];

      return f;
    }

    // Unified extraction from calibration sample
    function extractSampleFeatures(sample) {
      const accData = sample.imu_data.accelerometer;
      const gyroData = sample.imu_data.gyroscope;
      const sncData = sample.snc_data.channels;
      return extractFeatures(accData, gyroData, sncData);
    }

    // Unified extraction from live buffer { imu: [{acc, gyro}], snc: [[c1,c2,c3]] }
    function extractLiveFeatures(buffer) {
      const accData = buffer.imu.map(d => d.acc);
      const gyroData = buffer.imu.map(d => d.gyro);
      const sncData = buffer.snc;
      return extractFeatures(accData, gyroData, sncData);
    }

    function stats3D(data) {
      const r = { mean: [0,0,0], std: [0,0,0] };
      if (!data || data.length === 0) return r;
      const n = data.length;
      for (const d of data) {
        r.mean[0] += (d[0]||0); r.mean[1] += (d[1]||0); r.mean[2] += (d[2]||0);
      }
      r.mean[0] /= n; r.mean[1] /= n; r.mean[2] /= n;
      for (const d of data) {
        r.std[0] += ((d[0]||0) - r.mean[0])**2;
        r.std[1] += ((d[1]||0) - r.mean[1])**2;
        r.std[2] += ((d[2]||0) - r.mean[2])**2;
      }
      r.std[0] = Math.sqrt(r.std[0] / n);
      r.std[1] = Math.sqrt(r.std[1] / n);
      r.std[2] = Math.sqrt(r.std[2] / n);
      return r;
    }

    function statsRich3D(data) {
      const r = { mean: [0,0,0], std: [0,0,0], rms: [0,0,0], min: [Infinity,Infinity,Infinity], max: [-Infinity,-Infinity,-Infinity] };
      if (!data || data.length === 0) {
        r.min = [0,0,0]; r.max = [0,0,0]; return r;
      }
      const n = data.length;
      for (const d of data) {
        for (let c = 0; c < 3; c++) {
          const v = d[c]||0;
          r.mean[c] += v;
          r.rms[c] += v * v;
          if (v < r.min[c]) r.min[c] = v;
          if (v > r.max[c]) r.max[c] = v;
        }
      }
      for (let c = 0; c < 3; c++) {
        r.mean[c] /= n;
        r.rms[c] = Math.sqrt(r.rms[c] / n);
      }
      for (const d of data) {
        for (let c = 0; c < 3; c++) {
          r.std[c] += ((d[c]||0) - r.mean[c])**2;
        }
      }
      for (let c = 0; c < 3; c++) r.std[c] = Math.sqrt(r.std[c] / n);
      return r;
    }

    // ============ MODEL TRAINING ============
    async function trainModel(elPrefix = 'train') {
      const panel = document.getElementById(elPrefix + "Panel");
      const fill = document.getElementById(elPrefix + "Fill");
      const label = document.getElementById(elPrefix + "Label");
      const stats = document.getElementById(elPrefix + "Stats");

      panel.classList.add("active");
      label.textContent = "Preparing training data...";
      fill.style.width = "0%";
      stats.textContent = "";

      await sleep(50);

      // 1. Extract features from calibration samples
      const features = [], labels = [];
      GESTURES.forEach((g, classIdx) => {
        S.gestureData[g].samples.forEach(sample => {
          features.push(Array.from(extractSampleFeatures(sample)));
          labels.push(classIdx);
        });
      });

      if (features.length < 3) {
        label.textContent = "Not enough samples!";
        stats.textContent = "Need at least 1 sample per gesture";
        return false;
      }

      // 2. Try scikit-learn server first, fallback to in-browser
      let result;
      try {
        label.textContent = "Connecting to sklearn trainer...";
        fill.style.width = "10%";
        await sleep(50);

        const resp = await fetch(`${TRAINER_URL}/train`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features, labels, gesture_names: GESTURES })
        });

        if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
        result = await resp.json();
        if (result.error) throw new Error(result.error);

        label.textContent = `sklearn: ${result.model_type} selected`;
        fill.style.width = "80%";
        stats.textContent = `CV accuracy: ${(result.best_cv_score*100).toFixed(1)}% · Train: ${(result.train_accuracy*100).toFixed(1)}%`;

        // Show model comparison
        if (result.cv_results) {
          const best = Object.entries(result.cv_results)
            .sort((a,b) => b[1].mean - a[1].mean)
            .map(([name, r]) => `${name}: ${(r.mean*100).toFixed(0)}%`)
            .join(' · ');
          console.log("Model comparison:", best);
        }

      } catch (e) {
        console.log("sklearn server unavailable, using in-browser fallback:", e.message);
        label.textContent = "Training in-browser (no sklearn server)...";
        fill.style.width = "15%";
        stats.textContent = "Run mudra_trainer.py for better models";
        await sleep(50);

        result = FallbackNN.train(features, labels, GESTURES.length, (ep, total) => {
          fill.style.width = `${15 + (ep/total)*80}%`;
          stats.textContent = `In-browser MLP · Epoch ${ep}/${total}`;
        });
      }

      // 3. Load the trained model
      Model.load(result);
      S.modelTrained = true;
      S.trainAccuracy = result.train_accuracy || 0;

      label.textContent = "Training complete!";
      const modelDesc = Model.type === 'rf' ? 'Random Forest' : `MLP (${result.model_type})`;
      stats.textContent = `${modelDesc} · CV: ${((result.best_cv_score||0)*100).toFixed(0)}% · Train: ${((result.train_accuracy||0)*100).toFixed(0)}% · ${features.length} samples`;
      fill.style.width = "100%";

      setEl("dbgModel", `${Model.type} (${result.model_type})`);
      setEl("dbgTrainAcc", `${((result.train_accuracy||0)*100).toFixed(0)}%`);

      // Auto-save profile (don't let save failure prevent game from starting)
      try { autoSaveProfile(); } catch (e) {
        console.error("Auto-save failed:", e);
        toast("⚠ Couldn't save profile (storage may be full)", "warning");
      }

      await sleep(500);
      return true;
    }

    // Predict from live buffer using trained model
    function predictGesture(buffer) {
      if (!S.modelTrained || !Model.type) return { gesture: null, probs: [0.33, 0.33, 0.33] };
      if (!buffer || buffer.imu.length < 10) return { gesture: null, probs: [0.33, 0.33, 0.33] };

      const features = extractLiveFeatures(buffer);
      const result = Model.predict(Array.from(features));

      if (result.confidence < 0.45) return { gesture: null, confidence: result.confidence, probs: result.probs };
      return result;
    }

    // ============ CONNECTION ============
    function connect() {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => { S.wsConnected = true; updateStatus(); subscribeSignals(); };
      ws.onclose = () => { S.wsConnected = false; updateStatus(); scheduleReconnect(); };
      ws.onerror = () => { S.wsConnected = false; updateStatus(); };
      ws.onmessage = (e) => {
        let msg; try { msg = JSON.parse(e.data); } catch { return; }
        // connection_status removed — new server does not emit it
        if (msg.type === "imu_acc") handleImu("acc", msg.data);
        if (msg.type === "imu_gyro") handleImu("gyro", msg.data);
        if (msg.type === "snc") handleSnc(msg.data);
        if (msg.type === "gesture") handleMudraGesture(msg.data);
      };
    }

    function subscribeSignals() {
      ["imu_acc", "imu_gyro", "snc", "gesture"].forEach(signal => send({ command: "subscribe", signal }));
    }

    function send(p) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(p)); }
    function scheduleReconnect() { clearTimeout(reconnTimer); reconnTimer = setTimeout(connect, 1200); }
    function updateStatus() {
      document.getElementById("wsDot").classList.toggle("connected", S.wsConnected);
      document.getElementById("wsText").textContent = S.wsConnected ? "Connected" : "Disconnected";
      document.getElementById("deviceDot").classList.toggle("connected", S.deviceConnected);
      document.getElementById("deviceText").textContent = S.deviceConnected ? "Device: Ready" : "Device: Not Found";
    }

    // Check sklearn trainer server availability
    let trainerAvailable = false;
    async function checkTrainer() {
      try {
        const resp = await fetch(`${TRAINER_URL}/health`, { signal: AbortSignal.timeout(2000) });
        trainerAvailable = resp.ok;
      } catch { trainerAvailable = false; }
      document.getElementById("trainerDot").classList.toggle("connected", trainerAvailable);
      document.getElementById("trainerText").textContent = trainerAvailable
        ? "Trainer: sklearn ready" : "Trainer: offline (in-browser fallback)";
    }
    checkTrainer();
    setInterval(checkTrainer, 10000);

    // ============ SIGNAL HANDLERS ============
    function handleImu(type, data) {
      const vals = Array.isArray(data?.values) ? data.values.map(Number) : [0,0,0];
      if (type === "acc") {
        S.curAcc = vals; S.imuSeq++; pushHist(S.accHist, vals[0], vals[1], vals[2], 50);
        setEl("calAccX", vals[0].toFixed(2)); setEl("calAccY", vals[1].toFixed(2)); setEl("calAccZ", vals[2].toFixed(2));
      } else {
        S.curGyro = vals; S.imuSeq++; pushHist(S.gyroHist, vals[0], vals[1], vals[2], 50);
        setEl("calGyroX", vals[0].toFixed(2)); setEl("calGyroY", vals[1].toFixed(2)); setEl("calGyroZ", vals[2].toFixed(2));
      }
      if (S.isRecording) S.recBuf.imu.push({ timestamp: Date.now(), type, values: [...vals] });
    }

    function handleSnc(data) {
      const channels = Array.isArray(data?.values) && data.values.length === 3 ? data.values : [[0],[0],[0]];
      for (let i = 0; i < 3; i++) {
        const ch = Array.isArray(channels[i]) ? channels[i] : [0];
        S.sncBufs[i].push(...ch);
        if (S.sncBufs[i].length > SNC_BUF) S.sncBufs[i].splice(0, S.sncBufs[i].length - SNC_BUF);
      }
      S.curSnc = S.sncBufs.map(buf => Number(buf[buf.length - 1] || 0));
      S.sncSeq++;
      drawSncWave();
      if (S.isRecording) {
        // Record ALL samples from this batch, not just the latest
        const batchLen = Math.max(...channels.map(ch => Array.isArray(ch) ? ch.length : 1));
        for (let s = 0; s < batchLen; s++) {
          S.recBuf.snc.push({
            timestamp: Date.now(),
            values: [
              Number(Array.isArray(channels[0]) ? (channels[0][s] ?? channels[0][channels[0].length-1]) : 0),
              Number(Array.isArray(channels[1]) ? (channels[1][s] ?? channels[1][channels[1].length-1]) : 0),
              Number(Array.isArray(channels[2]) ? (channels[2][s] ?? channels[2][channels[2].length-1]) : 0)
            ]
          });
        }
      }
    }

    function handleMudraGesture(data) { console.log("Mudra gesture:", data); }
    function pushHist(h, x, y, z, max) { h.x.push(x); h.y.push(y); h.z.push(z); if (h.x.length > max) { h.x.shift(); h.y.shift(); h.z.shift(); } }
    function setEl(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

    // ============ SCREENS ============
    function showScreen(id) {
      document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
      document.getElementById("screen-" + id).classList.add("active");
      if (id === "welcome") updateProfilesUI();
      if (id === "debug") startDebugSensorViz();
    }
    function openModal(id) { document.getElementById(id).classList.add("active"); }
    function closeModal(id) { document.getElementById(id).classList.remove("active"); }

    // ============ CALIBRATION ============
    function startCalibration() {
      const nameInput = document.getElementById("profileNameInput");
      const name = nameInput.value.trim();
      if (!name) { toast("Enter a profile name first", "error"); nameInput.focus(); return; }

      if (!S.wsConnected) connect();
      S.profileName = name;
      S.hand = document.querySelector(".hand-btn.selected")?.dataset.hand || "right";
      S.samplesReq = parseInt(document.getElementById("optSamples").value);
      S.roundsToWin = parseInt(document.getElementById("optRounds").value);
      S.detectionMs = parseInt(document.getElementById("optDetection").value);
      S.gestureData = { rock: { samples: [] }, paper: { samples: [] }, scissors: { samples: [] } };
      S.curGestIdx = 0;
      S.modelTrained = false;
      Model.clear();
      document.getElementById("trainPanel").classList.remove("active");
      showScreen("cal");
      updateCalUI();
      startSensorViz();
    }

    function updateCalUI() {
      const g = GESTURES[S.curGestIdx];
      const info = INFO[g];
      const handIcon = S.hand === 'left' ? '🫲' : '🫱';
      document.getElementById("calProfileBadge").textContent = `${handIcon} ${S.profileName || 'Untitled'} · ${S.hand} hand`;
      document.getElementById("calIcon").textContent = info.icon;
      document.getElementById("calText").textContent = `Make: ${info.name}`;
      document.getElementById("calHint").textContent = info.hint;

      // Progress steps — mark as done if gesture already has enough samples
      document.getElementById("calProgress").innerHTML = GESTURES.map((gn, i) => {
        const hasSamples = S.gestureData[gn].samples.length >= S.samplesReq;
        const cls = i === S.curGestIdx ? "cal-step active" : (i < S.curGestIdx || hasSamples) ? "cal-step done" : "cal-step";
        const count = S.gestureData[gn].samples.length;
        return `<div class="${cls}"><div class="step-circle">${ICONS[gn]}</div><div class="step-name">${INFO[gn].name}${count ? ` (${count})` : ''}</div></div>`;
      }).join("");

      const samples = S.gestureData[g].samples;
      const dots = document.getElementById("sampleDots");
      dots.innerHTML = "";
      for (let i = 0; i < S.samplesReq; i++) {
        const d = document.createElement("div"); d.className = "sdot";
        if (i < samples.length) {
          d.classList.add("recorded");
          const stab = samples[i].stability || 0.5;
          if (stab > 0.7) { d.style.background = "var(--success)"; d.style.boxShadow = "0 0 8px rgba(34,197,94,0.5)"; }
          else if (stab > 0.5) { d.style.background = "var(--primary)"; }
          else { d.style.background = "var(--yellow)"; }
        }
        dots.appendChild(d);
      }

      const list = document.getElementById("sampleList");
      list.innerHTML = samples.map((s, i) => {
        const stab = s.stability || 0.5;
        const qc = stab > 0.7 ? "excellent" : stab > 0.5 ? "good" : "ok";
        const qt = stab > 0.7 ? "Excellent" : stab > 0.5 ? "Good" : "OK";
        return `<div class="sample-item"><div class="sample-info"><span>Sample ${i+1}</span><span class="quality-tag ${qc}">${qt} (${(stab*100).toFixed(0)}%)</span></div><button class="remove-btn" onclick="removeSample('${g}',${i})">&times;</button></div>`;
      }).join("");

      document.getElementById("btnAddMore").style.display = samples.length >= S.samplesReq ? "inline-block" : "none";

      const nextBtn = document.getElementById("btnNextGesture");
      nextBtn.disabled = samples.length < S.samplesReq;
      nextBtn.textContent = S.curGestIdx === GESTURES.length - 1 ? "Train Model & Validate" : "Next Gesture";

      // Show "Train & Play" button when all gestures have enough samples
      const allDone = GESTURES.every(g => S.gestureData[g].samples.length >= S.samplesReq);
      document.getElementById("trainNowRow").style.display = allDone ? "block" : "none";
      document.getElementById("profileSavedNote").style.display = (allDone && S.modelTrained) ? "block" : "none";
    }

    async function doRecord() {
      const btn = document.getElementById("btnRecord");
      if (btn.disabled) return;
      const g = GESTURES[S.curGestIdx];
      const curLen = S.gestureData[g].samples.length;
      const dots = document.querySelectorAll(".sdot");

      btn.disabled = true; btn.textContent = "Get ready...";
      for (let i = 2; i >= 1; i--) {
        btn.textContent = `Hold gesture in ${i}...`;
        Sfx.playCountdown(i);
        await sleep(800);
      }
      btn.textContent = "HOLD STILL!"; btn.classList.add("recording");
      Sfx.playShoot();
      if (dots[curLen]) dots[curLen].classList.add("recording");

      await sleep(300);
      S.isRecording = true; S.recBuf = { imu: [], snc: [] };
      await sleep(1500);
      S.isRecording = false;
      btn.textContent = "Record Sample"; btn.classList.remove("recording"); btn.disabled = false;
      Sfx.playRecordStop();

      if (S.recBuf.imu.length >= 10 || S.recBuf.snc.length >= 10) {
        const stab = calcStability(S.recBuf);
        if (stab < 0.3) { toast(`Too much movement! (${(stab*100).toFixed(0)}%)`, "error"); updateCalUI(); return; }
        S.gestureData[g].samples.push({
          timestamp: new Date().toISOString(),
          stability: stab,
          imu_data: {
            accelerometer: S.recBuf.imu.filter(d => d.type === "acc").map(d => d.values),
            gyroscope: S.recBuf.imu.filter(d => d.type === "gyro").map(d => d.values)
          },
          snc_data: { channels: S.recBuf.snc.map(d => d.values) }
        });
        const qt = stab > 0.7 ? "Excellent!" : stab > 0.5 ? "Good" : "OK";
        toast(`Sample ${S.gestureData[g].samples.length} recorded! ${qt}`, "success");
      } else {
        toast("Not enough sensor data. Check connection.", "error");
      }
      updateCalUI();
    }

    function calcStability(buf) {
      const accD = buf.imu.filter(d => d.type === "acc").map(d => d.values);
      const gyroD = buf.imu.filter(d => d.type === "gyro").map(d => d.values);
      const sncD = buf.snc.map(d => d.values);
      if (accD.length < 5) return 0.5;
      const accVar = variance3D(accD);
      const gyroVar = gyroD.length >= 5 ? variance3D(gyroD) : 0;
      const sncVar = sncD.length >= 5 ? variance3D(sncD) : 0;
      return clamp01(Math.exp(-accVar/2)*0.3 + Math.exp(-gyroVar/50)*0.5 + Math.exp(-sncVar/0.1)*0.2);
    }

    function variance3D(data) {
      if (data.length < 2) return 0;
      const mean = [0, 0, 0];
      data.forEach(d => { mean[0] += (d[0]||0)/data.length; mean[1] += (d[1]||0)/data.length; mean[2] += (d[2]||0)/data.length; });
      let v = 0;
      data.forEach(d => { v += ((d[0]||0) - mean[0])**2 + ((d[1]||0) - mean[1])**2 + ((d[2]||0) - mean[2])**2; });
      return v / data.length;
    }

    function removeSample(g, idx) {
      if (S.gestureData[g]?.samples.length > idx) {
        S.gestureData[g].samples.splice(idx, 1);
        S.modelTrained = false; Model.clear(); // model invalidated
        updateCalUI(); toast(`Sample ${idx+1} removed`, "info");
      }
    }

    function resetCurrentGesture() {
      const g = GESTURES[S.curGestIdx];
      S.gestureData[g] = { samples: [] };
      S.modelTrained = false;
      updateCalUI(); toast(`${INFO[g].name} samples cleared`, "info");
    }

    async function nextGesture() {
      if (S.curGestIdx < GESTURES.length - 1) {
        S.curGestIdx++;
        updateCalUI();
      } else {
        // All gestures recorded → train model then validate
        try {
          const success = await trainModel();
          if (success) {
            await sleep(800);
            startValidation();
          }
        } catch (e) {
          console.error("Training failed:", e);
          toast("Training error: " + e.message, "error");
        }
      }
    }

    function skipCalibration() {
      S.quickMode = true;
      S.modelTrained = false;
      toast("Test mode: Press R=Rock, P=Paper, S=Scissors during play", "info");
      startGame();
    }

    function quickPlay() {
      S.quickMode = true;
      S.modelTrained = false;
      toast("Demo mode: Press R=Rock, P=Paper, S=Scissors", "info");
      startGame();
    }

    // ============ VALIDATION ============
    function startValidation() {
      S.valIdx = 0; S.valPassed = 0;
      showScreen("val");
      runValRound();
    }

    function runValRound() {
      if (S.valIdx >= GESTURES.length) {
        if (S.valPassed >= 2) {
          document.getElementById("btnStartGame").disabled = false;
          document.getElementById("btnStartAnyway").style.display = "none";
          document.getElementById("valNote").style.display = "none";
          toast("Validation passed! Model is ready!", "success");
        } else {
          document.getElementById("btnStartGame").disabled = true;
          document.getElementById("btnStartAnyway").style.display = "inline-block";
          document.getElementById("valNote").style.display = "block";
          toast(`Validation: ${S.valPassed}/3 passed.`, "info");
        }
        return;
      }

      const g = GESTURES[S.valIdx];
      document.getElementById("valIcon").textContent = INFO[g].icon;
      document.getElementById("valText").textContent = `Get ready to perform: ${INFO[g].name}`;
      document.getElementById("valResult").textContent = "Get ready...";
      document.getElementById("valResult").style.color = "var(--warning)";
      document.getElementById("valDetected").textContent = "Waiting...";
      document.getElementById("valConf").textContent = "0%";
      document.getElementById("valBar").style.width = "0%";

      let cd = 2;
      const cdInt = setInterval(() => {
        if (cd > 0) { document.getElementById("valResult").textContent = `Starting in ${cd}...`; Sfx.playCountdown(cd); cd--; }
        else {
          clearInterval(cdInt);
          document.getElementById("valText").textContent = `Perform: ${INFO[g].name} NOW!`;
          document.getElementById("valResult").textContent = "Hold the gesture...";
          document.getElementById("valResult").style.color = "var(--primary)";
          Sfx.playShoot();
          detectForValidation(g);
        }
      }, 1000);
    }

    function detectForValidation(expected) {
      const start = Date.now();
      const readyMs = 500, detectMs = 2500;
      let lastR = { gesture: null, probs: [0.33,0.33,0.33] };

      // Helper: build merged buffer from recBuf for prediction
      const buildBuf = () => {
        const accE = S.recBuf.imu.filter(d => d.type === "acc");
        const gyroE = S.recBuf.imu.filter(d => d.type === "gyro");
        return {
          imu: accE.map((a, i) => ({ acc: [...a.values], gyro: gyroE[i] ? [...gyroE[i].values] : [0,0,0] })),
          snc: S.recBuf.snc.map(d => [...d.values])
        };
      };

      const showResult = (r) => {
        S.isRecording = false;
        const rEl = document.getElementById("valResult");
        document.getElementById("valDetected").textContent = r.gesture ? INFO[r.gesture].name : "Unknown";
        document.getElementById("valConf").textContent = `${Math.round(r.confidence*100)}%`;
        document.getElementById("valBar").style.width = "100%";

        if (r.gesture === expected) {
          rEl.textContent = `Correct! (${Math.round(r.confidence*100)}% confidence)`;
          rEl.style.color = "var(--success)";
          S.valPassed++; Sfx.playWin();
        } else {
          rEl.textContent = `Expected ${INFO[expected].name}, got ${r.gesture ? INFO[r.gesture].name : "Unknown"}`;
          rEl.style.color = "var(--error)"; Sfx.playLose();
        }
        setTimeout(() => { S.valIdx++; runValRound(); }, 2000);
      };

      const tick = () => {
        const el = Date.now() - start;
        const detEl = Math.max(0, el - readyMs);
        document.getElementById("valBar").style.width = `${Math.min(100, (detEl/detectMs)*100)}%`;

        // Start recording once ready period is over
        if (el >= readyMs && !S.isRecording) {
          S.isRecording = true;
          S.recBuf = { imu: [], snc: [] };
        }

        if (el < readyMs + detectMs) {
          if (S.isRecording) {
            const buf = buildBuf();
            if (buf.imu.length > 10) {
              lastR = predictGesture(buf);
              document.getElementById("valDetected").textContent = lastR.gesture ? INFO[lastR.gesture].name : "Analyzing...";
              document.getElementById("valConf").textContent = `${Math.round(lastR.confidence*100)}%`;
              if (lastR.confidence > 0.88 && lastR.gesture) { showResult(lastR); return; }
            }
          }
          requestAnimationFrame(tick);
        } else {
          const buf = buildBuf();
          const r = buf.imu.length > 5 ? predictGesture(buf) : lastR;
          showResult(r);
        }
      };
      tick();
    }

    // ============ GAME ============
    let gameActive = false;

    function startGame() {
      S.pScore = 0; S.aScore = 0; S.roundHistory = [];
      S.usage = { rock:0, paper:0, scissors:0 };
      S.respTimes = []; S.streak = 0; S.bestStreak = 0;
      S.totalDetect = 0; S.successDetect = 0;
      gameActive = true;
      showScreen("game"); updateScores(); resetArena();
      setTimeout(() => { if (gameActive) startRound(); }, 1000);
    }

    function stopGame() {
      gameActive = false;
      S.isPlaying = false;
    }

    function updateScores() {
      document.getElementById("scorePlayer").textContent = S.pScore;
      document.getElementById("scoreAi").textContent = S.aScore;
    }

    function resetArena() {
      document.getElementById("pGesture").textContent = "\u{2753}"; document.getElementById("pGesture").className = "player-gesture";
      document.getElementById("pName").textContent = "Ready";
      document.getElementById("aGesture").textContent = "\u{2753}"; document.getElementById("aGesture").className = "player-gesture";
      document.getElementById("aName").textContent = "Ready";
      document.getElementById("vsText").style.display = "block";
      document.getElementById("cdNum").textContent = "";
      document.getElementById("gameStatus").textContent = "Get ready for the next round!";
      document.getElementById("btnNextRound").style.display = "none";
      document.getElementById("gameDetectWin").style.display = "none";
    }

    async function startRound() {
      if (!gameActive) return;
      S.isPlaying = true; resetArena();
      document.getElementById("vsText").style.display = "none";
      const cdEl = document.getElementById("cdNum");
      for (let i = 3; i >= 1; i--) {
        if (!gameActive) return;
        cdEl.textContent = i; cdEl.style.animation = "none"; cdEl.offsetHeight;
        cdEl.style.animation = "cd-pulse 900ms ease-in-out"; Sfx.playCountdown(i); await sleep(1000);
      }
      if (!gameActive) return;
      cdEl.textContent = "SHOOT!"; Sfx.playShoot(); await sleep(500);
      if (!gameActive) return;
      cdEl.textContent = ""; document.getElementById("vsText").style.display = "block";
      detectPlayerGesture();
    }

    function detectPlayerGesture() {
      document.getElementById("gameDetectWin").style.display = "block";
      document.getElementById("gameStatus").textContent = "Make your gesture now!";
      const start = Date.now(), dur = S.detectionMs;
      let lastR = { gesture: null, probs: [0.33,0.33,0.33] };

      // Use event-driven recording (same as calibration & debug) for full data density
      S.isRecording = true;
      S.recBuf = { imu: [], snc: [] };

      // Helper: build merged buffer from recBuf for prediction
      const buildBuf = () => {
        const accE = S.recBuf.imu.filter(d => d.type === "acc");
        const gyroE = S.recBuf.imu.filter(d => d.type === "gyro");
        return {
          imu: accE.map((a, i) => ({ acc: [...a.values], gyro: gyroE[i] ? [...gyroE[i].values] : [0,0,0] })),
          snc: S.recBuf.snc.map(d => [...d.values])
        };
      };

      const tick = () => {
        if (!gameActive) { S.isRecording = false; return; }
        const el = Date.now() - start;
        document.getElementById("gameDetectBar").style.width = `${Math.min(100,(el/dur)*100)}%`;
        document.getElementById("gameDetectTime").textContent = `${((dur-el)/1000).toFixed(1)}s`;

        const buf = buildBuf();
        if (S.modelTrained && buf.imu.length > 5) {
          lastR = predictGesture(buf);
          if (lastR.confidence > 0.88 && lastR.gesture) { S.isRecording = false; finishRound(lastR, el); return; }
        }

        if (el < dur) requestAnimationFrame(tick);
        else { S.isRecording = false; finishRound(lastR, dur); }
      };
      tick();
    }

    // Store last round's data for potential correction
    let lastRoundRecBuf = null;
    let lastRoundDetectedGesture = null;
    let lastRoundAiGesture = null;
    let lastRoundResult = null;

    function finishRound(pResult, respTime) {
      if (!gameActive) return;
      S.isPlaying = false; S.totalDetect++;
      document.getElementById("gameDetectWin").style.display = "none";
      let pg = pResult.gesture;

      // Save recBuf for potential correction (deep copy)
      lastRoundRecBuf = S.recBuf ? JSON.parse(JSON.stringify(S.recBuf)) : null;

      if (S.quickMode && quickPlayGesture) { pg = quickPlayGesture; quickPlayGesture = null; S.successDetect++; }
      else if (!pg) {
        pg = GESTURES[Math.floor(Math.random() * 3)];
        if (!S.quickMode) toast("No gesture detected — random selection", "info");
      } else { S.successDetect++; }

      lastRoundDetectedGesture = pg;

      S.respTimes.push(respTime); S.usage[pg]++;
      const ag = aiChoice();
      lastRoundAiGesture = ag;

      document.getElementById("pGesture").textContent = ICONS[pg];
      document.getElementById("pName").textContent = INFO[pg].name;
      document.getElementById("aGesture").textContent = ICONS[ag];
      document.getElementById("aName").textContent = INFO[ag].name;

      const result = winner(pg, ag);
      lastRoundResult = result;
      S.roundHistory.push({ player: pg, ai: ag, result });
      const pEl = document.getElementById("pGesture"), aEl = document.getElementById("aGesture"), status = document.getElementById("gameStatus");

      if (result === "win") { S.pScore++; S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak); pEl.classList.add("win"); aEl.classList.add("lose"); status.innerHTML = '<span class="result-text win">YOU WIN!</span>'; Sfx.playWin(); }
      else if (result === "lose") { S.aScore++; S.streak = 0; pEl.classList.add("lose"); aEl.classList.add("win"); status.innerHTML = '<span class="result-text lose">AI WINS!</span>'; Sfx.playLose(); }
      else { pEl.classList.add("draw"); aEl.classList.add("draw"); status.innerHTML = '<span class="result-text draw">DRAW!</span>'; Sfx.playDraw(); }

      updateScores();
      document.getElementById("gameCorrectionPanel").style.display = "none";
      const isMatchOver = S.roundsToWin > 0 && (S.pScore >= S.roundsToWin || S.aScore >= S.roundsToWin);
      // Always show Wrong? button so user can correct even the final round
      document.getElementById("btnWrongGesture").style.display = (lastRoundRecBuf && !S.quickMode) ? "inline-block" : "none";
      if (isMatchOver) {
        // Show "End Match" instead of "Next Round", give user time to correct
        document.getElementById("btnNextRound").textContent = "End Match";
        document.getElementById("btnNextRound").style.display = "inline-block";
        S._pendingMatchResult = S.pScore >= S.roundsToWin ? "victory" : "defeat";
      } else {
        document.getElementById("btnNextRound").textContent = "Next Round";
        document.getElementById("btnNextRound").style.display = "inline-block";
        S._pendingMatchResult = null;
      }
    }

    function showGameCorrection() {
      document.getElementById("gameCorrectionPanel").style.display = "block";
      document.getElementById("btnWrongGesture").style.display = "none";
      // Pre-highlight the detected gesture
      document.querySelectorAll(".game-correct-btn").forEach(btn => {
        btn.classList.remove("correct", "incorrect", "selected-correct");
        if (btn.dataset.gesture === lastRoundDetectedGesture) btn.classList.add("incorrect");
      });
    }

    function correctGameGesture(actualGesture) {
      if (!lastRoundRecBuf) return;

      // Save the corrected sample as training data
      const stab = calcStability(lastRoundRecBuf);
      S.gestureData[actualGesture].samples.push({
        timestamp: new Date().toISOString(),
        stability: stab,
        source: 'game-correction',
        imu_data: {
          accelerometer: lastRoundRecBuf.imu.filter(d => d.type === "acc").map(d => d.values),
          gyroscope: lastRoundRecBuf.imu.filter(d => d.type === "gyro").map(d => d.values)
        },
        snc_data: { channels: lastRoundRecBuf.snc.map(d => d.values) }
      });
      S.debugNewSamples = (S.debugNewSamples || 0) + 1;

      // Visual feedback
      document.querySelectorAll(".game-correct-btn").forEach(btn => {
        btn.classList.remove("correct", "incorrect", "selected-correct");
        if (btn.dataset.gesture === actualGesture) btn.classList.add("selected-correct");
      });

      // Recalculate the round with the correct gesture
      const oldPg = lastRoundDetectedGesture;
      const newResult = winner(actualGesture, lastRoundAiGesture);

      // Undo old score
      S.usage[oldPg]--;
      if (lastRoundResult === "win") { S.pScore--; }
      else if (lastRoundResult === "lose") { S.aScore--; }

      // Apply new score
      S.usage[actualGesture]++;
      const lastEntry = S.roundHistory[S.roundHistory.length - 1];
      lastEntry.player = actualGesture;
      lastEntry.result = newResult;
      lastEntry.corrected = true;

      if (newResult === "win") S.pScore++;
      else if (newResult === "lose") S.aScore++;

      // Update UI
      document.getElementById("pGesture").textContent = ICONS[actualGesture];
      document.getElementById("pName").textContent = INFO[actualGesture].name;
      const pEl = document.getElementById("pGesture"), aEl = document.getElementById("aGesture"), status = document.getElementById("gameStatus");
      pEl.className = "player-gesture"; aEl.className = "player-gesture";
      if (newResult === "win") { pEl.classList.add("win"); aEl.classList.add("lose"); status.innerHTML = '<span class="result-text win">YOU WIN!</span>'; }
      else if (newResult === "lose") { pEl.classList.add("lose"); aEl.classList.add("win"); status.innerHTML = '<span class="result-text lose">AI WINS!</span>'; }
      else { pEl.classList.add("draw"); aEl.classList.add("draw"); status.innerHTML = '<span class="result-text draw">DRAW!</span>'; }
      updateScores();

      lastRoundDetectedGesture = actualGesture;
      lastRoundResult = newResult;

      toast(`Corrected → ${INFO[actualGesture].name} (sample saved)`, "info");

      // Hide correction panel after brief moment
      setTimeout(() => {
        document.getElementById("gameCorrectionPanel").style.display = "none";
        // Recalculate pending match result after correction
        if (S.roundsToWin > 0) {
          const isMatchOver = S.pScore >= S.roundsToWin || S.aScore >= S.roundsToWin;
          if (isMatchOver) {
            S._pendingMatchResult = S.pScore >= S.roundsToWin ? "victory" : "defeat";
            document.getElementById("btnNextRound").textContent = "End Match";
          } else {
            S._pendingMatchResult = null;
            document.getElementById("btnNextRound").textContent = "Next Round";
          }
        }
      }, 800);

      lastRoundRecBuf = null; // prevent double-correction
    }

    function aiChoice() {
      const total = S.usage.rock + S.usage.paper + S.usage.scissors;
      if (total > 3 && Math.random() < 0.4) {
        const rp = S.usage.rock/total, pp = S.usage.paper/total, sp = S.usage.scissors/total;
        const mx = Math.max(rp, pp, sp);
        if (mx === rp) return "paper"; if (mx === pp) return "scissors"; return "rock";
      }
      return GESTURES[Math.floor(Math.random() * 3)];
    }

    function winner(p, a) {
      if (p === a) return "draw";
      return { rock:"scissors", paper:"rock", scissors:"paper" }[p] === a ? "win" : "lose";
    }

    // ============ RESULTS ============
    function showResults(outcome) {
      gameActive = false;
      // Save any correction samples collected during the game
      if (S.debugNewSamples > 0) {
        try { autoSaveProfile(); } catch (e) { console.warn("Save after game failed:", e); }
      }
      showScreen("results");
      const r = document.getElementById("finalResult");
      if (outcome === "victory") { r.textContent = "VICTORY!"; r.className = "final-result victory"; Sfx.playVictoryFanfare(); createConfetti(); }
      else { r.textContent = "DEFEAT"; r.className = "final-result defeat"; Sfx.playDefeatSound(); }
      document.getElementById("finalPlayer").textContent = S.pScore;
      document.getElementById("finalAi").textContent = S.aScore;
      document.getElementById("statRounds").textContent = S.roundHistory.length;
      document.getElementById("statAccuracy").textContent = S.totalDetect > 0 ? `${Math.round(S.successDetect/S.totalDetect*100)}%` : "0%";
      document.getElementById("statAvgTime").textContent = S.respTimes.length > 0 ? `${Math.round(S.respTimes.reduce((a,b)=>a+b,0)/S.respTimes.length)}ms` : "0ms";
      document.getElementById("statStreak").textContent = S.bestStreak;
      document.getElementById("usageRock").textContent = S.usage.rock;
      document.getElementById("usagePaper").textContent = S.usage.paper;
      document.getElementById("usageScissors").textContent = S.usage.scissors;
    }

    function createConfetti() {
      const colors = ["#4f46e5","#22c55e","#ff3d8a","#ffd700","#a855f7"];
      for (let i = 0; i < 50; i++) {
        const el = document.createElement("div");
        el.style.cssText = `position:fixed; width:10px; height:10px; background:${colors[Math.floor(Math.random()*colors.length)]}; left:${Math.random()*100}vw; top:-10px; border-radius:${Math.random()>0.5?"50%":"0"}; pointer-events:none; z-index:9999; animation:confetti-fall ${2+Math.random()*2}s linear forwards;`;
        document.body.appendChild(el); setTimeout(() => el.remove(), 4000);
      }
    }

    // ============ SENSOR VIZ ============
    let accCanvas, accCtx, gyroCanvas, gyroCtx, vizRunning = false;
    function startSensorViz() {
      accCanvas = document.getElementById("canvasAcc"); accCtx = accCanvas?.getContext("2d");
      gyroCanvas = document.getElementById("canvasGyro"); gyroCtx = gyroCanvas?.getContext("2d");
      resizeCanvases();
      if (!vizRunning) { vizRunning = true; requestAnimationFrame(renderLoop); }
    }

    function resizeCanvases() { [accCanvas, gyroCanvas, dbgAccCanvas, dbgGyroCanvas].forEach(c => { if (c) { c.width = c.offsetWidth * devicePixelRatio; c.height = c.offsetHeight * devicePixelRatio; } }); }

    let liveRecogCounter = 0;
    const INFER_BUF_MAX = 45; // ~1.5s at sensor rate
    let inferLastImuSeq = 0, inferLastSncSeq = 0;
    function renderLoop() {
      // Update rolling inference buffer ONLY when new sensor data arrives
      // (matches calibration recording rate — prevents duplicate entries that skew std features)
      if (S.imuSeq !== inferLastImuSeq) {
        S.inferBuf.imu.push({ acc: [...S.curAcc], gyro: [...S.curGyro] });
        if (S.inferBuf.imu.length > INFER_BUF_MAX) S.inferBuf.imu.shift();
        inferLastImuSeq = S.imuSeq;
      }
      if (S.sncSeq !== inferLastSncSeq) {
        S.inferBuf.snc.push([...S.curSnc]);
        if (S.inferBuf.snc.length > INFER_BUF_MAX) S.inferBuf.snc.shift();
        inferLastSncSeq = S.sncSeq;
      }
      renderIMU(accCtx, S.accHist, accCanvas);
      renderIMU(gyroCtx, S.gyroHist, gyroCanvas);
      updateLiveRecognition();
      updateDebug();
      // Debug mode rendering
      if (document.getElementById("screen-debug")?.classList.contains("active")) {
        renderIMU(dbgAccCtx, S.accHist, dbgAccCanvas);
        renderIMU(dbgGyroCtx, S.gyroHist, dbgGyroCanvas);
        drawSncWave("canvasSncDebug");
        updateDebugSensorValues();
        if (S.debugPhase === 'live') updateDebugLivePrediction();
      }
      requestAnimationFrame(renderLoop);
    }

    function renderIMU(ctx, hist, canvas) {
      if (!ctx || !canvas) return;
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fillRect(0, 0, w, h);
      if (hist.x.length < 2) return;
      const cols = { x:"#ff6b6b", y:"#4ecdc4", z:"#ffe66d" };
      const step = w / (hist.x.length - 1);
      ["x","y","z"].forEach(axis => {
        ctx.strokeStyle = cols[axis]; ctx.lineWidth = 2 * devicePixelRatio; ctx.beginPath();
        hist[axis].forEach((val, i) => { const x = i*step; const y = h - ((val+20)/40*h); i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
        ctx.stroke();
      });
    }

    function drawSncWave(canvasId = "canvasSnc") {
      const canvas = document.getElementById(canvasId); if (!canvas) return;
      const ctx = canvas.getContext("2d"), r = canvas.getBoundingClientRect();
      canvas.width = r.width * devicePixelRatio; canvas.height = r.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
      const chColors = ["#00d4ff","#22c55e","#ff6b6b"];
      S.sncBufs.forEach((buf, ci) => {
        if (buf.length < 2) return;
        const data = buf.slice(-100);
        ctx.strokeStyle = chColors[ci]; ctx.lineWidth = 2; ctx.beginPath();
        const step = w / (data.length - 1);
        data.forEach((val, i) => { const y = ((1-val)/2)*(h-10)+5; i===0 ? ctx.moveTo(i*step, y) : ctx.lineTo(i*step, y); });
        ctx.stroke();
      });
    }

    function updateLiveRecognition() {
      liveRecogCounter++;
      if (liveRecogCounter < 5) return;
      liveRecogCounter = 0;
      if (!document.getElementById("screen-cal")?.classList.contains("active")) return;
      if (!S.modelTrained) {
        setEl("liveIcon", "-"); setEl("liveName", "Train model first"); return;
      }
      const r = predictGesture(S.inferBuf);
      if (r.gesture && r.confidence > 0.4) {
        setEl("liveIcon", ICONS[r.gesture]||"?");
        const el = document.getElementById("liveName");
        el.textContent = `${INFO[r.gesture].name} (${(r.confidence*100).toFixed(0)}%)`;
        el.style.color = r.confidence > 0.6 ? "var(--success)" : "var(--primary)";
      } else { setEl("liveIcon", "?"); const el = document.getElementById("liveName"); el.textContent = "Unknown"; el.style.color = "var(--text-secondary)"; }
      if (r.probs) {
        setEl("liveRock", `${(r.probs[0]*100).toFixed(0)}%`);
        setEl("livePaper", `${(r.probs[1]*100).toFixed(0)}%`);
        setEl("liveScissors", `${(r.probs[2]*100).toFixed(0)}%`);
      }
    }

    // ============ DEBUG ============
    let debugOn = false;
    function toggleDebug() { debugOn = !debugOn; document.getElementById("debugPanel").classList.toggle("active", debugOn); }
    function updateDebug() {
      if (!debugOn) return;
      setEl("dbgAcc", `[${S.curAcc.map(v=>v.toFixed(2)).join(", ")}]`);
      setEl("dbgGyro", `[${S.curGyro.map(v=>v.toFixed(2)).join(", ")}]`);
      setEl("dbgSnc", `[${S.curSnc.map(v=>v.toFixed(2)).join(", ")}]`);

      if (!S.modelTrained) return;
      const r = predictGesture(S.inferBuf);
      if (r.probs) {
        setEl("dbgRock", `${(r.probs[0]*100).toFixed(1)}%`);
        setEl("dbgPaper", `${(r.probs[1]*100).toFixed(1)}%`);
        setEl("dbgScissors", `${(r.probs[2]*100).toFixed(1)}%`);
      }
      setEl("dbgDetected", r.gesture ? INFO[r.gesture].name : "Unknown");
      setEl("dbgConf", `${(r.confidence*100).toFixed(1)}%`);
    }

    // ============ PROFILES (named, persistent calibration data) ============
    // Profiles (gesture data) and model cache are stored SEPARATELY:
    //   Profiles:  PROFILES_KEY → [{id, name, hand, gestureData, ...}]   (always saved)
    //   Models:    MODEL_KEY_PREFIX + id → {type, scaler, mlp, rf, meta}  (best-effort cache)
    const PROFILES_KEY = "mudra-duel-v4-profiles";
    const MODEL_KEY_PREFIX = "mudra-duel-v4-model-";

    // Migrate v3 data on first load
    (function migrateFromV3() {
      if (localStorage.getItem(PROFILES_KEY)) return; // already have v4 data
      const v3Profiles = localStorage.getItem("mudra-duel-v3-profiles");
      if (!v3Profiles) return; // no v3 data to migrate
      try {
        const profiles = JSON.parse(v3Profiles);
        if (!profiles.length) return;
        // Move (not copy) to avoid exceeding localStorage quota:
        // remove v3 first to free space, then write v4
        localStorage.removeItem("mudra-duel-v3-profiles");
        localStorage.setItem(PROFILES_KEY, v3Profiles);
        // Move model caches too (collect keys first, then move)
        const v3ModelKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("mudra-duel-v3-model-")) v3ModelKeys.push(key);
        }
        v3ModelKeys.forEach(key => {
          const id = key.slice("mudra-duel-v3-model-".length);
          const data = localStorage.getItem(key);
          localStorage.removeItem(key);
          try { localStorage.setItem(MODEL_KEY_PREFIX + id, data); } catch {}
        });
        console.log(`[Migration] Moved ${profiles.length} profiles from v3 → v4`);
        // Trigger folder sync so the data is written to the project folder
        syncToFolder();
      } catch (e) { console.warn("[Migration] Failed to migrate v3 data:", e); }
    })();

    function getProfiles() { try { return JSON.parse(localStorage.getItem(PROFILES_KEY)||"[]"); } catch { return []; } }

    function storeProfiles(p) {
      // NEVER include modelData in the profiles blob — it's stored separately
      const clean = p.map(({ modelData, ...rest }) => rest);
      const json = JSON.stringify(clean);
      console.log(`storeProfiles: ${clean.length} profiles, ${(json.length/1024).toFixed(0)}KB`);
      try {
        localStorage.setItem(PROFILES_KEY, json);
        syncToFolder();
        return true;
      } catch (e) {
        console.warn("Profile save failed, clearing model cache to free space...", e.message);
        // Model cache is expendable — clear ALL of it to make room for profile data
        clearAllModelCache();
        try {
          localStorage.setItem(PROFILES_KEY, json);
          console.log("Profile save succeeded after clearing model cache");
          return true;
        } catch (e2) {
          console.error("Profile save STILL failed after cache cleanup:", e2.message);
          throw e2;
        }
      }
    }

    function clearAllModelCache() {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(MODEL_KEY_PREFIX)) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => { localStorage.removeItem(k); console.log(`Cleared model cache: ${k}`); });
      console.log(`Cleared ${keysToRemove.length} model cache entries`);
    }

    // Save/load model data in its own key (best-effort, won't break profile save if it fails)
    function storeModelData(profileId, modelData) {
      if (!modelData) return false;
      try {
        const json = JSON.stringify(modelData);
        console.log(`storeModelData: ${profileId}, ${(json.length/1024).toFixed(0)}KB`);
        localStorage.setItem(MODEL_KEY_PREFIX + profileId, json);
        syncToFolder();
        return true;
      } catch (e) {
        console.warn(`Model cache failed for ${profileId} (${e.message}) — will retrain on load`);
        // Try to clean up old model caches to make room
        try {
          const profiles = getProfiles();
          const activeIds = new Set(profiles.map(p => p.id));
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(MODEL_KEY_PREFIX)) {
              const mid = key.slice(MODEL_KEY_PREFIX.length);
              if (!activeIds.has(mid)) { localStorage.removeItem(key); console.log(`Cleaned orphan model: ${key}`); }
            }
          }
          // Retry after cleanup
          localStorage.setItem(MODEL_KEY_PREFIX + profileId, json);
          return true;
        } catch { return false; }
      }
    }

    function loadModelData(profileId) {
      try {
        const raw = localStorage.getItem(MODEL_KEY_PREFIX + profileId);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    }

    function removeModelData(profileId) {
      try { localStorage.removeItem(MODEL_KEY_PREFIX + profileId); } catch {}
    }

    // Save/overwrite profile by name (called automatically after training)
    function saveProfile(name, gestureData, modelData) {
      if (!name) { console.warn("saveProfile: no name"); return false; }
      const profiles = getProfiles();
      const ei = profiles.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
      let oldId = null;
      if (ei >= 0) { oldId = profiles[ei].id; profiles.splice(ei, 1); }
      const id = Date.now().toString();
      profiles.unshift({
        id, name,
        hand: S.hand || "right",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        gestureData: JSON.parse(JSON.stringify(gestureData)),
        samplesPerGesture: GESTURES.map(g => gestureData[g]?.samples?.length || 0)
      });
      // 1. Save profile data (gesture data) — this is the critical save
      storeProfiles(profiles);
      // 2. Cache model data separately (best-effort, won't block profile save)
      if (oldId) removeModelData(oldId);
      const modelSaved = storeModelData(id, modelData);
      console.log(`Profile "${name}" saved (id=${id}, model=${modelSaved ? 'cached' : 'not cached'})`);
      // Store the current profile's ID for later use
      S.currentProfileId = id;
      return modelSaved ? true : 'no_model';
    }

    // Auto-save the current session's profile
    function autoSaveProfile() {
      if (!S.profileName || !S.modelTrained) {
        console.warn("autoSaveProfile skipped:", { name: S.profileName, trained: S.modelTrained });
        return false;
      }
      const result = saveProfile(S.profileName, S.gestureData, Model.serialize());
      // Verify it was actually saved
      const saved = getProfiles();
      const found = saved.find(p => p.name.toLowerCase() === S.profileName.toLowerCase());
      if (found) {
        const note = result === 'no_model' ? ' (will retrain on load)' : '';
        toast(`Profile "${S.profileName}" saved${note}`, "success");
        console.log(`autoSaveProfile OK: "${S.profileName}" (${found.samplesPerGesture} samples)`);
      } else {
        toast(`⚠ Failed to save "${S.profileName}"`, "error");
        console.error("autoSaveProfile VERIFY FAILED — profile not in storage!");
      }
      updateProfilesUI();
      return !!found;
    }

    // Load profile → go straight to game
    async function loadProfile(id) {
      const p = getProfiles().find(p => p.id === id);
      if (!p) { toast("Profile not found", "error"); return; }
      S.gestureData = JSON.parse(JSON.stringify(p.gestureData));
      S.profileName = p.name;
      S.hand = p.hand || "right";
      S.currentProfileId = p.id;
      S.roundsToWin = parseInt(document.getElementById("optRounds").value);
      S.detectionMs = parseInt(document.getElementById("optDetection").value);

      // Try to load cached model data from separate storage
      const cachedModel = loadModelData(p.id);
      if (cachedModel && cachedModel.type) {
        Model.deserialize(cachedModel);
        S.modelTrained = true;
        S.trainAccuracy = cachedModel.meta?.train_accuracy || 1;
        toast(`Loaded "${p.name}" — ready to play!`, "success");
        if (!S.wsConnected) connect();
        startSensorViz();
        startGame();
      } else {
        // No cached model — retrain from gesture data
        toast(`Loaded "${p.name}", training model...`, "info");
        if (!S.wsConnected) connect();
        startSensorViz();
        showScreen("cal");
        S.curGestIdx = GESTURES.length - 1;
        try {
          const success = await trainModel();
          if (success) startGame();
        } catch (e) {
          console.error("Training failed:", e);
          toast("Training error: " + e.message, "error");
        }
      }
    }

    // Play with all profiles' training data merged into one model
    async function playAllCombined() {
      const profiles = getProfiles().filter(p =>
        p.gestureData && GESTURES.every(g => p.gestureData[g]?.samples?.length > 0)
      );
      if (!profiles.length) { toast("No trained profiles found", "error"); return; }

      // Merge gesture data from all profiles
      S.gestureData = { rock: { samples: [] }, paper: { samples: [] }, scissors: { samples: [] } };
      let totalSamples = 0;
      profiles.forEach(p => {
        GESTURES.forEach(g => {
          if (p.gestureData[g]?.samples) {
            S.gestureData[g].samples.push(...JSON.parse(JSON.stringify(p.gestureData[g].samples)));
            totalSamples += p.gestureData[g].samples.length;
          }
        });
      });

      S.profileName = `Combined (${profiles.length} profiles)`;
      S.hand = profiles[0].hand || "right";
      S.currentProfileId = null;
      S.roundsToWin = parseInt(document.getElementById("optRounds").value);
      S.detectionMs = parseInt(document.getElementById("optDetection").value);

      const perGesture = GESTURES.map(g => S.gestureData[g].samples.length);
      toast(`Merging ${totalSamples} samples from ${profiles.length} profiles (${perGesture.join('/')})...`, "info");

      if (!S.wsConnected) connect();
      startSensorViz();
      showScreen("cal");
      S.curGestIdx = GESTURES.length - 1;

      try {
        const success = await trainModel();
        if (success) startGame();
      } catch (e) {
        console.error("Combined training failed:", e);
        toast("Training error: " + e.message, "error");
      }
    }

    function deleteProfile(id) {
      const profiles = getProfiles(), p = profiles.find(p => p.id === id);
      if (!p || !confirm(`Delete "${p.name}"?`)) return;
      removeModelData(p.id);
      storeProfiles(profiles.filter(p => p.id !== id));
      toast(`Deleted "${p.name}"`, "info");
      updateProfilesUI();
    }

    // Edit profile: load saved calibration data and open calibration to add more samples
    function editProfile(id) {
      const p = getProfiles().find(p => p.id === id);
      if (!p) { toast("Profile not found", "error"); return; }

      // Load profile data into state
      S.gestureData = JSON.parse(JSON.stringify(p.gestureData));
      S.profileName = p.name;
      S.hand = p.hand || "right";
      S.currentProfileId = p.id;
      S.samplesReq = parseInt(document.getElementById("optSamples").value);
      S.roundsToWin = parseInt(document.getElementById("optRounds").value);
      S.detectionMs = parseInt(document.getElementById("optDetection").value);
      S.curGestIdx = 0;
      S.modelTrained = false;
      Model.clear();

      // Update hand toggle buttons to reflect the profile's hand
      document.querySelectorAll(".hand-btn").forEach(b => b.classList.remove("selected"));
      const handBtn = document.querySelector(`.hand-btn[data-hand="${S.hand}"]`);
      if (handBtn) handBtn.classList.add("selected");

      // Update profile name input
      document.getElementById("profileNameInput").value = S.profileName;

      if (!S.wsConnected) connect();
      document.getElementById("trainPanel").classList.remove("active");
      showScreen("cal");
      updateCalUI();
      startSensorViz();

      const total = GESTURES.reduce((n, g) => n + (S.gestureData[g]?.samples?.length || 0), 0);
      toast(`Editing "${p.name}" — ${total} samples loaded. Add more or train!`, "info");
    }

    // ============ DEBUG MODE (Active Learning) ============
    let dbgAccCanvas, dbgAccCtx, dbgGyroCanvas, dbgGyroCtx;
    let debugRecogCounter = 0;

    async function enterDebugMode(profileId) {
      const p = getProfiles().find(p => p.id === profileId);
      if (!p) { toast("Profile not found", "error"); return; }

      // Load profile data into state
      S.gestureData = JSON.parse(JSON.stringify(p.gestureData));
      S.profileName = p.name;
      S.hand = p.hand || "right";
      S.currentProfileId = p.id;
      S.detectionMs = parseInt(document.getElementById("optDetection").value);

      // Reset debug session stats
      S.debugCaptures = 0;
      S.debugCorrect = 0;
      S.debugNewSamples = 0;
      S.debugIsCapturing = false;
      S.debugCapturedResult = null;
      S.debugPhase = 'live';

      // Load model
      const cachedModel = loadModelData(p.id);
      if (cachedModel && cachedModel.type) {
        Model.deserialize(cachedModel);
        S.modelTrained = true;
        S.trainAccuracy = cachedModel.meta?.train_accuracy || 1;
      } else {
        // Need to train from gesture data first
        toast(`Training model for "${p.name}"...`, "info");
        if (!S.wsConnected) connect();
        showScreen("debug");
        startDebugSensorViz();
        const success = await trainModel('debugTrain');
        if (!success) { toast("Training failed", "error"); showScreen("welcome"); return; }
        updateDebugUI();
        return;
      }

      if (!S.wsConnected) connect();
      showScreen("debug");
      startDebugSensorViz();
      updateDebugUI();
      toast(`Debug mode: ${p.name}`, "info");
    }

    function startDebugSensorViz() {
      dbgAccCanvas = document.getElementById("canvasAccDebug");
      dbgAccCtx = dbgAccCanvas?.getContext("2d");
      dbgGyroCanvas = document.getElementById("canvasGyroDebug");
      dbgGyroCtx = dbgGyroCanvas?.getContext("2d");
      [dbgAccCanvas, dbgGyroCanvas].forEach(c => {
        if (c) { c.width = c.offsetWidth * devicePixelRatio; c.height = c.offsetHeight * devicePixelRatio; }
      });
      if (!vizRunning) { vizRunning = true; requestAnimationFrame(renderLoop); }
    }

    function updateDebugSensorValues() {
      setEl("dbgModeAccX", S.curAcc[0].toFixed(2));
      setEl("dbgModeAccY", S.curAcc[1].toFixed(2));
      setEl("dbgModeAccZ", S.curAcc[2].toFixed(2));
      setEl("dbgModeGyroX", S.curGyro[0].toFixed(2));
      setEl("dbgModeGyroY", S.curGyro[1].toFixed(2));
      setEl("dbgModeGyroZ", S.curGyro[2].toFixed(2));
    }

    function updateDebugLivePrediction() {
      debugRecogCounter++;
      if (debugRecogCounter < 5) return; // throttle ~12fps
      debugRecogCounter = 0;

      if (!S.modelTrained) {
        setEl("debugLiveIcon", "?");
        setEl("debugLiveName", "No model loaded");
        setEl("debugLiveConf", "-");
        return;
      }

      const r = predictGesture(S.inferBuf);
      const colors = { rock: "var(--error)", paper: "var(--primary)", scissors: "var(--purple)" };

      if (r.gesture && r.confidence > 0.4) {
        setEl("debugLiveIcon", ICONS[r.gesture]);
        setEl("debugLiveName", INFO[r.gesture].name);
        const confEl = document.getElementById("debugLiveConf");
        if (confEl) {
          confEl.textContent = `${(r.confidence * 100).toFixed(0)}%`;
          confEl.style.color = r.confidence > 0.7 ? "var(--success)" : r.confidence > 0.5 ? "var(--primary)" : "var(--warning)";
        }
      } else {
        setEl("debugLiveIcon", "?");
        setEl("debugLiveName", "Unknown");
        const confEl = document.getElementById("debugLiveConf");
        if (confEl) { confEl.textContent = `${(r.confidence * 100).toFixed(0)}%`; confEl.style.color = "var(--text-secondary)"; }
      }

      // Update probability bars
      const barsEl = document.getElementById("debugProbBars");
      if (barsEl) {
        barsEl.innerHTML = GESTURES.map((g, i) => {
          const pct = ((r.probs[i] || 0) * 100).toFixed(0);
          const isTop = r.gesture === g;
          return `<div class="debug-prob-row">
            <div class="debug-prob-label"><span>${ICONS[g]}</span> <span>${INFO[g].name}</span></div>
            <div class="debug-prob-bar-bg">
              <div class="debug-prob-bar-fill" style="width:${pct}%; background:${colors[g]}; ${isTop ? 'opacity:1' : 'opacity:0.5'}"></div>
            </div>
            <div class="debug-prob-pct">${pct}%</div>
          </div>`;
        }).join("");
      }
    }

    async function debugCapture() {
      if (S.debugIsCapturing || S.debugPhase === 'review') return;

      const btn = document.getElementById("btnDebugCapture");
      S.debugPhase = 'capturing';
      S.debugIsCapturing = true;

      btn.disabled = true;
      btn.textContent = "Hold gesture...";
      btn.classList.add("debug-capture-recording");
      Sfx.playShoot();

      // Small lead-in for user to stabilize
      await sleep(300);

      // Record 1.5s of sensor data (same mechanism as calibration)
      S.isRecording = true;
      S.recBuf = { imu: [], snc: [] };
      await sleep(1500);
      S.isRecording = false;

      btn.textContent = "Capture Gesture";
      btn.classList.remove("debug-capture-recording");
      btn.disabled = false;
      Sfx.playRecordStop();

      // Need enough data
      if (S.recBuf.imu.length < 10 && S.recBuf.snc.length < 10) {
        toast("Not enough sensor data. Check connection.", "error");
        S.debugIsCapturing = false;
        S.debugPhase = 'live';
        return;
      }

      // Build merged buffer: recBuf stores separate {type:"acc"} and {type:"gyro"} entries
      // predictGesture expects {imu: [{acc, gyro}], snc: [[c1,c2,c3]]}
      const accEntries = S.recBuf.imu.filter(d => d.type === "acc");
      const gyroEntries = S.recBuf.imu.filter(d => d.type === "gyro");
      const mergedBuf = {
        imu: accEntries.map((a, i) => ({
          acc: [...a.values],
          gyro: gyroEntries[i] ? [...gyroEntries[i].values] : [0, 0, 0]
        })),
        snc: S.recBuf.snc.map(d => [...d.values])
      };

      // Run prediction on captured buffer
      const result = predictGesture(mergedBuf);

      // Store for review
      S.debugCapturedResult = {
        gesture: result.gesture,
        confidence: result.confidence,
        probs: result.probs,
        recBuf: JSON.parse(JSON.stringify(S.recBuf))
      };

      S.debugIsCapturing = false;
      S.debugPhase = 'review';
      showDebugReview(result);
    }

    function showDebugReview(result) {
      document.getElementById("debugCaptureRow").style.display = "none";
      document.getElementById("debugReviewPanel").style.display = "block";

      const icon = result.gesture ? ICONS[result.gesture] : "?";
      const name = result.gesture ? INFO[result.gesture].name : "Unknown";
      setEl("debugReviewIcon", icon);
      setEl("debugReviewName", name);
      setEl("debugReviewConf", `${(result.confidence * 100).toFixed(0)}%`);

      // Pre-highlight the predicted gesture button
      document.querySelectorAll(".debug-gesture-btn").forEach(btn => {
        btn.classList.remove("correct", "incorrect", "selected-correct");
        if (btn.dataset.gesture === result.gesture) {
          btn.classList.add("correct");
        }
      });
    }

    function debugConfirmGesture(actualGesture) {
      if (S.debugPhase !== 'review' || !S.debugCapturedResult) return;

      const predicted = S.debugCapturedResult.gesture;
      const isCorrect = predicted === actualGesture;

      S.debugCaptures++;
      if (isCorrect) { S.debugCorrect++; Sfx.playWin(); }
      else { Sfx.playLose(); }

      // Visual feedback
      document.querySelectorAll(".debug-gesture-btn").forEach(btn => {
        btn.classList.remove("correct", "incorrect", "selected-correct");
        if (btn.dataset.gesture === actualGesture) btn.classList.add("selected-correct");
        if (btn.dataset.gesture === predicted && !isCorrect) btn.classList.add("incorrect");
      });

      // Active learning: save sample to gestureData under the user's label
      const recBuf = S.debugCapturedResult.recBuf;
      const stab = calcStability(recBuf);

      S.gestureData[actualGesture].samples.push({
        timestamp: new Date().toISOString(),
        stability: stab,
        source: 'debug',
        imu_data: {
          accelerometer: recBuf.imu.filter(d => d.type === "acc").map(d => d.values),
          gyroscope: recBuf.imu.filter(d => d.type === "gyro").map(d => d.values)
        },
        snc_data: { channels: recBuf.snc.map(d => d.values) }
      });

      S.debugNewSamples++;

      if (isCorrect) {
        toast(`Correct! Sample added to ${INFO[actualGesture].name}`, "success");
      } else {
        toast(`Corrected: was ${predicted ? INFO[predicted].name : 'Unknown'} → labeled ${INFO[actualGesture].name}`, "info");
      }

      updateDebugStats();
      updateDebugSampleCounts();

      // Show retrain button if enough new samples
      if (S.debugNewSamples >= 3) {
        document.getElementById("debugRetrainRow").style.display = "block";
        setEl("debugRetrainCount", S.debugNewSamples);
      }

      // Return to live mode after brief pause
      setTimeout(() => {
        S.debugPhase = 'live';
        S.debugCapturedResult = null;
        document.getElementById("debugReviewPanel").style.display = "none";
        document.getElementById("debugCaptureRow").style.display = "block";
      }, 1200);
    }

    async function debugRetrain() {
      const btn = document.getElementById("btnDebugRetrain");
      btn.disabled = true;
      btn.textContent = "Retraining...";

      try {
        const success = await trainModel('debugTrain');
        if (success) {
          S.debugNewSamples = 0;
          document.getElementById("debugRetrainRow").style.display = "none";
          // Auto-save the profile with new samples + model
          try { autoSaveProfile(); } catch (e) {
            console.error("Debug auto-save failed:", e);
            toast("Couldn't save profile (storage may be full)", "warning");
          }
          updateDebugSampleCounts();
          toast("Model retrained! Predictions should improve.", "success");
        }
      } catch (e) {
        toast("Retrain error: " + e.message, "error");
      }

      btn.disabled = false;
      btn.textContent = `Retrain with ${S.debugNewSamples} new samples`;
    }

    function updateDebugStats() {
      setEl("debugStatCaptures", S.debugCaptures);
      setEl("debugStatCorrect", S.debugCorrect);
      setEl("debugStatAccuracy", S.debugCaptures > 0 ? `${Math.round(S.debugCorrect / S.debugCaptures * 100)}%` : "-");
      setEl("debugStatNew", S.debugNewSamples);
    }

    function updateDebugSampleCounts() {
      GESTURES.forEach(g => {
        const id = "debugSamples" + g.charAt(0).toUpperCase() + g.slice(1);
        setEl(id, S.gestureData[g]?.samples?.length || 0);
      });
    }

    function updateDebugUI() {
      const handIcon = S.hand === 'left' ? '🫲' : '🫱';
      setEl("debugProfileBadge", `${handIcon} ${S.profileName} · ${S.hand} hand`);
      updateDebugStats();
      updateDebugSampleCounts();
      document.getElementById("debugReviewPanel").style.display = "none";
      document.getElementById("debugCaptureRow").style.display = "block";
      document.getElementById("debugRetrainRow").style.display = "none";
      document.getElementById("debugTrainPanel").classList.remove("active");
    }

    // Render saved profiles on welcome screen
    function updateProfilesUI() {
      const profiles = getProfiles();
      const section = document.getElementById("savedProfilesSection");
      const list = document.getElementById("savedProfilesList");
      if (!profiles.length) { section.style.display = "none"; return; }
      section.style.display = "block";
      list.innerHTML = profiles.map(p => {
        const cached = loadModelData(p.id);
        const modelType = cached?.type === 'rf' ? 'Random Forest' : cached?.type === 'mlp' ? 'MLP' : 'will train';
        const samples = (p.samplesPerGesture || []).join('/') || '?';
        const handIcon = p.hand === 'left' ? '🫲' : '🫱';
        return `<div class="profile-item" onclick="loadProfile('${p.id}')">
          <div>
            <div class="profile-name">${handIcon} ${p.name}</div>
            <div class="profile-meta">${p.hand || 'right'} hand · ${modelType} · ${samples} samples</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span class="profile-play" style="cursor:pointer;" title="Play now">▶</span>
            <button class="btn-edit-sm" onclick="event.stopPropagation(); editProfile('${p.id}')" title="Add samples">✏️</button>
            ${cached?.type ? `<button class="btn-edit-sm" onclick="event.stopPropagation(); enterDebugMode('${p.id}')" title="Debug mode" style="background:rgba(168,85,247,0.15); border-color:var(--purple); color:var(--purple); font-size:0.7rem;">&#x1F52C;</button>` : ''}
            <button class="btn-danger-sm" onclick="event.stopPropagation(); deleteProfile('${p.id}')" title="Delete">&times;</button>
          </div>
        </div>`;
      }).join("");
      // Show "Play All Combined" if 1+ profiles have gesture data
      const playAllBtn = document.getElementById("btnPlayAll");
      const hasData = profiles.some(p => p.gestureData && GESTURES.every(g => p.gestureData[g]?.samples?.length > 0));
      if (playAllBtn) playAllBtn.style.display = hasData ? "inline-block" : "none";
    }

    // Legacy compat: also render in old presets modal if still present
    function updatePresetsUI() { updateProfilesUI(); }

    // ============ AUDIO ============
    const Sfx = {
      ctx: null, ok: true,
      init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ok = false; } },
      resume() { if (this.ctx?.state === "suspended") this.ctx.resume(); },
      tone(f, d, type="sine", vol=0.3) {
        if (!this.ok || !this.ctx) return; this.resume();
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.frequency.value = f; o.type = type;
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + d);
        o.start(); o.stop(this.ctx.currentTime + d);
      },
      playCountdown(n) { this.tone({3:440,2:523,1:659}[n]||880, 0.15, "square", 0.2); },
      playShoot() { this.tone(880, 0.1, "square", 0.3); setTimeout(() => this.tone(1100, 0.15, "square", 0.3), 100); },
      playWin() { [523,659,784,1047].forEach((f,i) => setTimeout(() => this.tone(f, 0.2, "sine", 0.25), i*100)); },
      playLose() { [392,330,294,262].forEach((f,i) => setTimeout(() => this.tone(f, 0.25, "sawtooth", 0.15), i*150)); },
      playDraw() { this.tone(440, 0.3, "triangle", 0.2); },
      playRecordStop() { this.tone(880, 0.1, "sine", 0.2); },
      playVictoryFanfare() { [{f:523,d:.15},{f:659,d:.15},{f:784,d:.15},{f:1047,d:.3},{f:784,d:.15},{f:1047,d:.4}].reduce((t,n) => { setTimeout(() => this.tone(n.f,n.d,"sine",0.25), t); return t+n.d*1000; }, 0); },
      playDefeatSound() { [{f:392,d:.2},{f:349,d:.2},{f:330,d:.2},{f:262,d:.5}].reduce((t,n) => { setTimeout(() => this.tone(n.f,n.d,"sawtooth",0.15), t); return t+n.d*1000; }, 0); }
    };

    // ============ UTILS ============
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function clamp01(v) { return Number.isFinite(v) ? clamp(v, 0, 1) : 0; }
    function toast(msg, type="info") {
      const t = document.getElementById("toast"); t.textContent = msg;
      t.className = `toast ${type} show`; setTimeout(() => t.classList.remove("show"), 3000);
    }

    // ============ EVENT WIRING ============
    document.addEventListener("DOMContentLoaded", () => {
      Sfx.init(); updateProfilesUI(); connect(); checkStorage();
      syncToFolder();          // write existing profiles to project folder
      checkFolderProfiles();   // offer import if new user with no profiles
    });

    // ============ EXPORT / IMPORT ============
    function exportData() {
      const profiles = getProfiles();
      if (!profiles.length) { toast("No profiles to export", "error"); return; }
      const bundle = { version: "v4", exportedAt: new Date().toISOString(), profiles: [], models: {} };
      profiles.forEach(p => {
        bundle.profiles.push(p);
        const model = loadModelData(p.id);
        if (model) bundle.models[p.id] = model;
      });
      const json = JSON.stringify(bundle);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mudra-duel-profiles-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported ${profiles.length} profiles (${(json.length/1024).toFixed(0)}KB)`, "success");
    }

    function importData(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const bundle = JSON.parse(reader.result);
          if (!bundle.profiles?.length) { toast("No profiles found in file", "error"); return; }
          const existing = getProfiles();
          const existingNames = new Set(existing.map(p => p.name.toLowerCase()));
          let added = 0, skipped = 0;
          bundle.profiles.forEach(p => {
            if (existingNames.has(p.name.toLowerCase())) { skipped++; return; }
            existing.push(p);
            existingNames.add(p.name.toLowerCase());
            if (bundle.models?.[p.id]) {
              storeModelData(p.id, bundle.models[p.id]);
            }
            added++;
          });
          storeProfiles(existing);
          updateProfilesUI();
          checkStorage();
          toast(`Imported ${added} profiles${skipped ? ` (${skipped} duplicates skipped)` : ''}`, "success");
        } catch (e) {
          console.error("Import error:", e);
          toast("Invalid file: " + e.message, "error");
        }
      };
      reader.readAsText(file);
    }

    // ============ AUTO-DETECT FOLDER PROFILES ============
    async function checkFolderProfiles() {
      try {
        // Skip if user already has profiles (they're already synced)
        if (getProfiles().length > 0) return;

        const res = await fetch('/profiles-files');
        if (!res.ok) return;
        const { files } = await res.json();
        if (!files || !files.length) return;

        const banner = document.getElementById("folderImportBanner");
        const list = document.getElementById("folderFileList");
        const btnImport = document.getElementById("btnFolderImport");
        let selectedFile = null;

        list.innerHTML = '';
        files.forEach(f => {
          const li = document.createElement("li");
          li.textContent = `📄 ${f}`;
          li.addEventListener("click", () => {
            list.querySelectorAll("li").forEach(el => el.classList.remove("selected"));
            li.classList.add("selected");
            selectedFile = f;
            btnImport.disabled = false;
          });
          list.appendChild(li);
        });

        // Auto-select if only one file
        if (files.length === 1) {
          list.querySelector("li").classList.add("selected");
          selectedFile = files[0];
          btnImport.disabled = false;
        }

        btnImport.onclick = async () => {
          if (!selectedFile) return;
          btnImport.disabled = true;
          btnImport.textContent = "Importing...";
          try {
            const fRes = await fetch(`/file/${encodeURIComponent(selectedFile)}`);
            if (!fRes.ok) throw new Error("Could not fetch file");
            const bundle = await fRes.json();
            if (!bundle.profiles?.length) { toast("No profiles found in file", "error"); return; }
            const existing = getProfiles();
            const existingNames = new Set(existing.map(p => p.name.toLowerCase()));
            let added = 0, skipped = 0;
            bundle.profiles.forEach(p => {
              if (existingNames.has(p.name.toLowerCase())) { skipped++; return; }
              existing.push(p);
              existingNames.add(p.name.toLowerCase());
              if (bundle.models?.[p.id]) storeModelData(p.id, bundle.models[p.id]);
              added++;
            });
            storeProfiles(existing);
            updateProfilesUI();
            checkStorage();
            toast(`Imported ${added} profiles from ${selectedFile}${skipped ? ` (${skipped} duplicates skipped)` : ''}`, "success");
          } catch (e) {
            console.error("Folder import error:", e);
            toast("Import failed: " + e.message, "error");
          }
          banner.style.display = "none";
        };

        document.getElementById("btnFolderDismiss").onclick = () => {
          banner.style.display = "none";
        };

        banner.style.display = "block";
        console.log(`[Folder] Found ${files.length} profile file(s): ${files.join(', ')}`);
      } catch (e) {
        // Server not available or not running via HTTP — silently skip
        console.log("[Folder] Auto-detect skipped (not served via HTTP or no files)");
      }
    }

    // ============ AUTO-SYNC PROFILES TO FOLDER ============
    let _syncTimer = null;
    function syncToFolder() {
      // Debounce: wait 2s after last save to avoid rapid writes
      clearTimeout(_syncTimer);
      _syncTimer = setTimeout(_doSyncToFolder, 2000);
    }
    async function _doSyncToFolder() {
      try {
        const profiles = getProfiles();
        if (!profiles.length) return;
        const bundle = {
          version: "v4",
          exportedAt: new Date().toISOString(),
          autoSaved: true,
          profiles: profiles,
          models: {}
        };
        profiles.forEach(p => {
          const m = loadModelData(p.id);
          if (m) bundle.models[p.id] = m;
        });
        const res = await fetch('/save-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bundle)
        });
        if (res.ok) {
          console.log(`[Sync] Saved ${profiles.length} profiles to project folder`);
        }
      } catch (e) {
        // Not running via HTTP server — silently skip
      }
    }

    function checkStorage() {
      const dot = document.getElementById("storageDot");
      const text = document.getElementById("storageText");
      try {
        // Test that localStorage actually works
        const testKey = "__storage_test__";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
        // Measure usage
        let totalBytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          totalBytes += (key?.length || 0) + (localStorage.getItem(key)?.length || 0);
        }
        const profiles = getProfiles();
        dot.classList.add("connected");
        text.textContent = `Storage: ${profiles.length} profiles (${(totalBytes/1024).toFixed(0)}KB)`;
        console.log(`[Storage] OK — ${(totalBytes/1024).toFixed(0)}KB used, ${localStorage.length} keys, ${profiles.length} profiles`);
        profiles.forEach(p => console.log(`  Profile: "${p.name}" (${p.id}), samples: ${p.samplesPerGesture}, model cached: ${!!loadModelData(p.id)}`));
      } catch (e) {
        dot.classList.remove("connected");
        text.textContent = "Storage: UNAVAILABLE";
        console.error("[Storage] localStorage not available:", e);
        toast("⚠ Storage not available — profiles won't persist. Try opening via http://127.0.0.1:8767/", "error");
      }
    }

    document.getElementById("btnStartCal").addEventListener("click", startCalibration);
    document.getElementById("profileNameInput").addEventListener("keydown", e => { if (e.key === "Enter") startCalibration(); });
    document.getElementById("btnPlayAll").addEventListener("click", playAllCombined);
    document.getElementById("btnExportData").addEventListener("click", exportData);
    document.getElementById("btnImportData").addEventListener("click", () => document.getElementById("importFileInput").click());
    document.getElementById("importFileInput").addEventListener("change", (e) => {
      if (e.target.files[0]) { importData(e.target.files[0]); e.target.value = ""; }
    });

    // Hand toggle
    document.querySelectorAll(".hand-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".hand-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        S.hand = btn.dataset.hand;
      });
    });
    document.getElementById("btnQuickPlay").addEventListener("click", quickPlay);
    document.getElementById("btnRecord").addEventListener("click", doRecord);
    document.getElementById("btnAddMore").addEventListener("click", () => toast("Record additional samples for better accuracy", "info"));
    document.getElementById("btnResetGesture").addEventListener("click", resetCurrentGesture);
    document.getElementById("btnNextGesture").addEventListener("click", nextGesture);
    document.getElementById("btnSkipCal").addEventListener("click", skipCalibration);
    // Profile auto-save replaces old manual preset save

    // Recalibrate: keep existing samples, go back to cal screen to add more
    const doRecal = () => {
      S.curGestIdx = 0;
      S.modelTrained = false;
      Model.clear();
      document.getElementById("trainPanel").classList.remove("active");
      showScreen("cal");
      updateCalUI();
      startSensorViz();
      const total = GESTURES.reduce((n, g) => n + (S.gestureData[g]?.samples?.length || 0), 0);
      toast(`Add more samples (${total} existing kept)`, "info");
    };
    document.getElementById("btnRecalibrate").addEventListener("click", doRecal);
    document.getElementById("btnRecalResults").addEventListener("click", doRecal);

    document.getElementById("btnStartGame").addEventListener("click", startGame);
    document.getElementById("btnStartAnyway").addEventListener("click", startGame);
    document.getElementById("btnTrainNow").addEventListener("click", async () => {
      try {
        const success = await trainModel();
        if (success) { await sleep(500); startGame(); }
      } catch (e) {
        console.error("Training failed:", e);
        toast("Training error: " + e.message, "error");
      }
    });
    document.getElementById("btnNextRound").addEventListener("click", () => {
      document.getElementById("gameCorrectionPanel").style.display = "none";
      document.getElementById("btnWrongGesture").style.display = "none";
      if (S._pendingMatchResult) {
        showResults(S._pendingMatchResult);
        S._pendingMatchResult = null;
      } else {
        startRound();
      }
    });
    document.getElementById("btnWrongGesture").addEventListener("click", showGameCorrection);
    document.querySelectorAll(".game-correct-btn").forEach(btn => {
      btn.addEventListener("click", () => correctGameGesture(btn.dataset.gesture));
    });
    document.getElementById("btnQuitGame").addEventListener("click", () => {
      // Save any corrections before quitting
      if (S.debugNewSamples > 0) {
        try { autoSaveProfile(); } catch (e) { console.warn("Save on quit failed:", e); }
      }
      stopGame(); showScreen("welcome");
    });
    document.getElementById("btnPlayAgain").addEventListener("click", startGame);
    document.getElementById("btnMainMenu").addEventListener("click", () => { stopGame(); showScreen("welcome"); });

    document.getElementById("fabHelp").addEventListener("click", () => openModal("helpModal"));
    document.getElementById("btnCloseHelp").addEventListener("click", () => closeModal("helpModal"));
    // Old preset modals kept for compat but no longer primary UX
    document.getElementById("btnClosePresets")?.addEventListener("click", () => closeModal("presetsModal"));
    document.getElementById("btnCloseSavePreset")?.addEventListener("click", () => closeModal("savePresetModal"));
    document.getElementById("btnDoSavePreset")?.addEventListener("click", () => { autoSaveProfile(); closeModal("savePresetModal"); });
    document.getElementById("fabDebug").addEventListener("click", toggleDebug);
    document.getElementById("btnCloseDebug").addEventListener("click", toggleDebug);
    document.getElementById("presetNameInput")?.addEventListener("keydown", e => { if (e.key === "Enter") { autoSaveProfile(); closeModal("savePresetModal"); } });

    // Debug Mode event wiring
    document.getElementById("btnDebugCapture").addEventListener("click", debugCapture);
    document.getElementById("btnDebugRetrain").addEventListener("click", debugRetrain);
    document.getElementById("btnDebugBack").addEventListener("click", () => {
      // Save any new samples before leaving
      if (S.debugNewSamples > 0) {
        try { autoSaveProfile(); } catch (e) { console.warn("Save on exit failed:", e); }
      }
      showScreen("welcome");
    });
    document.getElementById("btnDebugPlay").addEventListener("click", () => startGame());
    document.querySelectorAll(".debug-gesture-btn").forEach(btn => {
      btn.addEventListener("click", () => debugConfirmGesture(btn.dataset.gesture));
    });

    document.addEventListener("keydown", e => {
      const debugActive = document.getElementById("screen-debug")?.classList.contains("active");
      if (e.code === "Space" && document.getElementById("screen-cal")?.classList.contains("active")) { e.preventDefault(); doRecord(); }
      if (e.code === "Space" && debugActive && S.debugPhase === 'live') { e.preventDefault(); debugCapture(); }
      if (e.code === "Enter") { const btn = document.getElementById("btnNextRound"); if (btn?.style.display !== "none") startRound(); }
      if (e.key === "?") openModal("helpModal");
      if (e.code === "Escape") { closeModal("helpModal"); closeModal("presetsModal"); closeModal("savePresetModal"); }
      if (e.key === "d" && e.ctrlKey) { e.preventDefault(); toggleDebug(); }
      // Debug mode: quick gesture selection during review (1/2/3 or r/p/s)
      if (debugActive && S.debugPhase === 'review') {
        if (e.key === '1' || e.key.toLowerCase() === 'r') { e.preventDefault(); debugConfirmGesture('rock'); }
        if (e.key === '2' || e.key.toLowerCase() === 'p') { e.preventDefault(); debugConfirmGesture('paper'); }
        if (e.key === '3' || e.key.toLowerCase() === 's') { e.preventDefault(); debugConfirmGesture('scissors'); }
      }
      if (S.quickMode && S.isPlaying) {
        if (e.key.toLowerCase() === "r") { quickPlayGesture = "rock"; toast("Rock!", "info"); }
        if (e.key.toLowerCase() === "p") { quickPlayGesture = "paper"; toast("Paper!", "info"); }
        if (e.key.toLowerCase() === "s") { quickPlayGesture = "scissors"; toast("Scissors!", "info"); }
      }
    });

    document.addEventListener("click", () => Sfx.resume(), { once: true });
    document.addEventListener("touchstart", () => Sfx.resume(), { once: true });
    window.addEventListener("resize", resizeCanvases);

    const cfStyle = document.createElement("style");
    cfStyle.textContent = `@keyframes confetti-fall { 0% { transform: translateY(0) rotate(0deg); opacity:1; } 100% { transform: translateY(100vh) rotate(720deg); opacity:0; } }`;
    document.head.appendChild(cfStyle);
  </script>
</body>
</html>

```