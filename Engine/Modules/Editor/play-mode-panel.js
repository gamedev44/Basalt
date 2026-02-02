/**
 * Basalt Play Mode Panel — UE5-style play mode settings (PIE, New Window)
 * Dock panel for editor layout.
 */

const PLAY_MODE = { PIE: 'pie', NEW_WINDOW: 'newWindow' };

export function createPlayModePanel(editorMode, onPlayInNewWindow, container = null) {
  let currentMode = PLAY_MODE.PIE;
  const parent = container || document.body;

  const panel = document.createElement('div');
  panel.id = 'play-mode-panel';
  panel.className = 'play-mode-panel';
  panel.innerHTML = `
    <style>
      .play-mode-panel {
        width: 100%;
        height: 100%;
        padding: 12px;
        background: #1e1e1e;
        color: #ddd;
        font-family: 'Segoe UI', sans-serif;
        font-size: 12px;
        overflow-y: auto;
        box-sizing: border-box;
      }
      .play-mode-panel h3 {
        margin: 0 0 12px 0;
        font-size: 11px;
        font-weight: 600;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .play-mode-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .play-mode-btn {
        padding: 8px 14px;
        background: #333;
        border: 1px solid #444;
        border-radius: 4px;
        color: #ddd;
        cursor: pointer;
        font-size: 11px;
      }
      .play-mode-btn:hover { background: #444; }
      .play-mode-btn.primary { background: rgba(0, 122, 204, 0.4); border-color: #007acc; }
      .play-mode-btn.primary:hover { background: rgba(0, 122, 204, 0.6); }
      .play-mode-btn.stop { background: rgba(180, 60, 60, 0.4); border-color: #b43c3c; }
      .play-mode-btn.stop:hover { background: rgba(180, 60, 60, 0.6); }
      .play-mode-label { flex: 1; color: #aaa; font-size: 11px; }
      .play-mode-section { margin-bottom: 16px; }
    </style>
    <div class="play-mode-section">
      <h3>Play In Editor (PIE)</h3>
      <div class="play-mode-row">
        <button id="pie-toggle" class="play-mode-btn primary">Play</button>
        <span class="play-mode-label">Play/Stop in viewport</span>
      </div>
    </div>
    <div class="play-mode-section">
      <h3>Play Options</h3>
      <div class="play-mode-row">
        <button id="play-new-window" class="play-mode-btn">Play in New Window</button>
        <span class="play-mode-label">Open full-screen play in new tab</span>
      </div>
    </div>
  `;

  const pieBtn = panel.querySelector('#pie-toggle');
  const newWindowBtn = panel.querySelector('#play-new-window');

  const updatePieButton = () => {
    if (!pieBtn) return;
    const playing = editorMode?.isPlaying ?? false;
    pieBtn.textContent = playing ? 'Stop' : 'Play';
    pieBtn.classList.toggle('primary', !playing);
    pieBtn.classList.toggle('stop', playing);
  };

  const pieSection = panel.querySelector('.play-mode-section');
  if (pieBtn && editorMode) {
    pieBtn.onclick = () => {
      editorMode.toggle();
      updatePieButton();
    };
  } else if (pieSection) {
    pieSection.style.display = 'none';
  }

  if (newWindowBtn && onPlayInNewWindow) {
    newWindowBtn.onclick = () => onPlayInNewWindow();
  }

  updatePieButton();
  parent.appendChild(panel);

  return {
    panel,
    updatePieButton,
    dispose() {
      panel.remove();
    },
  };
}

export { PLAY_MODE };
