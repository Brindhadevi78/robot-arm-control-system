import React from 'react';
import { JointAngles, RobotStatus, SequenceStep } from '../types';
import { Vector3D } from '../utils/kinematics';
import { Activity, Gauge, Compass, CheckCircle2, Clock } from 'lucide-react';

interface TelemetryBottomBarProps {
  joints: JointAngles;
  status: RobotStatus;
  currentStep: SequenceStep | null;
  stepIndex: number;
  totalSteps: number;
  progressPercent: number;
  tcpCoordinates: Vector3D;
}

export const TelemetryBottomBar: React.FC<TelemetryBottomBarProps> = ({
  joints,
  status,
  currentStep,
  stepIndex,
  totalSteps,
  progressPercent,
  tcpCoordinates,
}) => {
  const isExecuting = status === 'EXECUTING';

  return (
    <footer className="h-16 bg-[#1a1d23] border-t border-[#2d323b] px-4 md:px-6 flex items-center justify-between select-none shrink-0 z-20">
      {/* Left side: Current Op, Dividers, Coordinates, and Joint Telemetry */}
      <div className="flex items-center space-x-4 md:space-x-8 min-w-0">
        {/* Current Operation */}
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Current Op</span>
          <span className="text-xs font-mono text-blue-400 uppercase truncate max-w-[160px] sm:max-w-xs font-medium">
            {isExecuting && currentStep
              ? `${currentStep.label.replace(/\s+/g, '_')}`
              : status === 'ESTOP'
              ? 'EMERGENCY_STOP'
              : status === 'PAUSED'
              ? 'SEQUENCE_PAUSED'
              : 'STANDBY_READY'}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-gray-800 shrink-0" />

        {/* Real-time TCP Coordinates */}
        <div className="hidden sm:flex items-center space-x-4 md:space-x-6">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">X-Coord</span>
            <span className="text-xs font-mono text-[#e0e0e0] font-medium">{tcpCoordinates.x}mm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Y-Coord</span>
            <span className="text-xs font-mono text-[#e0e0e0] font-medium">{tcpCoordinates.y}mm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Z-Coord</span>
            <span className="text-xs font-mono text-[#e0e0e0] font-medium">{tcpCoordinates.z}mm</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gray-800 shrink-0" />

        {/* Joint Angles Readouts */}
        <div className="hidden lg:flex items-center space-x-4 text-[11px] font-mono">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-bold">J1</span>
            <span className="text-xs font-mono text-gray-300">{Math.round(joints.base)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-bold">J2</span>
            <span className="text-xs font-mono text-gray-300">{Math.round(joints.shoulder)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-bold">J3</span>
            <span className="text-xs font-mono text-gray-300">{Math.round(joints.elbow)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-bold">J4</span>
            <span className="text-xs font-mono text-gray-300">{Math.round(joints.wristTilt)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-bold">J5</span>
            <span className="text-xs font-mono text-gray-300">{Math.round(joints.wristRot)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase font-bold">GRP</span>
            <span className="text-xs font-mono text-blue-400">{Math.round(joints.gripper)}mm</span>
          </div>
        </div>
      </div>

      {/* Right side: Motor Temp and Stepped Visual Meter */}
      <div className="flex items-center space-x-3 md:space-x-4 shrink-0">
        <div className="text-right">
          <span className="text-[9px] text-gray-500 block leading-tight font-bold uppercase tracking-wider">MOTOR TEMP</span>
          <span className="text-xs font-mono text-orange-400 font-semibold">
            {isExecuting ? '46.2°C' : status === 'ESTOP' ? '38.0°C' : '42.4°C'}
          </span>
        </div>
        <div className="flex space-x-1 items-end h-6">
          <div className="w-1 h-6 bg-blue-500/20" />
          <div className="w-1 h-6 bg-blue-500/40" />
          <div className="w-1 h-6 bg-blue-500/60" />
          <div className="w-1 h-6 bg-blue-500/80" />
          <div className="w-1 h-6 bg-blue-500" />
        </div>
      </div>
    </footer>
  );
};
