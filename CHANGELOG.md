# Changelog — Basalt Engine

All notable changes to the Basalt Engine are documented here.

---

## [Unreleased] — 2025-01-30

### Added

- **STATUS.md** — Master checklist (`docs/STATUS.md`) for done vs pending; single source of truth.

- **Weapon Data Table** — UE5-style per-gun property editor; edit display name, damage, mag, full auto, camera (base/ADS), URL, file on the fly; changes apply via `config.WEAPON_OVERRIDES`; Apply button reloads weapon; Live Preview (from Variables panel) updates camera in real time.
- **WEAPON_OVERRIDES** — Runtime overrides merged with `WEAPON_DEFINITIONS`; persisted to localStorage.
- **Rifle camera offset** — Per-weapon camera config; rifle view moved left and up from right-shoulder position (see `RIFLE_CAMERA` in `weapon-switch-component.js`).
- **Camera offset sliders** — `CAM_OFFSET_X` and `CAM_OFFSET_Y` in Variables & Components (ADS category) with range sliders for live tweaking.
- **Live Preview toggle** — Checkbox in Variables panel header; when enabled, changing WEAPON_SLOT and clicking Apply updates the viewport immediately.
- **WEAPON_SLOT dropdown** — Rifle/Pistol selector in Variables panel instead of raw number input.
- **Shoulder cam reference** — `docs/fps/SHOULDER_CAM_REFERENCE.md` documents baseline values for future shoulder cam implementation.
- **ARMS_RIG constant** — Canonical arms rig definition (`arms_assault_rifle_02.glb`) with idle + walk anims.
- **reloadWeapon** — FPS controller exposes `reloadWeapon()` for Live Preview and external weapon refresh.

### Fixed

- **Weapon switch freeze** — Resolved `ReferenceError` from undefined `disposeWeaponAnimations`; replaced with `stopWeaponAnimations` (stop only, no dispose).
- **Multiple weapons visible** — Wheel events over Variables panel no longer trigger weapon switch; scroll in panel scrolls content only.
- **Weapon load race** — `loadId` prevents stale loads from overwriting; only the latest load applies.
- **Rifle walk animation** — Switched to `ImportMeshAsync` and use `result.animationGroups` so idle/walk come from the current load, not stale groups from disposed weapons.
- **Weapon2 callback** — Added missing `prevIdle`/`prevWalk` so weapon 2 switch works correctly.

### Reliability & Error Handling

- **stopWeaponAnimations** — Safe stop of previous idle/walk before loading new weapon; wrapped in try/catch.
- **currentWeaponRoot.dispose** — Wrapped in try/catch with optional chaining to avoid errors on invalid refs.
- **loadWeapon** — Try/catch around load callback; `ImportMeshAsync` error handling; fallback to `onLoaded(null)` on failure.
- **FPS controller anim logic** — Try/catch around idle/walk toggle so anim errors do not freeze the game loop.
- **Fallback for weapons without walk** — When `walk` is null (e.g. pistol), `isWalking` resets correctly when movement stops.

### Changed

- **Weapon loader** — Uses `ImportMeshAsync` instead of `ImportMesh`; animation groups taken from `result.animationGroups` for correct rifle walk.
- **Config init** — `WEAPON_OVERRIDES` default `{ 0: {}, 1: {} }` when not in stored.
- **Pistol anims** — Pistol definition includes `['idle', 'walk']`; walk plays if the pistol GLB has it.

---

### Documentation & License

- **CHANGELOG.md** — Added; documents all new features, fixes, and reliability systems.
- **docs/IWI_PCL_BASALT.md** — IronWill Interactive Proprietary Contributor License adapted for Basalt Engine.
- **LICENSE** — IWI-PCL summary; full terms in `docs/IWI_PCL_BASALT.md`.
- **Docs** — Updated all reference docs; removed formal phrasing; sole-dev voice.

---

## Prior Work

- FPS controller with WASD, jump, gravity, sprint
- Weapon switch (rifle/pistol) via keys 1/2, scroll, Tab wheel
- ADS (aim down sights) with per-weapon camera config
- Variable panel with config persistence (localStorage)
- Template loader (FPS / Empty scene)
- Static script loading via `modules.config.js` and `bootstrap.js`
