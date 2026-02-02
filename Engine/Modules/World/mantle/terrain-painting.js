/**
 * Mantle — Terrain Painting
 * Brush-based height modification on terrain heightmap
 */

/** TerrainPainter — Paint height with brush (raise/lower/flatten) */
export class TerrainPainter {
  constructor(terrainGenerator, options = {}) {
    this.terrain = terrainGenerator;
    this.brushRadius = options.brushRadius ?? 5;
    this.brushStrength = options.brushStrength ?? 0.1;
    this.brushFalloff = options.brushFalloff ?? 0.5; // 0=flat, 1=smooth
    this.mode = options.mode ?? 'raise'; // 'raise' | 'lower' | 'flatten' | 'smooth'
    this.flattenHeight = options.flattenHeight ?? 0.5;
  }

  /** Paint at world position (x, z) — call from raycast hit */
  paintAt(worldX, worldZ, delta = 1) {
    if (!this.terrain.map) return;
    const mapSize = this.terrain.mapSize;
    const scale = this.terrain.scale;
    const half = scale / 2;
    const u = (worldX + half) / scale;
    const v = (worldZ + half) / scale;
    const mapX = Math.floor(u * (mapSize - 1));
    const mapZ = Math.floor(v * (mapSize - 1));
    if (mapX < 0 || mapX >= mapSize || mapZ < 0 || mapZ >= mapSize) return;
    this._paintAtMap(mapX, mapZ, delta);
  }

  /** Paint at heightmap UV (0..1) */
  paintAtUV(u, v, delta = 1) {
    if (!this.terrain.map) return;
    const mapSize = this.terrain.mapSize;
    const mapX = Math.floor(u * (mapSize - 1));
    const mapZ = Math.floor(v * (mapSize - 1));
    if (mapX < 0 || mapX >= mapSize || mapZ < 0 || mapZ >= mapSize) return;
    this._paintAtMap(mapX, mapZ, delta);
  }

  /** Paint at map indices */
  _paintAtMap(centerX, centerZ, delta) {
    const map = this.terrain.map;
    const mapSize = this.terrain.mapSize;
    const radius = Math.max(1, Math.floor(this.brushRadius));
    const strength = this.brushStrength * delta;

    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const z = centerZ + dz;
        if (x < 0 || x >= mapSize || z < 0 || z >= mapSize) continue;

        const dist = Math.sqrt(dx * dx + dz * dz) / radius;
        if (dist > 1) continue;

        const falloff = 1 - Math.pow(dist, 1 + this.brushFalloff * 2);
        const w = falloff * strength;

        const idx = z * mapSize + x;
        const h = map[idx];

        switch (this.mode) {
          case 'raise':
            map[idx] = Math.min(1, h + w);
            break;
          case 'lower':
            map[idx] = Math.max(0, h - w);
            break;
          case 'flatten':
            map[idx] = h + (this.flattenHeight - h) * w;
            break;
          case 'smooth': {
            const avg = this._sampleNeighbors(map, x, z, mapSize);
            map[idx] = h + (avg - h) * w;
            break;
          }
          default:
            map[idx] = Math.min(1, Math.max(0, h + w));
        }
      }
    }
  }

  _sampleNeighbors(map, x, z, mapSize) {
    let sum = 0, count = 0;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, nz = z + dz;
        if (nx >= 0 && nx < mapSize && nz >= 0 && nz < mapSize) {
          sum += map[nz * mapSize + nx];
          count++;
        }
      }
    }
    return count ? sum / count : map[z * mapSize + x];
  }

  /** Rebuild mesh from modified heightmap (call after painting) */
  rebuildMesh() {
    if (this.terrain.mesh) {
      this.terrain.constructMesh({
        subdivisions: this.terrain.mapSize - 1,
        minHeight: 0,
        maxHeight: this.terrain.elevationScale,
        material: this.terrain.material,
        receiveShadows: true
      });
    }
  }
}
