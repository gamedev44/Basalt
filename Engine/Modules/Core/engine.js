/**
 * Basalt Engine — Babylon engine init, canvas, resize
 * ResizeObserver handles dock panel resize (iframe viewport); window.resize for standalone.
 */

export function createEngine(canvasElement) {
  const engine = new BABYLON.Engine(canvasElement, true);

  const doResize = () => {
    try { engine.resize(); } catch (_) {}
  };

  window.addEventListener('resize', doResize);

  const target = canvasElement.parentElement || canvasElement;
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(doResize);
    ro.observe(target);
  }

  setTimeout(doResize, 50);
  setTimeout(doResize, 300);
  setTimeout(doResize, 800);

  return engine;
}
