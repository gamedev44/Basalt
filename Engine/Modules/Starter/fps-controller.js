/**
 * Basalt FPS Controller — Starter module / base template
 * Bundles player, camera, input, movement, weapon, firing, HUD.
 * Add this module to get full FPS experience; omit for other modes.
 * Uses config for all variables (CHARACTER, WEAPONS, etc.).
 */

import { createPlayer } from '../Player/Char/player.js';
import { createCamera } from '../Player/Actor/camera.js';
import { createInput } from '../Player/Input/input.js';
import { createMovement } from '../Player/Components/movement.js';
import { applyAttachments, cycleScope, cycleMuzzle } from '../Weapons/attachment-component.js';
import { loadWeapon, loadWeaponBySlot } from '../Weapons/weapon-loader.js';
import { setWeaponSlot, getWeaponSlot } from '../Weapons/weapon-switch-component.js';
import { createFiring } from '../Weapons/firing.js';
import { createHUD } from '../UI/hud.js';
import { createWeaponWheel } from '../UI/weapon-wheel.js';

/**
 * Create FPS controller. Context: { ground, mantle, spawnHeight }.
 * Returns { player, head, firing, movement, hud, run } for main loop.
 */
export function createFpsController(scene, canvas, config, context = {}) {
  const { ground, mantle, spawnHeight } = context;
  const spawnY = spawnHeight ?? (config.PLAYER_HEIGHT ?? 1.7);

  const { player, head, box } = createPlayer(scene, config, spawnY);
  const cameraCtrl = createCamera(scene, canvas, player, config);
  canvas.onclick = () => cameraCtrl?.requestPointerLock?.();

  const input = createInput(config);
  input.attachPointerEvents(scene);

  const firing = createFiring(scene, input, config, () => ground);
  const getGroundHeight = mantle?.terrain
    ? (x, z) => mantle.terrain.getHeightAtWorld(x, z)
    : null;

  const spawnPos = { x: 0, y: spawnY, z: 0 };

  const movement = createMovement(
    player,
    input,
    config,
    () => head,
    () => scene.getNodeByName?.('camera'),
    () => firing.currentRecoilPos ?? BABYLON.Vector3.Zero(),
    getGroundHeight,
    spawnPos
  );

  const hud = createHUD(scene, config);

  const weaponWheel = createWeaponWheel(config, (slot) => {
    setWeaponSlot(config, slot);
    loadWeaponBySlot(scene, player, head, config, currentWeaponRoot, (data) => {
      currentWeaponRoot = data?.weaponRoot ?? null;
      idle = data?.idle;
      walk = data?.walk;
      isWalking = false;
    }, cameraCtrl?.camera, idle, walk);
  });

  let idle = null;
  let walk = null;
  let currentWeaponRoot = null;
  const onWeaponLoaded = (data) => {
    idle = data?.idle;
    walk = data?.walk;
    currentWeaponRoot = data?.weaponRoot ?? null;
  };
  loadWeapon(scene, player, head, (data) => {
    currentWeaponRoot = data?.weaponRoot ?? null;
    idle = data?.idle;
    walk = data?.walk;
  }, config, cameraCtrl?.camera);

  let isWalking = false;
  let prevCycleScope = 0;
  let prevCycleMuzzle = 0;
  let prevWeapon1 = 0;
  let prevWeapon2 = 0;
  let prevWeaponWheel = 0;
  let prevWeaponScrollUp = 0;
  let prevWeaponScrollDown = 0;
  const run = (engine) => {
    if (hud?.updateStats) hud.updateStats(engine, firing?.bulletCount ?? 0, movement?.jumpCount ?? 0);
    if (hud?.updateCrosshair) hud.updateCrosshair(input.isAds);

    if (input.keys.cycleScope && !prevCycleScope) {
      cycleScope(config);
      applyAttachments(scene, config);
    }
    prevCycleScope = input.keys.cycleScope ?? 0;
    if (input.keys.cycleMuzzle && !prevCycleMuzzle) {
      cycleMuzzle(config);
      applyAttachments(scene, config);
    }
    prevCycleMuzzle = input.keys.cycleMuzzle ?? 0;

    if (input.keys.weapon1 && !prevWeapon1) {
      setWeaponSlot(config, 0);
      loadWeaponBySlot(scene, player, head, config, currentWeaponRoot, (data) => {
        currentWeaponRoot = data?.weaponRoot ?? null;
        idle = data?.idle;
        walk = data?.walk;
        isWalking = false;
      }, cameraCtrl?.camera, idle, walk);
    }
    prevWeapon1 = input.keys.weapon1 ?? 0;
    if (input.keys.weapon2 && !prevWeapon2) {
      setWeaponSlot(config, 1);
      loadWeaponBySlot(scene, player, head, config, currentWeaponRoot, (data) => {
        currentWeaponRoot = data?.weaponRoot ?? null;
        idle = data?.idle;
        walk = data?.walk;
        isWalking = false;
      }, null, idle, walk);
    }
    prevWeapon2 = input.keys.weapon2 ?? 0;

    if (input.keys.weaponScrollUp && !prevWeaponScrollUp) {
      const next = (getWeaponSlot(config) + 1) % 2;
      setWeaponSlot(config, next);
      loadWeaponBySlot(scene, player, head, config, currentWeaponRoot, (data) => {
        currentWeaponRoot = data?.weaponRoot ?? null;
        idle = data?.idle;
        walk = data?.walk;
        isWalking = false;
      }, null, idle, walk);
    }
    prevWeaponScrollUp = input.keys.weaponScrollUp ?? 0;
    if (input.keys.weaponScrollDown && !prevWeaponScrollDown) {
      const next = (getWeaponSlot(config) + 1) % 2;
      setWeaponSlot(config, next);
      loadWeaponBySlot(scene, player, head, config, currentWeaponRoot, (data) => {
        currentWeaponRoot = data?.weaponRoot ?? null;
        idle = data?.idle;
        walk = data?.walk;
        isWalking = false;
      }, null, idle, walk);
    }
    prevWeaponScrollDown = input.keys.weaponScrollDown ?? 0;

    if (input.keys.weaponWheel && !prevWeaponWheel) {
      weaponWheel.show();
    }
    prevWeaponWheel = input.keys.weaponWheel ?? 0;
    if (!input.keys.weaponWheel && prevWeaponWheel && weaponWheel.isVisible()) {
      const slot = weaponWheel.getHoveredSlot(weaponWheel.lastMouseX, weaponWheel.lastMouseY);
      setWeaponSlot(config, slot);
      loadWeaponBySlot(scene, player, head, config, currentWeaponRoot, (data) => {
        currentWeaponRoot = data?.weaponRoot ?? null;
        idle = data?.idle;
        walk = data?.walk;
        isWalking = false;
      }, null, idle, walk);
      weaponWheel.hide();
    }

    input.keys.weaponScrollUp = 0;
    input.keys.weaponScrollDown = 0;

    if (firing?.run) firing.run(scene, () => head, () => scene.getNodeByName?.('camera'));
    if (movement?.run) movement.run(scene, ground, () => {});

    try {
      if (idle && walk && player) {
        const isMoving = !!(input.keys.forward || input.keys.back || input.keys.left || input.keys.right);
        if (isMoving && !isWalking) {
          idle.stop?.();
          walk.start?.(true);
          isWalking = true;
        } else if (!isMoving && isWalking) {
          walk.stop?.();
          idle.start?.(true);
          isWalking = false;
        }
      } else if (idle && player && !walk) {
        const isMoving = !!(input.keys.forward || input.keys.back || input.keys.left || input.keys.right);
        if (!isMoving && isWalking) isWalking = false;
      }
    } catch (_) { /* anim error — don't freeze game */ }
  };

  const reloadWeapon = () => {
    loadWeaponBySlot(scene, player, head, config, currentWeaponRoot, (data) => {
      currentWeaponRoot = data?.weaponRoot ?? null;
      idle = data?.idle;
      walk = data?.walk;
      isWalking = false;
    }, cameraCtrl?.camera, idle, walk);
  };

  return {
    player,
    head,
    box,
    input,
    firing,
    movement,
    hud,
    run,
    reloadWeapon,
  };
}
