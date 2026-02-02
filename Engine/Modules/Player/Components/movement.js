/**
 * Basalt Movement — WASD, jump, gravity, sprint, air momentum, fall respawn (uses config)
 * Designed for network replication: velocity, movement mode, and state are exposed.
 * Drift macro: optional arcade-style sliding when moving at speed.
 */

import { getHeadPosition } from './ads.js';

/** Movement modes — replicated for simulated proxies (other players) */
export const MovementMode = { WALKING: 0, FALLING: 1, DRIFTING: 2 };

/** Drift macro — arcade-style sliding. Call from run when DRIFT_ENABLED and speed > threshold */
export function applyDriftMacro(velocityXZ, player, input, config) {
  const DRIFT_THRESHOLD = config.DRIFT_SPEED_THRESHOLD ?? 0.08;
  const DRIFT_FRICTION = config.DRIFT_GROUND_FRICTION ?? 0.92;
  const DRIFT_TURN_MULT = config.DRIFT_TURN_MULT ?? 1.4;

  const len = Math.sqrt(velocityXZ.x * velocityXZ.x + velocityXZ.z * velocityXZ.z);
  if (len < DRIFT_THRESHOLD) return velocityXZ;

  const rotationMatrix = BABYLON.Matrix.RotationY(player.rotation.y);
  const forwardDir = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, 1), rotationMatrix);
  const rightDir = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(1, 0, 0), rotationMatrix);

  const moveVector = BABYLON.Vector3.Zero();
  if (input.keys.forward) moveVector.addInPlace(forwardDir);
  if (input.keys.back) moveVector.subtractInPlace(forwardDir);
  if (input.keys.left) moveVector.subtractInPlace(rightDir);
  if (input.keys.right) moveVector.addInPlace(rightDir);

  const hasInput = moveVector.lengthSquared() > 0;
  if (!hasInput) return velocityXZ;

  moveVector.normalize();
  const driftAccel = len * DRIFT_TURN_MULT * 0.15;
  velocityXZ.addInPlace(moveVector.scale(driftAccel));
  velocityXZ.scaleInPlace(DRIFT_FRICTION);
  const newLen = Math.sqrt(velocityXZ.x * velocityXZ.x + velocityXZ.z * velocityXZ.z);
  if (newLen > len * 1.1) velocityXZ.scaleInPlace(len * 1.1 / newLen);
  return velocityXZ;
}

export function createMovement(player, input, config, getHead, getCameraNode, getRecoilPos = () => BABYLON.Vector3.Zero(), getGroundHeight = null, spawnPosition = null) {
  let verticalVelocity = 0;
  let velocityXZ = new BABYLON.Vector3(0, 0, 0);
  let isGrounded = true;
  let jumpCount = 0;
  let airMaxSpeed = 0;

  const getSpawnPos = () => {
    if (spawnPosition && typeof spawnPosition.x === 'number' && typeof spawnPosition.y === 'number' && typeof spawnPosition.z === 'number') {
      return spawnPosition;
    }
    const h = config.PLAYER_HEIGHT ?? 1.7;
    return { x: 0, y: h, z: 0 };
  };

  const run = (scene, ground, statsUpdater) => {
    const deltaTime = scene.getEngine().getDeltaTime();
    const head = getHead();
    const cameraNode = getCameraNode();
    const fpsCamera = scene.activeCamera;

    const WALK_SPEED = config.WALK_SPEED ?? 0.12;
    const SPRINT_SPEED = config.SPRINT_SPEED ?? 0.22;
    const JUMP_FORCE = config.JUMP_FORCE ?? 0.15;
    const GRAVITY = config.GRAVITY ?? -0.008;
    const AIR_DRAG = config.AIR_DRAG ?? 0.98;
    const AIR_ACCELERATION = config.AIR_ACCELERATION ?? 0.4;
    const GROUND_FRICTION = config.GROUND_FRICTION ?? 0.85;
    const APEX_THRESHOLD = config.APEX_THRESHOLD ?? 0.02;
    const APEX_GRAVITY_MULT = config.APEX_GRAVITY_MULT ?? 0.5;
    const PLAYER_HEIGHT = config.PLAYER_HEIGHT ?? 1.7;
    const FALL_RESPAWN_Y = config.FALL_RESPAWN_Y ?? -50;

    const currentSpeed = (input.keys.shift && !input.isAds) ? SPRINT_SPEED : WALK_SPEED;

    // Fall off map — respawn at spawn position
    if (player.position.y < FALL_RESPAWN_Y) {
      const spawn = getSpawnPos();
      player.position.set(spawn.x, spawn.y, spawn.z);
      verticalVelocity = 0;
      velocityXZ.set(0, 0, 0);
      isGrounded = true;
    }

    // Input direction (normalized)
    const moveVector = BABYLON.Vector3.Zero();
    const rotationMatrix = BABYLON.Matrix.RotationY(player.rotation.y);
    const forwardDir = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, 1), rotationMatrix);
    const rightDir = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(1, 0, 0), rotationMatrix);

    if (input.keys.forward) moveVector.addInPlace(forwardDir);
    if (input.keys.back) moveVector.subtractInPlace(forwardDir);
    if (input.keys.left) moveVector.subtractInPlace(rightDir);
    if (input.keys.right) moveVector.addInPlace(rightDir);

    const hasInput = moveVector.lengthSquared() > 0;
    if (hasInput) moveVector.normalize();

    // Horizontal velocity — air momentum + ground friction
    if (isGrounded) {
      if (hasInput) {
        const accel = currentSpeed * 0.35;
        velocityXZ.addInPlace(moveVector.scale(accel));
        const len = Math.sqrt(velocityXZ.x * velocityXZ.x + velocityXZ.z * velocityXZ.z);
        if (len > currentSpeed) {
          velocityXZ.scaleInPlace(currentSpeed / len);
        }
        if (config.DRIFT_ENABLED && len > (config.DRIFT_SPEED_THRESHOLD ?? 0.08)) {
          applyDriftMacro(velocityXZ, player, input, config);
        }
      } else {
        velocityXZ.scaleInPlace(GROUND_FRICTION);
        if (velocityXZ.lengthSquared() < 1e-6) velocityXZ.set(0, 0, 0);
      }
    } else {
      // Air: shift has no effect — use airMaxSpeed (speed at takeoff) for clamp
      if (airMaxSpeed <= 0) {
        const len = Math.sqrt(velocityXZ.x * velocityXZ.x + velocityXZ.z * velocityXZ.z);
        airMaxSpeed = Math.max(currentSpeed, len);
      }
      if (hasInput) {
        const airAccel = airMaxSpeed * AIR_ACCELERATION * 0.25;
        velocityXZ.addInPlace(moveVector.scale(airAccel));
      }
      velocityXZ.scaleInPlace(AIR_DRAG);
      const len = Math.sqrt(velocityXZ.x * velocityXZ.x + velocityXZ.z * velocityXZ.z);
      if (len > airMaxSpeed) velocityXZ.scaleInPlace(airMaxSpeed / len);
    }

    player.position.addInPlace(velocityXZ);

    // Jump Physics — ground level from terrain or flat at 0 (small buffer to prevent clipping)
    const groundY = getGroundHeight ? getGroundHeight(player.position.x, player.position.z) : 0;
    const groundLevel = groundY + PLAYER_HEIGHT + 0.02;

    if (isGrounded) {
      if (input.keys.jump) {
        verticalVelocity = JUMP_FORCE;
        isGrounded = false;
        airMaxSpeed = currentSpeed;
        jumpCount++;
      }
    } else {
      const g = (Math.abs(verticalVelocity) < APEX_THRESHOLD) ? GRAVITY * APEX_GRAVITY_MULT : GRAVITY;
      verticalVelocity += g;
      if (verticalVelocity < 0) verticalVelocity *= AIR_DRAG;
      player.position.y += verticalVelocity;
      if (player.position.y <= groundLevel) {
        player.position.y = groundLevel;
        verticalVelocity = 0;
        velocityXZ.scaleInPlace(0.7);
        isGrounded = true;
        airMaxSpeed = 0;
      }
    }

    // View Positioning (head/camera) — ADS component, includes recoil (matches backup)
    if (head && cameraNode && fpsCamera) {
      const recoil = getRecoilPos();
      const targetPos = getHeadPosition(config, input.isAds, recoil);
      head.position = BABYLON.Vector3.Lerp(head.position, targetPos, 0.2 * (deltaTime / 16));
      fpsCamera.position.copyFrom(head.position);
    }

    if (statsUpdater) statsUpdater({ jumpCount });
  };

  /** Full velocity (x, y, z) — for network replication */
  const getVelocity = () => new BABYLON.Vector3(velocityXZ.x, verticalVelocity, velocityXZ.z);

  /** Movement state — for replication, client-side prediction, server reconciliation */
  const getState = () => ({
    position: player.position.clone(),
    velocity: getVelocity(),
    isGrounded,
    movementMode: isGrounded ? MovementMode.WALKING : MovementMode.FALLING,
    jumpCount,
  });

  return {
    run,
    get jumpCount() { return jumpCount; },
    get verticalVelocity() { return verticalVelocity; },
    get isGrounded() { return isGrounded; },
    get velocityXZ() { return velocityXZ.clone(); },
    getVelocity,
    getState,
    MovementMode,
  };
}
