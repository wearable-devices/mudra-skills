# mudra-skills

Claude Code skills for building [Mudra Band](https://wearabledevices.co.il) apps — generate 2D flat/screen apps, 3D/XR experiences, or let the router auto-classify your prompt.

## Install

```bash
npx mudra-skills
```

Then restart Claude Code or run `/reload-plugins`.

## What You Get

Three skills installed to `~/.claude/plugins/mudra/`:

| Skill | Invoke | Description |
|---|---|---|
| **mudra-master** | `/mudra:mudra-master` | Auto-router — classifies your prompt and hands off to 2D or 3D |
| **mudra-preview** | `/mudra:mudra-preview` | Generates single-file HTML 2D apps |
| **mudra-xr** | `/mudra:mudra-xr` | Generates single-file HTML 3D/XR apps using XR Blocks |

## Usage

Just describe what you want to build in Claude Code:

```
/mudra:mudra-master build a gesture-controlled music player
```

Or let the router figure it out — describe an app idea and it will classify it as 2D or 3D automatically.

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
| `battery` | discrete | battery level |

## Requirements

- [Claude Code](https://claude.ai/code) CLI
- Node.js 18+

## License

MIT
