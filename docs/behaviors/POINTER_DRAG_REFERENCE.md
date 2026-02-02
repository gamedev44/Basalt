# PointerDragBehavior — Rail Constraint Reference

Draggable object constrained to a single axis (rail) — useful for sliders, levers, doors on tracks.

---

## Rail Constraint (1 Axis Only)

```javascript
var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(1, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
    sphere.rotation.x = Math.PI/2;
    sphere.position.y = 1;
    var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

    // Rail constraint: drag only on X axis
    var pointerDragBehavior = new BABYLON.PointerDragBehavior({ 
        dragAxis: new BABYLON.Vector3(1, 0, 0)  // X-axis only
    });
    
    // Alternative: drag on plane (Y-up)
    // var pointerDragBehavior = new BABYLON.PointerDragBehavior({ 
    //     dragPlaneNormal: new BABYLON.Vector3(0, 1, 0) 
    // });
    
    // Use drag plane in world space
    pointerDragBehavior.useObjectOrientationForDragging = false;

    // Listen to drag events
    pointerDragBehavior.onDragStartObservable.add((event) => console.log("dragStart", event));
    pointerDragBehavior.onDragObservable.add((event) => console.log("drag", event));
    pointerDragBehavior.onDragEndObservable.add((event) => console.log("dragEnd", event));

    sphere.addBehavior(pointerDragBehavior);
    return scene;
};
```

---

## Options

| Option | Type | Description |
|--------|------|-------------|
| `dragAxis` | Vector3 | Constrain to single axis, e.g. `(1,0,0)` = X only |
| `dragPlaneNormal` | Vector3 | Constrain to plane, e.g. `(0,1,0)` = horizontal |
| `useObjectOrientationForDragging` | boolean | `false` = world space; `true` = object-local |
| `moveAttached` | boolean | `true` = auto-move mesh; `false` = handle manually in `onDragObservable` |

---

## Basalt Notes

1. **Sliders / levers** — `dragAxis` for rail-constrained UI or props
2. **Doors on tracks** — X or Z axis for sliding doors
3. **Variable inspector** — Expose `dragAxis` for configurable constraints
4. **IronWill** — `ent_` objects with `basalt_drag_axis` custom prop → auto-add PointerDragBehavior
