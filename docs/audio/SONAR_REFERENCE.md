# Sonar (Audio) — Integration Reference

**Source:** [Babylon.js Legacy Audio](https://doc.babylonjs.com/legacy/audio) | [PCY1J#6](https://playground.babylonjs.com/#PCY1J#6) — Multi-violin sync

---

## Background Music (Simple)

```javascript
var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 0, 0), scene);

    // Load the sound and play automatically once ready
    var music = new BABYLON.Sound("Violons", "sounds/violons11.wav", scene, null, { 
        loop: true, 
        autoplay: true 
    });
     
    return scene;
};
```

**Options:** `loop`, `autoplay`, `spatialSound`, `maxDistance`, etc.

---

## Multi-Track Sync (3 Violins, Different Parts)

**Playground:** [PCY1J#6](https://playground.babylonjs.com/#PCY1J#6)

Example: 3 violins playing different parts in synchronous song — multiple `BABYLON.Sound` instances started together for layered/ensemble playback.

---

## Basalt Sonar Notes

1. **`snd_` prefix** — IronWill schema: objects named `snd_*` become Sonar emitters
2. **Spatial audio** — `spatialSound: true` for 3D positioning
3. **Reverb zones** — `vol_` triggers for reverb boundaries
4. **Multi-track** — Use PCY1J#6 pattern for ensemble/sync playback
5. **Asset path** — `sounds/` folder or CDN; ensure CORS for external URLs
