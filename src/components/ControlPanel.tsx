import React from 'react';
import {
  JointAngles,
  JOINT_LIMITS,
  RobotStatus,
} from '../types';
import {
  Play,
  Square,
  Home,
  RotateCcw,
  Sliders,
  Maximize,
  Minimize,
  FastForward,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ControlPanelProps {
  joints: JointAngles;
  status: RobotStatus;
  isOnline: boolean;
  speedMultiplier: number;
  totalProgress?: number;
  onJointChange: (joint: keyof JointAngles, value: number) => void;
  onHome: () => void;
  onReset: () => void;
  onStartSequence: () => void;
  onStopSequence: () => void;
  onGrip: () => void;
  onRelease: () => void;
  onSpeedChange: (multiplier: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  joints,
  status,
  isOnline,
  speedMultiplier,
  totalProgress = 0,
  onJointChange,
  onHome,
  onReset,
  onStartSequence,
  onStopSequence,
  onGrip,
  onRelease,
  onSpeedChange,
}) => {
  const isExecuting = status === 'EXECUTING';
  const isEstop = status === 'ESTOP';
  const controlsDisabled = !isOnline || isEstop || isExecuting;

  // Sliders order: Base Rotation, Shoulder Joint, Elbow Joint, Wrist Rotation, Wrist Tilt, Gripper
  const sliderOrder: (keyof JointAngles)[] = [
    'base',
    'shoulder',
    'elbow',
    'wristRot',
    'wristTilt',
    'gripper',
  ];

  return (
    <aside className="w-full md:w-[340px] bg-[#1a1d23] border-l border-[#2d323b] flex flex-col h-full overflow-y-auto select-none z-10">
      <div className="p-5 md:p-6 space-y-6 md:space-y-8 overflow-y-auto flex-1">
        {/* Section 1: Joint Configuration */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Joint Configuration</h2>
            <span className="text-[10px] bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded font-mono font-medium">
              {isExecuting ? 'AUTOMATION ACTIVE' : controlsDisabled ? 'LOCKED' : 'MANUAL OVERRIDE'}
            </span>
          </div>

          <div className="space-y-4">
            {sliderOrder.map((key) => {
              const limit = JOINT_LIMITS[key];
              const currentValue = joints[key];
              const isGripper = key === 'gripper';

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-gray-400 uppercase tracking-wide">{limit.label}</span>
                    <span className="text-white font-mono font-medium">
                      {isGripper ? `${Math.round(currentValue)}mm` : `${currentValue > 0 ? '+' : ''}${currentValue.toFixed(1)}°`}
                    </span>
                  </div>
                  <input
                    id={`slider-${key}`}
                    type="range"
                    min={limit.min}
                    max={limit.max}
                    step={isGripper ? 1 : 0.5}
                    value={currentValue}
                    onChange={(e) => onJointChange(key, parseFloat(e.target.value))}
                    disabled={controlsDisabled}
                    className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Operational Controls */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Operational Controls</h2>
            <div className="flex items-center space-x-1 font-mono text-[10px]">
              <span className="text-gray-500 mr-0.5">SPD:</span>
              {[0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  id={`speed-${spd}x-btn`}
                  onClick={() => onSpeedChange(spd)}
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                    speedMultiplier === spd
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-[#2d323b] text-gray-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              id="home-position-btn"
              onClick={onHome}
              disabled={controlsDisabled}
              className="bg-[#2d323b] hover:bg-[#383e4a] disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded text-xs font-semibold border border-white/5 transition-colors cursor-pointer text-white"
            >
              HOME
            </button>
            <button
              id="reset-joints-btn"
              onClick={onReset}
              disabled={controlsDisabled}
              className="bg-[#2d323b] hover:bg-[#383e4a] disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded text-xs font-semibold border border-white/5 transition-colors cursor-pointer text-white"
            >
              RESET
            </button>
            {isExecuting ? (
              <button
                id="stop-sequence-btn"
                onClick={onStopSequence}
                className="bg-amber-600 hover:bg-amber-500 py-2.5 rounded text-xs font-bold shadow-lg shadow-amber-900/20 transition-all cursor-pointer text-white"
              >
                PAUSE
              </button>
            ) : (
              <button
                id="start-sequence-btn"
                onClick={onStartSequence}
                disabled={!isOnline || isEstop}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded text-xs font-bold shadow-lg shadow-blue-900/20 transition-all cursor-pointer text-white"
              >
                START SEQUENCE
              </button>
            )}
            <button
              id="stop-btn"
              onClick={onStopSequence}
              disabled={!isExecuting}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded text-xs font-semibold border border-white/5 transition-colors cursor-pointer text-white"
            >
              STOP
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              id="grip-actuate-btn"
              onClick={onGrip}
              disabled={controlsDisabled}
              className="bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed py-2 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer text-white"
            >
              GRIP
            </button>
            <button
              id="release-actuate-btn"
              onClick={onRelease}
              disabled={controlsDisabled}
              className="bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed py-2 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer text-white"
            >
              RELEASE
            </button>
          </div>
        </section>

        {isEstop && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded text-red-300 text-xs font-mono">
            <span className="font-bold block">SAFETY INTERLOCK ACTIVE</span>
            <span className="text-[10px] text-red-400">Emergency Stop latched. Motion is inhibited until reset.</span>
          </div>
        )}
      </div>

      {/* Sequence Progress Bar at Bottom of Sidebar */}
      <div className="mt-auto p-4 bg-[#14161b] border-t border-[#2d323b] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">SEQUENCE PROGRESS</span>
          <span className="text-[10px] font-mono text-blue-400 font-semibold">{Math.round(totalProgress)}%</span>
        </div>
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, totalProgress))}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
