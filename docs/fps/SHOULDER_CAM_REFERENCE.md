# Shoulder Cam Reference

> Rifle view ended up rendering from the **right shoulder** instead of eye/head. Captured these values for future shoulder cam implementation (GTA-style).

## Reference Values

The rifle (`arms_assault_rifle_02.glb`) with `SHARED_ARMS_CAMERA` produced a right-shoulder view:

| Mode | X | Y | Z | Effect |
|------|---|---|---|--------|
| **Base (hip)** | -0.03 | 0.04 | -0.24 | Right shoulder |
| **ADS** | -0.10 | 0.07 | 0.1 | Right shoulder, tighter |

### Coordinate System (Babylon Z-up, local to weapon `cameraNode`)

- **X:** Negative = right shoulder, Positive = left shoulder, 0 = centered (eye/head)
- **Y:** Vertical offset (up/down)
- **Z:** Forward/back from camera node

## Baseline for Shoulder Cam Implementation

| Preset | base.x | ads.x | Notes |
|--------|--------|-------|------|
| **Right shoulder** | -0.03 | -0.10 | Use rifle values as-is |
| **Left shoulder** | +0.03 | +0.10 | Mirror X |
| **Eye/head (centered)** | 0 | 0 | Default FPS |

## Implementation Notes

1. **Per-weapon override:** `WEAPON_DEFINITIONS[slot].camera` can override `SHARED_ARMS_CAMERA` with shoulder-specific values.
2. **Shoulder switch:** Toggle `base.x` and `ads.x` sign (e.g. multiply by -1) when switching shoulders.
3. **Source:** `Engine/Modules/Weapons/weapon-switch-component.js` — `SHARED_ARMS_CAMERA`, `WEAPON_DEFINITIONS`
4. **Consumer:** `Engine/Modules/Player/ads.js` — `getHeadPosition()` uses `def.camera.base` / `def.camera.ads`

## Arms Rig & Animations

- **Rifle arms** (`arms_assault_rifle_02.glb`) — canonical rig; idle + walk play when holding rifle.
- **Pistol** — own GLB (`arms_handgun_01.glb`), `anims: ['idle', 'walk']`; walk plays if the GLB has it.
- `ARMS_RIG` in `weapon-switch-component.js` — base rig definition.
- TODO: single-rig mode (rifle arms + weapon mesh swap) needs pistol-only asset or GLB inspection.

## Roadmap

[BASALT_ROADMAP.md](../BASALT_ROADMAP.md) — Runtime → Optional Shoulder Cams.
