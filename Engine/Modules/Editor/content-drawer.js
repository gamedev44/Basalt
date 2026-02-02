/**
 * Basalt Content Drawer — In-game content, local file explorer, Blueprint Editor entry
 * Blueprint Editor button only shown when a blueprint file is selected in Content Browser.
 */

export function createContentDrawer(container, { onOpenBlueprintEditor, openPanel, getSelectedAsset } = {}) {
  if (!container) return { dispose: () => {} };

  const root = document.createElement('div');
  root.className = 'content-drawer';
  root.innerHTML = `
    <style>
      .content-drawer {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #161b22;
        color: #c9d1d9;
        font-size: 11px;
      }
      .cd-section {
        padding: 8px;
        border-bottom: 1px solid #30363d;
      }
      .cd-section-title {
        font-size: 10px;
        color: #888;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .cd-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 6px;
        transition: background 0.15s, border-color 0.15s;
      }
      .cd-card:hover {
        background: #30363d;
        border-color: #4c65d4;
      }
      .cd-card-icon {
        font-size: 20px;
        opacity: 0.9;
      }
      .cd-card-label { flex: 1; }
      .cd-card-desc {
        font-size: 9px;
        color: #666;
        margin-top: 2px;
      }
      .cd-placeholder {
        padding: 12px;
        color: #666;
        font-size: 10px;
      }
      .cd-blueprint-section { display: none; }
      .cd-blueprint-section.visible { display: block; }
    </style>
    <div class="cd-section cd-blueprint-section" id="cd-blueprint-section">
      <div class="cd-section-title">Blueprint</div>
      <div class="cd-card" id="cd-blueprint-editor">
        <span class="cd-card-icon material-symbols-outlined">account_tree</span>
        <div class="cd-card-label">
          <div>Blueprint Editor</div>
          <div class="cd-card-desc" id="cd-blueprint-desc">Edit player objects, components, variables, functions</div>
        </div>
      </div>
    </div>
    <div class="cd-section">
      <div class="cd-section-title">Content</div>
      <div class="cd-placeholder">Select a blueprint in Content Browser to edit, or use right-click → Open Blueprint Editor</div>
    </div>
  `;

  const blueprintSection = root.querySelector('#cd-blueprint-section');
  const blueprintDesc = root.querySelector('#cd-blueprint-desc');
  const blueprintBtn = root.querySelector('#cd-blueprint-editor');

  const updateBlueprintVisibility = () => {
    const asset = typeof getSelectedAsset === 'function' ? getSelectedAsset() : null;
    const isBlueprint = asset?.type === 'blueprint';
    blueprintSection?.classList.toggle('visible', !!isBlueprint);
    if (blueprintDesc && asset?.name) {
      blueprintDesc.textContent = `Edit ${asset.name}`;
    }
  };

  if (blueprintBtn) {
    blueprintBtn.onclick = () => {
      if (openPanel) openPanel('blueprint');
      else if (onOpenBlueprintEditor) onOpenBlueprintEditor();
    };
  }

  updateBlueprintVisibility();
  const interval = setInterval(updateBlueprintVisibility, 500);

  container.innerHTML = '';
  container.appendChild(root);

  return {
    updateBlueprintVisibility,
    dispose() {
      clearInterval(interval);
      root.remove();
    },
  };
}
