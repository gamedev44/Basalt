/**
 * Mantle — Simplex noise (Ashima Arts / webgl-noise style)
 * CPU fallback for height map generation
 */

const F3 = 1 / 3;
const G3 = 1 / 6;
const grad3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
  1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
  0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
]);

export function createSimplexNoise(rand) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor((rand() ?? Math.random()) * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  return function (x, y, z = 0) {
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const X0 = x - i + t;
    const Y0 = y - j + t;
    const Z0 = z - k + t;

    let i1, j1, k1, i2, j2, k2;
    if (X0 >= Y0) {
      if (Y0 >= Z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      } else if (X0 >= Z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
      } else {
        i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
      }
    } else {
      if (Y0 < Z0) {
        i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
      } else if (X0 < Z0) {
        i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
      } else {
        i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      }
    }

    const x1 = X0 - i1 + G3, y1 = Y0 - j1 + G3, z1 = Z0 - k1 + G3;
    const x2 = X0 - i2 + 2 * G3, y2 = Y0 - j2 + 2 * G3, z2 = Z0 - k2 + 2 * G3;
    const x3 = X0 - 1 + 3 * G3, y3 = Y0 - 1 + 3 * G3, z3 = Z0 - 1 + 3 * G3;

    const ii = i & 255, jj = j & 255, kk = k & 255;
    const gi0 = perm[ii + perm[jj + perm[kk]]] % 12;

    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
    let t0 = 0.6 - X0 * X0 - Y0 * Y0 - Z0 * Z0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * (grad3[gi0 * 3] * X0 + grad3[gi0 * 3 + 1] * Y0 + grad3[gi0 * 3 + 2] * Z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 >= 0) {
      const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
      t1 *= t1;
      n1 = t1 * t1 * (grad3[gi1 * 3] * x1 + grad3[gi1 * 3 + 1] * y1 + grad3[gi1 * 3 + 2] * z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 >= 0) {
      const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
      t2 *= t2;
      n2 = t2 * t2 * (grad3[gi2 * 3] * x2 + grad3[gi2 * 3 + 1] * y2 + grad3[gi2 * 3 + 2] * z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 >= 0) {
      const gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;
      t3 *= t3;
      n3 = t3 * t3 * (grad3[gi3 * 3] * x3 + grad3[gi3 * 3 + 1] * y3 + grad3[gi3 * 3 + 2] * z3);
    }

    return 32 * (n0 + n1 + n2 + n3);
  };
}
