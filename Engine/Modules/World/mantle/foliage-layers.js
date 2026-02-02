/**
 * Mantle — Foliage Layers
 * Up to 20 layers or group layers for vegetation/decoration scatter
 */

const MAX_LAYERS = 20;

/** FoliageLayer — Single scatter layer (meshes or instances) */
export class FoliageLayer {
  constructor(options = {}) {
    this.id = options.id ?? `layer_${Date.now()}`;
    this.name = options.name ?? 'Foliage Layer';
    this.enabled = options.enabled !== false;
    this.density = options.density ?? 0.01; // instances per sq unit
    this.minScale = options.minScale ?? 0.8;
    this.maxScale = options.maxScale ?? 1.2;
    this.minRotation = options.minRotation ?? 0;
    this.maxRotation = options.maxRotation ?? Math.PI * 2;
    this.heightMin = options.heightMin ?? 0;
    this.heightMax = options.heightMax ?? 1;
    this.slopeMin = options.slopeMin ?? 0;
    this.slopeMax = options.slopeMax ?? 1;
    this.meshUrl = options.meshUrl ?? null;
    this.meshTemplate = options.meshTemplate ?? null; // Babylon mesh to instance
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

/** FoliageGroupLayer — Group of layers (for organization) */
export class FoliageGroupLayer {
  constructor(options = {}) {
    this.id = options.id ?? `group_${Date.now()}`;
    this.name = options.name ?? 'Foliage Group';
    this.enabled = options.enabled !== false;
    this.layers = options.layers ?? [];
  }

  addLayer(layer) {
    if (this.layers.length < MAX_LAYERS) {
      this.layers.push(layer);
      return true;
    }
    return false;
  }

  removeLayer(id) {
    const i = this.layers.findIndex(l => l.id === id);
    if (i >= 0) {
      this.layers.splice(i, 1);
      return true;
    }
    return false;
  }
}

/** FoliageLayerManager — Manages up to 20 layers or group layers */
export class FoliageLayerManager {
  constructor(terrainGenerator, scene, options = {}) {
    this.terrain = terrainGenerator;
    this.scene = scene;
    this.maxLayers = options.maxLayers ?? MAX_LAYERS;
    this.layers = []; // FoliageLayer or FoliageGroupLayer
    this.seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
  }

  /** Add a foliage layer (or group) */
  addLayer(layer) {
    if (this.layers.length >= this.maxLayers) return false;
    this.layers.push(layer);
    return true;
  }

  /** Remove layer by id */
  removeLayer(id) {
    const i = this.layers.findIndex(l => l.id === id);
    if (i >= 0) {
      this.layers.splice(i, 1);
      return true;
    }
    return false;
  }

  /** Scatter all enabled layers on terrain */
  async scatterAll() {
    for (const layer of this.layers) {
      if (!layer.enabled) continue;
      if (layer instanceof FoliageGroupLayer) {
        for (const sub of layer.layers) {
          if (sub.enabled) await this._scatterLayer(sub);
        }
      } else {
        await this._scatterLayer(layer);
      }
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

      const inst = mesh.createInstance(`foliage_${layer.id}_${i}`);
      inst.position.set(worldX, worldY, worldZ);
      inst.scaling.setAll(s);
      inst.rotation.y = rotY;
      inst.parent = this.terrain.mesh ?? this.scene;
      layer.instances.push(inst);
    }
  }

  _parseMeshUrl(url) {
    const lastSlash = url.lastIndexOf('/');
    const rootUrl = lastSlash >= 0 ? url.substring(0, lastSlash + 1) : '';
    const filename = lastSlash >= 0 ? url.substring(lastSlash + 1) : url;
    return { rootUrl, filename };
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

  /** Clear all instances */
  clearAll() {
    for (const layer of this.layers) {
      const subs = layer instanceof FoliageGroupLayer ? layer.layers : [layer];
      for (const sub of subs) {
        for (const inst of sub.instances || []) inst.dispose();
        sub.instances = [];
      }
    }
  }

  dispose() {
    this.clearAll();
  }
}
