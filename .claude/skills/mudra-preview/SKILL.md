---
name: mudra-preview
version: 3.1.1
description: Generate a working Mudra Band interactive app preview as a single-file HTML. Use when the user describes a Mudra-controlled experience (gesture, pressure, navigation, IMU, SNC), wants to prototype a Mudra Companion app, or asks to build/preview a Mudra app.
---

# Mudra Preview

Generate a complete, working single-file HTML app controlled by Mudra Band signals.

**Mandatory feature :** Every generated app MUST
include a Manual/Mudra **Mode toggle** as defined in `references/prompt.md`
§ "Mode Toggle (Manual / Mudra) — Required". Manual is the default; Mudra
opens a single WebSocket lazily and disables the simulator panel so signals
come only from the band.

**No disconnect overlay:** Do **not** render a "Band disconnected" overlay,
toast, or any other separate disconnect alert. Connection state is
communicated **only** through the existing connection-status pill (which
shows "Connecting…" / "Connected" / "Disconnected"). No extra notice,
no banner, no modal.

**Branding:** The footer/badge text MUST be exactly
**"Created by Mudra"** — never "Created with Mudra Studio" or any
other variant.

**Mandatory feature :** Connection state MUST reflect
the **band**, not the WebSocket. The Companion service accepts socket
connections even when no band is paired. Every generated app MUST:
1. Send `{command:"get_status"}` immediately in `ws.onopen` (no waiting for any
   server-initiated frame — the new server sends none).
2. Poll `get_status` every 2 s while in Mudra mode.
3. Use the rule **`device.firmware && device.serial_number` both non-null** to
   determine band-connected (not `device.state` alone).
4. Display a **6-state connection label**: `Connecting…` / `Mudra connected`
   (with hand chip LEFT/RIGHT) / `WebSocket only` (orange `#eab308`, hand
   `None`) / `Reconnecting…` / `Already in use by another tab` (terminal).
5. Auto-reconnect with backoff [1, 2, 5, 10]s on non-conflict WebSocket drops.
   Do NOT retry after `client_already_connected` — show the terminal message.

The canonical protocol is in `references/agent_protocol.json`.

## Steps

1. **Read the full instructions** from `references/prompt.md` inside the skill base directory. That file contains the complete protocol contract, signal compatibility rules, the Mode Toggle architecture (mandatory), build defaults, and sample catalog — follow all of it.

2. **Infer intent** from the user's description (or the args passed to this skill). Fill gaps with smart defaults. Ask only if there is genuine ambiguity (e.g., `gesture` vs `pressure`, `navigation` vs `nav_direction`, or directional motion vs IMU+Biometric bundle).

3. **Select the best-matching template** from `assets/` inside the skill base directory. Use the selection rule from `references/prompt.md` (motion mode → interaction pattern → signal overlap).

4. **Generate the app** as a single self-contained HTML file:
   - Follow every rule in `references/prompt.md` (protocol contract, signal compatibility, mock WebSocket, theme, fallbacks)
   - Choose a color palette that matches the concept — never default to dark unless the concept calls for it
   - Include the Mudra badge, connection indicator, telemetry HUD, simulator panel (see below), and keyboard fallbacks

### Simulator Panel (Required)

Every generated app MUST include a **compact, always-visible simulator panel** with one button set per subscribed signal. The user must be able to trigger every signal with a click — so they can test without the band, or alongside it.

**Layout rules**
- One thin horizontal strip (usually in or just below the header, or pinned to the bottom edge).
- **Always visible** — do NOT hide when the band is connected.
- Group by signal. Use short labels so it stays compact (e.g., `Tap`, `2Tap`, `Twist`, `↑`, `↓`, `Roll L`).
- Reuse the existing `.btn` style from the chosen template.
- No drawers, no collapse, no accordion — one click to fire.

**Buttons per signal** (only render the groups for signals the app actually subscribes to)

| Signal | Buttons |
|---|---|
| `gesture` | `Tap`, `2Tap`, `Twist`, `2Twist` |
| `nav_direction` | `↑`, `↓`, `←`, `→`, `Roll L`, `Roll R` |
| `navigation` | `↑`, `↓`, `←`, `→` (each click emits one delta event of ±8) |
| `pressure` | Slider `0–100%` (or `−` / `+` buttons if horizontal space is tight) |
| `button` | `Press`, `Release` |
| `imu_acc` | `Tilt X`, `Tilt Y`, `Tilt Z` (each fires a 5-frame burst at ±2 m/s²) |
| `imu_gyro` | `Rot X`, `Rot Y`, `Rot Z` (each fires a 5-frame burst at ±10 deg/s) |
| `snc` | `Spike` (injects a burst of elevated samples on all 3 channels) |

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

5. **Save the output** to `preview/<concept-name>.html` in the project root (create the `preview/` directory if it doesn't exist). Use a short kebab-case name derived from the concept (e.g., `preview/drum-machine.html`).

6. **Report the file path** so the user can open it in a browser immediately.

## Default Signal Set 

Unless the user explicitly asks for a different signal, every generated
app MUST restrict itself to **at most these signals** (subject to the
exclusivity rules below):

1. **One** of `pressure` **or** `gesture` — never both. `gesture` and
   `pressure` are mutually exclusive.
   - **Tap exclusivity rule** (within `gesture`): use `tap` OR `double_tap`
     — **never both together** unless the user explicitly names both (e.g.,
     "use single tap for X and double tap for Y").
     - `tap` → frequent/lightweight: counter increment, navigation step,
       toggle, next/back, select, trigger. **Default choice.**
     - `double_tap` → only when the user explicitly requests it by name.
       Never pair it with `tap` as a default two-action scheme.
     - Generic synonyms ("tap", "click", "press") → `tap`.
     - When an app needs **two distinct gesture actions** (e.g., forward +
       backward), pair `tap` with `twist` — not with `double_tap`.
       `double_tap` is reserved for explicit user requests only.
2. **One** directional signal — either `nav_direction` **or**
   `navigation`, never both.

Rules:

- Drop any of the above if the concept does not need it (e.g., a pure
  tap-counter subscribes to `gesture` only and skips the directional
  signal).
- **`gesture` and `pressure` are mutually exclusive** — pick one
  interaction model per app. Tap/twist concepts → `gesture`. Analog
  concepts (volume, brush, throttle) → `pressure`.
- `nav_direction` and `navigation` are **mutually exclusive per app** —
  pick the one that fits the interaction (discrete swipes →
  `nav_direction`; continuous cursor/scroll → `navigation`). Never wire
  both into the same app.
- **IMU+Biometric bundle (`imu_acc` + `imu_gyro` + `snc`) is
  inseparable.** If the concept needs any one of them, subscribe to all
  three. The bundle is **mutually exclusive** with `navigation` and
  `nav_direction` — pick directional motion OR the IMU+Biometric bundle,
  never both.
- Other gesture subtypes (`twist`, `double_twist`, etc.) and other
  signals (`button`, `imu_acc`, `imu_gyro`, `snc`) are **off by
  default**. Only include them when the user's prompt names them,
  names a synonym from the Signal Inference table in
  `references/prompt.md` § "Signal Inference Reference", or describes
  an interaction that genuinely cannot be expressed with the defaults
  (e.g., "tilt to steer" → IMU+Biometric bundle; "hold to charge" →
  `button`).
- Battery level and charging state are available via `device.battery` / `device.charging` in the
  `get_status` / `get_device_info` response.
- The simulator panel must mirror whichever subset the app actually
  subscribes to — do not render buttons for signals that are not wired.

## Quick Reference

- WebSocket endpoint: `ws://127.0.0.1:8766` (bare URL — NOT `/events`)
- Mode toggle (Manual / Mudra) is **mandatory** in every generated app — see `references/prompt.md` § "Mode Toggle (Manual / Mudra) — Required"
- Lazy WS lifecycle: open on Manual→Mudra, close on Mudra→Manual. Manual mode opens NO WebSocket.
- Subscribe one signal per command: `{ "command": "subscribe", "signal": "<name>" }` — singular `signal`, never `signals`, never an array
- Motion modes are mutually exclusive: Pointer (`navigation`+`button`) / Direction (`nav_direction`) / IMU+Biometric (`imu_acc`+`imu_gyro`+`snc`, always all three together)
- IMU+Biometric bundle: `imu_acc`, `imu_gyro`, `snc` always subscribed together — never partially. The bundle is mutually exclusive with `navigation` and `nav_direction`.
- `gesture` and `pressure` are mutually exclusive — never combine them
- `button` combines freely with `gesture`, `pressure`, `snc`, `imu_acc`, `imu_gyro` (subject to the Pointer/Direction/IMU motion-mode XOR — `button` belongs to Pointer mode and never combines with `nav_direction`).
- **Navigation sensitivity is gentle by default**: keyboard `step = 3`, sim button `±3`, cursor multiplier `0.002`. Raise only when the prompt explicitly asks for fast/snappy movement. See `references/prompt.md` § "Navigation sensitivity defaults".
- Canonical protocol JSON: `references/agent_protocol.json`
