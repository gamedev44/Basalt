/**
 * Mantle — Actor Scatter Layer
 * Scatter nearly any mesh on terrain surface (props, rocks, trees, etc.)
 */

/** ActorScatterLayer — Scatter meshes on terrain */
export class ActorScatterLayer {
  constructor(options = {}) {
    this.id = options.id ?? `actor_${Date.now()}`;
    this.name = options.name ?? 'Actor Layer';
    this.enabled = options.enabled !== false;
    this.density = options.density ?? 0.005;
    this.minScale = options.minScale ?? 0.5;
    this.maxScale = options.maxScale ?? 1.5;
    this.minRotation = options.minRotation ?? 0;
    this.maxRotation = options.maxRotation ?? Math.PI * 2;
    this.heightMin = options.heightMin ?? 0;
    this.heightMax = options.heightMax ?? 1;
    this.slopeMin = options.slopeMin ?? 0;
    this.slopeMax = options.slopeMax ?? 1;
    this.alignToSurface = options.alignToSurface !== false;
    this.meshUrl = options.meshUrl ?? null;
    this.meshTemplate = options.meshTemplate ?? null;
    this.instances = [];
    this._rand = null;
  }

  setSeed(seed) {
    this._rand = this._mulberry32(seed ?? Math.floor(Math.random() * 0xffffffff));
  }

  _mulberry32(seed) {
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}

/** ActorScatterManager — Manages actor scatter on terrain */
export class ActorScatterManager {
  constructor(terrainGenerator, scene, options = {}) {
    this.terrain = terrainGenerator;
    this.scene = scene;
    this.layers = [];
    this.seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
  }

  /** Add scatter layer */
  addLayer(layer) {
    this.layers.push(layer);
    return true;
  }

  /** Remove layer by id */
  removeLayer(id) {
    const i = this.layers.findIndex(l => l.id === id);
    if (i >= 0) {
      this.layers[i].instances.forEach(inst => inst.dispose());
      this.layers.splice(i, 1);
      return true;
    }
    return false;
  }

  /** Scatter mesh at position on terrain (single placement) */
  scatterAt(worldX, worldZ, meshOrUrl, options = {}) {
    const mesh = typeof meshOrUrl === 'string'
      ? this.scene.getMeshByName(meshOrUrl)
      : meshOrUrl;
    if (!mesh) return null;

    const mapSize = this.terrain.mapSize;
    const scale = this.terrain.scale;
    const half = scale / 2;
    const u = (worldX + half) / scale;
    const v = (worldZ + half) / scale;
    const mapX = Math.floor(u * (mapSize - 1));
    const mapZ = Math.floor(v * (mapSize - 1));
    const idx = mapZ * mapSize + mapX;
    const heightNorm = this.terrain.map[idx];
    const worldY = heightNorm * this.terrain.elevationScale;

    const inst = mesh.createInstance(`actor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    inst.position.set(worldX, worldY, worldZ);
    if (options.scale) inst.scaling.setAll(options.scale);
    if (options.rotationY != null) inst.rotation.y = options.rotationY;
    inst.parent = this.terrain.mesh ?? this.scene;
    return inst;
  }

  /** Scatter all layers */
  async scatterAll() {
    for (const layer of this.layers) {
      if (!layer.enabled) continue;
      await this._scatterLayer(layer);
    }
  }

  async _scatterLayer(layer) {
    if (!this.terrain.map || !layer.meshTemplate && !layer.meshUrl) return;

    for (const inst of layer.instances || []) inst.dispose();
    layer.instances = [];

    const mapSize = this.terrain.mapSize;
    const scale = this.terrain.scale;
    const half = scale / 2;
    const totalCells = mapSize * mapSize;
    const numInstances = Math.floor(totalCells * layer.density);
    const rand = layer._rand ?? (() => Math.random());

    let mesh = layer.meshTemplate;
    if (!mesh && layer.meshUrl) {
      const { rootUrl, filename } = this._parseMeshUrl(layer.meshUrl);
      const result = await BABYLON.SceneLoader.ImportMeshAsync('', rootUrl, filename, this.scene);
      mesh = result.meshes[0];
      if (!mesh) return;
    }
    if (!mesh) return;

    for (let i = 0; i < numInstances; i++) {
      const u = rand();
      const v = rand();
      const mapX = Math.floor(u * (mapSize - 1));
      const mapZ = Math.floor(v * (mapSize - 1));
      const idx = mapZ * mapSize + mapX;
      const heightNorm = this.terrain.map[idx];

      if (heightNorm < layer.heightMin || heightNorm > layer.heightMax) continue;

      const slope = this._getSlope(mapX, mapZ);
      if (slope < layer.slopeMin || slope > layer.slopeMax) continue;

      const worldX = u * scale - half;
      const worldZ = v * scale - half;
      const worldY = heightNorm * this.terrain.elevationScale;

      const s = layer.minScale + rand() * (layer.maxScale - layer.minScale);
      const rotY = layer.minRotation + rand() * (layer.maxRotation - layer.minRotation);

      const inst = mesh.createInstance(`actor_${layer.id}_${i}`);
      inst.position.set(worldX, worldY, worldZ);
      inst.scaling.setAll(s);
      inst.rotation.y = rotY;

      inst.rotation.y = rotY;

      inst.parent = this.terrain.mesh ?? this.scene;
      layer.instances.push(inst);
    }
  }

  _getSlope(x, z) {
    const map = this.terrain.map;
    const mapSize = this.terrain.mapSize;
    const h = map[z * mapSize + x] ?? 0;
    const hx = map[z * mapSize + Math.min(x + 1, mapSize - 1)] ?? h;
    const hz = map[Math.min(z + 1, mapSize - 1) * mapSize + x] ?? h;
    const dx = (hx - h) * this.terrain.elevationScale;
    const dz = (hz - h) * this.terrain.elevationScale;
    return Math.min(1, Math.sqrt(dx * dx + dz * dz) / 2);
  }

  _getSurfaceNormal(x, z) {
    const map = this.terrain.map;
    const mapSize = this.terrain.mapSize;
    const scale = this.terrain.scale;
    const step = scale / mapSize;
    const h = (map[z * mapSize + x] ?? 0) * this.terrain.elevationScale;
    const hx = (map[z * mapSize + Math.min(x + 1, mapSize - 1)] ?? h) * this.terrain.elevationScale;
    const hz = (map[Math.min(z + 1, mapSize - 1) * mapSize + x] ?? h) * this.terrain.elevationScale;
    const dx = new BABYLON.Vector3(step, hx - h, 0);
    const dz = new BABYLON.Vector3(0, hz - h, step);
    return BABYLON.Vector3.Cross(dz, dx).normalize();
  }

  /** Clear all instances */
  clearAll() {
    for (const layer of this.layers) {
      layer.instances.forEach(inst => inst.dispose());
      layer.instances = [];
    }
  }

  dispose() {
    this.clearAll();
  }
}
