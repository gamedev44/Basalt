/**
 * Mantle — Terrain Generator (C90R62 reference)
 * Procedural terrain: simplex noise height map + hydraulic erosion
 * Optional heightmap import from image
 */

import { seedTerrainGenerator } from './mulberry32.js';
import { createSimplexNoise } from './simplex-noise.js';

/** HeightMapGenerator — Multi-octave simplex noise (CPU) */
export class HeightMapGenerator {
  constructor(options = {}) {
    this.numOctaves = options.numOctaves ?? 7;
    this.persistence = options.persistence ?? 0.4;
    this.lacunarity = options.lacunarity ?? 2;
    this.initialScale = options.initialScale ?? 2;
    this.seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
    this._rand = seedTerrainGenerator(this.seed);
    this._noise = createSimplexNoise(this._rand);
  }

  generateHeightMapCPU(mapSize) {
    const map = new Float32Array(mapSize * mapSize);
    let minH = Infinity, maxH = -Infinity;

    for (let y = 0; y < mapSize; y++) {
      for (let x = 0; x < mapSize; x++) {
        let amplitude = 1;
        let frequency = 1;
        let height = 0;

        for (let o = 0; o < this.numOctaves; o++) {
          const nx = (x / mapSize) * this.initialScale * frequency + this.seed * 0.01;
          const ny = (y / mapSize) * this.initialScale * frequency + this.seed * 0.01 + 1000;
          height += this._noise(nx, ny, this.seed * 0.001) * amplitude;
          amplitude *= this.persistence;
          frequency *= this.lacunarity;
        }

        map[y * mapSize + x] = height;
        minH = Math.min(minH, height);
        maxH = Math.max(maxH, height);
      }
    }

    const range = maxH - minH || 1;
    for (let i = 0; i < map.length; i++) {
      map[i] = (map[i] - minH) / range;
    }
    return map;
  }
}

/** TerrainGenerator — Height map + erosion + mesh */
export class TerrainGenerator {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.mapSize = options.mapSize ?? 256;
    this.scale = options.scale ?? 20;
    this.elevationScale = options.elevationScale ?? 10;
    this.useGPU = options.useGPU ?? false;
    this.seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
    this._rand = seedTerrainGenerator(this.seed);

    // Erosion params (C90R62)
    this.numErosionIterations = options.numErosionIterations ?? 80000;
    this.sedimentCapacityFactor = options.sedimentCapacityFactor ?? 3;
    this.evaporateSpeed = options.evaporateSpeed ?? 0.01;
    this.inertia = options.inertia ?? 0.1;
    this.erosionRadius = options.erosionRadius ?? 3;
    this.depositSpeed = options.depositSpeed ?? 0.3;
    this.erodeSpeed = options.erodeSpeed ?? 0.3;
    this.gravity = options.gravity ?? 4;
    this.maxLifetime = options.maxLifetime ?? 30;

    this.heightMapGen = new HeightMapGenerator({
      numOctaves: options.numOctaves ?? 7,
      persistence: options.persistence ?? 0.4,
      lacunarity: options.lacunarity ?? 2,
      initialScale: options.initialScale ?? 2,
      seed: this.seed
    });

    this.map = null;
    this.mesh = null;
    this.material = null;
  }

  /** Generate height map (procedural or use existing) */
  generateHeightMap() {
    this.map = this.heightMapGen.generateHeightMapCPU(this.mapSize);
    return this.map;
  }

  /** Import heightmap from image URL (grayscale = height) */
  async importHeightMapFromImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = this.mapSize;
        canvas.height = this.mapSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, this.mapSize, this.mapSize);
        const data = ctx.getImageData(0, 0, this.mapSize, this.mapSize).data;
        this.map = new Float32Array(this.mapSize * this.mapSize);
        for (let i = 0; i < this.map.length; i++) {
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];
          this.map[i] = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        }
        resolve(this.map);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /** Import heightmap from raw Float32Array (must be mapSize*mapSize) */
  importHeightMapFromArray(arr) {
    if (arr.length !== this.mapSize * this.mapSize) {
      throw new Error(`Heightmap must be ${this.mapSize * this.mapSize} elements`);
    }
    this.map = new Float32Array(arr);
    return this.map;
  }

  /** Hydraulic erosion (CPU droplet simulation) */
  erode(numIterations) {
    if (!this.map) throw new Error('Generate or import heightmap first');
    const iter = numIterations ?? this.numErosionIterations;
    const brushRadius = Math.max(2, Math.min(8, this.erosionRadius));
    const brush = this._buildBrush(brushRadius);

    for (let i = 0; i < iter; i++) {
      let posX = this._rand() * (this.mapSize - 2) + 0.5;
      let posY = this._rand() * (this.mapSize - 2) + 0.5;
      let dirX = 0, dirY = 0;
      let speed = 0, water = 1, sediment = 0;

      for (let life = 0; life < this.maxLifetime; life++) {
        const mapX = Math.floor(posX);
        const mapY = Math.floor(posY);
        if (mapX < 1 || mapX >= this.mapSize - 2 || mapY < 1 || mapY >= this.mapSize - 2) break;

        const height = this._getHeightBilinear(posX, posY);
        const gradX = (this._getHeightBilinear(posX + 0.01, posY) - height) / 0.01;
        const gradY = (this._getHeightBilinear(posX, posY + 0.01) - height) / 0.01;

        dirX = dirX * this.inertia - gradX * (1 - this.inertia);
        dirY = dirY * this.inertia - gradY * (1 - this.inertia);
        const len = Math.sqrt(dirX * dirX + dirY * dirY) || 0.001;
        dirX /= len;
        dirY /= len;

        const nextX = posX + dirX;
        const nextY = posY + dirY;
        const newHeight = this._getHeightBilinear(nextX, nextY);
        const deltaHeight = newHeight - height;

        speed = Math.sqrt(speed * speed + deltaHeight * this.gravity);
        water *= 1 - this.evaporateSpeed;
        sediment *= 1 - this.evaporateSpeed * 0.3;

        const capacity = Math.max(-deltaHeight, 0) * speed * water * this.sedimentCapacityFactor;

        if (deltaHeight > 0 || sediment > capacity) {
          const deposit = deltaHeight > 0
            ? Math.min(deltaHeight, sediment)
            : (sediment - capacity) * this.depositSpeed;
          this._deposit(posX, posY, deposit, brush);
          sediment -= deposit;
        } else {
          const erodeAmount = Math.min((capacity - sediment) * this.erodeSpeed, -deltaHeight);
          this._erode(posX, posY, erodeAmount, brush);
          sediment += erodeAmount * 0.3;
        }

        posX = nextX;
        posY = nextY;
      }
    }
  }

  _buildBrush(radius) {
    const brush = [];
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const distSq = x * x + y * y;
        if (distSq < radius * radius) {
          brush.push({ x, y, w: 1 - Math.sqrt(distSq) / radius });
        }
      }
    }
    return brush;
  }

  _getHeightBilinear(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, this.mapSize - 1), y1 = Math.min(y0 + 1, this.mapSize - 1);
    const fx = x - x0, fy = y - y0;
    const h00 = this.map[y0 * this.mapSize + x0];
    const h10 = this.map[y0 * this.mapSize + x1];
    const h01 = this.map[y1 * this.mapSize + x0];
    const h11 = this.map[y1 * this.mapSize + x1];
    return (1 - fx) * (1 - fy) * h00 + fx * (1 - fy) * h10 + (1 - fx) * fy * h01 + fx * fy * h11;
  }

  _erode(x, y, amount, brush) {
    const totalWeight = brush.reduce((s, b) => s + b.w, 0) || 1;
    for (const b of brush) {
      const bx = Math.floor(x + b.x);
      const by = Math.floor(y + b.y);
      if (bx >= 0 && bx < this.mapSize && by >= 0 && by < this.mapSize) {
        const idx = by * this.mapSize + bx;
        this.map[idx] -= amount * (b.w / totalWeight);
      }
    }
  }

  _deposit(x, y, amount, brush) {
    const totalWeight = brush.reduce((s, b) => s + b.w, 0) || 1;
    for (const b of brush) {
      const bx = Math.floor(x + b.x);
      const by = Math.floor(y + b.y);
      if (bx >= 0 && bx < this.mapSize && by >= 0 && by < this.mapSize) {
        const idx = by * this.mapSize + bx;
        this.map[idx] += amount * (b.w / totalWeight);
      }
    }
  }

  /** Build mesh from height map using data URL (Babylon expects image URL). Returns Promise. */
  constructMesh(options = {}) {
    if (!this.map) throw new Error('Generate or import heightmap first');

    const subdivisions = options.subdivisions ?? this.mapSize - 1;
    const minHeight = options.minHeight ?? 0;
    const maxHeight = options.maxHeight ?? this.elevationScale;

    const canvas = document.createElement('canvas');
    canvas.width = this.mapSize;
    canvas.height = this.mapSize;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(this.mapSize, this.mapSize);
    for (let i = 0; i < this.map.length; i++) {
      const v = Math.floor(Math.max(0, Math.min(1, this.map[i])) * 255);
      imgData.data[i * 4] = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    return new Promise((resolve) => {
      let resolved = false;
      const finish = (mesh) => {
        if (resolved) return;
        resolved = true;
        mesh.checkCollisions = true;
        if (options.material) {
          mesh.material = options.material;
          this.material = options.material;
        } else {
          this._applyDefaultMaterial();
        }
        if (options.receiveShadows !== false) {
          mesh.receiveShadows = true;
        }
        resolve(mesh);
      };
      this.mesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
        'mantle_terrain',
        dataUrl,
        {
          width: this.scale,
          height: this.scale,
          subdivisions,
          minHeight,
          maxHeight,
          updatable: false,
          onReady: finish
        },
        this.scene
      );
      this.mesh.checkCollisions = true;
      setTimeout(() => finish(this.mesh), 3000);
    });
  }

  _applyDefaultMaterial() {
    const mat = new BABYLON.StandardMaterial('mantle_terrain_mat', this.scene);
    mat.diffuseColor = new BABYLON.Color3(0.4, 0.5, 0.35);
    mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    mat.diffuseTexture = new BABYLON.Texture('https://i.imgur.com/HADnUQr.png', this.scene);
    mat.diffuseTexture.uScale = this.scale / 4;
    mat.diffuseTexture.vScale = this.scale / 4;
    this.mesh.material = mat;
    this.material = mat;
  }

  /** Get terrain height at center (for player spawn) */
  getCenterHeight() {
    if (!this.map) return 0;
    const cx = Math.floor(this.mapSize / 2);
    const cy = Math.floor(this.mapSize / 2);
    const idx = cy * this.mapSize + cx;
    const norm = this.map[idx] ?? 0;
    return norm * this.elevationScale;
  }

  /** Get terrain height at world position (x, z) */
  getHeightAtWorld(worldX, worldZ) {
    if (!this.map) return 0;
    const half = this.scale / 2;
    const u = (worldX + half) / this.scale;
    const v = (worldZ + half) / this.scale;
    const mapX = Math.floor(u * (this.mapSize - 1));
    const mapZ = Math.floor(v * (this.mapSize - 1));
    if (mapX < 0 || mapX >= this.mapSize || mapZ < 0 || mapZ >= this.mapSize) return 0;
    const idx = mapZ * this.mapSize + mapX;
    const norm = this.map[idx] ?? 0;
    return norm * this.elevationScale;
  }

  /** Try to load NME terrain material from snippet 4W2QH3#4 */
  async loadNmeTerrainMaterial() {
    try {
      const mat = await BABYLON.NodeMaterial.ParseFromSnippetAsync('4W2QH3#4', this.scene);
      if (this.mesh) this.mesh.material = mat;
      this.material = mat;
      return mat;
    } catch (e) {
    }
    return null;
  }

  dispose() {
    if (this.mesh) this.mesh.dispose();
    if (this.material && this.material !== this.mesh?.material) this.material.dispose();
  }
}
