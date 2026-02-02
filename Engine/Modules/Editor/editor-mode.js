/**
 * Basalt Editor Mode — Edit/Play toggle, free-fly camera (UE5-style PIE)
 * Edit mode: free-fly camera, paused gameplay, gizmos
 * Play mode: FPS controller runs in viewport (PIE)
 */

const FLY_SPEED = 0.15;
const LOOK_SENSITIVITY = 0.002;

export function createEditorMode(scene, canvas, fpsController, input, gizmoHandler) {
  if (!fpsController?.player || !fpsController?.head) return null;

  const { player, head } = fpsController;
  const fpsCamera = scene.activeCamera;
  if (!fpsCamera) return null;

  let isPlaying = false;
  let flyYaw = 0;
  let flyPitch = 0;
  let isRightDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  const keysUp = { q: 0, e: 0 };

  const keydown = (evt) => {
    if (evt.keyCode === 81) keysUp.q = 1;
    if (evt.keyCode === 69) keysUp.e = 1;
  };
  const keyup = (evt) => {
    if (evt.keyCode === 81) keysUp.q = 0;
    if (evt.keyCode === 69) keysUp.e = 0;
  };

  const onPointerDown = (evt) => {
    if (!isPlaying && evt.button === 2) {
      isRightDragging = true;
      lastMouseX = evt.clientX;
      lastMouseY = evt.clientY;
    }
  };
  const onPointerUp = () => {
    isRightDragging = false;
  };
  const onPointerMove = (evt) => {
    if (isRightDragging && !isPlaying) {
      const dx = evt.clientX - lastMouseX;
      const dy = evt.clientY - lastMouseY;
      lastMouseX = evt.clientX;
      lastMouseY = evt.clientY;
      flyYaw -= dx * LOOK_SENSITIVITY;
      flyPitch -= dy * LOOK_SENSITIVITY;
      flyPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, flyPitch));
    }
  };

  const enterEditMode = () => {
    if (!isPlaying) return;
    isPlaying = false;
    document.exitPointerLock?.();

    const headWorld = fpsCamera.getAbsolutePosition?.() ?? fpsCamera.position.clone();
    fpsCamera.parent = null;
    fpsCamera.position.copyFrom(headWorld);
    flyYaw = player.rotation.y;
    flyPitch = player.rotation.x;

    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerUp);

    if (gizmoHandler) gizmoHandler.setVisible(true);
  };

  enterEditMode();

  const enterPlayMode = () => {
    if (isPlaying) return;
    isPlaying = true;

    window.removeEventListener('keydown', keydown);
    window.removeEventListener('keyup', keyup);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerleave', onPointerUp);

    fpsCamera.parent = player;
    if (gizmoHandler) {
      gizmoHandler.setVisible(false);
      gizmoHandler.setAttachedNode(null);
    }
  };

  const toggle = () => {
    if (isPlaying) enterEditMode();
    else enterPlayMode();
    return isPlaying;
  };

  const runFreeFly = () => {
    if (isPlaying) return;
    const k = input?.keys ?? {};
    const fwd = (k.forward ? 1 : 0) - (k.back ? 1 : 0);
    const right = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    const up = (keysUp.e ? 1 : 0) - (keysUp.q ? 1 : 0);
    const speed = (k.shift ? 1.5 : 1) * FLY_SPEED;

    const cp = Math.cos(flyPitch);
    const sp = Math.sin(flyPitch);
    const cy = Math.cos(flyYaw);
    const sy = Math.sin(flyYaw);
    const fwdDir = new BABYLON.Vector3(sy * cp, sp, cy * cp);
    const rightDir = new BABYLON.Vector3(cy, 0, -sy);
    const upDir = new BABYLON.Vector3(0, 1, 0);

    fpsCamera.position.addInPlace(fwdDir.scale(fwd * speed));
    fpsCamera.position.addInPlace(rightDir.scale(right * speed));
    fpsCamera.position.addInPlace(upDir.scale(up * speed));

    fpsCamera.rotation.x = flyPitch;
    fpsCamera.rotation.y = flyYaw;
    fpsCamera.rotation.z = 0;
  };

  return {
    get isPlaying() { return isPlaying; },
    get isEditing() { return !isPlaying; },
    toggle,
    enterEditMode,
    enterPlayMode,
    runFreeFly,
    dispose() {
      if (!isPlaying) enterPlayMode();
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    },
  };
}
