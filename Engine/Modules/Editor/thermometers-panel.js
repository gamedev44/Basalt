/**
 * Basalt Thermometers Panel — Gameplay, Graphics, Audio usage
 * Dreams-style optimization: max thresholds per metric; warns when exceeded.
 * Keeps games performant across varied hardware.
 */

/** Max thresholds — exceeded = players' PCs may struggle */
const THERMOMETER_LIMITS = {
  logic: { max: 100, label: 'Logic / Scripts', msg: 'Logic overload — players\' PCs may struggle with script updates.' },
  objects: { max: 500, label: 'Objects (puppets, emitters)', msg: 'Too many objects — consider LOD, culling, or instancing.' },
  memory: { max: 256, label: 'Memory (MB)', msg: 'High memory usage — low-end devices may stutter or crash.' },
  complexity: { max: 500, label: 'Shader / Model complexity', msg: 'Graphics overload — reduce draw calls or material count.' },
  audio: { max: 50, label: 'Sound samples / data', msg: 'Audio overload — too many sounds; mix or pool emitters.' },
};

/** Rolling average for memory to smooth GC spikes (240→265→240) */
const MEMORY_SAMPLES = 8;

export function createThermometersPanel(engine, scene, container, options = {}) {
  if (!container) return null;

  const { getScene, getLogicCount } = options;
  const memoryHistory = [];

  const panel = document.createElement('div');
  panel.className = 'thermometers-panel';
  panel.innerHTML = `
    <style>
      .thermometers-panel {
        width: 100%;
        height: 100%;
        padding: 12px;
        background: #1e1e1e;
        color: #ddd;
        font-family: 'Segoe UI', sans-serif;
        font-size: 11px;
        overflow-y: auto;
        box-sizing: border-box;
      }
      .thermometers-panel h3 {
        margin: 0 0 8px 0;
        font-size: 10px;
        font-weight: 600;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .thermometer-row {
        margin-bottom: 12px;
      }
      .thermometer-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
        font-size: 10px;
        color: #aaa;
      }
      .thermometer-bar {
        height: 6px;
        background: rgba(0,0,0,0.4);
        border-radius: 2px;
        overflow: hidden;
      }
      .thermometer-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.15s ease;
      }
      .thermometer-fill.gameplay { background: linear-gradient(90deg, #2d5a27, #4ade80); }
      .thermometer-fill.graphics { background: linear-gradient(90deg, #1e3a5f, #60a5fa); }
      .thermometer-fill.audio { background: linear-gradient(90deg, #4a1d5f, #c084fc); }
      .thermometer-fill.over { background: linear-gradient(90deg, #7f1d1d, #ef4444) !important; }
      .thermo-warning {
        margin-top: 8px;
        padding: 8px;
        background: rgba(127, 29, 29, 0.4);
        border: 1px solid #b91c1c;
        border-radius: 4px;
        font-size: 10px;
        color: #fca5a5;
      }
      .thermo-warning:empty { display: none; }
    </style>
    <h3>Gameplay Thermometer</h3>
    <div class="thermometer-row">
      <div class="thermometer-label"><span>Logic / Scripts</span><span id="gameplay-logic">0</span></div>
      <div class="thermometer-bar"><div id="gameplay-logic-bar" class="thermometer-fill gameplay" style="width:0%"></div></div>
    </div>
    <div class="thermometer-row">
      <div class="thermometer-label"><span>Objects (puppets, emitters)</span><span id="gameplay-objects">0</span></div>
      <div class="thermometer-bar"><div id="gameplay-objects-bar" class="thermometer-fill gameplay" style="width:0%"></div></div>
    </div>
    <h3>Graphics Thermometer</h3>
    <div class="thermometer-row">
      <div class="thermometer-label"><span>Memory (MB)</span><span id="graphics-memory">0</span></div>
      <div class="thermometer-bar"><div id="graphics-memory-bar" class="thermometer-fill graphics" style="width:0%"></div></div>
    </div>
    <div class="thermometer-row">
      <div class="thermometer-label"><span>Shader / Model complexity</span><span id="graphics-complexity">0</span></div>
      <div class="thermometer-bar"><div id="graphics-complexity-bar" class="thermometer-fill graphics" style="width:0%"></div></div>
    </div>
    <h3>Audio Thermometer</h3>
    <div class="thermometer-row">
      <div class="thermometer-label"><span>Sound samples / data</span><span id="audio-samples">0</span></div>
      <div class="thermometer-bar"><div id="audio-samples-bar" class="thermometer-fill audio" style="width:0%"></div></div>
    </div>
    <div id="thermo-warnings" class="thermo-warning"></div>
  `;

  const setBar = (id, value, max = 100, isOver = false) => {
    const el = panel.querySelector(`#${id}`);
    const barEl = panel.querySelector(`#${id}-bar`);
    if (el && barEl) {
      const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
      el.textContent = value + ' / ' + max;
      barEl.style.width = Math.min(pct, 100) + '%';
      barEl.classList.toggle('over', isOver);
    }
  };

  const update = () => {
    let eng = engine;
    let scn = scene;
    if ((!eng || !scn) && getScene) {
      scn = getScene();
      eng = scn?.getEngine?.() ?? null;
    }
    if (!eng || !scn) return;
    const meshCount = scn.meshes?.length ?? 0;
    const matCount = scn.materials?.length ?? 0;
    const drawCalls = eng.drawCalls ?? eng._drawCalls ?? meshCount;
    let behaviorCount = 0;
    (scn.meshes ?? []).forEach((m) => { behaviorCount += m.behaviors?.length ?? 0; });
    const scriptCount = typeof getLogicCount === 'function' ? getLogicCount(behaviorCount) : behaviorCount;
    let rawMemMb = 0;
    if (typeof performance !== 'undefined' && performance.memory) {
      rawMemMb = (performance.memory.usedJSHeapSize ?? 0) / (1024 * 1024);
    } else if (eng.getMemoryInfo) {
      const info = eng.getMemoryInfo();
      rawMemMb = (info?.total ?? 0) / (1024 * 1024);
    }
    memoryHistory.push(rawMemMb);
    if (memoryHistory.length > MEMORY_SAMPLES) memoryHistory.shift();
    const memMb = memoryHistory.length ? memoryHistory.reduce((a, b) => a + b, 0) / memoryHistory.length : rawMemMb;

    const audioCount = scn.sounds?.length ?? 0;
    const complexity = matCount + drawCalls;

    const logicOver = scriptCount > THERMOMETER_LIMITS.logic.max;
    const objectsOver = meshCount > THERMOMETER_LIMITS.objects.max;
    const memOver = memMb > THERMOMETER_LIMITS.memory.max;
    const complexityOver = complexity > THERMOMETER_LIMITS.complexity.max;
    const audioOver = audioCount > THERMOMETER_LIMITS.audio.max;

    setBar('gameplay-logic', scriptCount, THERMOMETER_LIMITS.logic.max, logicOver);
    setBar('gameplay-objects', meshCount, THERMOMETER_LIMITS.objects.max, objectsOver);
    const memEl = panel.querySelector('#graphics-memory');
    const memBar = panel.querySelector('#graphics-memory-bar');
    if (memEl && memBar) {
      memEl.textContent = memMb.toFixed(1) + ' / ' + THERMOMETER_LIMITS.memory.max + ' MB';
      const memPct = Math.min(100, (memMb / THERMOMETER_LIMITS.memory.max) * 100);
      memBar.style.width = memPct + '%';
      memBar.classList.toggle('over', memOver);
    }
    setBar('graphics-complexity', complexity, THERMOMETER_LIMITS.complexity.max, complexityOver);
    setBar('audio-samples', audioCount, THERMOMETER_LIMITS.audio.max, audioOver);

    const warnings = [];
    if (logicOver) warnings.push(THERMOMETER_LIMITS.logic.msg);
    if (objectsOver) warnings.push(THERMOMETER_LIMITS.objects.msg);
    if (memOver) warnings.push(THERMOMETER_LIMITS.memory.msg);
    if (complexityOver) warnings.push(THERMOMETER_LIMITS.complexity.msg);
    if (audioOver) warnings.push(THERMOMETER_LIMITS.audio.msg);
    const warnEl = panel.querySelector('#thermo-warnings');
    if (warnEl) {
      warnEl.textContent = warnings.length ? '⚠ ' + warnings.join('\n') : '';
      warnEl.style.whiteSpace = warnings.length ? 'pre-wrap' : 'normal';
    }
  };

  container.appendChild(panel);
  let interval = setInterval(update, 500);

  return {
    panel,
    update,
    dispose() {
      clearInterval(interval);
      panel.remove();
    },
  };
}
