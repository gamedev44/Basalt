/**
 * Basalt HUD — Crosshair, statsText, buildInfo (Babylon.GUI)
 * Uses engine.getFps() for real Babylon.js FPS; smoothed display + frame time.
 */

import { getCrosshairStyle } from '../Player/ads.js';

export function createHUD(scene, config = null) {
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('HUD');

  const crosshairContainer = new BABYLON.GUI.Container('crosshair');
  crosshairContainer.width = '20px';
  crosshairContainer.height = '20px';
  advancedTexture.addControl(crosshairContainer);

  const vLine = new BABYLON.GUI.Rectangle();
  vLine.width = '2px';
  vLine.height = '100%';
  vLine.color = 'white';
  vLine.thickness = 0;
  vLine.background = 'white';
  crosshairContainer.addControl(vLine);

  const hLine = new BABYLON.GUI.Rectangle();
  hLine.width = '100%';
  hLine.height = '2px';
  hLine.color = 'white';
  hLine.thickness = 0;
  hLine.background = 'white';
  crosshairContainer.addControl(hLine);

  const statsText = new BABYLON.GUI.TextBlock();
  statsText.text = 'FPS: 0 (0 ms)\nBullets: 0\nJumps: 0';
  statsText.color = 'white';
  statsText.fontSize = 18;
  statsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  statsText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
  statsText.left = '20px';
  statsText.top = '20px';
  advancedTexture.addControl(statsText);

  let smoothedFps = 0;
  const FPS_SMOOTH = 0.15;

  const buildInfo = new BABYLON.GUI.TextBlock();
  buildInfo.text = 'Iron Will First Person WebGPU Engine with Babylon 8 and HavokSDK 5 - (Experimental Renderer).';
  buildInfo.color = 'rgba(255,255,255,0.6)';
  buildInfo.fontSize = 14;
  buildInfo.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  buildInfo.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  buildInfo.left = '-20px';
  buildInfo.top = '-20px';
  advancedTexture.addControl(buildInfo);

  const updateStats = (engine, bullets, jumps) => {
    const rawFps = engine.getFps();
    const deltaMs = engine.getDeltaTime();
    smoothedFps = smoothedFps ? smoothedFps * (1 - FPS_SMOOTH) + rawFps * FPS_SMOOTH : rawFps;
    const fpsStr = Math.round(smoothedFps).toString();
    const msStr = deltaMs >= 1 ? (deltaMs | 0) : deltaMs.toFixed(1);
    statsText.text = `FPS: ${fpsStr} (${msStr} ms)\nBullets: ${bullets}\nJumps: ${jumps}`;
  };

  const updateCrosshair = (isAds) => {
    const style = getCrosshairStyle(config, isAds);
    crosshairContainer.alpha = style.alpha;
    crosshairContainer.scaleX = style.scale;
    crosshairContainer.scaleY = style.scale;
  };

  return {
    advancedTexture,
    crosshairContainer,
    statsText,
    buildInfo,
    updateStats,
    updateCrosshair,
    dispose() {
      advancedTexture.dispose();
    },
  };
}
