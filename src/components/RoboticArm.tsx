import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { JointAngles, RobotStatus } from '../types';
import { DEG2RAD, ARM_DIMENSIONS } from '../utils/kinematics';

interface RoboticArmProps {
  joints: JointAngles;
  status: RobotStatus;
  isGrippingCube: boolean;
  onTcpPositionUpdate?: (pos: THREE.Vector3) => void;
}

export const RoboticArm: React.FC<RoboticArmProps> = ({
  joints,
  status,
  isGrippingCube,
  onTcpPositionUpdate,
}) => {
  // References for hierarchical joints
  const baseRotationGroup = useRef<THREE.Group>(null);
  const shoulderGroup = useRef<THREE.Group>(null);
  const elbowGroup = useRef<THREE.Group>(null);
  const wristTiltGroup = useRef<THREE.Group>(null);
  const wristRotGroup = useRef<THREE.Group>(null);
  const leftFingerRef = useRef<THREE.Group>(null);
  const rightFingerRef = useRef<THREE.Group>(null);
  const tcpMarkerRef = useRef<THREE.Group>(null);

  // Materials defined with memo for performance
  const materials = useMemo(() => {
    // Primary white/light-gray metallic robotic body with clean specular highlights
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f1f5f9'),
      metalness: 0.45,
      roughness: 0.32,
    });

    // Dark charcoal / graphite metallic joints and structural accents
    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1e293b'),
      metalness: 0.7,
      roughness: 0.35,
    });

    // Chrome / polished stainless steel shafts & bolts
    const chromeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#cbd5e1'),
      metalness: 0.92,
      roughness: 0.15,
    });

    // Anodized dark bronze / titanium joint caps
    const capMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#334155'),
      metalness: 0.8,
      roughness: 0.28,
    });

    // Non-slip rubber gripper pads
    const rubberMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f172a'),
      metalness: 0.1,
      roughness: 0.9,
    });

    // Status LED indicator ring
    const ledMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#10b981'),
      emissive: new THREE.Color('#10b981'),
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });

    // Warning amber decal / stripe
    const warningDecalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f59e0b'),
      roughness: 0.4,
      metalness: 0.2,
    });

    return {
      bodyMat,
      darkAccentMat,
      chromeMat,
      capMat,
      rubberMat,
      ledMat,
      warningDecalMat,
    };
  }, []);

  // Update LED color based on robot status in animation frame
  useFrame((state) => {
    if (materials.ledMat) {
      if (status === 'ESTOP') {
        const blink = Math.sin(state.clock.elapsedTime * 12) > 0;
        materials.ledMat.color.set(blink ? '#ef4444' : '#550000');
        materials.ledMat.emissive.set(blink ? '#ef4444' : '#220000');
        materials.ledMat.emissiveIntensity = blink ? 1.6 : 0.2;
      } else if (status === 'EXECUTING') {
        const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 6);
        materials.ledMat.color.set('#3b82f6');
        materials.ledMat.emissive.set('#3b82f6');
        materials.ledMat.emissiveIntensity = 0.6 + pulse * 0.8;
      } else if (status === 'PAUSED') {
        materials.ledMat.color.set('#f59e0b');
        materials.ledMat.emissive.set('#f59e0b');
        materials.ledMat.emissiveIntensity = 0.8;
      } else if (status === 'OFFLINE') {
        materials.ledMat.color.set('#64748b');
        materials.ledMat.emissive.set('#334155');
        materials.ledMat.emissiveIntensity = 0.1;
      } else {
        // ONLINE
        materials.ledMat.color.set('#10b981');
        materials.ledMat.emissive.set('#10b981');
        materials.ledMat.emissiveIntensity = 0.9;
      }
    }

    // Optional TCP world position tracking
    if (tcpMarkerRef.current && onTcpPositionUpdate) {
      const worldPos = new THREE.Vector3();
      tcpMarkerRef.current.getWorldPosition(worldPos);
      onTcpPositionUpdate(worldPos);
    }
  });

  // Calculate finger offset based on gripper percentage (0 = closed, 100 = open)
  // 0% -> 0.04m separation, 100% -> 0.16m separation
  const fingerSpread = 0.038 + (joints.gripper / 100) * 0.08;

  // Joint angle conversions to radians
  const qBase = joints.base * DEG2RAD;
  const qShoulder = joints.shoulder * DEG2RAD;
  const qElbow = joints.elbow * DEG2RAD;
  const qWristTilt = joints.wristTilt * DEG2RAD;
  const qWristRot = joints.wristRot * DEG2RAD;

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================================= */}
      {/* 1. FIXED RECTANGULAR BASE WITH ROUNDED CORNERS & MOUNTING BOLTS           */}
      {/* ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Main rectangular platform base with beveled edges */}
        <mesh position={[0, 0.04, 0]} castShadow receiveShadow material={materials.darkAccentMat}>
          <boxGeometry args={[1.5, 0.08, 1.3]} />
        </mesh>

        {/* Top beveled face plate */}
        <mesh position={[0, 0.085, 0]} castShadow receiveShadow material={materials.bodyMat}>
          <boxGeometry args={[1.42, 0.02, 1.22]} />
        </mesh>

        {/* Corner mounting bolt flanges (4 corners) */}
        {[
          [-0.62, -0.52],
          [0.62, -0.52],
          [-0.62, 0.52],
          [0.62, 0.52],
        ].map(([bx, bz], i) => (
          <group key={`base-bolt-${i}`} position={[bx, 0.09, bz]}>
            {/* Bolt washer */}
            <mesh castShadow material={materials.darkAccentMat}>
              <cylinderGeometry args={[0.045, 0.045, 0.015, 16]} />
            </mesh>
            {/* Hex bolt head */}
            <mesh position={[0, 0.015, 0]} castShadow material={materials.chromeMat}>
              <cylinderGeometry args={[0.028, 0.028, 0.02, 6]} />
            </mesh>
          </group>
        ))}

        {/* Cable gland / power connector port at rear of base plate */}
        <group position={[0, 0.06, -0.55]}>
          <mesh castShadow material={materials.darkAccentMat} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
          </mesh>
          <mesh position={[0, 0, -0.05]} material={materials.rubberMat} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
          </mesh>
        </group>

        {/* Lower pedestal riser cylinder */}
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow material={materials.darkAccentMat}>
          <cylinderGeometry args={[0.42, 0.46, 0.14, 36]} />
        </mesh>

        {/* Decorative chrome groove ring */}
        <mesh position={[0, 0.23, 0]} material={materials.chromeMat}>
          <cylinderGeometry args={[0.425, 0.425, 0.02, 36]} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 2. JOINT 1: CYLINDRICAL ROTATING BASE (YAW - ROTATES AROUND Y)           */}
      {/* ========================================================================= */}
      <group
        ref={baseRotationGroup}
        position={[0, 0.24, 0]}
        rotation={[0, qBase, 0]}
      >
        {/* Turntable cylinder */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow material={materials.bodyMat}>
          <cylinderGeometry args={[0.38, 0.40, 0.28, 36]} />
        </mesh>

        {/* Dark accent status ring around base */}
        <mesh position={[0, 0.04, 0]} castShadow material={materials.darkAccentMat}>
          <cylinderGeometry args={[0.395, 0.395, 0.06, 36]} />
        </mesh>

        {/* Status LED glow ring */}
        <mesh
          position={[0, 0.04, 0]}
          material={materials.ledMat}
        >
          <torusGeometry args={[0.398, 0.012, 16, 48]} />
        </mesh>

        {/* Base service hatch & inspection bolts */}
        <mesh position={[0, 0.16, 0.37]} castShadow material={materials.darkAccentMat}>
          <boxGeometry args={[0.22, 0.12, 0.02]} />
        </mesh>

        {/* Dual upright shoulder support bracket forks */}
        <group position={[0, 0.38, 0]}>
          {/* Left fork upright */}
          <mesh position={[-0.22, 0.12, 0]} castShadow receiveShadow material={materials.bodyMat}>
            <boxGeometry args={[0.12, 0.32, 0.34]} />
          </mesh>
          {/* Right fork upright */}
          <mesh position={[0.22, 0.12, 0]} castShadow receiveShadow material={materials.bodyMat}>
            <boxGeometry args={[0.12, 0.32, 0.34]} />
          </mesh>
          {/* Fork bridge plate */}
          <mesh position={[0, 0, 0]} castShadow material={materials.darkAccentMat}>
            <cylinderGeometry args={[0.35, 0.36, 0.08, 32]} />
          </mesh>
        </group>

        {/* ======================================================================= */}
        {/* 3. JOINT 2: SHOULDER ROTARY JOINT (PITCH - ROTATES AROUND X)            */}
        {/* ======================================================================= */}
        <group
          ref={shoulderGroup}
          position={[0, 0.62, 0]}
          rotation={[qShoulder, 0, 0]}
        >
          {/* Main heavy-duty shoulder rotary hub cylinder */}
          <mesh castShadow material={materials.darkAccentMat} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.19, 0.19, 0.58, 32]} />
          </mesh>

          {/* Left Joint Cap (dark circular cap with concentric detail) */}
          <group position={[-0.30, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh castShadow material={materials.capMat}>
              <cylinderGeometry args={[0.18, 0.18, 0.03, 32]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} material={materials.chromeMat}>
              <cylinderGeometry args={[0.07, 0.07, 0.02, 24]} />
            </mesh>
            {/* Center hex bolt */}
            <mesh position={[0, 0.035, 0]} material={materials.darkAccentMat}>
              <cylinderGeometry args={[0.03, 0.03, 0.02, 6]} />
            </mesh>
          </group>

          {/* Right Joint Cap (dark circular cap) */}
          <group position={[0.30, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <mesh castShadow material={materials.capMat}>
              <cylinderGeometry args={[0.18, 0.18, 0.03, 32]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} material={materials.chromeMat}>
              <cylinderGeometry args={[0.07, 0.07, 0.02, 24]} />
            </mesh>
            {/* Center hex bolt */}
            <mesh position={[0, 0.035, 0]} material={materials.darkAccentMat}>
              <cylinderGeometry args={[0.03, 0.03, 0.02, 6]} />
            </mesh>
          </group>

          {/* Axis J2 Label / Badge on Joint Cap */}
          <mesh position={[-0.31, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={materials.warningDecalMat}>
            <planeGeometry args={[0.08, 0.03]} />
          </mesh>

          {/* --------------------------------------------------------------------- */}
          {/* LOWER ROBOTIC ARM BOOM (Segment 1)                                    */}
          {/* --------------------------------------------------------------------- */}
          <group position={[0, ARM_DIMENSIONS.lowerArmLength / 2, 0]}>
            {/* Main arm structural shell */}
            <mesh castShadow receiveShadow material={materials.bodyMat}>
              <boxGeometry args={[0.22, ARM_DIMENSIONS.lowerArmLength - 0.15, 0.24]} />
            </mesh>

            {/* Chamfered front panel detail */}
            <mesh position={[0, 0, 0.125]} castShadow material={materials.darkAccentMat}>
              <boxGeometry args={[0.14, ARM_DIMENSIONS.lowerArmLength - 0.35, 0.02]} />
            </mesh>

            {/* Contrast metallic groove running down the side */}
            <mesh position={[0.115, 0, 0]} material={materials.chromeMat}>
              <boxGeometry args={[0.015, ARM_DIMENSIONS.lowerArmLength - 0.3, 0.06]} />
            </mesh>
            <mesh position={[-0.115, 0, 0]} material={materials.chromeMat}>
              <boxGeometry args={[0.015, ARM_DIMENSIONS.lowerArmLength - 0.3, 0.06]} />
            </mesh>

            {/* Rear actuator / motor housing bulge */}
            <mesh position={[0, -0.2, -0.15]} castShadow material={materials.darkAccentMat}>
              <boxGeometry args={[0.24, 0.42, 0.12]} />
            </mesh>
            <mesh position={[0, -0.2, -0.22]} castShadow material={materials.capMat} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.09, 0.09, 0.22, 24]} />
            </mesh>

            {/* Cable management conduit clamp */}
            <mesh position={[0.09, 0.18, -0.12]} material={materials.rubberMat} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
            </mesh>
          </group>

          {/* ===================================================================== */}
          {/* 4. JOINT 3: ELBOW ROTARY JOINT (PITCH - ROTATES AROUND X)             */}
          {/* ===================================================================== */}
          <group
            ref={elbowGroup}
            position={[0, ARM_DIMENSIONS.lowerArmLength, 0]}
            rotation={[qElbow, 0, 0]}
          >
            {/* Rotary elbow hub cylinder */}
            <mesh castShadow material={materials.darkAccentMat} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.50, 32]} />
            </mesh>

            {/* Left elbow joint cap */}
            <group position={[-0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow material={materials.capMat}>
                <cylinderGeometry args={[0.15, 0.15, 0.025, 32]} />
              </mesh>
              <mesh position={[0, 0.018, 0]} material={materials.chromeMat}>
                <cylinderGeometry args={[0.06, 0.06, 0.015, 20]} />
              </mesh>
              <mesh position={[0, 0.03, 0]} material={materials.darkAccentMat}>
                <cylinderGeometry args={[0.025, 0.025, 0.015, 6]} />
              </mesh>
            </group>

            {/* Right elbow joint cap */}
            <group position={[0.26, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <mesh castShadow material={materials.capMat}>
                <cylinderGeometry args={[0.15, 0.15, 0.025, 32]} />
              </mesh>
              <mesh position={[0, 0.018, 0]} material={materials.chromeMat}>
                <cylinderGeometry args={[0.06, 0.06, 0.015, 20]} />
              </mesh>
              <mesh position={[0, 0.03, 0]} material={materials.darkAccentMat}>
                <cylinderGeometry args={[0.025, 0.025, 0.015, 6]} />
              </mesh>
            </group>

            {/* ------------------------------------------------------------------- */}
            {/* UPPER ROBOTIC ARM BOOM (Segment 2)                                  */}
            {/* ------------------------------------------------------------------- */}
            <group position={[0, ARM_DIMENSIONS.upperArmLength / 2, 0]}>
              {/* Tapered streamlined white metallic upper arm */}
              <mesh castShadow receiveShadow material={materials.bodyMat}>
                <boxGeometry args={[0.18, ARM_DIMENSIONS.upperArmLength - 0.12, 0.18]} />
              </mesh>

              {/* Recessed side panel line */}
              <mesh position={[0.095, 0, 0]} material={materials.darkAccentMat}>
                <boxGeometry args={[0.01, ARM_DIMENSIONS.upperArmLength - 0.28, 0.08]} />
              </mesh>
              <mesh position={[-0.095, 0, 0]} material={materials.darkAccentMat}>
                <boxGeometry args={[0.01, ARM_DIMENSIONS.upperArmLength - 0.28, 0.08]} />
              </mesh>

              {/* Accent status LED strip on upper forearm */}
              <mesh position={[0, 0.1, 0.092]} material={materials.ledMat}>
                <boxGeometry args={[0.03, 0.35, 0.008]} />
              </mesh>

              {/* Counter-pivot actuator bulge near elbow */}
              <mesh position={[0, -0.22, -0.11]} castShadow material={materials.darkAccentMat}>
                <boxGeometry args={[0.19, 0.28, 0.08]} />
              </mesh>
            </group>

            {/* =================================================================== */}
            {/* 5. JOINT 4: COMPACT WRIST ASSEMBLY (PITCH / TILT)                   */}
            {/* =================================================================== */}
            <group
              ref={wristTiltGroup}
              position={[0, ARM_DIMENSIONS.upperArmLength, 0]}
              rotation={[qWristTilt, 0, 0]}
            >
              {/* Wrist pitch rotary cylinder */}
              <mesh castShadow material={materials.darkAccentMat} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.11, 0.11, 0.32, 28]} />
              </mesh>

              {/* Left & Right dark circular wrist caps */}
              <group position={[-0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh material={materials.capMat}>
                  <cylinderGeometry args={[0.10, 0.10, 0.02, 24]} />
                </mesh>
                <mesh position={[0, 0.015, 0]} material={materials.chromeMat}>
                  <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
                </mesh>
              </group>

              <group position={[0.17, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <mesh material={materials.capMat}>
                  <cylinderGeometry args={[0.10, 0.10, 0.02, 24]} />
                </mesh>
                <mesh position={[0, 0.015, 0]} material={materials.chromeMat}>
                  <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
                </mesh>
              </group>

              {/* Wrist gimbal neck */}
              <mesh position={[0, 0.12, 0]} castShadow receiveShadow material={materials.bodyMat}>
                <boxGeometry args={[0.15, 0.16, 0.15]} />
              </mesh>

              {/* ================================================================= */}
              {/* 6. JOINT 5: WRIST ROTATION / TOOL FLANGE (ROLL - ROTATES AROUND Y) */}
              {/* ================================================================= */}
              <group
                ref={wristRotGroup}
                position={[0, 0.22, 0]}
                rotation={[0, qWristRot, 0]}
              >
                {/* Cylindrical tool mounting flange */}
                <mesh castShadow material={materials.darkAccentMat}>
                  <cylinderGeometry args={[0.12, 0.13, 0.08, 28]} />
                </mesh>
                <mesh position={[0, 0.045, 0]} material={materials.chromeMat}>
                  <cylinderGeometry args={[0.115, 0.115, 0.015, 28]} />
                </mesh>

                {/* =============================================================== */}
                {/* 7. TWO-FINGER PARALLEL GRIPPER                                  */}
                {/* =============================================================== */}
                <group position={[0, 0.10, 0]}>
                  {/* Gripper actuator base / chassis */}
                  <mesh castShadow receiveShadow material={materials.bodyMat}>
                    <boxGeometry args={[0.34, 0.10, 0.16]} />
                  </mesh>

                  {/* Dark inner slide carriage */}
                  <mesh position={[0, 0.02, 0]} castShadow material={materials.darkAccentMat}>
                    <boxGeometry args={[0.28, 0.07, 0.12]} />
                  </mesh>

                  {/* Dual parallel polished linear guide rods */}
                  <mesh position={[0, 0.05, 0.04]} material={materials.chromeMat} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.012, 0.012, 0.36, 16]} />
                  </mesh>
                  <mesh position={[0, 0.05, -0.04]} material={materials.chromeMat} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.012, 0.012, 0.36, 16]} />
                  </mesh>

                  {/* Center pneumatic actuator valve details */}
                  <mesh position={[0, -0.01, 0.085]} material={materials.darkAccentMat} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.03, 12]} />
                  </mesh>

                  {/* ------------------------------------------------------------- */}
                  {/* LEFT GRIPPER FINGER (Sliding along -X axis)                   */}
                  {/* ------------------------------------------------------------- */}
                  <group ref={leftFingerRef} position={[-fingerSpread, 0.06, 0]}>
                    {/* Finger slide block */}
                    <mesh castShadow material={materials.darkAccentMat}>
                      <boxGeometry args={[0.045, 0.05, 0.10]} />
                    </mesh>

                    {/* Finger upper bracket (angled slightly inwards) */}
                    <group position={[0, 0.07, 0]} rotation={[0, 0, -0.12]}>
                      {/* Metal finger spine */}
                      <mesh castShadow material={materials.chromeMat}>
                        <boxGeometry args={[0.035, 0.12, 0.08]} />
                      </mesh>

                      {/* Lower curved claw tip */}
                      <group position={[0.015, 0.09, 0]} rotation={[0, 0, 0.22]}>
                        <mesh castShadow material={materials.darkAccentMat}>
                          <boxGeometry args={[0.03, 0.09, 0.07]} />
                        </mesh>

                        {/* Inner high-friction textured rubber gripping pad */}
                        <mesh position={[0.017, 0, 0]} material={materials.rubberMat}>
                          <boxGeometry args={[0.008, 0.075, 0.065]} />
                        </mesh>
                      </group>
                    </group>
                  </group>

                  {/* ------------------------------------------------------------- */}
                  {/* RIGHT GRIPPER FINGER (Sliding along +X axis)                  */}
                  {/* ------------------------------------------------------------- */}
                  <group ref={rightFingerRef} position={[fingerSpread, 0.06, 0]}>
                    {/* Finger slide block */}
                    <mesh castShadow material={materials.darkAccentMat}>
                      <boxGeometry args={[0.045, 0.05, 0.10]} />
                    </mesh>

                    {/* Finger upper bracket (angled slightly inwards) */}
                    <group position={[0, 0.07, 0]} rotation={[0, 0, 0.12]}>
                      {/* Metal finger spine */}
                      <mesh castShadow material={materials.chromeMat}>
                        <boxGeometry args={[0.035, 0.12, 0.08]} />
                      </mesh>

                      {/* Lower curved claw tip */}
                      <group position={[-0.015, 0.09, 0]} rotation={[0, 0, -0.22]}>
                        <mesh castShadow material={materials.darkAccentMat}>
                          <boxGeometry args={[0.03, 0.09, 0.07]} />
                        </mesh>

                        {/* Inner high-friction textured rubber gripping pad */}
                        <mesh position={[-0.017, 0, 0]} material={materials.rubberMat}>
                          <boxGeometry args={[0.008, 0.075, 0.065]} />
                        </mesh>
                      </group>
                    </group>
                  </group>

                  {/* Tool Center Point (TCP) Marker / Attachment anchor */}
                  <group ref={tcpMarkerRef} position={[0, 0.24, 0]}>
                    {/* If cube is gripped, it will be rendered attached right here! */}
                    {isGrippingCube && (
                      <group position={[0, 0, 0]}>
                        {/* Target Cube attached in jaws */}
                        <mesh castShadow receiveShadow>
                          <boxGeometry args={[0.18, 0.18, 0.18]} />
                          <meshStandardMaterial
                            color="#38bdf8"
                            metalness={0.8}
                            roughness={0.2}
                          />
                        </mesh>
                        {/* Cube metallic edge trim */}
                        <mesh>
                          <boxGeometry args={[0.184, 0.184, 0.184]} />
                          <meshStandardMaterial
                            color="#0284c7"
                            wireframe
                          />
                        </mesh>
                        {/* Center gold fiducial marker / grab target */}
                        <mesh position={[0, 0, 0.092]}>
                          <circleGeometry args={[0.04, 16]} />
                          <meshBasicMaterial color="#f59e0b" />
                        </mesh>
                      </group>
                    )}
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
