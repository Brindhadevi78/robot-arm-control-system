import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  JointAngles,
  HOME_JOINT_ANGLES,
  ZERO_JOINT_ANGLES,
  RobotStatus,
  CubeLocation,
  PICK_AND_PLACE_SEQUENCE,
  SequenceStep,
} from './types';
import { calculateForwardKinematics, lerpJoints, Vector3D } from './utils/kinematics';
import { TopNavbar } from './components/TopNavbar';
import { RoboticArmCanvas } from './components/RoboticArmCanvas';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryBottomBar } from './components/TelemetryBottomBar';

export default function App() {
  // Primary Robot State
  const [joints, setJoints] = useState<JointAngles>(HOME_JOINT_ANGLES);
  const [status, setStatus] = useState<RobotStatus>('ONLINE');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cubeLocation, setCubeLocation] = useState<CubeLocation>('pickup');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Animation & Sequence State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepProgress, setStepProgress] = useState<number>(0);
  const [totalProgress, setTotalProgress] = useState<number>(0);

  // Animation Refs
  const animationFrameRef = useRef<number | null>(null);
  const currentJointsRef = useRef<JointAngles>(HOME_JOINT_ANGLES);
  currentJointsRef.current = joints;

  const sequenceRunningRef = useRef<boolean>(false);
  const speedRef = useRef<number>(speedMultiplier);
  speedRef.current = speedMultiplier;

  // Real-time TCP (Tool Center Point) cartesian coordinates
  const tcpCoordinates: Vector3D = calculateForwardKinematics(joints);

  // Clean up any running animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Smooth interpolation helper to move robot to a target pose
  const animateToJoints = useCallback(
    (target: JointAngles, durationMs = 1000, onComplete?: () => void) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const startJoints = { ...currentJointsRef.current };
      const startTime = performance.now();
      const actualDuration = Math.max(200, durationMs / speedRef.current);

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const t = Math.min(1, elapsed / actualDuration);

        const nextJoints = lerpJoints(startJoints, target, t);
        setJoints(nextJoints);

        if (t < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          setJoints(target);
          if (onComplete) onComplete();
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Execute full 9-step pick-and-place sequence
  const startPickAndPlaceSequence = useCallback(() => {
    if (!isOnline || status === 'ESTOP') return;

    sequenceRunningRef.current = true;
    setStatus('EXECUTING');

    let stepIdx = 0;
    const steps = PICK_AND_PLACE_SEQUENCE;

    const runStep = (index: number) => {
      if (!sequenceRunningRef.current) return;
      if (index >= steps.length) {
        // Sequence completed successfully
        sequenceRunningRef.current = false;
        setStatus('ONLINE');
        setCurrentStepIndex(0);
        setTotalProgress(100);
        return;
      }

      const step = steps[index];
      setCurrentStepIndex(index);

      // Handle payload grab/release triggers at precise step markers
      if (step.cubeAction === 'grab') {
        setCubeLocation('gripped');
      } else if (step.cubeAction === 'release') {
        setCubeLocation('dropoff');
      }

      const startJoints = { ...currentJointsRef.current };
      const targetJoints = step.targetAngles;
      const startTime = performance.now();
      const stepDuration = Math.max(300, step.durationMs / speedRef.current);

      const animateFrame = (currentTime: number) => {
        if (!sequenceRunningRef.current) return;

        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / stepDuration);

        const currentInterpolated = lerpJoints(startJoints, targetJoints, progress);
        setJoints(currentInterpolated);

        // Update overall sequence progress bar percentage
        const overallPct = ((index + progress) / steps.length) * 100;
        setTotalProgress(overallPct);
        setStepProgress(progress * 100);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateFrame);
        } else {
          // Finish current step
          setJoints(targetJoints);

          // If step had a cube action after move
          if (step.cubeAction === 'grab') {
            setCubeLocation('gripped');
          } else if (step.cubeAction === 'release') {
            setCubeLocation('dropoff');
          }

          // Small pause between steps for realistic robot acceleration
          setTimeout(() => {
            if (sequenceRunningRef.current) {
              runStep(index + 1);
            }
          }, 100);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateFrame);
    };

    runStep(0);
  }, [isOnline, status]);

  // Halt current automated sequence
  const stopSequence = useCallback(() => {
    sequenceRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setStatus('PAUSED');
  }, []);

  // Emergency Stop Trigger
  const handleEmergencyStop = useCallback(() => {
    sequenceRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setStatus('ESTOP');
  }, []);

  // Reset E-Stop
  const handleResetEstop = useCallback(() => {
    setStatus(isOnline ? 'ONLINE' : 'OFFLINE');
    setTotalProgress(0);
  }, [isOnline]);

  // Move directly to neutral HOME position
  const handleHome = useCallback(() => {
    if (status === 'ESTOP' || !isOnline) return;
    if (sequenceRunningRef.current) {
      sequenceRunningRef.current = false;
    }
    setStatus('EXECUTING');
    animateToJoints(HOME_JOINT_ANGLES, 1200, () => {
      setStatus('ONLINE');
      setTotalProgress(0);
    });
  }, [status, isOnline, animateToJoints]);

  // Restore all joint values & reset payload
  const handleReset = useCallback(() => {
    if (status === 'ESTOP' || !isOnline) return;
    if (sequenceRunningRef.current) {
      sequenceRunningRef.current = false;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setStatus('ONLINE');
    setJoints(HOME_JOINT_ANGLES);
    setCubeLocation('pickup');
    setTotalProgress(0);
    setCurrentStepIndex(0);
  }, [status, isOnline]);

  // Actuate Gripper to closed position
  const handleGrip = useCallback(() => {
    if (status === 'ESTOP' || !isOnline) return;
    setJoints((prev) => ({ ...prev, gripper: 5 }));
  }, [status, isOnline]);

  // Actuate Gripper to open position
  const handleRelease = useCallback(() => {
    if (status === 'ESTOP' || !isOnline) return;
    setJoints((prev) => ({ ...prev, gripper: 85 }));
    if (cubeLocation === 'gripped') {
      setCubeLocation('dropoff');
    }
  }, [status, isOnline, cubeLocation]);

  // Direct joint control slider change
  const handleJointChange = useCallback(
    (jointKey: keyof JointAngles, value: number) => {
      if (status === 'ESTOP' || !isOnline || status === 'EXECUTING') return;
      setJoints((prev) => ({
        ...prev,
        [jointKey]: value,
      }));
    },
    [status, isOnline]
  );

  // Toggle controller power
  const handleToggleOnline = useCallback(() => {
    if (status === 'ESTOP') return;
    if (isOnline) {
      if (sequenceRunningRef.current) {
        stopSequence();
      }
      setIsOnline(false);
      setStatus('OFFLINE');
    } else {
      setIsOnline(true);
      setStatus('ONLINE');
    }
  }, [isOnline, status, stopSequence]);

  const activeStep: SequenceStep | null =
    status === 'EXECUTING' && PICK_AND_PLACE_SEQUENCE[currentStepIndex]
      ? PICK_AND_PLACE_SEQUENCE[currentStepIndex]
      : null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0f1115] font-sans text-[#e0e0e0] select-none antialiased">
      {/* Top Navbar */}
      <TopNavbar
        status={status}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        onEmergencyStop={handleEmergencyStop}
        onResetEstop={handleResetEstop}
      />

      {/* Center Layout: Left 3D Viewport + Right Control Panel */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 relative overflow-hidden bg-[#090a0c]">
        {/* Left Side: Real-time 3D Robotic Arm Viewport */}
        <div className="flex-1 w-full h-1/2 md:h-full relative min-h-0 overflow-hidden">
          <RoboticArmCanvas
            joints={joints}
            status={status}
            cubeLocation={cubeLocation}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((prev) => !prev)}
          />
        </div>

        {/* Right Side: Joint & Motion Controls Panel */}
        <div className="h-1/2 md:h-full flex-shrink-0 min-h-0">
          <ControlPanel
            joints={joints}
            status={status}
            isOnline={isOnline}
            speedMultiplier={speedMultiplier}
            totalProgress={totalProgress}
            onJointChange={handleJointChange}
            onHome={handleHome}
            onReset={handleReset}
            onStartSequence={startPickAndPlaceSequence}
            onStopSequence={stopSequence}
            onGrip={handleGrip}
            onRelease={handleRelease}
            onSpeedChange={setSpeedMultiplier}
          />
        </div>
      </main>

      {/* Bottom Telemetry & Status Bar */}
      <TelemetryBottomBar
        joints={joints}
        status={status}
        currentStep={activeStep}
        stepIndex={currentStepIndex}
        totalSteps={PICK_AND_PLACE_SEQUENCE.length}
        progressPercent={totalProgress}
        tcpCoordinates={tcpCoordinates}
      />
    </div>
  );
}
