/**
 * Basalt Monaco Folder Panel — Browse and edit files from a folder (webkitdirectory)
 * Reference: Monaco Local Folder Explorer pattern. Uses standard file input for compatibility.
 */

const EXT_TO_LANG = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
  cpp: 'cpp', c: 'cpp', java: 'java', lua: 'lua',
};

function getLanguage(ext) {
  return EXT_TO_LANG[ext] || 'plaintext';
}

export function createMonacoFolderPanel(container, files = []) {
  if (!container) return { dispose: () => {} };

  const root = document.createElement('div');
  root.className = 'monaco-folder-panel';
  root.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;background:#1e1e1e;color:#ccc;overflow:hidden;';

  root.innerHTML = `
    <style>
      .mfp-header { padding:6px 10px; border-bottom:1px solid #333; display:flex; align-items:center; gap:8px; flex-shrink:0; background:#252526; }
      .mfp-search { flex:1; min-width:0; padding:4px 8px; background:#3c3c3c; border:none; border-radius:2px; color:#ccc; font-size:12px; }
      .mfp-search:focus { outline:none; border:1px solid #007acc; }
      .mfp-body { flex:1; display:flex; min-height:0; }
      .mfp-sidebar { width:280px; border-right:1px solid #333; background:#1e1e1e; display:flex; flex-direction:column; overflow:hidden; }
      .mfp-file-list { flex:1; overflow-y:auto; padding:4px 0; }
      .mfp-file-item { padding:6px 12px; cursor:pointer; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-bottom:1px solid #252526; }
      .mfp-file-item:hover { background:#2a2d2e; color:#fff; }
      .mfp-file-item.active { background:#37373d; color:#fff; border-left:3px solid #007acc; }
      .mfp-editor-wrap { flex:1; position:relative; min-width:0; }
      .mfp-placeholder { padding:20px; color:#6e7681; font-size:13px; }
      ::-webkit-scrollbar { width:8px; }
      ::-webkit-scrollbar-thumb { background:#333; border-radius:4px; }
    </style>
    <div class="mfp-header">
      <input type="text" class="mfp-search" id="mfp-search" placeholder="Filter files..." />
    </div>
    <div class="mfp-body">
      <aside class="mfp-sidebar">
        <div class="mfp-file-list" id="mfp-file-list"></div>
      </aside>
      <main class="mfp-editor-wrap">
        <div id="mfp-monaco" class="mfp-editor-wrap"></div>
      </main>
    </div>
  `;

  const fileListEl = root.querySelector('#mfp-file-list');
  const searchInput = root.querySelector('#mfp-search');
  const monacoWrap = root.querySelector('#mfp-monaco');

  let editor = null;
  let allFiles = [...files];
  let filteredFiles = [...files];

  function renderFileList(filesToShow) {
    fileListEl.innerHTML = '';
    if (filesToShow.length === 0) {
      fileListEl.innerHTML = '<div class="mfp-placeholder" style="padding:12px;">No files found.</div>';
      return;
    }
    filesToShow.sort((a, b) => (a.webkitRelativePath || a.name || '').localeCompare(b.webkitRelativePath || b.name || ''));
    filesToShow.forEach((file) => {
      const div = document.createElement('div');
      div.className = 'mfp-file-item';
      div.textContent = file.webkitRelativePath || file.name || '?';
      div.title = file.webkitRelativePath || file.name || '';
      div.onclick = () => loadFile(file, div);
      fileListEl.appendChild(div);
    });
  }

  async function loadFile(file, element) {
    fileListEl.querySelectorAll('.mfp-file-item').forEach((el) => el.classList.remove('active'));
    if (element) element.classList.add('active');

    const content = await file.text();
    const ext = (file.name || '').split('.').pop().toLowerCase();
    const lang = getLanguage(ext);

    if (typeof require === 'undefined') {
      monacoWrap.innerHTML = '<div class="mfp-placeholder">Monaco not loaded. Ensure Editor_Layout has Monaco scripts.</div>';
      return;
    }

    require(['vs/editor/editor.main'], () => {
      if (!editor) {
        editor = monaco.editor.create(monacoWrap, {
          value: content,
          language: lang,
          theme: 'vs-dark',
          automaticLayout: true,
          fontSize: 13,
          lineHeight: 20,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          minimap: { enabled: true },
        });
      } else {
        const oldModel = editor.getModel();
        const newModel = monaco.editor.createModel(content, lang);
        editor.setModel(newModel);
        if (oldModel) oldModel.dispose();
      }
    });
  }

  searchInput.oninput = () => {
    const term = searchInput.value.toLowerCase();
    filteredFiles = term
      ? allFiles.filter((f) => (f.webkitRelativePath || f.name || '').toLowerCase().includes(term))
      : allFiles;
    renderFileList(filteredFiles);
  };

  renderFileList(filteredFiles);

  if (filteredFiles.length > 0) {
    loadFile(filteredFiles[0], fileListEl.querySelector('.mfp-file-item'));
  } else {
    monacoWrap.innerHTML = '<div class="mfp-placeholder">Select a folder to begin. Use Content Browser → Open Folder.</div>';
  }

  container.innerHTML = '';
  container.appendChild(root);

  return {
    dispose() {
      if (editor) {
        editor.dispose();
        editor = null;
      }
      root.remove();
    },
  };
}
