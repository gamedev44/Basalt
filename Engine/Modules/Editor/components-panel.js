/**
 * Basalt Components Panel — Blueprint Editor: Components, Variables, Functions
 * Placeholder for full blueprint component system.
 */

export function createComponentsPanel(scene, container) {
  if (!container) return null;

  const panel = document.createElement('div');
  panel.className = 'components-panel';
  panel.innerHTML = `
    <style>
      .components-panel {
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
      .components-panel h3 {
        margin: 0 0 12px 0;
        font-size: 11px;
        font-weight: 600;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .components-panel .hint {
        color: #666;
        font-size: 11px;
        line-height: 1.5;
      }
    </style>
    <h3>Components / Variables / Functions</h3>
    <div class="hint">
      Blueprint component system. Attach components to actors, edit variables, define functions.
    </div>
  `;

  container.appendChild(panel);
  return { panel, dispose: () => panel.remove() };
}
