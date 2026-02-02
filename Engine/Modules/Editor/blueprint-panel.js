/**
 * Basalt Blueprint Panel — Embeds Nexus Node Editor (Blueprint_Editor.html) in an iframe.
 * Replaces the old Variables + Components layout with the full node graph editor.
 */

export function createBlueprintPanel(container, { config, persistConfig, getScene } = {}) {
  if (!container) return { dispose: () => {} };

  const root = document.createElement('div');
  root.className = 'blueprint-panel';
  root.style.cssText = 'display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;background:#0a0a0a;';

  const iframe = document.createElement('iframe');
  iframe.src = 'Blueprint_Editor.html';
  iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
  iframe.title = 'MC logic graph FOR Micro chip';

  root.appendChild(iframe);
  container.innerHTML = '';
  container.appendChild(root);

  return {
    init() {
      // No module dependencies needed — Nexus editor is self-contained
    },
    dispose() {
      iframe.src = 'about:blank';
      root.remove();
    },
  };
}
