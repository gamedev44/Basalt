/**
 * Basalt Crosshair — Dynamic IW5-style crosshair for Advanced FPS template
 * Spread based on movement (walk/sprint), recoil bloom when firing, ADS fade.
 * Per-weapon configs supported via setConfig().
 */

/** Default config — rifle-style spread */
export const CROSSHAIR_DEFAULTS = {
  BASE_GAP: 24,
  WALK_GAP: 40,
  SPRINT_GAP: 80,
  RECOIL_BLOOM: 15,
  RECOIL_RECOVERY: 0.15,
  THICKNESS: 2,
  OUTLINE_SIZE: 1,
  LENGTH: 18,
  COLOR: 'white',
  OUTLINE: 'black',
  /** Sway influence 0–10: 0 = locked at center, 10 = 1:1 with barrel sway */
  SWAY_INFLUENCE: 5,
  /** Pixel scale for sway (recoil units → screen px) */
  SWAY_PIXEL_SCALE: 200,
  /** Sway smoothing 0–1: higher = snappier, lower = smoother (0.08–0.15 typical) */
  SWAY_SMOOTH: 0.025,
};

/** Pistol — tighter base, less sprint spread */
export const CROSSHAIR_PISTOL = {
  ...CROSSHAIR_DEFAULTS,
  BASE_GAP: 18,
  WALK_GAP: 32,
  SPRINT_GAP: 60,
  RECOIL_BLOOM: 12,
  SWAY_INFLUENCE: 4,
};

/**
 * Create dynamic crosshair system. Returns { update, setConfig, dispose }.
 * @param {BABYLON.Scene} scene
 * @param {Object} [config] — CROSSHAIR_DEFAULTS merged with this
 */
export function createCrosshair(scene, config = {}) {
  const cfg = { ...CROSSHAIR_DEFAULTS, ...config };
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('CrosshairUI', true);
  const container = new BABYLON.GUI.Container();
  container.horizontalCenter = 0;
  container.verticalCenter = 0;
  advancedTexture.addControl(container);

  const bars = {
    top: { main: new BABYLON.GUI.Rectangle(), bg: new BABYLON.GUI.Rectangle() },
    bottom: { main: new BABYLON.GUI.Rectangle(), bg: new BABYLON.GUI.Rectangle() },
    left: { main: new BABYLON.GUI.Rectangle(), bg: new BABYLON.GUI.Rectangle() },
    right: { main: new BABYLON.GUI.Rectangle(), bg: new BABYLON.GUI.Rectangle() },
  };

  Object.keys(bars).forEach((key) => {
    const pair = bars[key];
    pair.bg.background = cfg.OUTLINE;
    pair.bg.thickness = 0;
    container.addControl(pair.bg);
    pair.main.background = cfg.COLOR;
    pair.main.thickness = 0;
    container.addControl(pair.main);
  });

  const fullThickness = cfg.THICKNESS + cfg.OUTLINE_SIZE * 2;
  const fullLength = cfg.LENGTH + cfg.OUTLINE_SIZE * 2;

  const setSizes = () => {
    ['top', 'bottom'].forEach((key) => {
      bars[key].bg.width = `${fullThickness}px`;
      bars[key].bg.height = `${fullLength}px`;
      bars[key].main.width = `${cfg.THICKNESS}px`;
      bars[key].main.height = `${cfg.LENGTH}px`;
    });
    ['left', 'right'].forEach((key) => {
      bars[key].bg.width = `${fullLength}px`;
      bars[key].bg.height = `${fullThickness}px`;
      bars[key].main.width = `${cfg.LENGTH}px`;
      bars[key].main.height = `${cfg.THICKNESS}px`;
    });
  };
  setSizes();

  let recoilAmount = 0;
  let swaySmoothX = 0;
  let swaySmoothY = 0;
  let currentConfig = { ...cfg };

  const update = (isMoving, isSprinting, isFiring, isADS, swayX = 0, swayY = 0, deltaTime = 16) => {
    container.alpha = isADS ? 0 : 1;
    if (isADS) return;

    let targetGap = currentConfig.BASE_GAP;
    if (isMoving) {
      targetGap = isSprinting ? currentConfig.SPRINT_GAP : currentConfig.WALK_GAP;
    }

    if (isFiring) {
      recoilAmount += currentConfig.RECOIL_BLOOM * 0.25;
      if (recoilAmount > 60) recoilAmount = 60;
    }
    recoilAmount *= 1 - currentConfig.RECOIL_RECOVERY;

    const finalGap = targetGap + recoilAmount;
    const offset = finalGap + currentConfig.LENGTH / 2;

    bars.top.bg.top = bars.top.main.top = `-${offset}px`;
    bars.bottom.bg.top = bars.bottom.main.top = `${offset}px`;
    bars.left.bg.left = bars.left.main.left = `-${offset}px`;
    bars.right.bg.left = bars.right.main.left = `${offset}px`;

    const dt = typeof deltaTime === 'number' && deltaTime > 0 ? deltaTime : 16;
    const smooth = Math.min(1, (currentConfig.SWAY_SMOOTH ?? 0.1) * (dt / 16));
    swaySmoothX += (swayX - swaySmoothX) * smooth;
    swaySmoothY += (swayY - swaySmoothY) * smooth;

    const inf = (currentConfig.SWAY_INFLUENCE ?? 0) / 10;
    const scale = currentConfig.SWAY_PIXEL_SCALE ?? 200;
    const pxX = swaySmoothX * scale * inf;
    const pxY = swaySmoothY * scale * inf;
    container.left = `${pxX}px`;
    container.top = `${pxY}px`;
  };

  const setConfig = (newConfig) => {
    if (newConfig) {
      currentConfig = { ...CROSSHAIR_DEFAULTS, ...newConfig };
    }
  };

  const dispose = () => {
    advancedTexture.dispose();
  };

  return { update, setConfig, dispose };
}
