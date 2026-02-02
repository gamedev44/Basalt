/**
 * Basalt Menu Bar — UE5-style top menu (File, Edit, Window, Tools, Build, Select, Actor, Help)
 * Window menu lists restorable panels; File → Save (persistConfig); Edit → Undo/Redo (stub).
 */

export function createMenuBar(container, options = {}) {
  if (!container) return { dispose: () => {} };

  const {
    onSave,
    onUndo,
    onRedo,
    openPanel,
    restorablePanels = [],
    setTheme,
    setLayoutPreset,
    layoutPresetOptions = [],
    onEditorSettings,
    onProjectSettings,
  } = options;

  const root = document.createElement('div');
  root.id = 'menu-bar';
  root.className = 'menu-bar';
  root.style.cssText = `
    display: flex;
    align-items: center;
    height: 24px;
    background: #161b22;
    border-bottom: 1px solid #30363d;
    padding: 0 8px;
    gap: 2px;
    font-size: 12px;
    color: #c9d1d9;
    flex-shrink: 0;
  `;

  const menuItems = [
    {
      label: 'File',
      sub: [
        { label: 'Save', shortcut: 'Ctrl+S', action: onSave },
        { label: 'Save All', action: () => onSave?.() },
        { type: 'sep' },
        { label: 'Exit', action: () => window.close() },
      ],
    },
    {
      label: 'Edit',
      sub: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: onUndo },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: onRedo },
        { type: 'sep' },
        { label: 'Editor Settings', action: onEditorSettings },
        { label: 'Project Settings', action: onProjectSettings },
      ],
    },
    {
      label: 'Window',
      sub: [
        ...restorablePanels.map((p) => ({
          label: p.title,
          action: () => openPanel?.(p.id),
        })),
        ...(options.renamePanel ? [{ type: 'sep' }, { label: 'Rename Panel...', action: options.renamePanel }] : []),
      ],
    },
    {
      label: 'Tools',
      sub: [
        { label: 'Toggle Inspector', action: () => document.getElementById('inspector-btn')?.click?.() },
        ...(options.onInspectorPopup ? [{ label: 'Inspector in New Window', action: options.onInspectorPopup }] : []),
        { label: 'Toggle Stats', action: () => document.getElementById('stats-btn')?.click?.() },
      ],
    },
    {
      label: 'Build',
      sub: [{ label: 'Build Project (stub)', action: () => {} }],
    },
    {
      label: 'Select',
      sub: [
        { label: 'Select All', action: () => {} },
        { label: 'Deselect All', action: () => {} },
      ],
    },
    {
      label: 'Actor',
      sub: [
        { label: 'Place Actor', action: () => openPanel?.('placeActors') },
        { label: 'Blueprint Editor', action: () => openPanel?.('blueprint') },
      ],
    },
    {
      label: 'Help',
      sub: [
        { label: 'Documentation', action: () => window.open('https://github.com/gamedev44/Basalt', '_blank') },
        { label: 'About Basalt', action: () => alert('Basalt Engine — Forged in Blender. Hardened in Basalt.') },
      ],
    },
  ];

  if (setTheme && Array.isArray(options.themeOptions) && options.themeOptions.length > 0) {
    menuItems[1].sub.push({ type: 'sep' });
    menuItems[1].sub.push({ label: 'Theme', sub: options.themeOptions.map((t) => ({ label: t.name, action: () => setTheme(t.id) })) });
  }
  if (setLayoutPreset && Array.isArray(layoutPresetOptions) && layoutPresetOptions.length > 0) {
    menuItems[1].sub.push({ label: 'Layout Preset', sub: layoutPresetOptions.map((p) => ({ label: p.name, action: () => setLayoutPreset(p.id) })) });
  }

  let activeMenu = null;

  const createMenuBtn = (label) => {
    const btn = document.createElement('div');
    btn.className = 'menu-bar-item';
    btn.textContent = label;
    btn.style.cssText = `
      padding: 4px 10px;
      cursor: pointer;
      border-radius: 2px;
      user-select: none;
    `;
    btn.onmouseenter = () => {
      btn.style.background = 'rgba(255,255,255,0.08)';
    };
    btn.onmouseleave = () => {
      if (activeMenu !== btn) btn.style.background = 'transparent';
    };
    return btn;
  };

  const createDropdown = (items, parentEl) => {
    const dd = document.createElement('div');
    dd.className = 'menu-dropdown';
    dd.style.cssText = `
      position: fixed;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 4px;
      min-width: 180px;
      padding: 4px 0;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    `;

    const flattenItems = (arr, depth = 0) => {
      const out = [];
      for (const it of arr || []) {
        if (it.type === 'sep') {
          out.push({ type: 'sep' });
        } else if (it.sub && Array.isArray(it.sub) && !it.action) {
          out.push(...flattenItems(it.sub, depth + 1));
        } else {
          out.push({ ...it, depth });
        }
      }
      return out;
    };

    const itemsFlat = flattenItems(items);
    itemsFlat.forEach((it) => {
      if (it.type === 'sep') {
        const sep = document.createElement('div');
        sep.style.cssText = 'height: 1px; background: #30363d; margin: 4px 8px;';
        dd.appendChild(sep);
        return;
      }
      const row = document.createElement('div');
      row.style.cssText = `
        padding: 6px 24px 6px ${12 + (it.depth || 0) * 12}px;
        cursor: pointer;
        font-size: 12px;
        color: #c9d1d9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      row.textContent = it.label;
      if (it.shortcut) {
        const kbd = document.createElement('span');
        kbd.textContent = it.shortcut;
        kbd.style.cssText = 'font-size: 10px; color: #888; margin-left: 16px;';
        row.appendChild(kbd);
      }
      row.onmouseenter = () => { row.style.background = 'rgba(255,255,255,0.08)'; };
      row.onmouseleave = () => { row.style.background = 'transparent'; };
      row.onclick = (e) => {
        e.stopPropagation();
        if (it.action) it.action();
        closeMenu();
      };
      dd.appendChild(row);
    });

    const rect = parentEl.getBoundingClientRect();
    dd.style.left = rect.left + 'px';
    dd.style.top = rect.bottom + 'px';
    return dd;
  };

  const closeMenu = () => {
    if (activeMenu) {
      const dd = document.querySelector('.menu-dropdown');
      if (dd) dd.remove();
      activeMenu.style.background = 'transparent';
      activeMenu = null;
      document.removeEventListener('click', closeMenu);
    }
  };

  menuItems.forEach((menu) => {
    const btn = createMenuBtn(menu.label);
    btn.onclick = (e) => {
      e.stopPropagation();
      closeMenu();
      const dd = createDropdown(menu.sub, btn);
      document.body.appendChild(dd);
      activeMenu = btn;
      btn.style.background = 'rgba(255,255,255,0.08)';
      setTimeout(() => document.addEventListener('click', closeMenu), 0);
    };
    root.appendChild(btn);
  });

  if (onSave) {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    });
  }

  container.innerHTML = '';
  container.appendChild(root);

  return {
    dispose() {
      root.remove();
      if (onSave) window.removeEventListener('keydown', () => {});
    },
  };
}
