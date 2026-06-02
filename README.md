##<p align="center">
 ## <img src="docs/assets/images/mudra-hero.svg" alt="Mudra Studio" width="700">
##</p>

<h1 align="center">Mudra Studio</h1>

<p align="center">
  <strong>The programmable neural input platform for Mudra wearable devices</strong><br>
  Build applications with gesture, pressure, cursor, motion, and SNC signals from the wrist.
</p>

<p align="center">
  <a href="https://wearable-devices.github.io/mudra-skills/">Live Demos</a> &nbsp;|&nbsp;
  <a href="#option-1--npx-recommended">npx Install</a> &nbsp;|&nbsp;
  <a href="#option-2--claude-skill-zip">Claude Skill</a> &nbsp;|&nbsp;
  <a href="#option-3--copy-paste-prompt">Copy-Paste Prompt</a> &nbsp;|&nbsp;
  <a href="#option-4--claude-plugin">Claude Plugin</a> &nbsp;|&nbsp;
  <a href="#option-5--public-gem-gemini">Public Gem</a>
</p>

---

## Build with real wrist-level input

Mudra Studio is the developer platform and software layer for interacting with Mudra Band, Mudra Link, and supported Wearable Devices hardware.

It turns wrist-level gesture, pressure, cursor, motion, and surface nerve conductance signals into programmable input for applications, devices, AI systems, smart glasses, XR experiences, accessibility tools, games, creative tools, and HCI research.

This repository contains the **Mudra Plugin**, the AI-assisted development layer for Mudra Studio.

The Mudra Plugin helps AI coding tools generate working Mudra-powered applications from natural language prompts. It includes installable skills, prompt packs, signal vocabulary, protocol rules, templates, examples, and fallback patterns.

Generated apps connect locally to the Mudra runtime over WebSocket:

```text
ws://127.0.0.1:8766
```

Today, live hardware input is streamed through **Mudra Companion** for macOS and Windows.

Soon, Mudra Companion will be replaced by the new **Mudra Link App**. Select beta users will receive access through the beta program during the first week of June 2026. No action is required for current users.

Apps can also run without hardware using simulator controls, mock WebSocket fallback, and keyboard shortcuts.

---

## Product hierarchy

Use these terms consistently:

| Name | Meaning |
|---|---|
| **Mudra Studio** | Developer platform and software layer for Mudra wearable input |
| **Mudra Link / Mudra Band** | Wearable hardware input devices |
| **Mudra Companion** | Current desktop runtime app for macOS and Windows |
| **Mudra Link App** | Upcoming runtime replacement for Mudra Companion |
| **Mudra Plugin** | AI-assisted build layer contained in this repository |
| **Mudra Skills** | Tool-specific skill bundles used by Claude, Gemini, and other AI coding tools |
| **Creator SDK** | Reviewed-access SDK layer for deeper integrations, raw signal workflows, and production use |

---

## What you can build

Mudra Studio is built for developers exploring input beyond screens, cameras, controllers, and voice.

Examples:

- AI agent approval and silent command interfaces
- smart-glasses and XR navigation
- hands-free menu systems
- accessibility input systems
- cursor and directional control
- gesture-controlled games
- pressure-based creative tools
- SNC and EMG-style signal visualizers
- HCI research prototypes
- device control and interaction demos

Example interaction mappings:

```text
Tap → select, confirm, approve, trigger
Double Tap → secondary action, menu, mode switch
Tap & Hold → charge, hold, zoom, volume, intensity
Tap & Hold + Move → drag, lasso, move, throw
Hand Twist → undo, back, escape, switch mode
Arm Position → cursor, pointer, panning, spatial navigation
Pressure → analog control, brush size, force, speed, zoom
Motion → tilt, orientation, movement-aware interaction
SNC Channels → advanced signal visualization and research workflows
```

---

## Skills included

The Mudra Plugin includes three main skills:

| Skill | Purpose | Use when |
|---|---|---|
| **mudra-master** | Main router skill | You want the AI to decide the right app type |
| **mudra-preview** | 2D HTML app builder | You want browser apps, dashboards, tools, games, or demos |
| **mudra-xr** | WebXR / 3D / AR builder | You want smart-glasses HUDs, spatial UI, XR, AR, or 3D experiences |

Recommended default:

```text
mudra-master
```

Use `mudra-master` unless you already know the exact target format.

---

## Install options

| Route | Best for | Result |
|---|---|---|
| **npx install** | Claude Code CLI users | Installs all three skills globally |
| **Claude Skill zip** | Claude Desktop or project-specific installs | Imports one skill package |
| **Copy-Paste Prompt** | Cursor, Aider, ChatGPT, and other AI tools | Fetches the skill into the current project |
| **Claude Plugin** | Global Claude Code plugin usage | Installs and updates through Claude plugin commands |
| **Public Gemini Gem** | Gemini users | Zero-install app generation in Gemini |

---

## Table of Contents

- [Build with real wrist-level input](#build-with-real-wrist-level-input)
- [Product hierarchy](#product-hierarchy)
- [What you can build](#what-you-can-build)
- [Skills included](#skills-included)
- [Install options](#install-options)
- [Live Demos](#live-demos)
- [Quick Start](#quick-start)
  - [Option 1 — npx Recommended](#option-1--npx-recommended)
  - [Option 2 — Claude Skill zip](#option-2--claude-skill-zip)
  - [Option 3 — Copy-Paste Prompt](#option-3--copy-paste-prompt)
  - [Option 4 — Claude Plugin](#option-4--claude-plugin)
  - [Option 5 — Public Gem Gemini](#option-5--public-gem-gemini)
- [Runtime connection](#runtime-connection)
- [Supported Signals](#supported-signals)
- [Build constraints](#build-constraints)
- [Example Prompts](#example-prompts)
- [Demo App Gallery](#demo-app-gallery)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Live Demos

Try these apps directly in your browser. No Mudra hardware is required for demo mode. Use the built-in simulator buttons or keyboard shortcuts.

### 2D Apps

| App | Signals | Live Link |
|---|---|---|
| Duck Hunt Remastered | navigation + gesture | [Open Demo](https://wearable-devices.github.io/mudra-skills/demos/2D/duck/) |
| Movable Box | nav_direction | [Open Demo](https://wearable-devices.github.io/mudra-skills/demos/2D/movable-box.html) |
| Pocket Deck | gesture | [Open Demo](https://wearable-devices.github.io/mudra-skills/demos/2D/pocket-deck.html) |
| One-Handed Recipe Coach | gesture | [Open Demo](https://wearable-devices.github.io/mudra-skills/demos/2D/recipe-coach.html) |

### 3D / XR Apps

| App | Signals | Live Link |
|---|---|---|
| 3D Color Picker | navigation + button | [Open Demo](https://wearable-devices.github.io/mudra-skills/demos/3D/3d-color-picker.html) |
| Floating Drum Kit | gesture | [Open Demo](https://wearable-devices.github.io/mudra-skills/demos/3D/floating-drum-kit.html) |
| Rubik's Cube XR | nav_direction | [Open Demo](https://wearable-devices.github.io/mudra-skills/demos/3D/rubiks-cube-xr.html) |
| XR TV | nav_direction + gesture | [Open Demo](https://wearable-devices.github.io/mudra-skills/demos/3D/xr-tv.html) |

> All demos include a mock WebSocket fallback. They work in a browser without the wearable connected.

---

## Quick Start

Install the Mudra Plugin into your AI coding tool.

All install routes load the same Mudra Studio build toolbox.

---

### Option 1 — npx Recommended

Best for Claude Code CLI users who want a one-command global install.

Prerequisites:

- Node.js 18 or later
- npm / npx
- Claude Code CLI

Install:

```bash
npx mudra-skills
```

This installs three skills globally:

```text
mudra-master
mudra-preview
mudra-xr
```

Installed location:

```text
~/.claude/skills/
```

Restart Claude Code after installation.

Usage:

```text
/mudra-master build me a snake game controlled by directional gestures
```

Update anytime:

```bash
npx mudra-skills@latest
```

---

### Option 2 — Claude Skill zip

Best for Claude Desktop or project-specific use.

Download the skill zip you want:

| Skill | Download |
|---|---|
| **mudra-master** recommended | [mudra-master.zip](Skill%20download/mudra-master.zip) |
| **mudra-preview** 2D apps only | [mudra-preview.zip](Skill%20download/mudra-preview.zip) |
| **mudra-xr** WebXR / 3D / AR apps only | [mudra-xr.zip](Skill%20download/mudra-xr.zip) |

Install in Claude Desktop:

```text
Settings → Skills → Import skill → select the zip
```

Or install in a project:

```text
.claude/skills/
```

Recommended usage:

```text
/mudra-master build me a relaxing bubble garden I can grow with pressure
```

Example session:

```text
You: /mudra-preview presentation controller with slide navigation and laser pointer

Claude:
I'll create a presentation controller using:
- nav_direction for slide navigation
- gesture for actions
- pressure for zoom control

Saved to: preview/presentation-controller.html
Open it in your browser to test with the simulator panel.
```

![Presentation Controller](docs/assets/images/presentation-controller-screenshot.svg)

---

### Option 3 — Copy-Paste Prompt

Best for Cursor, Aider, ChatGPT, Claude web, or any AI coding tool that can fetch URLs and edit files.

Paste this as your first message:

```text
Please set up Mudra Studio for this session by doing the following steps in order:

1. Fetch https://github.com/wearable-devices/mudra-skills/blob/main/Skill%20download/mudra-master.zip, unzip it in my current folder so I can use it, and read the SKILL.md inside. This is your main reference for everything Mudra.

2. Confirm you are ready by replying with:
✅ Mudra Studio loaded.
Routing buckets: 2D HTML Apps · WebXR / AR

Then ask me what I would like to build.
```

Note for web-based AI tools:

Generated HTML must be saved locally and opened from your computer to reach the local WebSocket endpoint:

```text
ws://127.0.0.1:8766
```

Browser previews hosted inside an AI tool usually cannot connect to your local runtime.

---

### Option 4 — Claude Plugin

Best for Claude Code CLI users who want a global plugin install with update support.

Prerequisites:

- Claude Code CLI
- Claude Pro, Max, or Team subscription

Run inside Claude Code:

```text
/plugin marketplace add https://github.com/wearable-devices/mudra-skills
/plugin install mudra@mudra-band
/reload-plugins
```

What you get:

- `mudra-master`
- `mudra-preview`
- `mudra-xr`

Update:

```text
/plugin update mudra && /reload-plugins
```

---

### Option 5 — Public Gem Gemini

Best for Gemini users who want zero install.

Open the Mudra Studio Master Gem:

[Open Mudra Studio Master Gem](https://gemini.google.com/gem/29d975c9c7c0)

Describe the app you want. The Master Gem routes automatically between 2D and 3D / XR.

Example:

```text
Create a music sequencer where I can use directional gestures to navigate the grid and tap to toggle beats on or off.
```

Expected output:

- single-file HTML app
- mock WebSocket fallback
- simulator panel
- keyboard shortcuts
- signal mapping summary

Note:

Gemini preview cannot usually reach your local runtime. Save the generated HTML to your computer and open it locally to connect to:

```text
ws://127.0.0.1:8766
```

![Gemini Gem](docs/assets/images/gemini-gem-screenshot.svg)

All Gems:

| Gem | Link |
|---|---|
| Mudra Studio Master auto-routes 2D / 3D | [Open Gem](https://gemini.google.com/gem/29d975c9c7c0) |
| Mudra Studio 2D | [Open Gem](https://gemini.google.com/gem/79fd23ccf68f) |
| Mudra Studio 3D / XR | [Open Gem](https://gemini.google.com/gem/70714fabfb28) |

---

## Runtime connection

To use live hardware input, install the current Mudra runtime app.

Current runtime:

```text
Mudra Companion for macOS and Windows
```

Coming soon:

```text
Mudra Link App
```

Both serve the same role: they stream wearable signals locally to applications through the Mudra Studio signal endpoint.

Local endpoint:

```text
ws://127.0.0.1:8766
```

Today’s flow:

```text
Mudra Link / Mudra Band
        ↓
Mudra Companion
        ↓
Local WebSocket stream
ws://127.0.0.1:8766
        ↓
Your app
```

Upcoming flow:

```text
Mudra Link / Mudra Band
        ↓
Mudra Link App
        ↓
Local WebSocket stream
ws://127.0.0.1:8766
        ↓
Your app
```

Select beta users will receive the new Mudra Link App during the first week of June 2026. No action is required for current users.

If hardware is not connected, generated apps should still run with:

- mock WebSocket fallback
- simulator controls
- keyboard fallback

---

## Supported Signals

Mudra Studio exposes Mudra wearable input as programmable signal streams.

| Signal | Type | Description | Data Format |
|---|---|---|---|
| `gesture` | Discrete | Finger gestures | `{ type: "tap" \| "double_tap" \| "twist" \| "double_twist" }` |
| `button` | Binary | Air touch press/release | `{ state: "press" \| "release" }` |
| `pressure` | Analog | Finger pressure 0–100% | `{ value: 0–100 }` |
| `navigation` | Continuous | Pointer-style X/Y deltas | `{ deltaX: float, deltaY: float }` |
| `nav_direction` | Discrete | Directional wrist gestures | `{ direction: "up" \| "down" \| "left" \| "right" \| "roll_left" \| "roll_right" }` |
| `imu_acc` | Continuous | Accelerometer | `{ x: float, y: float, z: float }` |
| `imu_gyro` | Continuous | Gyroscope | `{ x: float, y: float, z: float }` |
| `snc` | Streaming | Surface nerve conductance channels | `{ data: [[ch1], [ch2], [ch3]] }` |
| `battery` | Status | Battery level and charging state | `{ level: 0–100, charging: bool }` |

Some advanced signals, raw workflows, and SDK features require approved SDK access or a RawData-enabled license.

---

## Build constraints

Generated Mudra apps should follow these constraints.

| Constraint | Reason |
|---|---|
| Use single-file HTML by default | Easy preview, sharing, and deployment |
| Connect through `ws://127.0.0.1:8766` | Standard local runtime endpoint |
| Include mock WebSocket fallback | Apps must work without hardware |
| Include simulator controls | Useful for demos, QA, and AI-generated testing |
| Include keyboard fallback | Fast browser testing |
| Declare signal mappings clearly | Users need to understand how the app is controlled |
| Route 2D vs XR explicitly | Prevents the wrong technical stack |
| Avoid unnecessary dependencies | Generated apps should run locally with minimal setup |
| Keep UI readable and simple | Input is gesture-first, not mouse-first |
| Support graceful failure | Apps should not break if hardware is unavailable |

---

## Example Prompts

### Games

```text
Space Invaders controlled by directional gestures to move and tap to shoot.
```

```text
A pong game where I tilt my wrist to move the paddle.
```

```text
Snake game using direction gestures for movement.
```

### Productivity

```text
Presentation controller. Swipe left and right for slides. Tap for laser pointer.
```

```text
Smart home dashboard. Navigate between rooms and tap to toggle devices.
```

```text
Document reader with gesture-based page scrolling and pressure zoom.
```

### AI agents

```text
Build an AI agent control panel. Tap to approve, twist to cancel, pressure to adjust response intensity.
```

```text
Create a silent command interface for smart glasses. Tap to confirm, double tap to open actions, twist to dismiss.
```

### Smart glasses and XR

```text
Smart-glasses notification HUD. Use Arm Position to move through cards, tap to select, twist to dismiss.
```

```text
Create a WebXR object selector. Move the cursor with Arm Position, tap to select, pressure to zoom.
```

### Creative

```text
Drum machine with tap and twist for different hits and pressure for velocity.
```

```text
Generative art canvas controlled by wrist tilt and rotation.
```

```text
Pressure-sensitive painting app with gesture-based color switching.
```

### Accessibility and research

```text
Gesture-to-speech app. Map subtle wrist gestures to common phrases.
```

```text
SNC visualizer showing three live channels in real time.
```

```text
Compare camera-based input with wrist-level gesture, pressure, and motion input.
```

---

## Demo App Gallery

### 2D Apps

| App | Description | Signals |
|---|---|---|
| [Duck Hunt Remastered](https://wearable-devices.github.io/mudra-skills/demos/2D/duck/) | Aim with your wrist and tap to fire — classic duck-hunt arcade revival. | `navigation` + `gesture` |
| [Movable Box](https://wearable-devices.github.io/mudra-skills/demos/2D/movable-box.html) | Wrist-controlled box. Directional gestures move it around the canvas. | `nav_direction` |
| [Pocket Deck](https://wearable-devices.github.io/mudra-skills/demos/2D/pocket-deck.html) | Hands-free slide deck. Tap to advance, double tap to go back. | `gesture` |
| [One-Handed Recipe Coach](https://wearable-devices.github.io/mudra-skills/demos/2D/recipe-coach.html) | Step-by-step cooking guide controlled with finger taps. | `gesture` |

### 3D / XR Apps

| App | Description | Signals |
|---|---|---|
| [3D Color Picker](https://wearable-devices.github.io/mudra-skills/demos/3D/3d-color-picker.html) | Pointer-driven 3D color wheel. Move to hue, press to lock the swatch. | `navigation` + `button` |
| [Floating Drum Kit](https://wearable-devices.github.io/mudra-skills/demos/3D/floating-drum-kit.html) | Spatial drum kit floating in front of the user. Tap and twist gestures hit pads. | `gesture` |
| [Rubik's Cube XR](https://wearable-devices.github.io/mudra-skills/demos/3D/rubiks-cube-xr.html) | Floating 3D Rubik's cube controlled by directional wrist gestures. | `nav_direction` |
| [XR TV](https://wearable-devices.github.io/mudra-skills/demos/3D/xr-tv.html) | Hands-free spatial TV. Swipe to change channels, tap to play or pause. | `nav_direction` + `gesture` |

---

## How It Works

### Architecture

<p align="center">
  <img src="docs/assets/images/architecture.svg" alt="Mudra Studio Architecture" width="800">
</p>

### Signal Flow

1. Mudra Link, Mudra Band, or supported wearable hardware captures wrist-level input.
2. The current runtime app, Mudra Companion, streams signals locally.
3. Soon, the Mudra Link App will replace Mudra Companion for selected beta users.
4. Your app connects to the local WebSocket endpoint:

```text
ws://127.0.0.1:8766
```

5. Your app subscribes to one or more signals:

```json
{ "command": "subscribe", "signal": "gesture" }
```

6. The runtime streams JSON messages to your app.
7. If the runtime is unavailable, the app uses mock WebSocket fallback.
8. The simulator panel and keyboard shortcuts allow testing without hardware.

### Keyboard Shortcuts

Every generated app should include keyboard fallback controls.

| Key | Action |
|---|---|
| `Space` | Trigger gesture tap |
| `Shift` | Button hold, press / release |
| `[` / `]` | Decrease / increase pressure |
| `Arrow Keys` | Navigation / direction / tilt |

---

## Project Structure

```text
mudra-skills/
├── .claude/
│   └── skills/
│       ├── mudra-master/             # Router skill
│       │   ├── SKILL.md
│       │   └── references/
│       ├── mudra-preview/            # 2D Mudra skill
│       │   ├── SKILL.md
│       │   ├── references/
│       │   │   └── promt.md          # Protocol spec and build rules
│       │   └── assets/               # Reference app templates
│       └── mudra-xr/                 # 3D / XR Mudra skill
│           ├── SKILL.md
│           ├── references/
│           │   ├── promt.md          # XR build rules
│           │   └── xrpromt.md        # XR Blocks reference corpus
│           └── assets/               # WebXR reference assets
├── docs/                             # GitHub Pages site
│   ├── index.html
│   ├── demos/
│   └── assets/images/
├── gemini-gem/
│   ├── gemini-master.prompt.md
│   ├── gemini-2d.prompt.md
│   └── gemini-3d.prompt.md
├── Skill download/                   # Pre-packaged zip files
│   ├── mudra-master.zip
│   ├── mudra-preview.zip
│   └── mudra-xr.zip
├── preview/                          # Generated apps land here
└── README.md
```

---

## Contributing

### Adding New Templates

1. Generate an app using `mudra-master`, `mudra-preview`, or `mudra-xr`.
2. Test it with simulator controls.
3. Test it with keyboard fallback.
4. Test it with live hardware when available.
5. Move the HTML file into the relevant assets folder.
6. Update examples if the template adds a new interaction pattern.

### Improving the Skills

- **Claude Master skill**: edit `.claude/skills/mudra-master/SKILL.md`
- **Claude 2D skill**: edit `.claude/skills/mudra-preview/references/promt.md`
- **Claude 3D / XR skill**: edit `.claude/skills/mudra-xr/references/promt.md`
- **Gemini Master Gem**: edit `gemini-gem/gemini-master.prompt.md`
- **Gemini 2D Gem**: edit `gemini-gem/gemini-2d.prompt.md`
- **Gemini 3D / XR Gem**: edit `gemini-gem/gemini-3d.prompt.md`

---

## License

See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built for Mudra Studio by Wearable Devices</strong><br>
  <em>Build interactions beyond voice, touch, and cameras.</em>
</p>
