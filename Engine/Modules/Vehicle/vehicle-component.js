/**
 * Basalt Vehicle Component — Stiff chassis vehicle with Havok physics
 * Easy rigging via RIG_SOCKETS; supports steering, throttle, drift.
 * Requires HavokPhysics_umd.js loaded before Babylon.js.
 */

import { RIG_SOCKETS, socketToVector3 } from './vehicle-rig.js';

const FILTERS = { CarParts: 1, Environment: 2 };

/** Create a physics vehicle. Returns { chassis, wheels, setInput, dispose } */
export async function createVehicle(scene, config = {}, options = {}) {
  const {
    position = { x: 0, y: 5, z: 0 },
    rig = RIG_SOCKETS,
    chassisSize = { w: 8, h: 1.5, d: 20 },
    wheelDiameter = 4.5,
    wheelWidth = 1.8,
    mass = 1200,
    maxSpeed = 200,
    maxSteer = Math.PI / 6,
  } = config;

  const havokInterface = options.havokInterface ?? (typeof HavokPhysics === 'function' ? await HavokPhysics() : null);
  if (!havokInterface) {
    console.warn('[Vehicle] HavokPhysics not loaded. Vehicle will not have physics.');
    return createVehiclePlaceholder(scene, position, chassisSize);
  }

  const BABYLON = globalThis.BABYLON;
  if (!BABYLON) return null;

  const havokInstance = new BABYLON.HavokPlugin(false, havokInterface);
  if (!scene.getPhysicsEngine()) {
    scene.enablePhysics(new BABYLON.Vector3(0, -240, 0), havokInstance);
  }
  const pe = scene.getPhysicsEngine();
  if (pe.setTimeStep) pe.setTimeStep(1 / 500);
  if (pe.setSubTimeStep) pe.setSubTimeStep(4.5);

  const RigSockets = {
    chassis: socketToVector3(rig.chassis) || new BABYLON.Vector3(0, 1, 0),
    wheels: {},
  };
  Object.entries(rig.wheels || {}).forEach(([k, v]) => {
    RigSockets.wheels[k] = socketToVector3(v) || new BABYLON.Vector3(0, -0.5, 0);
  });

  const tyreMaterial = new BABYLON.StandardMaterial('tyreMat', scene);
  tyreMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const chassis = BABYLON.MeshBuilder.CreateBox('Chassis', {
    height: chassisSize.h,
    width: chassisSize.w,
    depth: chassisSize.d,
  });
  chassis.position.set(position.x, position.y, position.z);
  chassis.visibility = options.chassisVisible ?? 0.4;

  const chassisBody = new BABYLON.PhysicsBody(chassis, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
  const chassisShape = new BABYLON.PhysicsShapeBox(
    BABYLON.Vector3.Zero(),
    BABYLON.Quaternion.Identity(),
    new BABYLON.Vector3(chassisSize.w, chassisSize.h, chassisSize.d),
    scene
  );
  chassisShape.material = { friction: 0.1, restitution: 0.1 };
  chassisBody.shape = chassisShape;
  chassisBody.setMassProperties({ mass, centerOfMass: new BABYLON.Vector3(0, -1, 0) });
  filterCollisions(chassis);

  const wheels = [];

  Object.entries(RigSockets.wheels).forEach(([key, pos]) => {
    const isSteer = key.startsWith('f');
    const worldPos = pos.add(chassis.position);

    const axle = BABYLON.MeshBuilder.CreateBox('Axle_' + key, { size: 1 });
    axle.position.copyFrom(worldPos);

    const axleBody = new BABYLON.PhysicsBody(axle, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
    const axleShape = new BABYLON.PhysicsShapeCylinder(
      new BABYLON.Vector3(-0.8, 0, 0),
      new BABYLON.Vector3(0.8, 0, 0),
      wheelWidth,
      scene
    );
    axleBody.shape = axleShape;
    axleBody.setMassProperties({ mass: 100 });
    filterCollisions(axle);

    const wheel = BABYLON.MeshBuilder.CreateCylinder('Wheel_' + key, {
      height: wheelWidth,
      diameter: wheelDiameter,
    });
    wheel.rotation.z = Math.PI / 2;
    wheel.bakeCurrentTransformIntoVertices();
    wheel.position.copyFrom(worldPos);
    wheel.material = tyreMaterial;

    const wheelBody = new BABYLON.PhysicsBody(wheel, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
    const wheelShape = new BABYLON.PhysicsShapeCylinder(
      new BABYLON.Vector3(-0.8, 0, 0),
      new BABYLON.Vector3(0.8, 0, 0),
      wheelDiameter / 2,
      scene
    );
    wheelShape.material = { friction: 1.5, restitution: 0.05 };
    wheelBody.shape = wheelShape;
    wheelBody.setMassProperties({ mass: 100 });
    filterCollisions(wheel);

    const suspension = attachAxleToFrame(axleBody, chassisBody, pos, isSteer, scene);
    const motor = createPoweredWheelJoint(axleBody, wheel, scene);

    wheels.push({ id: key, axleBody, wheelBody, suspension, motor, isSteer });
  });

  let input = { fwd: 0, side: 0 };
  let currentSpeed = 0;
  let currentSteer = 0;

  scene.onBeforeRenderObservable.add(() => {
    const targetSteer = input.side * maxSteer;
    currentSteer = BABYLON.Scalar.Lerp(currentSteer, targetSteer, 0.1);
    const targetSpeed = input.fwd * maxSpeed;
    currentSpeed = BABYLON.Scalar.Lerp(currentSpeed, targetSpeed, 0.05);

    wheels.forEach((w) => {
      if (w.isSteer) {
        w.suspension.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, currentSteer);
      }
      w.motor.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, currentSpeed);
    });
  });

  const setInput = (fwd, side) => {
    input.fwd = Math.max(-1, Math.min(1, fwd ?? 0));
    input.side = Math.max(-1, Math.min(1, side ?? 0));
  };

  const dispose = () => {
    chassis.dispose();
    wheels.forEach((w) => {
      w.axleBody?.dispose?.();
      w.wheelBody?.dispose?.();
    });
  };

  return { chassis, wheels, setInput, dispose, input: () => ({ ...input }) };
}

function attachAxleToFrame(axleBody, frameBody, offset, hasSteering, scene) {
  const BABYLON = globalThis.BABYLON;
  const pivot = offset instanceof BABYLON.Vector3 ? offset : new BABYLON.Vector3(offset.x ?? 0, offset.y ?? 0, offset.z ?? 0);

  const joint = new BABYLON.Physics6DoFConstraint(
    {
      pivotA: pivot,
      pivotB: BABYLON.Vector3.Zero(),
    },
    [
      { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },
      {
        axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y,
        minLimit: -0.2,
        maxLimit: 0.2,
        stiffness: 100000,
        damping: 5000,
      },
      { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0 },
      { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: -0.1, maxLimit: 0.1 },
      {
        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y,
        minLimit: hasSteering ? null : 0,
        maxLimit: hasSteering ? null : 0,
      },
      { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: -0.05, maxLimit: 0.05 },
    ],
    scene
  );

  frameBody.addConstraint(axleBody, joint);

  if (hasSteering) {
    joint.setAxisMotorType(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, BABYLON.PhysicsConstraintMotorType.POSITION);
    joint.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 1e12);
  }

  return joint;
}

function createPoweredWheelJoint(axleBody, wheel, scene) {
  const BABYLON = globalThis.BABYLON;
  const joint = new BABYLON.Physics6DoFConstraint(
    {},
    [
      { axis: BABYLON.PhysicsConstraintAxis.LINEAR_DISTANCE, minLimit: 0, maxLimit: 0 },
      { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, minLimit: 0, maxLimit: 0 },
      { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: 0, maxLimit: 0 },
    ],
    scene
  );

  axleBody.addConstraint(wheel.physicsBody, joint);
  joint.setAxisMotorType(BABYLON.PhysicsConstraintAxis.ANGULAR_X, BABYLON.PhysicsConstraintMotorType.VELOCITY);
  joint.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 250000);
  joint.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 0);

  return joint;
}

function filterCollisions(mesh) {
  if (mesh.physicsBody?.shape) {
    mesh.physicsBody.shape.filterMembershipMask = FILTERS.CarParts;
    mesh.physicsBody.shape.filterCollideMask = FILTERS.Environment;
  }
}

function createVehiclePlaceholder(scene, position, chassisSize) {
  const BABYLON = globalThis.BABYLON;
  if (!BABYLON) return null;

  const chassis = BABYLON.MeshBuilder.CreateBox('Chassis', {
    height: chassisSize.h,
    width: chassisSize.w,
    depth: chassisSize.d,
  });
  chassis.position.set(position.x, position.y, position.z);

  const setInput = () => {};
  const dispose = () => chassis.dispose();

  return { chassis, wheels: [], setInput, dispose, input: () => ({ fwd: 0, side: 0 }) };
}
