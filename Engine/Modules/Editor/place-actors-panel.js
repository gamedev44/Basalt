/**
 * Basalt Place Actors Panel — UE5-style left panel
 * Search Classes, category filters (Basic, Lights, Volumes, etc.), actor list
 * Click spawns placeholder or wires to content-browser
 */

const ACTOR_CLASSES = [
  { id: 'actor', name: 'Actor', icon: 'category', category: 'basic', help: 'Base class for all placeable actors' },
  { id: 'character', name: 'Character', icon: 'person', category: 'basic', help: 'Character with movement and animation' },
  { id: 'pawn', name: 'Pawn', icon: 'sports_esports', category: 'basic', help: 'Possessable pawn' },
  { id: 'point_light', name: 'Point Light', icon: 'lightbulb', category: 'lights', help: 'Omnidirectional point light' },
  { id: 'directional_light', name: 'Directional Light', icon: 'wb_sunny', category: 'lights', help: 'Directional/sun light' },
  { id: 'player_start', name: 'Player Start', icon: 'play_circle', category: 'basic', help: 'Spawn point for player' },
  { id: 'static_mesh', name: 'Static Mesh', icon: 'view_in_ar', category: 'basic', help: 'Static mesh actor' },
  { id: 'camera', name: 'Camera', icon: 'videocam', category: 'basic', help: 'Camera actor' },
  { id: 'vehicle', name: 'Vehicle', icon: 'directions_car', category: 'vehicles', help: 'Physics vehicle (Havok chassis + wheels)' },
  { id: 'trigger_zone', name: 'Trigger Zone', icon: 'sensors', category: 'volumes', help: 'Volume that fires On Enter / On Exit' },
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'basic', name: 'Basic', icon: 'category' },
  { id: 'lights', name: 'Lights', icon: 'lightbulb' },
  { id: 'vehicles', name: 'Vehicles', icon: 'directions_car' },
  { id: 'volumes', name: 'Volumes', icon: 'sensors' },
];

export function createPlaceActorsPanel(container, options = {}) {
  if (!container) return { dispose: () => {} };

  const { getScene, onSpawnActor } = options;
  let activeCategory = 'all';
  let searchQuery = '';

  const root = document.createElement('div');
  root.className = 'place-actors-panel';
  root.innerHTML = `
    <style>
      .place-actors-panel {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #161b22;
        color: #c9d1d9;
        font-size: 11px;
        overflow: hidden;
      }
      .pa-header {
        padding: 8px;
        border-bottom: 1px solid #30363d;
        flex-shrink: 0;
      }
      .pa-search {
        width: 100%;
        padding: 6px 8px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 4px;
        color: #c9d1d9;
        font-size: 11px;
        box-sizing: border-box;
      }
      .pa-search:focus { outline: none; border-color: #4c65d4; }
      .pa-search::placeholder { color: #6e7681; }
      .pa-categories {
        display: flex;
        gap: 4px;
        margin-top: 8px;
        flex-wrap: wrap;
      }
      .pa-cat-btn {
        padding: 4px 8px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 4px;
        color: #8b949e;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .pa-cat-btn:hover { background: #30363d; color: #c9d1d9; }
      .pa-cat-btn.active { background: #388bfd; border-color: #388bfd; color: #fff; }
      .pa-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      .pa-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        margin-bottom: 4px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
      }
      .pa-item:hover { background: #30363d; border-color: #4c65d4; }
      .pa-item-icon {
        font-size: 20px;
        opacity: 0.9;
      }
      .pa-item-name { flex: 1; font-weight: 500; }
      .pa-item-help {
        font-size: 10px;
        color: #6e7681;
        cursor: help;
      }
    </style>
    <div class="pa-header">
      <input type="text" class="pa-search" placeholder="Search Classes..." id="pa-search" />
      <div class="pa-categories" id="pa-categories"></div>
    </div>
    <div class="pa-list" id="pa-list"></div>
  `;

  const searchInput = root.querySelector('#pa-search');
  const categoriesEl = root.querySelector('#pa-categories');
  const listEl = root.querySelector('#pa-list');

  const filterActors = () => {
    const q = searchQuery.toLowerCase();
    const cat = activeCategory;
    return ACTOR_CLASSES.filter((a) => {
      const matchCat = cat === 'all' || a.category === cat;
      const matchSearch = !q || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  };

  const renderCategories = () => {
    categoriesEl.innerHTML = '';
    CATEGORIES.forEach((c) => {
      const btn = document.createElement('div');
      btn.className = 'pa-cat-btn' + (activeCategory === c.id ? ' active' : '');
      btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:14px;">${c.icon}</span>${c.name}`;
      btn.onclick = () => {
        activeCategory = c.id;
        renderCategories();
        renderList();
      };
      categoriesEl.appendChild(btn);
    });
  };

  const renderList = () => {
    const actors = filterActors();
    listEl.innerHTML = actors
      .map(
        (a) => `
      <div class="pa-item" data-id="${a.id}" title="${a.help || ''}">
        <span class="pa-item-icon material-symbols-outlined">${a.icon}</span>
        <span class="pa-item-name">${a.name}</span>
        <span class="pa-item-help material-symbols-outlined" title="${a.help || ''}">help</span>
      </div>
    `
      )
      .join('');

    listEl.querySelectorAll('.pa-item').forEach((el) => {
      el.onclick = (e) => {
        if (e.target.closest('.pa-item-help')) return;
        const id = el.dataset.id;
        const actor = ACTOR_CLASSES.find((a) => a.id === id);
        if (actor && onSpawnActor) onSpawnActor(actor);
        else if (actor && getScene) {
          const scene = typeof getScene === 'function' ? getScene() : getScene;
          if (scene) void spawnPlaceholder(scene, actor);
        }
      };
    });
  };

  const spawnPlaceholder = async (scene, actor) => {
    if (!scene || !BABYLON) return;
    try {
      if (actor.id === 'point_light') {
        const light = new BABYLON.PointLight('PointLight', new BABYLON.Vector3(0, 5, 0), scene);
        light.intensity = 1;
      } else if (actor.id === 'directional_light') {
        new BABYLON.DirectionalLight('DirectionalLight', new BABYLON.Vector3(-1, -2, -1), scene);
      } else if (actor.id === 'vehicle') {
        const { createVehicle } = await import('../Vehicle/vehicle-component.js');
        const vehicle = await createVehicle(scene, { position: { x: 0, y: 5, z: 0 } });
        if (vehicle?.chassis) vehicle.chassis.name = 'Vehicle_' + Date.now();
      } else if (actor.id === 'trigger_zone') {
        const box = BABYLON.MeshBuilder.CreateBox('TriggerZone_' + Date.now(), { width: 10, height: 5, depth: 10 }, scene);
        box.position.set(0, 2.5, 0);
        box.isPickable = false;
        box.visibility = 0.3;
      } else {
        const mesh = BABYLON.MeshBuilder.CreateBox(actor.id + '_' + Date.now(), { size: 1 }, scene);
        mesh.position.set(0, 0.5, 0);
      }
    } catch (e) {
      console.warn('[place-actors] spawn:', e);
    }
  };

  searchInput.oninput = () => {
    searchQuery = searchInput.value;
    renderList();
  };

  renderCategories();
  renderList();
  container.appendChild(root);

  return {
    dispose() {
      root.remove();
    },
  };
}
