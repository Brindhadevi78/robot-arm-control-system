import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { RoboticArm } from './RoboticArm';
import { SceneEnvironment } from './SceneEnvironment';
import { JointAngles, RobotStatus, CubeLocation } from '../types';
import { RotateCw, Eye, Grid as GridIcon, Maximize2 } from 'lucide-react';

interface RoboticArmCanvasProps {
  joints: JointAngles;
  status: RobotStatus;
  cubeLocation: CubeLocation;
  showGrid: boolean;
  onToggleGrid: () => void;
  onTcpPositionUpdate?: (pos: THREE.Vector3) => void;
}

export const RoboticArmCanvas: React.FC<RoboticArmCanvasProps> = ({
  joints,
  status,
  cubeLocation,
  showGrid,
  onToggleGrid,
  onTcpPositionUpdate,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [activePreset, setActivePreset] = React.useState<'PER' | 'TOP' | 'FRT' | 'SIDE'>('PER');

  const setCameraPreset = (x: number, y: number, z: number, targetY = 1.0, targetZ = 0.2) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      controls.object.position.set(x, y, z);
      controls.target.set(0, targetY, targetZ);
      controls.update();
    }
  };

  return (
    <div className="relative w-full h-full min-h-0 bg-[#090a0c] overflow-hidden select-none">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [3.2, 2.4, 3.4], fov: 42, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        className="w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#090a0c']} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={1.2}
          maxDistance={8.0}
          maxPolarAngle={Math.PI / 2 - 0.04}
          target={[0, 1.0, 0.2]}
        />

        <SceneEnvironment
          cubeLocation={cubeLocation}
          showGrid={showGrid}
        />

        <RoboticArm
          joints={joints}
          status={status}
          isGrippingCube={cubeLocation === 'gripped'}
          onTcpPositionUpdate={onTcpPositionUpdate}
        />
      </Canvas>

      {/* High Density Radial Dot Grid Pattern Subtle Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#2d323b_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none z-[1]" />

      {/* Viewport Top Left: Telemetry HUD */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex flex-col space-y-2 pointer-events-auto">
        <div className="bg-black/40 backdrop-blur p-2.5 border border-white/5 rounded text-[10px] font-mono shadow-lg space-y-0.5">
          <p className="text-blue-400 font-bold">VIEWPORT: MAIN_PERSPECTIVE</p>
          <p className="text-gray-500">FPS: 60.0</p>
          <p className="text-gray-500">LATENCY: 12ms</p>
        </div>
      </div>

      {/* Viewport Top Right: Payload & Grid Controls */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex items-center space-x-2 pointer-events-auto">
        <div className="bg-black/40 backdrop-blur px-3 py-1.5 border border-white/5 rounded text-[10px] font-mono flex items-center space-x-2 shadow-lg">
          <span className="text-gray-500 font-bold">PAYLOAD:</span>
          <span
            className={
              cubeLocation === 'gripped'
                ? 'text-green-400 font-semibold'
                : cubeLocation === 'pickup'
                ? 'text-amber-400 font-semibold'
                : 'text-blue-400 font-semibold'
            }
          >
            {cubeLocation === 'gripped' ? 'IN JAWS' : cubeLocation === 'pickup' ? 'STATION A' : 'PALLET B'}
          </span>
        </div>

        <button
          id="toggle-grid-btn"
          onClick={onToggleGrid}
          title={showGrid ? 'Hide Workspace Grid' : 'Show Workspace Grid'}
          className={`p-2 rounded border border-white/10 backdrop-blur text-xs font-mono transition-colors cursor-pointer shadow-lg ${
            showGrid ? 'bg-blue-600/30 text-blue-400 border-blue-500/40' : 'bg-black/40 text-gray-400 hover:text-white'
          }`}
        >
          <GridIcon className="w-3.5 h-3.5" />
        </button>

        <button
          id="reset-camera-btn"
          onClick={() => {
            setActivePreset('PER');
            setCameraPreset(3.2, 2.4, 3.4, 1.0, 0.2);
          }}
          title="Reset Camera Orientation"
          className="p-2 rounded border border-white/10 bg-black/40 text-gray-400 hover:text-white backdrop-blur transition-colors cursor-pointer shadow-lg"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Viewport Bottom Left: Coordinate Guide */}
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 pointer-events-none hidden md:flex items-center space-x-3 text-[10px] font-mono text-gray-500 bg-black/40 backdrop-blur px-3 py-1.5 rounded border border-white/5">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-0.5 bg-red-500 rounded" />
          <span>X-LAT</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-0.5 bg-green-500 rounded" />
          <span>Y-ALT</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-0.5 bg-blue-500 rounded" />
          <span>Z-RCH</span>
        </div>
        <span className="text-gray-700">|</span>
        <span>L-DRAG: ORBIT • R-DRAG: PAN • WHEEL: ZOOM</span>
      </div>

      {/* Viewport Bottom Right: Camera Angles HUD */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10 flex flex-col space-y-2 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur p-2 md:p-3 rounded-lg border border-white/10 flex space-x-2 md:space-x-3 shadow-xl">
          <button
            id="camera-preset-top"
            onClick={() => {
              setActivePreset('TOP');
              setCameraPreset(0.01, 5.2, 0.2, 0.2);
            }}
            title="Top View"
            className={`w-9 h-9 md:w-10 md:h-10 border rounded flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activePreset === 'TOP'
                ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold'
                : 'border-white/20 opacity-50 hover:opacity-100 hover:bg-white/10 text-gray-300'
            }`}
          >
            TOP
          </button>
          <button
            id="camera-preset-iso"
            onClick={() => {
              setActivePreset('PER');
              setCameraPreset(3.2, 2.4, 3.4, 1.0, 0.2);
            }}
            title="Perspective View"
            className={`w-9 h-9 md:w-10 md:h-10 border rounded flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activePreset === 'PER'
                ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold'
                : 'border-white/20 opacity-50 hover:opacity-100 hover:bg-white/10 text-gray-300'
            }`}
          >
            PER
          </button>
          <button
            id="camera-preset-front"
            onClick={() => {
              setActivePreset('FRT');
              setCameraPreset(0, 1.5, 4.2, 1.0, 0.2);
            }}
            title="Front View"
            className={`w-9 h-9 md:w-10 md:h-10 border rounded flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activePreset === 'FRT'
                ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold'
                : 'border-white/20 opacity-50 hover:opacity-100 hover:bg-white/10 text-gray-300'
            }`}
          >
            FRT
          </button>
          <button
            id="camera-preset-side"
            onClick={() => {
              setActivePreset('SIDE');
              setCameraPreset(4.2, 1.5, 0.2, 1.0, 0.2);
            }}
            title="Side View"
            className={`w-9 h-9 md:w-10 md:h-10 border rounded flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activePreset === 'SIDE'
                ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold'
                : 'border-white/20 opacity-50 hover:opacity-100 hover:bg-white/10 text-gray-300'
            }`}
          >
            SIDE
          </button>
        </div>
      </div>
    </div>
  );
};
