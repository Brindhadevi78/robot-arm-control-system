export interface JointAngles {
  base: number;       // J1: -180 to 180 deg (Yaw)
  shoulder: number;   // J2: -60 to 90 deg (Pitch)
  elbow: number;      // J3: -100 to 100 deg (Pitch)
  wristTilt: number;  // J4: -90 to 90 deg (Pitch)
  wristRot: number;   // J5: -180 to 180 deg (Roll/Yaw)
  gripper: number;    // 0 (fully closed) to 100 (fully open)
}

export type RobotStatus = 'ONLINE' | 'EXECUTING' | 'PAUSED' | 'ESTOP' | 'OFFLINE';

export type CubeLocation = 'pickup' | 'gripped' | 'dropoff' | 'custom';

export interface SequenceStep {
  id: number;
  label: string;
  description: string;
  targetAngles: JointAngles;
  durationMs: number; // base duration at 1x speed
  cubeAction?: 'none' | 'grab' | 'release';
}

export const INITIAL_JOINT_ANGLES: JointAngles = {
  base: 0,
  shoulder: 15,
  elbow: 45,
  wristTilt: -30,
  wristRot: 0,
  gripper: 80,
};

export const HOME_JOINT_ANGLES: JointAngles = {
  base: 0,
  shoulder: 20,
  elbow: 40,
  wristTilt: -30,
  wristRot: 0,
  gripper: 75,
};

export const ZERO_JOINT_ANGLES: JointAngles = {
  base: 0,
  shoulder: 0,
  elbow: 0,
  wristTilt: 0,
  wristRot: 0,
  gripper: 100,
};

export interface JointLimit {
  min: number;
  max: number;
  unit: string;
  label: string;
  axis: string;
}

export const JOINT_LIMITS: Record<keyof JointAngles, JointLimit> = {
  base: { min: -180, max: 180, unit: '°', label: 'Base Rotation', axis: 'J1 (Yaw)' },
  shoulder: { min: -60, max: 90, unit: '°', label: 'Shoulder Joint', axis: 'J2 (Pitch)' },
  elbow: { min: -100, max: 100, unit: '°', label: 'Elbow Joint', axis: 'J3 (Pitch)' },
  wristTilt: { min: -90, max: 90, unit: '°', label: 'Wrist Tilt', axis: 'J4 (Pitch)' },
  wristRot: { min: -180, max: 180, unit: '°', label: 'Wrist Rotation', axis: 'J5 (Roll)' },
  gripper: { min: 0, max: 100, unit: '%', label: 'Parallel Gripper', axis: 'End Effector' },
};

export const PICK_AND_PLACE_SEQUENCE: SequenceStep[] = [
  {
    id: 1,
    label: '1. Home Position',
    description: 'Calibrating and moving to standard safe home posture',
    targetAngles: { base: 0, shoulder: 20, elbow: 35, wristTilt: -25, wristRot: 0, gripper: 75 },
    durationMs: 1200,
    cubeAction: 'none',
  },
  {
    id: 2,
    label: '2. Move Arm Downward',
    description: 'Lowering arm joints toward pickup quadrant',
    targetAngles: { base: -45, shoulder: 30, elbow: 55, wristTilt: 40, wristRot: 0, gripper: 80 },
    durationMs: 1400,
    cubeAction: 'none',
  },
  {
    id: 3,
    label: '3. Approach Object',
    description: 'Positioning parallel gripper directly over payload cube',
    targetAngles: { base: -45, shoulder: 38, elbow: 68, wristTilt: 60, wristRot: 0, gripper: 80 },
    durationMs: 1200,
    cubeAction: 'none',
  },
  {
    id: 4,
    label: '4. Close Gripper',
    description: 'Actuating parallel fingers to grasp payload firmly',
    targetAngles: { base: -45, shoulder: 38, elbow: 68, wristTilt: 60, wristRot: 0, gripper: 6 },
    durationMs: 900,
    cubeAction: 'grab',
  },
  {
    id: 5,
    label: '5. Lift Object',
    description: 'Ascending vertically to safe transit altitude',
    targetAngles: { base: -45, shoulder: 20, elbow: 35, wristTilt: 20, wristRot: 0, gripper: 6 },
    durationMs: 1300,
    cubeAction: 'none',
  },
  {
    id: 6,
    label: '6. Rotate Base',
    description: 'Slewing base turntable J1 across to destination pallet',
    targetAngles: { base: 45, shoulder: 20, elbow: 35, wristTilt: 20, wristRot: 0, gripper: 6 },
    durationMs: 1800,
    cubeAction: 'none',
  },
  {
    id: 7,
    label: '7. Move to Destination',
    description: 'Lowering payload onto target landing zone',
    targetAngles: { base: 45, shoulder: 38, elbow: 68, wristTilt: 60, wristRot: 0, gripper: 6 },
    durationMs: 1400,
    cubeAction: 'none',
  },
  {
    id: 8,
    label: '8. Release Object',
    description: 'Opening parallel gripper fingers to deposit payload',
    targetAngles: { base: 45, shoulder: 38, elbow: 68, wristTilt: 60, wristRot: 0, gripper: 80 },
    durationMs: 900,
    cubeAction: 'release',
  },
  {
    id: 9,
    label: '9. Return to Home',
    description: 'Retracting manipulator to home standby posture',
    targetAngles: { base: 0, shoulder: 20, elbow: 35, wristTilt: -25, wristRot: 0, gripper: 75 },
    durationMs: 1500,
    cubeAction: 'none',
  },
];
