import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CubeLocation } from '../types';

interface SceneEnvironmentProps {
  cubeLocation: CubeLocation;
  showGrid?: boolean;
}

export const SceneEnvironment: React.FC<SceneEnvironmentProps> = ({
  cubeLocation,
  showGrid = true,
}) => {
  // Pickup station position in world space
  const pickupPos: [number, number, number] = [-1.30, 0.18, 1.30];
  // Dropoff station position in world space
  const dropoffPos: [number, number, number] = [1.30, 0.18, 1.30];

  const safetyEdges = useMemo(() => {
    const box = new THREE.BoxGeometry(4.6, 0.01, 3.8);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, []);

  const materials = useMemo(() => {
    // Heavy industrial steel worktable
    const tableMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1e2430'),
      metalness: 0.6,
      roughness: 0.45,
    });

    // Table edge beveled aluminum trim
    const tableTrimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#94a3b8'),
      metalness: 0.85,
      roughness: 0.25,
    });

    // Pickup platform
    const pickupMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#334155'),
      metalness: 0.7,
      roughness: 0.35,
    });

    // High visibility hazard yellow
    const hazardMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f59e0b'),
      roughness: 0.3,
    });

    // Target dropoff cyan ring
    const dropoffMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0ea5e9'),
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    // Target payload cube (anodized electric blue)
    const cubeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#38bdf8'),
      metalness: 0.8,
      roughness: 0.22,
    });

    // Pedestal feet
    const feetMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f172a'),
      metalness: 0.3,
      roughness: 0.8,
    });

    return {
      tableMat,
      tableTrimMat,
      pickupMat,
      hazardMat,
      dropoffMat,
      cubeMat,
      feetMat,
    };
  }, []);

  return (
    <group>
      {/* ========================================================================= */}
      {/* STUDIO LIGHTING RIG                                                       */}
      {/* ========================================================================= */}
      <ambientLight intensity={0.9} color="#ffffff" />

      {/* Main key directional light with sharp industrial highlights */}
      <directionalLight
        position={[6, 9, 7]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0003}
        color="#ffffff"
      />

      {/* Soft cool fill light from opposite quadrant */}
      <directionalLight
        position={[-6, 7, -5]}
        intensity={0.9}
        color="#bae6fd"
      />

      {/* Front fill light so robot front and gripper are clearly lit */}
      <directionalLight
        position={[0, 4, 7]}
        intensity={0.85}
        color="#f8fafc"
      />

      {/* Overhead downlight */}
      <directionalLight
        position={[0, 8, 0]}
        intensity={0.7}
        color="#ffffff"
      />

      {/* Rim / backlight for crisp silhouette edges on metallic surfaces */}
      <directionalLight
        position={[0, 5, -7]}
        intensity={0.8}
        color="#f1f5f9"
      />

      {/* Warm gentle bounce from underneath / front */}
      <pointLight position={[0, -0.5, 3]} intensity={0.4} color="#fed7aa" />

      {/* ========================================================================= */}
      {/* INDUSTRIAL WORKBENCH TABLE SURFACE                                        */}
      {/* ========================================================================= */}
      <group position={[0, -0.06, 0]}>
        {/* Main tabletop surface */}
        <mesh position={[0, 0.03, 0]} receiveShadow material={materials.tableMat}>
          <boxGeometry args={[5.2, 0.06, 4.4]} />
        </mesh>

        {/* Outer aluminum bevel bezel */}
        <mesh position={[0, 0.058, 0]} material={materials.tableTrimMat}>
          <boxGeometry args={[5.24, 0.015, 4.44]} />
        </mesh>

        {/* Sub-table frame / steel legs */}
        {[
          [-2.4, -0.6, -2.0],
          [2.4, -0.6, -2.0],
          [-2.4, -0.6, 2.0],
          [2.4, -0.6, 2.0],
        ].map(([lx, ly, lz], idx) => (
          <group key={`table-leg-${idx}`} position={[lx, ly, lz]}>
            <mesh castShadow material={materials.feetMat}>
              <boxGeometry args={[0.12, 1.2, 0.12]} />
            </mesh>
            {/* Rubber foot leveler */}
            <mesh position={[0, -0.58, 0]} material={materials.tableTrimMat}>
              <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Subtle coordinate grid on the workbench */}
      {showGrid && (
        <group position={[0, 0.002, 0]}>
          <gridHelper
            args={[5.0, 20, '#475569', '#334155']}
            position={[0, 0, 0]}
          />
        </group>
      )}

      {/* ========================================================================= */}
      {/* STATION A: PICKUP PEDESTAL                                                */}
      {/* ========================================================================= */}
      <group position={pickupPos}>
        {/* Cylindrical riser pedestal */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow material={materials.pickupMat}>
          <cylinderGeometry args={[0.26, 0.30, 0.18, 32]} />
        </mesh>

        {/* Hazard yellow warning border ring */}
        <mesh position={[0, 0.092, 0]} material={materials.hazardMat} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.015, 16, 32]} />
        </mesh>

        {/* Platform target crosshair */}
        <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.14, 24]} />
          <meshBasicMaterial color="#f59e0b" wireframe />
        </mesh>

        {/* Station Label Plate */}
        <mesh position={[0, 0.02, 0.31]} rotation={[-0.3, 0, 0]} material={materials.tableTrimMat}>
          <boxGeometry args={[0.34, 0.08, 0.02]} />
        </mesh>

        {/* PAYLOAD CUBE (When at pickup station) */}
        {cubeLocation === 'pickup' && (
          <group position={[0, 0.18, 0]}>
            {/* Main cube body */}
            <mesh castShadow receiveShadow material={materials.cubeMat}>
              <boxGeometry args={[0.18, 0.18, 0.18]} />
            </mesh>

            {/* Subtle wireframe metallic highlight */}
            <mesh>
              <boxGeometry args={[0.182, 0.182, 0.182]} />
              <meshBasicMaterial color="#0284c7" wireframe />
            </mesh>

            {/* Gold alignment fiducial marker on top */}
            <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 16]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
          </group>
        )}
      </group>

      {/* ========================================================================= */}
      {/* STATION B: DROPOFF PALLET                                                 */}
      {/* ========================================================================= */}
      <group position={dropoffPos}>
        {/* Cylindrical dropoff stand */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow material={materials.pickupMat}>
          <cylinderGeometry args={[0.26, 0.30, 0.18, 32]} />
        </mesh>

        {/* Cyan LED illuminated landing ring */}
        <mesh position={[0, 0.092, 0]} material={materials.dropoffMat} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.015, 16, 32]} />
        </mesh>

        {/* Destination target concentric rings */}
        <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.16, 24]} />
          <meshBasicMaterial color="#38bdf8" wireframe />
        </mesh>

        {/* Station Label Plate */}
        <mesh position={[0, 0.02, 0.31]} rotation={[-0.3, 0, 0]} material={materials.tableTrimMat}>
          <boxGeometry args={[0.34, 0.08, 0.02]} />
        </mesh>

        {/* PAYLOAD CUBE (When at dropoff station) */}
        {cubeLocation === 'dropoff' && (
          <group position={[0, 0.18, 0]}>
            <mesh castShadow receiveShadow material={materials.cubeMat}>
              <boxGeometry args={[0.18, 0.18, 0.18]} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.182, 0.182, 0.182]} />
              <meshBasicMaterial color="#0284c7" wireframe />
            </mesh>
            <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 16]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          </group>
        )}
      </group>

      {/* Safety perimeter lines around robot cell */}
      <group position={[0, 0.003, 0]}>
        {/* Outer safety line */}
        <lineSegments geometry={safetyEdges}>
          <lineBasicMaterial color="#eab308" />
        </lineSegments>
      </group>
    </group>
  );
};
