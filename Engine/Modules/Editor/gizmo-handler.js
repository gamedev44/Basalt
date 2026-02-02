/**
 * Basalt Gizmo Handler — GizmoManager for translate/rotate/scale on selection
 * getIsEditing: optional () => boolean — only pick when editing (e.g. editor mode)
 */

export function createGizmoHandler(scene, canvas, getIsEditing = null) {
  const gizmoManager = new BABYLON.GizmoManager(scene);
  gizmoManager.usePointerToAttachGizmos = false;

  const onPointerDown = (evt) => {
    if (evt.button !== 0) return;
    if (getIsEditing && !getIsEditing()) return;
    const pickInfo = scene.pick(scene.pointerX, scene.pointerY, (m) => m.isPickable && m.isVisible);
    if (pickInfo.hit && pickInfo.pickedMesh) {
      gizmoManager.attachToNode(pickInfo.pickedMesh);
    } else {
      gizmoManager.attachToNode(null);
    }
  };

  scene.onPointerObservable.add((info) => {
    if (info.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      onPointerDown(info.event);
    }
  });

  const setGizmoMode = (mode) => {
    const t = mode === 'translate' || mode === 'position';
    const r = mode === 'rotate' || mode === 'rotation';
    const s = mode === 'scale';
    gizmoManager.positionGizmoEnabled = t;
    gizmoManager.rotationGizmoEnabled = r;
    gizmoManager.scaleGizmoEnabled = s;
  };

  return {
    gizmoManager,
    setAttachedNode(node) {
      gizmoManager.attachToNode(node);
    },
    setVisible(visible) {
      gizmoManager.positionGizmoEnabled = visible;
      gizmoManager.rotationGizmoEnabled = visible;
      gizmoManager.scaleGizmoEnabled = visible;
    },
    setGizmoMode,
    dispose() {
      gizmoManager.dispose();
    },
  };
}
