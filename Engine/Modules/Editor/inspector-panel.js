/**
 * Basalt Inspector Panel — Babylon debugLayer show/hide
 * parentElement: optional container for embedded inspector (e.g. dock panel)
 */

export function createInspectorPanel(scene, parentElement = null) {
  return {
    show() {
      scene.debugLayer.show({
        embedMode: true,
        ...(parentElement && { parentElement }),
      });
    },
    hide() {
      scene.debugLayer.hide();
    },
    toggle() {
      if (scene.debugLayer.isVisible()) scene.debugLayer.hide();
      else this.show();
    },
    isVisible() {
      return scene.debugLayer.isVisible();
    },
  };
}
