# mudra-skills

Skills for building [Mudra Band](https://wearabledevices.co.il) apps — works with Claude, Codex, and Antigravity. Generate 2D flat/screen apps, 3D/XR experiences, or let the router auto-classify your prompt.

## Install

```bash
npx mudra-skills
```

You'll be prompted to choose your AI assistant:

```
Which AI assistant are you using?
(↑↓ to move, Enter to select)

❯ Claude
  Codex
  Antigravity
```

Or skip the prompt with the `--llm` flag:

```bash
npx mudra-skills --llm claude
npx mudra-skills --llm codex
npx mudra-skills --llm antigravity
```

### Where skills get installed

| AI | Install path | Invoke with |
|---|---|---|
| **Claude** | `~/.claude/skills/` | `/mudra-master` |
| **Codex** | `~/.agents/skills/` | `$mudra-master` |
| **Antigravity** | `~/.gemini/antigravity/skills/` | `@mudra-master` |

## What You Get

Three skills, installed as folders:

| Skill | Description |
|---|---|
| **mudra-master** | Auto-router — classifies your prompt and hands off to 2D or 3D |
| **mudra-preview** | Generates single-file HTML 2D apps |
| **mudra-xr** | Generates single-file HTML 3D/XR apps using XR Blocks |

## Usage

### Claude
```
/mudra-master build a gesture-controlled music player
```

### Codex
```
$mudra-master build a gesture-controlled music player
```

### Antigravity
```
@mudra-master build a gesture-controlled music player
```

Or just describe what you want — the router will classify it as 2D or 3D automatically.

## What Gets Generated

Every generated app includes:
- Mudra Band WebSocket connection (`ws://127.0.0.1:8766`)
- Mock fallback + simulator panel (works without the band)
- Keyboard shortcuts for every subscribed signal
- Connection status indicator

## Mudra Signals

| Signal | Type | Use for |
|---|---|---|
| `gesture` | discrete | finger pinches (index, middle, ring, little, thumb, grab) |
| `button` | discrete | hardware button press/release |
| `pressure` | analog | continuous squeeze force (0–1) |
| `navigation` | pointer | 2D cursor delta (x, y) |
| `nav_direction` | discrete | swipe direction (up/down/left/right) |
| `imu_acc` | analog | accelerometer (x, y, z) |
| `imu_gyro` | analog | gyroscope (x, y, z) |
| `snc` | analog | 3-channel bio signal |

## Requirements

- Node.js 18+
- One of: [Claude Code](https://claude.ai/code), [Codex CLI](https://github.com/openai/codex), or Antigravity

## License

MIT
