import { JointAngles } from '../types';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

// Physical dimensions of the arm segments (in centimeters / scene units)
export const ARM_DIMENSIONS = {
  baseHeight: 0.75,       // Height from table surface to shoulder joint center
  lowerArmLength: 1.40,   // Center of shoulder joint to center of elbow joint
  upperArmLength: 1.30,   // Center of elbow joint to center of wrist pitch joint
  wristLength: 0.50,      // Wrist joint to gripper mounting flange
  gripperTipOffset: 0.35, // Flange to fingertip Tool Center Point (TCP)
};

/**
 * Calculates the forward kinematics to determine the Tool Center Point (TCP)
 * position relative to the base center (0, 0, 0).
 */
export function calculateForwardKinematics(joints: JointAngles): Vector3D {
  const q1 = joints.base * DEG2RAD;
  const q2 = joints.shoulder * DEG2RAD;
  const q3 = joints.elbow * DEG2RAD;
  const q4 = joints.wristTilt * DEG2RAD;

  // In the arm's sagittal plane:
  // Angle of lower arm relative to vertical Y
  const a1 = q2;
  // Angle of upper arm relative to lower arm
  const a2 = a1 + q3;
  // Angle of wrist assembly relative to upper arm
  const a3 = a2 + q4;

  const L0 = ARM_DIMENSIONS.baseHeight;
  const L1 = ARM_DIMENSIONS.lowerArmLength;
  const L2 = ARM_DIMENSIONS.upperArmLength;
  const L3 = ARM_DIMENSIONS.wristLength + ARM_DIMENSIONS.gripperTipOffset;

  // Reach in vertical plane:
  // Vertical Y component:
  const y = L0 + L1 * Math.cos(a1) + L2 * Math.cos(a2) + L3 * Math.cos(a3);

  // Horizontal radius component (planar distance from base axis of rotation):
  const r = L1 * Math.sin(a1) + L2 * Math.sin(a2) + L3 * Math.sin(a3);

  // Project planar reach according to base yaw angle (q1):
  const x = r * Math.sin(q1);
  const z = r * Math.cos(q1);

  // Return coordinates scaled to simulated millimeters (scene units * 100)
  return {
    x: Math.round(x * 100),
    y: Math.round(y * 100),
    z: Math.round(z * 100),
  };
}

/**
 * Helper to interpolate smoothly between two joint states
 */
export function lerpJoints(a: JointAngles, b: JointAngles, t: number): JointAngles {
  // Smoothstep ease
  const ease = t * t * (3 - 2 * t);
  return {
    base: a.base + (b.base - a.base) * ease,
    shoulder: a.shoulder + (b.shoulder - a.shoulder) * ease,
    elbow: a.elbow + (b.elbow - a.elbow) * ease,
    wristTilt: a.wristTilt + (b.wristTilt - a.wristTilt) * ease,
    wristRot: a.wristRot + (b.wristRot - a.wristRot) * ease,
    gripper: a.gripper + (b.gripper - a.gripper) * ease,
  };
}
