/**
 * Basalt Vehicle Rig — Easy rigging system for physics vehicles
 * Defines socket positions for chassis and wheels (FL, FR, RL, RR).
 * Use with vehicle-component.js for full Havok physics setup.
 */

/** Default rig sockets — local offsets from chassis center (x=right, y=up, z=forward) */
export const RIG_SOCKETS = {
  chassis: { x: 0, y: 1, z: 0 },
  wheels: {
    fl: { x: 5, y: -0.5, z: 8 },
    fr: { x: -5, y: -0.5, z: 8 },
    rl: { x: 5, y: -0.5, z: -8 },
    rr: { x: -5, y: -0.5, z: -8 },
  },
};

/** Preset rigs — different vehicle layouts */
export const RIG_PRESETS = {
  car: RIG_SOCKETS,
  truck: {
    chassis: { x: 0, y: 1.2, z: 0 },
    wheels: {
      fl: { x: 6, y: -0.6, z: 10 },
      fr: { x: -6, y: -0.6, z: 10 },
      rl: { x: 6, y: -0.6, z: -10 },
      rr: { x: -6, y: -0.6, z: -10 },
    },
  },
  kart: {
    chassis: { x: 0, y: 0.5, z: 0 },
    wheels: {
      fl: { x: 3, y: -0.3, z: 5 },
      fr: { x: -3, y: -0.3, z: 5 },
      rl: { x: 3, y: -0.3, z: -5 },
      rr: { x: -3, y: -0.3, z: -5 },
    },
  },
};

/** Convert socket object to Babylon Vector3 */
export function socketToVector3(socket) {
  if (!globalThis.BABYLON) return null;
  return new globalThis.BABYLON.Vector3(socket.x ?? 0, socket.y ?? 0, socket.z ?? 0);
}
