/**
 * Basalt Status Bar — UE5-style bottom bar
 * Content Drawer toggle, Output Log tab, Cmd dropdown + console input (stub), Derived Data, Source Control
 */

export function createStatusBar(container, options = {}) {
  if (!container) return { dispose: () => {} };

  const {
    onToggleContentDrawer,
    contentDrawerExpanded = true,
    openPanel,
  } = options;

  const root = document.createElement('div');
  root.id = 'status-bar';
  root.className = 'status-bar';
  root.style.cssText = `
    display: flex;
    align-items: center;
    height: 24px;
    min-height: 24px;
    background: #161b22;
    border-top: 1px solid #30363d;
    padding: 0 8px;
    gap: 12px;
    font-size: 11px;
    color: #8b949e;
    flex-shrink: 0;
  `;

  // Content Drawer toggle
  const drawerBtn = document.createElement('div');
  drawerBtn.className = 'status-bar-item';
  drawerBtn.textContent = contentDrawerExpanded ? '▼ Blueprint Graph' : '▶ Blueprint Graph';
  drawerBtn.style.cssText = 'cursor: pointer; padding: 0 6px; user-select: none;';
  drawerBtn.onmouseenter = () => { drawerBtn.style.color = '#c9d1d9'; };
  drawerBtn.onmouseleave = () => { drawerBtn.style.color = '#8b949e'; };
  drawerBtn.onclick = () => {
    if (onToggleContentDrawer) onToggleContentDrawer();
    else openPanel?.('contentDrawer');
  };
  root.appendChild(drawerBtn);

  const sep = () => {
    const s = document.createElement('span');
    s.style.cssText = 'width:1px;height:14px;background:#30363d;margin:0 4px;';
    return s;
  };
  root.appendChild(sep());

  // Output Log tab
  const logTab = document.createElement('div');
  logTab.className = 'status-bar-item';
  logTab.textContent = 'Output Log';
  logTab.style.cssText = 'cursor: pointer; padding: 0 6px; user-select: none;';
  logTab.onmouseenter = () => { logTab.style.color = '#c9d1d9'; };
  logTab.onmouseleave = () => { logTab.style.color = '#8b949e'; };
  logTab.onclick = () => { /* stub: open output log panel */ };
  root.appendChild(logTab);
  root.appendChild(sep());

  // Cmd dropdown + input (stub)
  const cmdWrap = document.createElement('div');
  cmdWrap.style.cssText = 'display: flex; align-items: center; gap: 4px;';
  const cmdSelect = document.createElement('select');
  cmdSelect.style.cssText = 'background:#21262d;border:1px solid #30363d;color:#c9d1d9;font-size:11px;height:20px;padding:0 4px;';
  cmdSelect.innerHTML = '<option>Cmd</option><option>Python</option>';
  const cmdInput = document.createElement('input');
  cmdInput.type = 'text';
  cmdInput.placeholder = 'Enter Console Command';
  cmdInput.style.cssText = 'width:180px;background:#21262d;border:1px solid #30363d;color:#c9d1d9;font-size:11px;height:20px;padding:0 6px;';
  cmdInput.onkeydown = (e) => { if (e.key === 'Enter') { /* stub */ } };
  cmdWrap.appendChild(cmdSelect);
  cmdWrap.appendChild(cmdInput);
  root.appendChild(cmdWrap);

  root.appendChild(sep());

  // Status: Derived Data, Source Control
  const statusWrap = document.createElement('div');
  statusWrap.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-left: auto;';
  statusWrap.innerHTML = `
    <span>Derived Data</span>
    <span>Source Control: Off</span>
  `;
  root.appendChild(statusWrap);

  container.appendChild(root);

  return {
    setContentDrawerExpanded(expanded) {
      drawerBtn.textContent = expanded ? '▼ Content Drawer' : '▶ Content Drawer';
    },
    dispose() {
      root.remove();
    },
  };
}
