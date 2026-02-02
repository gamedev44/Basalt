# Mixamo Trigger Animation — Reference

Trigger Mixamo character animations by name, with blending and weighted sync.

---

## Setup

```javascript
// Required for Mixamo: matrix interpolation
BABYLON.Animation.AllowMatricesInterpolation = true;

// Load character
BABYLON.SceneLoader.ImportMesh("", "./scenes/", "dummy3.babylon", scene, function (newMeshes, particleSystems, skeletons) {
    var skeleton = skeletons[0];

    // Blending
    skeleton.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
    skeleton.animationPropertiesOverride.enableBlending = true;
    skeleton.animationPropertiesOverride.blendingSpeed = 0.05;
    skeleton.animationPropertiesOverride.loopMode = 1;  // BABYLON.Animation.LOOP_MODE_CYCLE

    var idleRange = skeleton.getAnimationRange("YBot_Idle");
    var walkRange = skeleton.getAnimationRange("YBot_Walk");
    var runRange = skeleton.getAnimationRange("YBot_Run");
    var leftRange = skeleton.getAnimationRange("YBot_LeftStrafeWalk");
    var rightRange = skeleton.getAnimationRange("YBot_RightStrafeWalk");

    // Start idle
    if (idleRange) scene.beginAnimation(skeleton, idleRange.from, idleRange.to, true);
});
```

---

## Trigger Single Animation

```javascript
if (walkRange) scene.beginAnimation(skeleton, walkRange.from, walkRange.to, true);
```

---

## Weighted Blend (Walk + Strafe)

```javascript
if (walkRange && leftRange) {
    scene.stopAnimation(skeleton);
    var walkAnim = scene.beginWeightedAnimation(skeleton, walkRange.from, walkRange.to, 0.5, true);
    var leftAnim = scene.beginWeightedAnimation(skeleton, leftRange.from, leftRange.to, 0.5, true);

    // Sync strafe to walk
    walkAnim.syncWith(null);
    leftAnim.syncWith(walkAnim);
}
```

---

## Babylon.GUI Button Trigger

```javascript
var button = BABYLON.GUI.Button.CreateSimpleButton("but1", "Play Walk");
button.onPointerDownObservable.add(() => {
    if (walkRange) scene.beginAnimation(skeleton, walkRange.from, walkRange.to, true);
});
UiPanel.addControl(button);
```

---

## Key Points

| Item | Value |
|------|-------|
| **AllowMatricesInterpolation** | `true` — required for Mixamo |
| **getAnimationRange(name)** | Get `{ from, to }` by anim name |
| **beginAnimation** | `(skeleton, from, to, loop)` |
| **beginWeightedAnimation** | `(skeleton, from, to, weight, loop)` |
| **syncWith** | Sync secondary anim to master |
| **blendingSpeed** | 0.05 typical |

---

## Basalt / Echo Usage

1. **IronWill** — `echo_id` custom prop → map to anim trigger
2. **Event triggers** — `vol_` enter → `beginAnimation(skeleton, range.from, range.to, true)`
3. **Variable inspector** — Expose anim names, blending speed
4. **Facade** — Babylon.GUI buttons for debug / UI triggers
