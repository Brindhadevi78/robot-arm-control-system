import React from 'react';
import { RobotStatus } from '../types';
import {
  AlertTriangle,
  Power,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface TopNavbarProps {
  status: RobotStatus;
  isOnline: boolean;
  onToggleOnline: () => void;
  onEmergencyStop: () => void;
  onResetEstop: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  status,
  isOnline,
  onToggleOnline,
  onEmergencyStop,
  onResetEstop,
}) => {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3.5 bg-[#1a1d23] border-b border-[#2d323b] shrink-0 select-none z-20">
      {/* Brand & System Information */}
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg shadow-md shadow-blue-900/30 shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tight text-[#e0e0e0] flex items-center flex-wrap">
            <span>ROBOT ARM CONTROL SYSTEM</span>
            <span className="text-xs font-normal text-gray-500 ml-2 hidden sm:inline font-mono">v2.4.0-STABLE</span>
          </h1>
        </div>
      </div>

      {/* Center Status Banner & Controls */}
      <div className="flex items-center space-x-3 md:space-x-6">
        {/* Status Indicator */}
        <div
          className={`flex items-center space-x-2 bg-black/30 px-3 py-1.5 rounded-full border text-xs font-mono ${
            status === 'ESTOP'
              ? 'border-red-500/40 text-red-500'
              : !isOnline
              ? 'border-gray-600/40 text-gray-400'
              : status === 'EXECUTING'
              ? 'border-blue-500/40 text-blue-400'
              : status === 'PAUSED'
              ? 'border-amber-500/40 text-amber-400'
              : 'border-green-500/30 text-green-500'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              status === 'ESTOP'
                ? 'bg-red-500 animate-pulse'
                : !isOnline
                ? 'bg-gray-500'
                : status === 'EXECUTING'
                ? 'bg-blue-400 animate-ping'
                : status === 'PAUSED'
                ? 'bg-amber-400'
                : 'bg-green-500 animate-pulse'
            }`}
          />
          <span className="font-semibold tracking-wide">
            {status === 'ESTOP'
              ? 'SAFETY ESTOP'
              : !isOnline
              ? 'SYSTEM OFFLINE'
              : status === 'EXECUTING'
              ? 'EXECUTING SEQUENCE'
              : status === 'PAUSED'
              ? 'MOTION HOLD'
              : 'SYSTEM ONLINE'}
          </span>
        </div>

        {/* Power / Online toggle */}
        <button
          id="power-toggle-btn"
          onClick={onToggleOnline}
          disabled={status === 'ESTOP'}
          title={isOnline ? 'Disconnect robot controller' : 'Power on robot controller'}
          className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#2d323b] hover:bg-[#383e4a] border border-white/5 text-xs font-mono transition-colors cursor-pointer ${
            isOnline ? 'text-gray-300' : 'text-green-400'
          } ${status === 'ESTOP' ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Power className={`w-3.5 h-3.5 ${isOnline ? 'text-green-400' : 'text-gray-400'}`} />
          <span>{isOnline ? 'DISCONNECT' : 'CONNECT'}</span>
        </button>

        {/* Emergency Stop & E-Stop Recovery */}
        {status === 'ESTOP' ? (
          <button
            id="estop-reset-btn"
            onClick={onResetEstop}
            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded font-bold text-sm shadow-lg shadow-amber-900/20 active:translate-y-0.5 transition-all cursor-pointer flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4 animate-spin" />
            <span>RESET ESTOP</span>
          </button>
        ) : (
          <button
            id="estop-trigger-btn"
            onClick={onEmergencyStop}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm shadow-lg shadow-red-900/20 active:translate-y-0.5 transition-all cursor-pointer"
          >
            EMERGENCY STOP
          </button>
        )}
      </div>
    </header>
  );
};
