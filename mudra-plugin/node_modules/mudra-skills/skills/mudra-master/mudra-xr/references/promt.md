# Mudra XR Skill — Build Rules

This document is the canonical reference for the `mudra-xr` Claude Code skill.
Read it in full before generating any app. Every rule below is non-negotiable
unless explicitly marked as configurable.

---

## Section 1 — Mudra Protocol

### WebSocket endpoint

```
ws://127.0.0.1:8766
```

Always construct the connection through `MudraClient` (Section 4).
Never use raw `new WebSocket(...)`.

### Nine canonical signals

| Signal | Category | Description |
|--------|----------|-------------|
| `gesture` | Discrete | Hand gesture events (tap, double_tap, twist, double_twist) |
| `button` | Discrete | Button hold / release |
| `pressure` | Analog | Finger pressure 0–100, normalized 0–1 |
| `navigation` | Motion (Pointer) | Continuous delta_x / delta_y cursor movement |
| `nav_direction` | Motion (Direction) | Discrete directional swipes: None, Right, Left, Up, Down, Roll Left, Roll Right |
| `imu_acc` | Motion (IMU) | Accelerometer values [x, y, z] m/s², frequency 1125 Hz |
| `imu_gyro` | Motion (IMU) | Gyroscope values [x, y, z] deg/s, frequency 1125 Hz |
| `snc` | Biometric | 3 de-interleaved channel arrays [[ch1], [ch2], [ch3]] |
| `battery` | Status | Battery level 0–100, charging boolean |

### Subscription handshake

Send one command per signal — never use plural `signals`, arrays, or batch commands:

```js
// CORRECT
ws.send(JSON.stringify({ command: 'subscribe', signal: 'gesture' }));
ws.send(JSON.stringify({ command: 'subscribe', signal: 'pressure' }));

// WRONG — never do this
ws.send(JSON.stringify({ command: 'subscribe', signals: ['gesture', 'pressure'] }));
ws.send(JSON.stringify({ command: 'subscribe', signal: ['gesture', 'pressure'] }));
```

### Full command surface

`subscribe`, `unsubscribe`, `get_subscriptions`, `enable`, `disable`,
`get_status`, `get_docs`, `trigger_gesture`

### Inbound message payload shapes

```js
// gesture
{ type: 'gesture', data: { type: 'tap'|'double_tap'|'twist'|'double_twist', confidence: 0–1, timestamp }, timestamp }

// button
{ type: 'button', data: { state: 'pressed'|'released', timestamp }, timestamp }

// pressure
{ type: 'pressure', data: { value: 0–100, normalized: 0–1, timestamp }, timestamp }

// navigation
{ type: 'navigation', data: { delta_x: number, delta_y: number, timestamp }, timestamp }

// nav_direction
{ type: 'nav_direction', data: { direction: 'Right'|'Left'|'Up'|'Down'|'Roll Left'|'Roll Right'|'None', timestamp }, timestamp }

// imu_acc
{ type: 'imu_acc', data: { values: [x, y, z], frequency: 1125, timestamp }, timestamp }

// imu_gyro
{ type: 'imu_gyro', data: { values: [x, y, z], frequency: 1125, timestamp }, timestamp }

// snc  — extend rolling buffers (500 samples/channel) with all samples per callback
{ type: 'snc', data: { values: [[ch1_samples], [ch2_samples], [ch3_samples]], timestamp }, timestamp }

// battery
{ type: 'battery', data: { level: 0–100, charging: boolean, timestamp }, timestamp }

// connection_status
{ type: 'connection_status', data: { status: 'connected'|'disconnected', message: string }, timestamp }
```

---

## Section 2 — Canonical Dependency Pins

Use the exact versions below. Never use `@latest` or version ranges.
Import map `<script type="importmap">` must contain **only** the dependencies
the app actually uses — no unused entries.

```json
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.182.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.182.0/examples/jsm/",
    "troika-three-text": "https://cdn.jsdelivr.net/gh/protectwise/troika@028b81cf308f0f22e5aa8e78196be56ec1997af5/packages/troika-three-text/src/index.js",
    "troika-three-utils": "https://cdn.jsdelivr.net/gh/protectwise/troika@v0.52.4/packages/troika-three-utils/src/index.js",
    "troika-worker-utils": "https://cdn.jsdelivr.net/gh/protectwise/troika@v0.52.4/packages/troika-worker-utils/src/index.js",
    "bidi-js": "https://esm.sh/bidi-js@%5E1.0.2?target=es2022",
    "webgl-sdf-generator": "https://esm.sh/webgl-sdf-generator@1.1.1/es2022/webgl-sdf-generator.mjs",
    "lit": "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js",
    "lit/": "https://esm.run/lit@3/",
    "xrblocks": "https://cdn.jsdelivr.net/npm/xrblocks@0.11.0/build/xrblocks.js",
    "xrblocks/addons/": "https://cdn.jsdelivr.net/npm/xrblocks@0.11.0/build/addons/"
  }
}
```

XR Blocks stylesheet (always `<link>` in `<head>`):

```html
<link type="text/css" rel="stylesheet" href="https://xrblocks.github.io/css/xr.css" />
```

Lit bundle warning suppression (place before import map):

```html
<script>window.litDisableBundleWarning = true;</script>
```

---

## Section 3 — XR Blocks Lifecycle Composition

### Module-scope MudraClient

Instantiate `MudraClient` exactly once at module scope — not inside `init()`.
This ensures the WebSocket open-attempt starts immediately on page load so the
1500 ms timeout (Section 4) begins counting before the XR scene initializes.

```js
// Module scope — outside any class
const mudra = new MudraClient('ws://127.0.0.1:8766');

class MainScript extends xb.Script {
  init() {
    // Wire mudra handlers here after scene objects are created
    mudra.on('gesture', (data) => { ... });
    mudra.on('pressure', (data) => { ... });
  }
  update() { /* called every frame by xb */ }
}
```

### xb.Script class structure

Every generated app's top-level logic lives inside a class extending `xb.Script`.
The class name may be anything (`MainScript`, `CubeApp`, etc.) but must extend `xb.Script`.

```js
class MainScript extends xb.Script {
  /** Called once after XR Blocks and the WebGL context are ready. */
  init() {
    // Add lights, meshes, Mudra bindings here.
    this.add(new THREE.HemisphereLight(0xffffff, 0x666666, 3));
    // Place objects at xb.user.objectDistance in front of viewer:
    this.mesh.position.set(0, xb.user.height - 0.5, -xb.user.objectDistance);
  }

  /** Called every animation frame. Keep cheap — no allocations. */
  update() { }

  /** Fires when a pinch/controller-trigger starts in XR. */
  onSelectStart(event) { }

  /** Fires when a pinch/controller-trigger ends in XR. */
  onSelectEnd(event) { }

  /** Fires every frame while a pinch is held in XR. */
  onSelecting(event) { }
}
```

### Entry point

```js
document.addEventListener('DOMContentLoaded', function () {
  xb.add(new MainScript());
  xb.init(new xb.Options());
});
```

### Key spatial constants

- `xb.user.height` — floor-relative eye height (approx. 1.6 m)
- `xb.user.objectDistance` — recommended arm-length distance for objects (approx. 0.8 m)
- Y-up coordinate system; Z is toward the viewer (negative Z = in front of you)

---

## Section 4 — Mock WebSocket Fallback (MudraClient)

### Policy

- Start the WebSocket open attempt immediately on page load.
- If the WebSocket does not open within **1500 ms**, activate the mock automatically.
- If the WebSocket closes mid-session (band disconnect), flip to mock without a page reload.
- The mock fires exactly the same message format as the real device.
- App code must not branch on `_useMock` — it must receive the same messages either way.

### Connection-status state machine

```
[page load]
    │
    ▼
connecting ──── ws opens within 1500 ms ──→ connected
    │
    └── timeout or error ──────────────────→ simulated
                                                  │
connected ──── ws.onclose fires ───────────────→ disconnected-simulated
simulated ──── ws.onclose fires ───────────────→ (already simulated, no change)
```

### Required MudraClient implementation

Include this class verbatim in every generated app:

```js
class MudraClient {
  constructor(url) {
    this._handlers = {};
    this._subscriptions = new Set();
    this._timers = [];
    this._status = 'connecting';
    this._notifyStatus('connecting');

    const timeout = setTimeout(() => this._startMock(), 1500);

    try {
      this._ws = new WebSocket(url);
      this._ws.onopen = () => {
        clearTimeout(timeout);
        this._status = 'connected';
        this._notifyStatus('connected');
        this._subscriptions.forEach(sig =>
          this._ws.send(JSON.stringify({ command: 'subscribe', signal: sig }))
        );
      };
      this._ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (this._handlers[msg.type]) this._handlers[msg.type](msg.data);
      };
      this._ws.onclose = () => {
        clearTimeout(timeout);
        if (this._status === 'connected') {
          this._status = 'disconnected-simulated';
          this._notifyStatus('disconnected-simulated');
          this._startMock();
        }
      };
      this._ws.onerror = () => {
        clearTimeout(timeout);
        this._startMock();
      };
    } catch (_) {
      clearTimeout(timeout);
      this._startMock();
    }
  }

  /** Register a handler for a signal type. Call before subscribe(). */
  on(signal, fn) {
    this._handlers[signal] = fn;
  }

  /** Subscribe to a signal. Safe to call before the WebSocket opens. */
  subscribe(signal) {
    this._subscriptions.add(signal);
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify({ command: 'subscribe', signal }));
    }
  }

  /** Send an arbitrary command to the band service. */
  send(cmd) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(cmd));
    } else if (cmd.command === 'trigger_gesture') {
      this._dispatchMockGesture(cmd.data.type);
    }
  }

  /** Current connection status string. */
  get status() { return this._status; }

  _notifyStatus(s) {
    if (this._handlers['_status']) this._handlers['_status'](s);
  }

  _emit(payload) {
    if (this._handlers[payload.type]) this._handlers[payload.type](payload.data);
  }

  _dispatchMockGesture(type) {
    this._emit({ type: 'gesture', data: { type, confidence: 0.99, timestamp: Date.now() } });
  }

  _startMock() {
    if (this._status === 'simulated' || this._status === 'disconnected-simulated') return;
    const wasPreviouslyConnected = this._status === 'connected';
    this._status = wasPreviouslyConnected ? 'disconnected-simulated' : 'simulated';
    this._notifyStatus(this._status);
    // Passive mock: no auto-firing. Signals fire ONLY from sim-panel clicks,
    // keyboard shortcuts, or real WebSocket messages. This keeps the scene
    // stable and makes the sim panel the single, explicit source of motion.
  }

  destroy() {
    this._timers.forEach(t => clearInterval(t));
    if (this._ws) this._ws.close();
  }
}
```

---

## Section 5 — Simulator Panel

### Purpose

The simulator panel lets a user exercise every subscribed Mudra signal without
a band or XR headset. It is a **2D DOM overlay** (not spatial XR UI) and must
always be visible in flat-screen mode. It disappears automatically when the
browser transitions to an immersive WebXR session (native WebXR DOM suppression).

### DOM structure

```html
<div id="mudra-sim" style="
  position: fixed; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
  padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 8px;
  z-index: 9999; font-family: system-ui, sans-serif;">
  <!-- One button group per subscribed signal -->
</div>
```

### Button groups per signal (render ONLY the sub-actions the app actually uses)

The catalog below is the **maximal** set per signal. The simulator panel
MUST render **only** the sub-actions the generated app handles — never
extras. Examples:

- App maps `gesture.tap` only → render `Tap`. Omit `2Tap`, `Twist`, `2Twist`.
- App maps `nav_direction` to Up/Down only → render `↑`, `↓`. Omit
  `←`, `→`, `Roll L`, `Roll R`.
- App uses `imu_acc` for X-axis tilt only → render `Tilt X+`, `Tilt X−`.
  Omit `Tilt Y+`, `Tilt Y−`.

When in doubt, walk every `mudra.on('<signal>', …)` handler and emit a
button only for sub-actions referenced inside it. Unused buttons are a
checklist failure (see Section 10, item 6).

| Signal | Maximal buttons (subset based on app handlers) |
|--------|---------|
| `gesture` | `Tap`, `2Tap`, `Twist`, `2Twist` |
| `nav_direction` | `↑`, `↓`, `←`, `→`, `Roll L`, `Roll R` |
| `navigation` | `↑`, `↓`, `←`, `→` (each emits one delta event of ±3 — gentle/low-sensitivity default; raise per-app only if the prompt explicitly asks for fast/snappy movement) |
| `pressure` | Slider `0–100` (label shows current value) |
| `button` | `Press`, `Release` |
| `imu_acc` | `Tilt X+`, `Tilt X−`, `Tilt Y+`, `Tilt Y−` (5-frame burst at ±2 m/s²) |
| `imu_gyro` | `Rot X+`, `Rot X−`, `Rot Y+`, `Rot Y−` (5-frame burst at ±10 deg/s) |
| `snc` | `Spike` (burst of elevated samples on all 3 channels) |

### Button firing rules

- Every button fires via the **same code path** as a real Mudra signal.
  Call the same handler that `mudra.on(signal, handler)` would invoke.
- For `gesture` buttons: also call `mudra.send({ command: 'trigger_gesture', data: { type } })`
  so the round-trip works when a real band is connected.
- Never duplicate logic between the simulator path and the real-signal path.

```js
// Example: gesture sim button wires to the same handler as real signals
function simGesture(type) {
  mudra.send({ command: 'trigger_gesture', data: { type } });
  handleGesture({ type, confidence: 1.0, timestamp: Date.now() });
}

// Example: pressure slider
pressureSlider.addEventListener('input', () => {
  const norm = pressureSlider.value / 100;
  handlePressure({ value: +pressureSlider.value, normalized: norm, timestamp: Date.now() });
});
```

### Visibility

- `#mudra-sim` is always visible in flat-screen mode.
- Do NOT conditionally hide it when the band is connected (both sources are valid per FR-014).
- The 2D DOM disappears automatically in immersive WebXR — no JS required.

---

## Section 6 — Keyboard Shortcuts + XR Blocks Precedence

### Canonical keyboard map

| Key | Signal / Action |
|-----|----------------|
| `Space` | `gesture` → tap |
| `Shift` | `button` → press (keydown) / release (keyup) |
| `[` | `pressure` decrease (−10, min 0) |
| `]` | `pressure` increase (+10, max 100) |
| `i` | `nav_direction` → Up OR `navigation` delta_y +3 |
| `k` | `nav_direction` → Down OR `navigation` delta_y −3 |
| `j` | `nav_direction` → Left OR `navigation` delta_x −3 |
| `l` | `nav_direction` → Right OR `navigation` delta_x +3 |

**Navigation sensitivity default**: keyboard `I`/`J`/`K`/`L` and sim panel
buttons emit deltas of **±3** per event (gentle / low-sensitivity
baseline). This keeps cursor/pan motion calm and predictable. Only raise
the magnitude when the prompt explicitly calls for fast/snappy movement
(racing, arcade-twitch, etc.).
| `u` | `imu_acc` tilt X+ burst |
| `o` | `imu_acc` tilt X− burst |
| `m` | `imu_gyro` rot Y+ burst |
| `n` | `imu_gyro` rot Y− burst |

For `imu` bursts: fire 5 synthetic frames at ±[2, 0, 9.81] m/s² (acc) or ±[10, 0, 0.5] deg/s (gyro).

### Reserved keys & mouse — owned by XR Blocks desktop simulator

The XR Blocks desktop simulator (active whenever the app runs in a flat
browser without a WebXR session) owns the keys and mouse gestures that
let the user navigate the 3D scene. Mudra MUST NOT claim or
`stopPropagation()` any of these — they are how the user orbits, walks,
and zooms while previewing the app:

| Input | XR Blocks role |
|-------|----------------|
| `W` `A` `S` `D` | Walk camera forward / left / back / right |
| `ArrowUp` `ArrowDown` `ArrowLeft` `ArrowRight` | Camera nav (alt to WASD) |
| `Q` `E` | Camera roll / vertical |
| `R` | Reset camera pose |
| Right-click drag | Orbit / look around |
| Mouse wheel | Zoom in / out |

**Why Mudra uses `I`/`J`/`K`/`L` and `U`/`O`/`M`/`N`**: these keys are
explicitly off the XR Blocks reserved set, so the desktop simulator
keeps full camera control while the band-driven keyboard shortcuts
remain available for testing without a band. Never reassign a Mudra
shortcut onto a reserved key, even when the app does not subscribe to a
navigation signal.

### Attachment rule (critical)

Mudra keyboard handlers MUST attach with `capture: true` and call
`event.stopPropagation()` on every key the app subscribes to. This prevents
XR Blocks' desktop-simulator bubble-phase listeners from double-firing.

```js
window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'Space':
      e.stopPropagation();
      simGesture('tap');
      break;
    case 'BracketLeft':
      e.stopPropagation();
      adjustPressure(-10);
      break;
    case 'BracketRight':
      e.stopPropagation();
      adjustPressure(+10);
      break;
    case 'KeyI':
      e.stopPropagation();
      handleNavDirection({ direction: 'Up', timestamp: Date.now() });
      break;
    // ... etc for subscribed keys only — using I/J/K/L for nav and U/O/M/N for IMU
  }
}, { capture: true });
```

Only intercept keys for signals the app actually subscribes to. Do NOT
`stopPropagation` on keys that no Mudra signal handles — XR Blocks needs
those, especially the reserved set above (WASD, arrows, Q/E/R, mouse).

---

## Section 7 — Connection-Status Indicator

### Required DOM element

Every generated app must include exactly one visible element that reflects
the current `MudraClient` status:

```html
<div id="mudra-status" style="
  position: fixed; top: 8px; right: 12px;
  padding: 4px 10px; border-radius: 999px;
  font-size: 0.8rem; font-family: system-ui, sans-serif;
  background: rgba(0,0,0,0.6); color: #fff;
  z-index: 9999;">Connecting…</div>
```

### Text states

| MudraClient status | textContent |
|-------------------|-------------|
| `connecting` | `Connecting…` |
| `connected` | `Connected` |
| `simulated` | `Simulated` |
| `disconnected-simulated` | `Disconnected — simulated` |

### Wiring

```js
mudra.on('_status', (s) => {
  const chip = document.getElementById('mudra-status');
  const labels = {
    'connecting': 'Connecting…',
    'connected': 'Connected',
    'simulated': 'Simulated',
    'disconnected-simulated': 'Disconnected — simulated',
  };
  chip.textContent = labels[s] ?? s;
});
```

### Visibility

- Visible in flat-screen mode at all times.
- Disappears automatically in immersive XR (native DOM suppression).
- Place in the top-right corner by default; adapt if the template uses that space.

---

## Section 8 — Signal Grouping Rules (Non-Negotiable)

### Signal group classification

| Group | Signals | Combine freely with |
|-------|---------|---------------------|
| **Pointer** | `navigation`, `button` | `gesture` OR `button` (not `pressure` if `gesture` is used) |
| **Direction** | `nav_direction` | `gesture` OR `pressure` OR `button` (but not `gesture`+`pressure` together) |
| **IMU+Biometric** | `imu_acc`, `imu_gyro`, `snc` | `gesture` OR `pressure` OR `button` (but not `gesture`+`pressure` together) |
| *(none)* | — | `gesture` OR `pressure` OR `button` (but not `gesture`+`pressure` together) |

### Bundling rule — IMU+Biometric (CRITICAL)

`imu_acc`, `imu_gyro`, and `snc` are an **inseparable bundle**. If the user's prompt
implies any one of them, subscribe to **all three**. Never subscribe to only one or
two of them.

```js
// CORRECT — all three always together
mudra.subscribe('imu_acc');
mudra.subscribe('imu_gyro');
mudra.subscribe('snc');

// WRONG — partial subscriptions
mudra.subscribe('snc');                   // missing imu_acc and imu_gyro
mudra.subscribe('imu_acc');               // missing imu_gyro and snc
```

### XOR rules (all non-negotiable)

1. **Gesture ⊕ Pressure** — an app may use `gesture` OR `pressure`, never both.
2. **Navigation ⊕ Nav_direction** — an app may use `navigation` OR `nav_direction`, never both.
3. **Pointer/Direction ⊕ IMU+Biometric** — `navigation` and `nav_direction` cannot be combined with the IMU+Biometric bundle (`imu_acc`/`imu_gyro`/`snc`).

### Illegal combinations

```
// REJECT these signal sets
gesture + pressure
navigation + nav_direction
navigation + imu_acc
navigation + imu_gyro
navigation + snc
nav_direction + imu_acc
nav_direction + imu_gyro
nav_direction + snc
button + nav_direction        // button belongs to Pointer mode only
```

### Valid signal sets (examples)

```
gesture + button
pressure + button
navigation + button
navigation + button + gesture
nav_direction
nav_direction + pressure + button
imu_acc + imu_gyro + snc
imu_acc + imu_gyro + snc + gesture
imu_acc + imu_gyro + snc + button
imu_acc + imu_gyro + snc + pressure + button
```

### Inference priority for ties

When the user prompt maps to multiple modes equally, ask one disambiguation
question — do not silently pick one.

Default to `direction` mode (`nav_direction`) when there is no navigation
language in the prompt at all and a motion mode is required by the template.

---

## Section 9 — AI API Key Handling (onboarding-gated, mandatory for AI apps)

### Lifecycle: `sessionStorage` keyed by `mudra.gemini.apiKey`

For any generated app that calls a Gemini / LLM endpoint, the API key MUST
be entered through the **onboarding modal** before the user can use the
app. The key is stored in `sessionStorage` under the literal key
`mudra.gemini.apiKey` — it persists across reloads in the same tab and
clears when the tab closes. **Do NOT use `localStorage`. Do NOT use a
`prompt()` popup. Do NOT prompt on first AI call.**

```js
// Read at app start
const apiKey = sessionStorage.getItem('mudra.gemini.apiKey');

// Write only from the onboarding "AI Setup" step
sessionStorage.setItem('mudra.gemini.apiKey', enteredKey);
```

### Required onboarding "AI Setup" fragment

For AI apps only, the onboarding modal MUST include the following
fragment inside `<section class="mudra-onb__body">`, placed AFTER the
actions table and BEFORE `</section>`:

```html
<div class="mudra-onb__ai" data-uses-ai>
  <h3 class="mudra-onb__ai-title">AI Setup</h3>
  <p class="mudra-onb__ai-lede">
    This app uses Google Gemini. Paste your API key to continue —
    it's stored only in this browser tab (<code>sessionStorage</code>)
    and is never sent anywhere except Google's API.
    <a href="https://aistudio.google.com/" target="_blank" rel="noopener">Get a key →</a>
  </p>
  <input
    id="mudra-onb-ai-key"
    class="mudra-onb__ai-input"
    type="password"
    autocomplete="off"
    spellcheck="false"
    placeholder="Paste Gemini API key (starts with AIza…)"
    aria-label="Gemini API key"
  />
  <p class="mudra-onb__ai-hint" data-role="hint"></p>
</div>
```

And the matching CSS (added to the existing `<style>`):

```css
.mudra-onb__ai { margin-top: 14px; padding-top: 12px; border-top: 1px solid #eee; }
.mudra-onb__ai-title { margin: 0 0 6px; font-size: 0.95rem; font-weight: 700; color: #111; }
.mudra-onb__ai-lede  { margin: 0 0 10px; color: #555; font-size: 0.85rem; }
.mudra-onb__ai-lede a { color: #0d9488; }
.mudra-onb__ai-input {
  width: 100%; box-sizing: border-box;
  padding: 9px 12px; border: 1px solid #d0d0d0; border-radius: 8px;
  font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  background: #f8f9fb; color: #111;
}
.mudra-onb__ai-input:focus { outline: 2px solid #14b8a6; border-color: #14b8a6; background: #fff; }
.mudra-onb__ai-hint { margin: 6px 2px 0; font-size: 0.75rem; color: #b91c1c; min-height: 1em; }
.mudra-onb__continue:disabled { opacity: 0.45; cursor: not-allowed; }
```

### Behaviour rules (AI apps only)

1. **`Got it` button starts disabled.** The IIFE that wires the modal
   reads `dialog.querySelector('.mudra-onb__ai')` — if it exists, the
   `.mudra-onb__continue` button is disabled until
   `.mudra-onb__ai-input` is non-empty AND matches `/^AIza[\w-]{30,}$/`
   (Google API-key prefix sanity check).
2. **On click of `Got it`**, write the trimmed value to
   `sessionStorage.setItem('mudra.gemini.apiKey', value)`, then close
   the modal.
3. **At every page load**, the IIFE checks `sessionStorage` first:
   - If `mudra.gemini.apiKey` is present and matches the prefix regex,
     the AI-Setup fragment is hidden (the user already provided a key
     this session) and `Got it` is enabled immediately.
   - If absent or malformed, the AI-Setup fragment is shown and the
     modal CANNOT be dismissed by `Escape`, the `×` close button, or
     the reopen `?` button without entering a valid key. `dialog.close()`
     paths called from those handlers are no-ops while the key is
     missing.
4. **The `?` reopen button** for AI apps re-runs the gating logic. If
   the user clears `sessionStorage` mid-session and reopens, the
   AI-Setup fragment renders again.
5. **Reading the key in app code:** the `xb.Script` subclass reads
   `sessionStorage.getItem('mudra.gemini.apiKey')` in `init()`. If the
   key is `null`, the AI portion of the app stays inert (no calls to
   Gemini) and the visible chat panel (Section 18) renders a `Set up
   AI in the welcome panel` placeholder.
6. **Never bake a key into the HTML source.** Pre-write regex scan
   (`/AIza[A-Za-z0-9_-]{30,}|sk-[A-Za-z0-9_-]{32,}/` excluding the
   literal placeholder string `AIza…`) must return zero matches.
7. **Never auto-read from URL params, `localStorage`, or `prompt()`.**
8. **Non-AI apps** ignore this section entirely. The AI-Setup fragment
   is omitted; the modal works as defined in Section 17 unchanged.

### Canonical Gemini model — `gemini-2.5-flash` only

For any generated app that calls Gemini via the **REST `generateContent`
endpoint**, the model ID MUST be exactly `gemini-2.5-flash`. No other
model IDs are permitted for REST text/chat/vision generation. This is a
hard pin — preview aliases get retired by Google and the app then 404s.

```js
// CORRECT — the only permitted REST model for text/chat/vision
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

// FORBIDDEN — preview aliases, dated aliases, retired families
gemini-1.5-flash, gemini-1.5-flash-latest, gemini-1.5-pro
gemini-2.5-flash-preview-09-2025, gemini-2.5-flash-preview-04-2025
gemini-flash-latest, gemini-pro, gemini-2.5-flash-002 (any -NNN suffix)
```

Pre-write regex scan — every generated HTML file MUST satisfy:

- `/generativelanguage\.googleapis\.com\/v1beta\/models\/([a-z0-9-]+):generateContent/`
  → captured model ID MUST equal `gemini-2.5-flash`. Any other capture
  fails the pre-write checklist.

Out-of-scope use cases (allowed exceptions, REST-only rule does NOT apply):

- **Live API** (WebSocket / xrblocks `xb.core.ai.startLiveSession()`):
  the Live endpoint uses its own model set (`gemini-2.0-flash-live-001`,
  `gemini-2.5-flash-native-audio-preview-12-2025`). Apps that genuinely
  need streaming audio/video may use those, but every text-chat app
  must use the REST pin above.
- **Image generation** via `:generateContent`: `gemini-2.5-flash-image`
  is permitted only when the app's purpose is image output. Default to
  the text pin otherwise.

If an app needs a different model, raise it to the user before writing —
do not silently swap in a preview alias.

---

## Section 10 — Pre-Write Checklist + Collision Handling

Before calling `Write` to emit a generated app, verify all items:

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | Single file | Exactly one `<html>` document; all CSS in `<style>`; all JS in `<script>` or `<script type="module">` |
| 2 | Import map | One `<script type="importmap">` block; contents match canonical pins (Section 2) exactly; no unused entries |
| 3 | xb.Script entry | Top-level logic inside `class <Name> extends xb.Script`; `xb.add(new <Name>())` + `xb.init(new xb.Options())` on `DOMContentLoaded` |
| 4 | MudraClient | One `MudraClient` instance at module scope; URL = `ws://127.0.0.1:8766`; does NOT auto-connect; `setMode()` drives connect/disconnect |
| 5 | Subscribe commands | Every used signal has exactly one `mudra.subscribe('<signal>')` call; none outside the signal set |
| 6 | Simulator panel | `<div id="mudra-sim">` present; ONLY buttons for sub-actions actually handled by the app (no extras like Roll L/R or Twist if unused); buttons fire via handler, not inline `onclick` |
| 7 | Keyboard bindings | `window.addEventListener('keydown', …, { capture: true })` present; `event.stopPropagation()` on every Mudra-claimed key |
| 8 | Status indicator | `<div id="mudra-status">` present; text states are `Manual` / `Connecting…` / `Connected` / `Disconnected` (Section 15); no `simulated` strings |
| 9 | AI key gating | If `usesAI`: the AI-Setup fragment (Section 9) is present inside `.mudra-onb__body`; key is read from `sessionStorage.getItem('mudra.gemini.apiKey')` only; ZERO `prompt(` calls for the key; ZERO `localStorage` references; ZERO baked keys (regex scan) |
| 9a | Visible AI chat I/O | If `usesAI`: the scene renders BOTH the latest user input AND the AI response as visible text (xb.ScrollingTroikaTextView, troika `Text`, or xb.SpatialPanel rows). The visible "Purpose" line states what the app does in one sentence. TTS may exist but is never the only output (Section 18) |
| 10 | Background lockdown | ZERO `applyBackground_*` methods in the class; ZERO calls to a background helper from `init()`; no `options.simulator.scenePath` line anywhere. Generated apps use the XR Blocks default room only (Section 14) |
| 11 | Mode toggle | `<div id="mode-toggle">` with **Manual** + **Mudra** buttons; Manual is the default on load; toggle remains clickable when disconnected; flipping atomically opens/closes the socket per Section 15 |
| 12 | Band-state polling | In Mudra mode the app sends `{command:"get_status"}` on `ws.onopen` and every 2000 ms thereafter; pill flips to `Connected` ONLY when `data.device.state === "connected"` |
| 13 | No disconnect overlay | No banner / toast / modal / inline alert ever rendered for disconnect — pill is the only indicator |
| 14 | Footer | Exactly one `<div id="mudra-badge">` containing the literal text `Created by Mudra` (no variants) |
| 15 | Mock is passive | `MudraClient._startMock()` (or equivalent) starts NO intervals — synthetic signals come only from sim-panel clicks and keyboard shortcuts |
| 16 | Gemini model pin | If the app calls `generativelanguage.googleapis.com/v1beta/models/<id>:generateContent`, the captured `<id>` MUST equal `gemini-2.5-flash`. No preview / dated / latest aliases. Live-API and image-gen exceptions per Section 9 |

### Retry policy

If any check fails:
1. Regenerate once and re-run the full checklist.
2. If the second attempt also fails, surface the specific failing check(s)
   to the user and do **not** write the file.

### File collision / auto-suffix rule

- Target filename: `preview/<name>.html`
- If that file already exists, try `preview/<name>-2.html`, then `-3.html`, etc.
- Never overwrite an existing file.
- Always report the final written path to the user.

---

## Section 11 — Signal → XR Binding Patterns

Use these as code snippets when adapting a template.
Copy and adapt — do not invent new patterns from scratch.

### gesture.tap → onSelectStart forwarding

```js
// In init():
mudra.on('gesture', (data) => {
  if (data.type === 'tap') this.onSelectStart({ source: 'mudra' });
  if (data.type === 'double_tap') this.onSelectEnd({ source: 'mudra' });
});
mudra.subscribe('gesture');
```

### pressure → scale / color mapping

```js
// In init():
mudra.on('pressure', (data) => {
  const s = 0.5 + data.normalized * 1.5;           // scale 0.5 … 2.0
  this.mesh.scale.setScalar(s);
  const hue = data.normalized * 0.8;               // hue 0 (red) … 0.8 (blue)
  this.mesh.material.color.setHSL(hue, 0.9, 0.5);
});
mudra.subscribe('pressure');
```

### nav_direction → spatial menu step

```js
// In init():
mudra.on('nav_direction', (data) => {
  switch (data.direction) {
    case 'Up':    this.menuIndex = Math.max(0, this.menuIndex - 1); break;
    case 'Down':  this.menuIndex = Math.min(this.items.length - 1, this.menuIndex + 1); break;
    case 'Right': this.selectItem(this.menuIndex); break;
    case 'Left':  this.goBack(); break;
  }
  this.updateMenuHighlight();
});
mudra.subscribe('nav_direction');
```

### imu_acc + imu_gyro + snc bundle → subscribe all three together

`imu_acc`, `imu_gyro`, and `snc` are always subscribed together. Register handlers
for each signal you actually use in the app, but always send all three subscribe commands.

```js
// In init():
mudra.on('imu_acc', (data) => {
  const [ax, ay] = data.values;
  this.mesh.rotation.x = THREE.MathUtils.clamp(ax * 0.1, -Math.PI / 4, Math.PI / 4);
  this.mesh.rotation.z = THREE.MathUtils.clamp(ay * 0.1, -Math.PI / 4, Math.PI / 4);
});
mudra.on('imu_gyro', (data) => {
  const [gx] = data.values;
  this.mesh.rotation.y += gx * 0.001;
});
mudra.on('snc', (data) => {
  const ch1 = data.values[0];
  const latest = ch1[ch1.length - 1];               // most recent sample
  const norm = Math.min(1, Math.abs(latest) / 500); // normalize
  this.overlay.material.opacity = norm * 0.7;
});
// ALWAYS subscribe all three — they form an inseparable bundle
mudra.subscribe('imu_acc');
mudra.subscribe('imu_gyro');
mudra.subscribe('snc');
```

### navigation → continuous cursor / pan

**Default sensitivity multiplier: `0.002`** (gentle / low-sensitivity).
Use this baseline for all navigation/cursor/pan bindings. Only raise it
when the prompt explicitly asks for fast/snappy movement.

```js
// In init():
const NAV_SENSITIVITY = 0.002;          // gentle default — slow, predictable
mudra.on('navigation', (data) => {
  this.cursorX = THREE.MathUtils.clamp(this.cursorX + data.delta_x * NAV_SENSITIVITY, -1, 1);
  this.cursorY = THREE.MathUtils.clamp(this.cursorY - data.delta_y * NAV_SENSITIVITY, -1, 1);
  this.cursor.position.set(this.cursorX, this.cursorY, -xb.user.objectDistance);
});
mudra.subscribe('navigation');
```

---

## Section 12 — Template Selection Table

One row per asset in `assets/`. The skill's keyword-based selector scores each row
against the user's prompt (signal names, motion keywords, XR feature words).

| id | path | keywords | motionModesSupported | xrFeatures |
|----|------|----------|---------------------|------------|
| `0_basic` | `assets/templates/0_basic.html` | `["basic","cylinder","pinch","color","simple","starter"]` | `["none","pointer"]` | `["input"]` |
| `1_ui` | `assets/templates/1_ui.html` | `["ui","spatial","panel","text","sdf","font","button","draggable","troika"]` | `["pointer"]` | `["input","ui"]` |
| `2_hands` | `assets/templates/2_hands.html` | `["hands","hand","pinch","gesture","joints","finger","hand-tracking"]` | `["pointer"]` | `["hands","input"]` |
| `3_depth` | `assets/templates/3_depth.html` | `["depth","mesh","depth-sensing","plane","environment","occlusion"]` | `["none"]` | `["depth-sensing","mesh-detection"]` |
| `4_stereo` | `assets/templates/4_stereo.html` | `["stereo","video","passthrough","camera","background","environment","feed"]` | `["none"]` | `["camera","passthrough"]` |
| `5_camera` | `assets/templates/5_camera.html` | `["camera","video","passthrough","texture","scene","background"]` | `["none","pointer"]` | `["camera","input"]` |
| `6_ai` | `assets/templates/6_ai.html` | `["ai","gemini","query","vision","photo","capture","llm","multimodal"]` | `["pointer"]` | `["input","camera"]` |
| `7_ai_live` | `assets/templates/7_ai_live.html` | `["ai","gemini","live","speech","transcription","voice","microphone","audio","real-time"]` | `["pointer"]` | `["input"]` |
| `8_objects` | `assets/templates/8_objects.html` | `["objects","detection","model","3d","place","anchor","ar","environment"]` | `["pointer"]` | `["mesh-detection","input"]` |
| `9_xr-toggle` | `assets/templates/9_xr-toggle.html` | `["toggle","xr","enter","exit","session","button","transition"]` | `["none","pointer"]` | `["input"]` |
| `heuristic_hand_gestures` | `assets/templates/heuristic_hand_gestures.html` | `["gesture","heuristic","hand","recognition","custom","pattern","hand-tracking"]` | `["none"]` | `["hands"]` |
| `meshes` | `assets/templates/meshes.html` | `["mesh","environment","scan","plane","floor","wall","surface"]` | `["none"]` | `["mesh-detection"]` |
| `planes` | `assets/templates/planes.html` | `["plane","floor","wall","surface","anchor","environment","horizontal","vertical"]` | `["none"]` | `["plane-detection"]` |
| `uikit` | `assets/templates/uikit.html` | `["ui","kit","component","widget","button","icon","material","text","panel","menu"]` | `["pointer"]` | `["input","ui"]` |
| `depthmap` | `assets/samples/depthmap.html` | `["depth","map","visualization","color","gradient","environment","scan"]` | `["none"]` | `["depth-sensing"]` |
| `depthmesh` | `assets/samples/depthmesh.html` | `["depth","mesh","wireframe","environment","scan","geometry"]` | `["none"]` | `["depth-sensing","mesh-detection"]` |
| `game_rps` | `assets/samples/game_rps.html` | `["game","rps","rock","paper","scissors","gesture","compete","fun","hand"]` | `["none"]` | `["hands"]` |
| `gestures_custom` | `assets/samples/gestures_custom.html` | `["gesture","custom","recognize","train","pose","hand-tracking","hands"]` | `["none"]` | `["hands"]` |
| `gestures_heuristic` | `assets/samples/gestures_heuristic.html` | `["gesture","heuristic","recognize","hand","pose","pinch","open","fist"]` | `["none"]` | `["hands"]` |
| `lighting` | `assets/samples/lighting.html` | `["lighting","light","shadow","scene","animals","3d","models","environment"]` | `["pointer"]` | `["input"]` |
| `mesh_detection` | `assets/samples/mesh_detection.html` | `["mesh","detection","environment","scan","ar","surface"]` | `["none"]` | `["mesh-detection"]` |
| `modelviewer` | `assets/samples/modelviewer.html` | `["model","viewer","3d","gltf","glb","object","rotate","inspect","load"]` | `["pointer"]` | `["input"]` |
| `paint` | `assets/samples/paint.html` | `["paint","draw","brush","stroke","canvas","art","color","gesture"]` | `["pointer"]` | `["input","hands"]` |
| `planar-vst` | `assets/samples/planar-vst.html` | `["plane","vst","passthrough","video","portal","ar","surface"]` | `["none"]` | `["plane-detection","camera"]` |
| `reticle` | `assets/samples/reticle.html` | `["reticle","cursor","pointer","aim","gaze","target","floor","placement"]` | `["none","pointer"]` | `["plane-detection","input"]` |
| `skybox_agent` | `assets/samples/skybox_agent.html` | `["skybox","sky","background","ai","gemini","generate","environment","image"]` | `["pointer"]` | `["input"]` |
| `sound` | `assets/samples/sound.html` | `["sound","audio","music","spatial","3d-audio","positional","play"]` | `["pointer"]` | `["input"]` |
| `ui` | `assets/samples/ui.html` | `["ui","panel","button","menu","list","text","interface","spatial"]` | `["pointer"]` | `["input","ui"]` |
| `virtual-screens` | `assets/samples/virtual-screens.html` | `["screen","virtual","window","share","stream","desktop","browser","display"]` | `["pointer"]` | `["input"]` |
| `3dgs-walkthrough` | `assets/demos/3dgs-walkthrough.html` | `["gaussian","splat","3dgs","scene","walkthrough","room","photo","realistic"]` | `["imu","direction"]` | `["input"]` |
| `aisimulator` | `assets/demos/aisimulator.html` | `["ai","simulate","gemini","agent","roleplay","character","conversation","npc"]` | `["pointer"]` | `["input"]` |
| `balloonpop` | `assets/demos/balloonpop.html` | `["balloon","pop","game","gesture","fun","pinch","particle","explosion"]` | `["none"]` | `["hands","input"]` |
| `ballpit` | `assets/demos/ballpit.html` | `["ball","physics","pit","throw","gravity","interact","fun","ammo"]` | `["pointer"]` | `["input","hands"]` |
| `drone` | `assets/demos/drone.html` | `["drone","fly","navigate","control","imu","tilt","direction","pilot"]` | `["imu","direction"]` | `["input"]` |
| `gemini-icebreakers` | `assets/demos/gemini-icebreakers.html` | `["gemini","icebreaker","question","conversation","ai","social","fun"]` | `["pointer"]` | `["input"]` |
| `gemini-xrobject` | `assets/demos/gemini-xrobject.html` | `["gemini","object","recognize","camera","ar","label","identify","vision"]` | `["pointer"]` | `["input","camera"]` |
| `math3d` | `assets/demos/math3d.html` | `["math","3d","formula","graph","equation","plot","visualization","education"]` | `["pointer"]` | `["input","ui"]` |
| `measure` | `assets/demos/measure.html` | `["measure","ruler","tape","distance","ar","depth","spatial","length"]` | `["none"]` | `["depth-sensing","mesh-detection"]` |
| `occlusion` | `assets/demos/occlusion.html` | `["occlusion","depth","animal","model","shadow","ar","realistic","environment"]` | `["pointer"]` | `["input","depth-sensing"]` |
| `rain` | `assets/demos/rain.html` | `["rain","particle","weather","atmosphere","shader","visual","instanced"]` | `["none","pointer"]` | `["input"]` |
| `screenwiper` | `assets/demos/screenwiper.html` | `["wiper","screen","wipe","clear","gesture","brush","clean","effect"]` | `["pointer"]` | `["input","hands"]` |
| `splash` | `assets/demos/splash.html` | `["splash","paint","decal","physics","shoot","color","ball","impact"]` | `["pointer"]` | `["input"]` |
| `webcam_gestures` | `assets/demos/webcam_gestures.html` | `["webcam","mediapipe","gesture","hand","camera","tracking","no-headset","flat"]` | `["none"]` | `[]` |
| `xremoji` | `assets/demos/xremoji.html` | `["emoji","expression","face","gesture","fun","balloon","tensorflow","social"]` | `["none"]` | `["hands"]` |
| `xrpoet` | `assets/demos/xrpoet.html` | `["poem","poetry","ai","gemini","generate","creative","camera","writing"]` | `["pointer"]` | `["input","camera"]` |

---

## Section 13 — Template Inference + Override

*(Populated after Phase 5 / T032.)*

---

## Section 14 — Background Lockdown (XR Blocks default only)

**Custom backgrounds are forbidden.** Every generated XR app uses the XR
Blocks default room and nothing else. There is no catalog, no helper, no
override, no `[bg=...]` tag, no `scenePath` override.

### Hard rules — apply unconditionally

1. The `xb.Script` subclass MUST NOT contain any `applyBackground_*` method.
2. `init()` MUST NOT call any background helper. It starts with lights,
   meshes, and Mudra wiring.
3. The entry point MUST NOT set `options.simulator.scenePath` — not to
   `null`, not to a path. Leave it alone so XR Blocks renders its default
   room.
4. No `THREE.SphereGeometry` dome, no custom skybox `Mesh`, no
   `THREE.Points` starfield, no `THREE.GridHelper` floor, no equirectangular
   `TextureLoader().load(...)` for background purposes. (Per-scene
   geometry that the app actually needs is fine — the ban is on standalone
   environment domes/floors/skies.)
5. Prompt cues like "in space", "starfield", "sunset sky", "cyberpunk
   vibe", "with a forest backdrop", or even literal `[bg=<id>]` tags MUST
   be IGNORED for background purposes. They may still inform template /
   motion-mode selection.
6. If the user explicitly insists on a custom background, decline and
   remind them that this skill is locked to the XR Blocks default room.

### Pre-write regex (Section 10 check #10)

The generated source MUST satisfy ALL of the following:

- `/applyBackground_/` → zero matches.
- `/options\.simulator\.scenePath/` → zero matches.

If either pattern matches, the file fails the pre-write checklist and is
not written.

---
## Section 15 — Mode Toggle (Manual / Mudra) — Required

**This section supersedes Section 4's auto-fallback "simulated" status and
Section 7's `simulated` / `disconnected-simulated` states for all new
apps.** Every XR app generated by this skill MUST implement the Mode
Toggle exactly as specified here. Canonical protocol:
`references/agent_protocol.json` (v2.0).

### Summary

The user picks how the app is driven via a visible **Mode** control,
rendered as a 2D DOM overlay (it disappears automatically in immersive
WebXR sessions, like the simulator panel and status pill):

- **Manual** (default on load): the simulator panel is fully interactive.
  Sim-panel actions inject synthetic signal messages into the same handler
  pipeline that real WebSocket messages would flow through. **No WebSocket
  connection is opened in Manual mode.** The XR scene reacts only to
  signal handlers — never to direct DOM clicks bypassing the signal path.
- **Mudra**: the app opens one WebSocket to `ws://127.0.0.1:8766` and
  subscribes to its signals one-at-a-time. The simulator panel is
  visually disabled (greyed-out, `pointer-events: none`,
  `aria-disabled="true"`) and emits no synthetic signals. The
  connection-status pill reflects band-pairing state via `get_status`
  polling — **no separate overlay, toast, or banner is rendered.**

**The Mode toggle MUST remain fully clickable and keyboard-focusable at
all times** — including while the band is disconnected. Manual is the
default on first load.

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
| WS `open` (in Mudra) | keep `connectionState = "connecting"`, send all `subscribe` commands, send `{command:"get_status"}`, start status-poll timer |
| inbound `status` with `data.device.state === "connected"` (in Mudra) | `connectionState = "connected"` |
| inbound `status` with `data.device.state !== "connected"` (in Mudra) | `connectionState = "disconnected"`, **keep socket open** — do NOT closeSocket, do NOT schedule WS reconnect; status-poll will surface the band coming back |
| inbound `connection_status: connected` (in Mudra) | request a fresh `get_status`; do not flip the pill on this alone |
| inbound `connection_status: disconnected` (in Mudra) | `connectionState = "disconnected"` |
| WS error / WS close (in Mudra) | `connectionState = "disconnected"`, stop status-poll, schedule socket reconnect |
| reconnect tick (in Mudra & socket dead) | open new socket → `connecting` |

**Single-socket guarantee:** never have two `WebSocket` instances open at
once. Use a connection token to neutralise rapid-toggle races (see the
`MudraClient` extensions below).

### MudraClient changes vs. Section 4

The `MudraClient` from Section 4 must be extended (or replaced) so it:

1. Does NOT auto-connect in its constructor. Connection is driven by
   `setMode("mudra")` only.
2. Exposes `setMode(mode)` to flip between `"manual"` and `"mudra"`.
3. In Manual mode, the `_startMock()` interval generators (if any) are
   NOT started. Mock signals must be **passive**: emitted only when the
   sim panel is clicked or a keyboard shortcut fires. (Memory:
   `MudraClient mock must be passive` — strip auto-firing intervals from
   `_startMock()`; sim panel clicks and keys are the only signal source.)
4. On entering Mudra mode, opens one WebSocket, sends `subscribe` for
   every signal in its subscription list, sends `{command:"get_status"}`
   immediately, and starts a 2 s `get_status` poll while the socket is
   `OPEN`.
5. Emits `_status` events with the new four-state vocabulary:
   `"idle" | "connecting" | "connected" | "disconnected"`. The legacy
   `"simulated"` / `"disconnected-simulated"` strings are removed.

### Disconnect detection — band state via `get_status` polling (mandatory)

**The WebSocket handshake to `127.0.0.1:8766` only proves the Companion
service is up. It does NOT prove the user's Mudra Band is paired.** The
Companion accepts socket connections even when no band is bonded — so
flipping the pill to "Connected" on `ws.onopen` is wrong. The pill MUST
reflect the band itself, not the socket.

The source of truth is the `status` response to `{command:"get_status"}`:

```json
> {"command":"get_status"}
< {"type":"status","data":{"device":{"state":"connected", ... }, ...}, "timestamp": ...}
< {"type":"status","data":{"device":{"state":"disconnected", ...}, ...}, "timestamp": ...}
```

Rules:

1. On `ws.onopen` (in Mudra mode): stay in `connecting`; send all
   `subscribe` commands; send `{command:"get_status"}`; start a
   **status-poll timer** that sends `{command:"get_status"}` every
   **2000 ms** while `mode === "mudra"` and the socket is `OPEN`.
2. On inbound `{type:"status"}` (in Mudra mode):
   - `data?.device?.state === "connected"` → `setState("connected")`.
   - Else → `setState("disconnected")`. Keep the socket open. Do NOT
     `closeSocket()`. The next poll tick picks the band up after pairing.
3. On inbound `{type:"connection_status"}`: hint only. On `disconnected`,
   flip the pill. On `connected`, send a fresh `{command:"get_status"}`
   and let the `status` handler do the actual transition.
4. On WS `error` / `close` (in Mudra mode): `setState("disconnected")`,
   stop the status-poll timer, `scheduleReconnect()`.
5. On Manual mode: stop the status-poll timer in `closeSocket()`.

Do not poll faster than 1 s; do not poll slower than 5 s. 2 s is
mandated. The pill MAY sit on `Connecting…` for up to one poll cycle
(~2 s) after entering Mudra mode while the first `status` round-trips —
that is correct behaviour.

### Reconnect backoff

While `mode === "mudra" && connectionState === "disconnected"` AND the
socket itself is dead (not just the band):

```js
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 5000, 5000];   // capped at 5s
```

Reset the index on every successful `connected` transition.

### Status pill text states (replaces Section 7)

| connectionState | textContent | colour hint |
|-----------------|-------------|-------------|
| `idle` (Manual) | `Manual` | neutral |
| `connecting` | `Connecting…` | amber |
| `connected` | `Connected` | green |
| `disconnected` | `Disconnected` | red |

The pill is the **only** disconnect indicator. No banner, toast, or
modal. The simulator panel is greyed (reduced opacity,
`pointer-events: none`) when in Mudra + `disconnected`, but the pill is
still the only textual disconnect cue.

### Mode-toggle DOM sketch

```html
<div id="mode-toggle" role="tablist" aria-label="Mode">
  <button id="mode-manual" role="tab" aria-selected="true">Manual</button>
  <button id="mode-mudra"  role="tab" aria-selected="false">Mudra</button>
</div>
<div id="mudra-status" class="conn-manual">Manual</div>
```

On every mode change, atomically: cancel any reconnect timer, stop the
status-poll, close any open socket, reset `connToken`, then either
(Manual) leave `connectionState = "idle"` OR (Mudra) call `openSocket()`.

---

## Section 16 — Footer Branding — "Created by Mudra"

Every generated app MUST render a small footer/badge with the **exact**
text **`Created by Mudra`**. Never "Created with Mudra Studio", never
"Powered by Mudra", never any other variant. The badge is a 2D DOM
overlay (disappears in immersive WebXR like the rest of the chrome).

```html
<div id="mudra-badge" style="
  position: fixed; bottom: 8px; right: 12px;
  padding: 4px 10px; border-radius: 999px;
  font-size: 0.75rem; font-family: system-ui, sans-serif;
  background: rgba(0,0,0,0.5); color: #fff; opacity: 0.85;
  z-index: 9999; pointer-events: none;">Created by Mudra</div>
```

Position is flexible if it would overlap the simulator panel — keep the
text identical.

---

## Section 17 — Onboarding Modal (mandatory, STRICT) — feature 008-strict-onboarding-templates

> **Supersedes feature 005's loose modal rules.** The locked layout is
> **Template 3 — split-card**. The DOM, CSS, and JS below MUST be emitted
> **verbatim**. Only the per-app content slots may vary.

Every generated XR app MUST ship a first-run onboarding modal that greets
the user and lists every action the app supports, with paired **Mudra** and
**Manual** controls per action. The modal closes via `×` (skip), the
**Continue** button, or `Escape`. It re-opens via a small floating `?` icon
**only outside immersive XR** — in-XR re-onboarding is out of scope for v1
(per feature 005 clarification Q3).

The binding contract is `specs/008-strict-onboarding-templates/contracts/onboarding-block.md`. The blocks below are the verbatim copies emitted into every app.

### XR-specific behavior (read carefully — unchanged from feature 005)

The onboarding modal is a **2D HTML overlay** shown before immersive entry.

- **MANDATORY: Disable the XR Blocks default Welcome overlay.** When the
  Simulator addon is imported (`import 'xrblocks/addons/simulator/SimulatorAddons.js';`),
  XR Blocks injects its own "Welcome to XR Blocks!" intro modal. This
  overlay competes visually with the Mudra onboarding modal and must be
  suppressed. Immediately after constructing the options object, set:

  ```js
  const options = new xb.Options();
  options.simulator.instructions.enabled = false; // suppress XR Blocks default Welcome overlay; the Mudra onboarding modal replaces it
  // ...rest of options config
  xb.init(options);
  ```

- **Do NOT** mirror the Mudra modal as a 3D panel inside the XR scene. In-XR re-onboarding is explicitly out of scope for v1.
- The inline `<script>` already listens for `xrsession-start` / `vr-session-start` / `ar-session-start` events and hides both the modal and the `?` icon during immersive sessions. Do NOT edit that wiring.
- The modal layers above the XR canvas in 2D mode (`z-index: 100`). The Mudra badge from Section 16 and the simulator panel sit beneath it, by design.

### Required palette addition

Every generated app's `:root` MUST add one variable beyond the canonical palette:

```css
--on-primary: #0c0d10;  /* dark text on the primary-blue Continue button */
```

### Locked DOM (paste at end of `<body>`)

```html
<!-- === BEGIN onboarding-block === (Template 3 — Split Card, feature 008) -->
<!-- IMPORTANT: do NOT add the `open` attribute. In 3D apps this matters
     particularly — XR Blocks' canvas is appended to <body> AFTER this
     dialog, and a non-modal dialog (HTML `open`) does NOT enter the
     browser's top layer. The dialog looks visible but the canvas can
     intercept clicks on Continue / ×. The IIFE below calls showModal()
     on load, which elevates the dialog above XR Blocks' canvas
     regardless of z-index. -->
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

### Locked CSS (paste inside the existing `<style>` block in `<head>` — add one if the template does not have one)

```css
/* === BEGIN onboarding-block === (Template 3 — Split Card, feature 008) */
#mudra-onboarding{position:fixed;inset:0;border:0;padding:0;background:transparent;width:100%;height:100%;max-width:none;max-height:none;display:grid;place-items:center;z-index:100;color:var(--text);}
#mudra-onboarding::backdrop{background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);}
#mudra-onboarding[hidden],#mudra-onboarding:not([open]){display:none;}
.ob-card{position:relative;background:var(--card);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.08);border-radius:18px;width:min(720px,94vw);max-height:88vh;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:0;box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:'Poppins',system-ui,sans-serif;}
.ob-x{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;appearance:none;border:0;background:rgba(255,255,255,0.08);color:var(--text);font-size:18px;cursor:pointer;z-index:2;}
.ob-x:hover{background:rgba(255,255,255,0.16);}
.ob-left{padding:36px 28px;background:linear-gradient(135deg,rgba(108,140,255,0.16),rgba(185,124,255,0.12));border-right:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;justify-content:space-between;border-radius:18px 0 0 18px;}
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

### Locked JS (paste inside an inline `<script>` — NOT `type="module"` — at end of `<body>`)

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
    return !!(window.xb && window.xb.session && window.xb.session.isImmersive);
  }
  function openOb()  { if (!root.open) root.showModal(); help.hidden = true; }
  function closeOb() { if (root.open)  root.close();    help.hidden = false; }

  // Close wiring — BOTH `.ob-x` and `.ob-continue` carry [data-ob-close].
  // This single querySelectorAll attaches the same `closeOb` to each;
  // do not add separate listeners or split the behavior.
  root.querySelectorAll('[data-ob-close]').forEach(b => b.addEventListener('click', closeOb));

  // Re-open wiring — floating help-pill (mouse/touch) and the `?` key.
  // `?` is gated on isInImmersiveXR() so it never re-opens inside VR/AR.
  help.addEventListener('click', openOb);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.open) closeOb();
    if (e.key === '?' && !root.open && !isInImmersiveXR()) openOb();
  });

  // Hide modal + help during immersive XR sessions (preserves feature 005's contract).
  ['xrsession-start','vr-session-start','ar-session-start'].forEach(ev =>
    window.addEventListener(ev, () => { if (root.open) root.close(); help.hidden = true; })
  );

  // Open on load — UNCONDITIONAL showModal(). The dialog enters the
  // browser's top layer so XR Blocks' canvas (appended after this
  // script) can never intercept clicks on Continue / ×. Do not gate on
  // `root.open`; do not use `root.show()`.
  root.showModal();
})();
// === END onboarding-block ===
```

### Close behavior — what each control does (verbatim explanation for the model)

| Control | When it fires | Effect |
|---|---|---|
| **Continue** (`.ob-continue`) | User clicks / activates the primary CTA in the right column | `root.close()`. Help-pill `?` becomes visible bottom-right. User starts using the app (or enters XR via the XR Blocks button). |
| **×** (`.ob-x`) | User clicks / activates the circular X in the top-right of the card | Same as Continue — `root.close()` + show `?` pill. The two paths are intentionally equivalent. X is the visual "skip" affordance. (Exception: AI-Setup extension blocks both Continue and × until a valid API key is entered — see "AI-app extension" below.) |
| **Escape** | User presses Esc while modal is open | Native `<dialog>` close + our `keydown` handler unhides the `?` pill. (AI extension also intercepts this via the `cancel` event when no valid key is set.) |
| **`?` key** | User presses `?` while modal is closed AND NOT inside immersive XR | `root.showModal()` reopens. Inside VR/AR the key is a no-op so the user is never yanked out of the scene. |
| **Help-pill** (`#mudra-onboarding-help`) | User clicks the floating `?` button bottom-right (visible only after the modal has been closed once, and hidden during immersive XR) | `root.showModal()` reopens. |
| **`xrsession-start` / `vr-session-start` / `ar-session-start`** | User enters VR/AR via the XR Blocks Enter button | Force-close the modal; hide the help-pill so it does not appear in-world. |
| **Page load** | Every fresh render | `root.showModal()` runs unconditionally inside the IIFE. Help-pill starts hidden. |

### How "close" is wired (REQUIRED — do not refactor)

1. Both close buttons carry the `data-ob-close` attribute. The single line `root.querySelectorAll('[data-ob-close]').forEach(b => b.addEventListener('click', closeOb))` is the entire mouse/touch close wiring. The AI-Setup extension below adds its own `capture:true` listener on top of these to gate close when no API key is present — it does not replace the underlying wiring.
2. Keyboard close is handled by the `document`-level `keydown` listener so Escape fires even when focus is outside the dialog.
3. Opening on load uses `root.showModal()` (modal mode, top layer). Never `root.show()` (non-modal) and never the `open` attribute in HTML. In 3D apps this is REQUIRED — non-modal dialogs do not enter the top layer and XR Blocks' canvas can intercept clicks behind the modal.

### Anti-patterns — will fail review

- ❌ `<dialog ... open>` in HTML. Open via `showModal()` only.
- ❌ Calling `root.show()` instead of `root.showModal()`.
- ❌ Omitting `options.simulator.instructions.enabled = false;` — XR Blocks' Welcome overlay then competes with the Mudra modal.
- ❌ Adding click-outside-to-close, time-out auto-close, or any extra close path.
- ❌ Hiding `#mudra-onboarding-help` permanently after first close — it must reappear (and remain hidden ONLY during immersive XR).
- ❌ Wiring `closeOb` to a button that lacks the `data-ob-close` attribute.
- ❌ Differentiating × from Continue behaviorally (e.g., "X means skip, Continue means save"). They are the same close path.

### Per-app content slots — the ONLY things you may vary

| Slot | Source | Notes |
|---|---|---|
| `{APP_NAME}` (`data-app-name`) | Derived from generated HTML filename | Override only to fix acronym capitalization (e.g., `data-app-name="AR Menu"` for `ar-menu.html`). |
| `{APP_NAME_HEAD}` / `{APP_NAME_TAIL}` | App name split into leading word + trailing word(s). Trailing word gets the `<em>` accent. | Single-word names: HEAD is whole word, TAIL is empty (emit `<em></em>`). |
| `{APP_TAGLINE}` | One-line description. MUST end with a period. MUST NOT exceed 90 characters. | Example: "Stack blocks with a flick of the wrist." |
| `MUDRA_ONBOARDING_ACTIONS` | Per `actions-array.md`. | See filter rule below. |

### `MUDRA_ONBOARDING_ACTIONS` shape (renamed from feature-005 `ACTIONS`)

```js
window.MUDRA_ONBOARDING_ACTIONS = [
  { action: "Toggle XR session", mudra: "Thumb tap", manual: "Enter",       mode: "gesture" },
  { action: "Look around",       mudra: "Lift wrist", manual: "Right-click + drag", mode: "imu_acc" },
  { action: "Move",              mudra: "Swipe",      manual: "W A S D",    mode: "nav_direction" }
];
```

Each row has four required fields:

- **`action`** — the behavior in plain English (NOT the control name).
- **`mudra`** — the Mudra control prose (`"Tap"`, `"Twist"`, `"Press 70%"`, `"Tilt left"`).
- **`manual`** — keyboard / mouse fallback. Use `"—"` (em dash) if there is no Manual equivalent (common in XR for camera / look controls).
- **`mode`** — one of: `gesture` | `button` | `pressure` | `navigation` | `nav_direction` | `imu_acc` | `imu_gyro` | `snc`.

### App-aware filter — STRICT (feature 008, FR-010)

Before emitting `MUDRA_ONBOARDING_ACTIONS`, the skill MUST filter:

1. **Build the subscribed set** — every canonical signal this specific app subscribes to.
2. **Drop every row** whose `mode` is not in the subscribed set. **Forbidden** to emit a row for an unsubscribed signal — that is a generation-time bug, not a runtime filter.
3. **Verify exactly one motion mode** (`navigation` | `nav_direction` | `imu_acc`/`imu_gyro` family) across all rows (Constitution Principle III).
4. **Verify Manual ↔ Mudra parity** — every row has both a Mudra and a Manual cell; `"—"` is the only acceptable Manual placeholder.
5. **No collisions** — no two rows share the same `manual` value or the same effective `mudra` value.

### Anti-patterns (will fail review)

- ❌ Omitting `options.simulator.instructions.enabled = false;` — the XR Blocks default Welcome overlay then duplicates / overrides the Mudra onboarding modal.
- ❌ Mirroring the modal as a 3D panel inside the XR scene (out of scope v1).
- ❌ Editing the `xrsession-start` / `xrsession-end` hide-show wiring.
- ❌ Emitting a row whose `mode` is not in the app's subscribed set.
- ❌ Mixing two motion modes in the same array.
- ❌ A row with `manual: null` or `manual: ""` — use `"—"`.
- ❌ Two rows with the same `manual` value — keyboard collision.
- ❌ Branding strings other than literal `Created by Mudra`. ("Mudra Studio" stays only as the `.ob-brand-mark` line above the app name.)
- ❌ CTA labels other than `Continue`.

Binding contracts: `specs/008-strict-onboarding-templates/contracts/onboarding-block.md` and `specs/008-strict-onboarding-templates/contracts/actions-array.md`.

### AI-app extension (mandatory when `usesAI`)

The AI-Setup fragment is rendered as an **extra row inside `.ob-chip-grid`** — not as a separate section. The fragment goes at the **top** of the chip grid (above all action chips) so the user sees it before any controls.

```html
<!-- Inject AS THE FIRST CHILD of #ob-rows when usesAI is true -->
<div class="ob-chip ob-chip-ai" id="ob-chip-ai" data-role="ai-setup">
  <span class="nm">AI key</span>
  <input class="mudra-onb__ai-input" type="password" placeholder="AIza…" aria-label="Gemini API key" autocomplete="off" />
  <span class="mn" data-role="hint" aria-live="polite"></span>
</div>
```

```css
/* Append to the locked onboarding-block CSS for AI-using apps only */
.ob-chip-ai{grid-template-columns:auto 1fr auto;}
.ob-chip-ai .mudra-onb__ai-input{appearance:none;background:rgba(255,255,255,0.04);color:var(--text);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:6px 10px;font:inherit;font-size:13px;}
.ob-chip-ai .mudra-onb__ai-input:focus{outline:2px solid var(--primary);outline-offset:0;}
.ob-chip-ai .mn[data-role="hint"]{color:var(--warning);}
```

The IIFE that wires the modal MUST be extended with this gating block, inserted just before the final unconditional `root.showModal();`:

```js
// AI-Setup gating — only runs when the fragment is present (usesAI === true)
const aiFragment  = document.getElementById('ob-chip-ai');
const continueBtn = root.querySelector('.ob-continue');
const closeBtn    = root.querySelector('.ob-x');
const KEY_NAME    = "mudra.gemini.apiKey";
const KEY_REGEX   = /^AIza[\w-]{30,}$/;

const hasValidStoredKey = () => {
  const k = sessionStorage.getItem(KEY_NAME);
  return typeof k === "string" && KEY_REGEX.test(k.trim());
};

if (aiFragment) {
  const input = aiFragment.querySelector(".mudra-onb__ai-input");
  const hint  = aiFragment.querySelector('[data-role="hint"]');

  const refreshGate = () => {
    if (hasValidStoredKey()) {
      aiFragment.hidden = true;
      continueBtn.disabled = false;
      return;
    }
    aiFragment.hidden = false;
    const v = input.value.trim();
    const ok = KEY_REGEX.test(v);
    continueBtn.disabled = !ok;
    hint.textContent = (!v || ok) ? "" : "Key should start with \"AIza\" and be ~39 chars.";
  };

  input.addEventListener("input", refreshGate);
  refreshGate();

  continueBtn.addEventListener("click", () => {
    const v = input.value.trim();
    if (KEY_REGEX.test(v)) sessionStorage.setItem(KEY_NAME, v);
  }, { capture: true });

  const blockClose = (e) => {
    if (hasValidStoredKey()) return;
    e.preventDefault();
    e.stopPropagation();
    input.focus();
  };
  closeBtn.addEventListener("click", blockClose, { capture: true });
  root.addEventListener("cancel", blockClose); // Escape
}
```

When the AI fragment is **absent** (non-AI app), the existing wiring runs untouched — `Continue` enables immediately, `Escape` / `×` dismiss as normal.

> **Migration note (feature 008, 2026-05-14):** the legacy `ACTIONS` variable is renamed to `MUDRA_ONBOARDING_ACTIONS`. The legacy `mudra-onb__*` class names from feature 005 are replaced by `ob-*` (the locked block's class names). The `Got it` CTA label is renamed to `Continue`. The AI-Setup fragment moves from `.mudra-onb__body` (separate section) into `.ob-chip-grid` (first chip).

---

## Section 18 — Visible AI Chat I/O (mandatory when `usesAI`)

Every AI-using app MUST render the conversation as on-screen text in the
3D scene — TTS / speech synthesis is optional, never a substitute.

### Required visible elements

| Element | What it shows | How to render |
|---------|---------------|---------------|
| **Purpose line** | One short sentence stating what the app does ("Ask anything — I'll answer.", "Tell me the date.", etc.). Visible at all times. | Troika `Text` or a top row in an `xb.SpatialPanel`. |
| **User input echo** | The latest user message (transcript from speech recognition OR typed text). Updates as soon as input is captured. | A bordered/highlighted row in the panel, e.g. prefixed `💬 You: …`. |
| **AI response** | The most recent AI reply in full readable text. Scrollable / wrapping. | `xb.ScrollingTroikaTextView` or a tall row in the panel, prefixed `🤖 AI: …`. |
| **Listening / Thinking indicator** | Distinguishes idle / listening / thinking states. | Avatar pulse + a single-word status line ("Listening…", "Thinking…", "Tap to talk"). |

### Rules

1. **Both sides of every exchange must be visible.** Voice-only output
   is a checklist failure. The chat panel must accumulate at least the
   last user turn AND the last AI turn at the same time.
2. **The Purpose line is fixed** for the lifetime of the app. Author it
   from the user's prompt — e.g. `"Create 3d AI I can ask the date"` →
   Purpose `"Voice assistant — ask anything, tap to talk."`. Never use
   a placeholder like `"AI Chat"` alone.
3. **Show typed input when speech recognition is unavailable.** If
   `webkitSpeechRecognition` / `SpeechRecognition` are missing, render
   an `<input type="text">` inside an XR Blocks panel OR a 2D overlay
   below the simulator panel. Both echo and reply still render in the
   3D scene.
4. **When no API key is set yet**, the chat panel renders the literal
   text `Set up AI in the welcome panel` in the response slot — do not
   attempt any API call.
5. **TTS** (`speechSynthesis`) is allowed but optional. If present, it
   speaks the AI response in addition to displaying it. Never as a
   replacement.
