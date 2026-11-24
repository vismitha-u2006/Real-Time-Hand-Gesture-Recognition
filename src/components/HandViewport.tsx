import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Crosshair,
  Eye,
  Focus,
  Grid3X3,
  Layers,
  Pause,
  Play,
  Scan,
  AlertTriangle,
} from 'lucide-react';
import {
  CalibrationParams,
  DiagnosticState,
  GestureId,
  Landmark3D,
  ViewportLayers,
} from '../types/hud';
import { GESTURE_LABELS, HAND_CONNECTIONS } from '../utils/handKinematics';

interface HandViewportProps {
  landmarks: Landmark3D[];
  activeGesture: GestureId;
  onSelectGesture: (g: GestureId) => void;
  diagnosticState: DiagnosticState;
  onSelectDiagnosticState: (s: DiagnosticState) => void;
  fps: number;
  latencyMs: number;
  confidence: number;
  pinchApertureMm: number;
  calibration: CalibrationParams;
  selectedLandmarkId: number | null;
  onSelectLandmarkId: (id: number | null) => void;
  layers: ViewportLayers;
  onToggleLayer: (layer: keyof ViewportLayers) => void;
  frozen: boolean;
  onToggleFrozen: () => void;
  cameraActive: boolean;
  cameraError: string | null;
  videoStream: MediaStream | null;
  onPointerPoseChange: (pose: {
    centerX: number;
    centerY: number;
    yawRad: number;
    pitchRad: number;
  }) => void;
  onPinchHoldChange: (holding: boolean) => void;
  onDepthDelta: (delta: number) => void;
  onCaptureFrame: () => void;
  captureFlash: boolean;
}

const GESTURE_ORDER: GestureId[] = [
  'open_palm',
  'precision_pinch',
  'index_point',
  'closed_fist',
  'dual_rotate',
];

export function HandViewport({
  landmarks,
  activeGesture,
  onSelectGesture,
  diagnosticState,
  onSelectDiagnosticState,
  fps,
  latencyMs,
  confidence,
  pinchApertureMm,
  calibration,
  selectedLandmarkId,
  onSelectLandmarkId,
  layers,
  onToggleLayer,
  frozen,
  onToggleFrozen,
  cameraActive,
  cameraError,
  videoStream,
  onPointerPoseChange,
  onPinchHoldChange,
  onDepthDelta,
  onCaptureFrame,
  captureFlash,
}: HandViewportProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number } | null>(null);
  const [isHoldingPinch, setIsHoldingPinch] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (cameraActive && videoStream) {
      videoEl.srcObject = videoStream;
      videoEl.play().catch(() => {});
    } else {
      videoEl.srcObject = null;
    }
  }, [cameraActive, videoStream]);

  // Compute bounding box of current 21 landmarks
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y > maxY) maxY = lm.y;
  }
  const padBox = 0.045;
  const bx = Math.max(0.02, minX - padBox);
  const by = Math.max(0.05, minY - padBox);
  const bw = Math.min(0.96 - bx, maxX - minX + padBox * 2);
  const bh = Math.min(0.92 - by, maxY - minY + padBox * 2);

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const isPinchActive =
    diagnosticState !== 'lost' &&
    (pinchApertureMm <= calibration.pinchThresholdMm || isHoldingPinch);

  const pinchMidX =
    thumbTip && indexTip ? ((thumbTip.x + indexTip.x) / 2) * 1000 : 500;
  const pinchMidY =
    thumbTip && indexTip ? ((thumbTip.y + indexTip.y) / 2) * 600 : 300;

  const selectedLm =
    selectedLandmarkId !== null ? landmarks[selectedLandmarkId] ?? null : null;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setCursorCoords({ x: nx, y: ny });

    if (!frozen) {
      // Smoothly steer palm center and 3D yaw/pitch around viewport center
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      onPointerPoseChange({
        centerX: 0.5 + dx * 0.24,
        centerY: 0.54 + dy * 0.2,
        yawRad: dx * 0.72,
        pitchRad: -dy * 0.52,
      });
    }
  };

  const handlePointerLeave = () => {
    setCursorCoords(null);
    if (isHoldingPinch) {
      setIsHoldingPinch(false);
      onPinchHoldChange(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on overlaid controls
    if ((e.target as HTMLElement).closest('button')) return;
    setIsHoldingPinch(true);
    onPinchHoldChange(true);
  };

  const handlePointerUp = () => {
    if (isHoldingPinch) {
      setIsHoldingPinch(false);
      onPinchHoldChange(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (frozen) return;
    onDepthDelta(e.deltaY > 0 ? -0.04 : 0.04);
  };

  // Telemetry chip semantic classes
  const latencyChipBorder =
    latencyMs <= 10
      ? 'border-[#10B981]/50 text-[#10B981]'
      : latencyMs <= 15
        ? 'border-[#F59E0B]/50 text-[#F59E0B]'
        : 'border-[#EF4444]/50 text-[#EF4444]';

  const fpsChipBorder =
    fps >= 58
      ? 'border-[#06D6F0]/50 text-[#06D6F0]'
      : fps >= 40
        ? 'border-[#F59E0B]/50 text-[#F59E0B]'
        : 'border-[#EF4444]/50 text-[#EF4444]';

  const diagChipStyle =
    diagnosticState === 'nominal'
      ? 'border-[#10B981]/50 text-[#10B981]'
      : diagnosticState === 'occluded'
        ? 'border-[#F59E0B]/50 text-[#F59E0B]'
        : 'border-[#EF4444]/55 text-[#EF4444]';

  const diagLabel =
    diagnosticState === 'nominal'
      ? 'NOMINAL LOCK'
      : diagnosticState === 'occluded'
        ? 'OCCLUSION WARN'
        : 'TRACKING LOST';

  return (
    <div className="flex flex-col gap-4">
      {/* Main Engineered Display Fixture (rounded-xl = 1.5rem) */}
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="relative aspect-[16/10] min-h-[380px] w-full overflow-hidden rounded-3xl bg-[#080e1d] border border-[#06D6F0]/20 cursor-crosshair select-none shadow-[0_0_40px_rgba(8,14,29,0.9)]"
      >
        {/* Optional live webcam feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover scale-x-[-1] transition-opacity duration-300 ${
            cameraActive && videoStream ? 'opacity-65' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Ambient radial optical vignette for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 48%, rgba(37,99,235,0.12) 0%, rgba(11,17,32,0.55) 55%, rgba(8,14,29,0.92) 100%)',
          }}
        />

        {/* Capture snapshot flash feedback */}
        {captureFlash && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 bg-[#06D6F0]/20 transition-opacity duration-200"
          />
        )}

        {/* Persistent Upper Coordinate Boundary Status Bar */}
        <div className="absolute inset-x-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3.5 py-2 hud-overlay">
          <div className="flex flex-wrap items-center gap-2">
            {/* HUD Telemetry Chip: FPS */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full bg-[#16233B]/80 px-2.5 py-1 font-mono text-xs tabular-nums border ${fpsChipBorder}`}
            >
              <span className="text-[#94A3B8]">FPS</span>
              <span className="font-semibold">{fps.toFixed(1)}</span>
            </div>

            {/* HUD Telemetry Chip: Latency */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full bg-[#16233B]/80 px-2.5 py-1 font-mono text-xs tabular-nums border ${latencyChipBorder}`}
            >
              <span className="text-[#94A3B8]">LAT</span>
              <span className="font-semibold">{latencyMs.toFixed(1)}ms</span>
            </div>

            {/* HUD Telemetry Chip: Confidence */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full bg-[#16233B]/80 px-2.5 py-1 font-mono text-xs tabular-nums border ${
                confidence >= calibration.minConfidenceCutoff * 100
                  ? 'border-[#06D6F0]/40 text-white'
                  : 'border-[#F59E0B]/50 text-[#F59E0B]'
              }`}
            >
              <span className="text-[#94A3B8]">CONF</span>
              <span className="font-semibold">{confidence.toFixed(1)}%</span>
            </div>

            {/* HUD Telemetry Chip: Tracking State */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full bg-[#16233B]/80 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider border ${diagChipStyle}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  diagnosticState === 'nominal'
                    ? 'bg-[#10B981]'
                    : diagnosticState === 'occluded'
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#EF4444]'
                }`}
                aria-hidden="true"
              />
              <span>{diagLabel}</span>
            </div>
          </div>

          {/* Right coordinates & source info */}
          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-[#94A3B8] tabular-nums">
            <span>
              {cameraActive && videoStream ? 'OPTICAL CAM + MESH' : 'SYNTHETIC KINEMATICS'}
            </span>
            <span aria-hidden="true" className="text-[#434655]">
              /
            </span>
            <span>
              {cursorCoords
                ? `X:${cursorCoords.x.toFixed(2)} Y:${cursorCoords.y.toFixed(2)}`
                : 'MOVE TO STEER · HOLD TO PINCH'}
            </span>
          </div>
        </div>

        {/* Camera permission error banner (non-blocking) */}
        {cameraError && (
          <div className="absolute left-3 right-3 top-16 z-20 flex items-center gap-2 rounded-xl border border-[#F59E0B]/40 bg-[#16233B]/90 px-3.5 py-2 text-xs text-[#F59E0B] backdrop-blur-md">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{cameraError} Continuing with interactive synthetic hand kinematics.</span>
          </div>
        )}

        {/* Primary SVG Skeletal Vision Overlay (1000 x 600 logical coordinate space) */}
        <svg
          viewBox="0 0 1000 600"
          className="absolute inset-0 z-10 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="Real-time 21-landmark spatial hand tracking overlay"
        >
          <defs>
            <filter id="cyanGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="violetGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="boneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#06D6F0" />
            </linearGradient>
          </defs>

          {/* Layer: Calibrated Optical Grid */}
          {layers.opticalGrid && (
            <g stroke="rgba(148,163,184,0.09)" strokeWidth="1">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
                <line key={`vx-${x}`} x1={x} y1={0} x2={x} y2={600} />
              ))}
              {[100, 200, 300, 400, 500].map((y) => (
                <line key={`hy-${y}`} x1={0} y1={y} x2={1000} y2={y} />
              ))}
              {/* Center spatial optical calibration reticle */}
              <circle
                cx="500"
                cy="310"
                r="140"
                fill="none"
                stroke="rgba(6,214,240,0.09)"
                strokeDasharray="6 6"
              />
              <circle
                cx="500"
                cy="310"
                r="230"
                fill="none"
                stroke="rgba(37,99,235,0.08)"
              />
              <line
                x1="485"
                y1="310"
                x2="515"
                y2="310"
                stroke="rgba(6,214,240,0.22)"
              />
              <line
                x1="500"
                y1="295"
                x2="500"
                y2="325"
                stroke="rgba(6,214,240,0.22)"
              />
            </g>
          )}

          {/* Layer: Dominant Electric Blue Bounding Envelope */}
          {layers.boundingBox && diagnosticState !== 'lost' && (
            <g>
              <rect
                x={bx * 1000}
                y={by * 600}
                width={bw * 1000}
                height={bh * 600}
                rx="12"
                fill="rgba(37, 99, 235, 0.04)"
                stroke={
                  diagnosticState === 'occluded'
                    ? 'rgba(245, 158, 11, 0.45)'
                    : 'rgba(37, 99, 235, 0.48)'
                }
                strokeWidth="1"
                strokeDasharray="6 4"
              />
              {/* Precision corner brackets */}
              {[
                // Top-left
                `M ${bx * 1000} ${by * 600 + 18} L ${bx * 1000} ${by * 600} L ${bx * 1000 + 18} ${by * 600}`,
                // Top-right
                `M ${(bx + bw) * 1000 - 18} ${by * 600} L ${(bx + bw) * 1000} ${by * 600} L ${(bx + bw) * 1000} ${by * 600 + 18}`,
                // Bottom-left
                `M ${bx * 1000} ${(by + bh) * 600 - 18} L ${bx * 1000} ${(by + bh) * 600} L ${bx * 1000 + 18} ${(by + bh) * 600}`,
                // Bottom-right
                `M ${(bx + bw) * 1000 - 18} ${(by + bh) * 600} L ${(bx + bw) * 1000} ${(by + bh) * 600} L ${(bx + bw) * 1000} ${(by + bh) * 600 - 18}`,
              ].map((d, idx) => (
                <path
                  key={idx}
                  d={d}
                  fill="none"
                  stroke={diagnosticState === 'occluded' ? '#F59E0B' : '#06D6F0'}
                  strokeWidth="2.2"
                />
              ))}

              {/* Bounding box label */}
              <g transform={`translate(${bx * 1000}, ${Math.max(76, by * 600 - 10)})`}>
                <rect
                  x="0"
                  y="-17"
                  width="196"
                  height="20"
                  rx="4"
                  fill="rgba(11,17,32,0.85)"
                  stroke="rgba(6,214,240,0.3)"
                  strokeWidth="0.75"
                />
                <text
                  x="8"
                  y="-4"
                  className="fill-[#06D6F0] font-mono text-[10.5px] font-semibold tracking-wider"
                >
                  {GESTURE_LABELS[isPinchActive ? 'precision_pinch' : activeGesture].toUpperCase()} · {confidence.toFixed(1)}%
                </text>
              </g>
            </g>
          )}

          {/* Layer: Skeletal Mesh (1.5px electric blue bones + 4px neon cyan joints) */}
          {layers.skeleton && (
            <g
              opacity={
                diagnosticState === 'lost'
                  ? 0.25
                  : diagnosticState === 'occluded'
                    ? 0.78
                    : 1
              }
            >
              {/* Inter-bone vectors: 1.5px electric blue (#2563EB) */}
              {HAND_CONNECTIONS.map(([a, b]) => {
                const lmA = landmarks[a];
                const lmB = landmarks[b];
                if (!lmA || !lmB) return null;
                const avgConf = (lmA.confidence + lmB.confidence) / 2;
                const strokeColor =
                  diagnosticState === 'lost'
                    ? '#EF4444'
                    : avgConf < 0.7
                      ? '#F59E0B'
                      : '#2563EB';
                return (
                  <g key={`bone-${a}-${b}`}>
                    {/* Outer subtle glow vector */}
                    <line
                      x1={lmA.x * 1000}
                      y1={lmA.y * 600}
                      x2={lmB.x * 1000}
                      y2={lmB.y * 600}
                      stroke={strokeColor}
                      strokeWidth="4"
                      strokeOpacity="0.22"
                      strokeLinecap="round"
                    />
                    {/* Core 1.5px bone vector */}
                    <line
                      x1={lmA.x * 1000}
                      y1={lmA.y * 600}
                      x2={lmB.x * 1000}
                      y2={lmB.y * 600}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* Pinch distance vector between thumb tip (#4) and index tip (#8) */}
              {thumbTip && indexTip && diagnosticState !== 'lost' && (
                <g>
                  <line
                    x1={thumbTip.x * 1000}
                    y1={thumbTip.y * 600}
                    x2={indexTip.x * 1000}
                    y2={indexTip.y * 600}
                    stroke={isPinchActive ? '#8B5CF6' : 'rgba(6,214,240,0.45)'}
                    strokeWidth={isPinchActive ? '2' : '1'}
                    strokeDasharray={isPinchActive ? undefined : '4 3'}
                  />
                  <g transform={`translate(${pinchMidX + 14}, ${pinchMidY - 8})`}>
                    <rect
                      x="0"
                      y="-13"
                      width="76"
                      height="18"
                      rx="9"
                      fill="rgba(22,35,59,0.88)"
                      stroke={isPinchActive ? '#8B5CF6' : 'rgba(6,214,240,0.35)'}
                      strokeWidth="1"
                    />
                    <text
                      x="38"
                      y="-1"
                      textAnchor="middle"
                      className={`font-mono text-[10px] font-semibold ${
                        isPinchActive ? 'fill-[#d0bcff]' : 'fill-[#86ecff]'
                      }`}
                    >
                      {pinchApertureMm.toFixed(1)} mm
                    </text>
                  </g>
                </g>
              )}

              {/* Active Pinch Concentric Violet Pulse (#8B5CF6) */}
              {isPinchActive && (
                <g
                  transform={`translate(${pinchMidX}, ${pinchMidY})`}
                  filter="url(#violetGlow)"
                >
                  <circle
                    r="16"
                    fill="rgba(139, 92, 246, 0.16)"
                    stroke="#8B5CF6"
                    strokeWidth="1.5"
                    className="animate-pinch-ripple origin-center"
                  />
                  <circle
                    r="10"
                    fill="rgba(139, 92, 246, 0.28)"
                    stroke="#d0bcff"
                    strokeWidth="1.2"
                  />
                  <circle r="3.5" fill="#FFFFFF" />
                </g>
              )}

              {/* 21 Joint Anchor Points (4px neon cyan #06D6F0) */}
              {landmarks.map((lm) => {
                const cx = lm.x * 1000;
                const cy = lm.y * 600;
                const isTip = [4, 8, 12, 16, 20].includes(lm.id);
                const isSelected = selectedLandmarkId === lm.id;
                const jointColor =
                  diagnosticState === 'lost'
                    ? '#EF4444'
                    : lm.confidence < 0.7
                      ? '#F59E0B'
                      : '#06D6F0';

                return (
                  <g
                    key={lm.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLandmarkId(isSelected ? null : lm.id);
                    }}
                  >
                    {/* Invisible generous click hit target */}
                    <circle cx={cx} cy={cy} r="12" fill="transparent" />

                    {/* Outer aura calibrated to model confidence */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isTip ? 7.5 : 5.5}
                      fill={jointColor}
                      fillOpacity={0.14 * lm.confidence}
                    />

                    {/* 4px anchor point */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 5 : 4}
                      fill={jointColor}
                      stroke="#0B1120"
                      strokeWidth="1.2"
                      filter="url(#cyanGlow)"
                    />

                    {/* Optional depth Z-vectors on fingertips */}
                    {layers.depthVectors && isTip && (
                      <g transform={`translate(${cx + 10}, ${cy + 4})`}>
                        <line
                          x1="-6"
                          y1="-4"
                          x2="0"
                          y2="-4"
                          stroke="rgba(6,214,240,0.4)"
                          strokeWidth="1"
                        />
                        <text className="fill-[#94A3B8] font-mono text-[9.5px]">
                          z:{lm.z >= 0 ? '+' : ''}
                          {(lm.z * 100).toFixed(1)}cm
                        </text>
                      </g>
                    )}

                    {/* Optional joint index numbers */}
                    {layers.jointIndices && (
                      <text
                        x={cx}
                        y={cy - 9}
                        textAnchor="middle"
                        className="fill-[#dde2f8] font-mono text-[9px] font-semibold"
                      >
                        {lm.id}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Layer 3 Active Focus Reticle on Selected Landmark */}
              {selectedLm && (
                <g
                  transform={`translate(${selectedLm.x * 1000}, ${selectedLm.y * 600})`}
                  pointerEvents="none"
                >
                  <circle
                    r="18"
                    fill="none"
                    stroke="#06D6F0"
                    strokeWidth="1.4"
                    strokeDasharray="5 3"
                    filter="url(#cyanGlow)"
                  />
                  <line x1="-24" y1="0" x2="-13" y2="0" stroke="#06D6F0" strokeWidth="1.2" />
                  <line x1="13" y1="0" x2="24" y2="0" stroke="#06D6F0" strokeWidth="1.2" />
                  <line x1="0" y1="-24" x2="0" y2="-13" stroke="#06D6F0" strokeWidth="1.2" />
                  <line x1="0" y1="13" x2="0" y2="24" stroke="#06D6F0" strokeWidth="1.2" />
                  <g transform="translate(22, -26)">
                    <rect
                      x="0"
                      y="0"
                      width="148"
                      height="36"
                      rx="8"
                      fill="rgba(22,35,59,0.92)"
                      stroke="rgba(6,214,240,0.45)"
                      strokeWidth="1"
                    />
                    <text
                      x="8"
                      y="14"
                      className="fill-[#06D6F0] font-mono text-[9.5px] font-semibold"
                    >
                      #{selectedLm.id} {selectedLm.name}
                    </text>
                    <text
                      x="8"
                      y="28"
                      className="fill-[#dde2f8] font-mono text-[9.5px]"
                    >
                      {selectedLm.x.toFixed(3)}, {selectedLm.y.toFixed(3)}, {selectedLm.z.toFixed(3)}
                    </text>
                  </g>
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Tracking Lost Center Diagnostic Overlay */}
        {diagnosticState === 'lost' && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="rounded-2xl border border-[#EF4444]/45 bg-[#0B1120]/85 px-6 py-4 text-center backdrop-blur-md">
              <p className="font-mono text-xs font-semibold tracking-widest text-[#EF4444]">
                CRITICAL · TRACKING LOCK LOST
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Confidence dropped below {(calibration.minConfidenceCutoff * 100).toFixed(0)}% cutoff. Re-acquiring palm ROI.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Floating HUD Control Dock */}
        <div className="absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2 hud-overlay">
          {/* Layer visibility toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: 'skeleton', label: 'Mesh', icon: Layers },
                { key: 'boundingBox', label: 'Bounds', icon: Scan },
                { key: 'depthVectors', label: 'Z-Depth', icon: Focus },
                { key: 'opticalGrid', label: 'Grid', icon: Grid3X3 },
                { key: 'jointIndices', label: 'IDs', icon: Crosshair },
              ] as const
            ).map(({ key, label, icon: Icon }) => {
              const active = layers[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleLayer(key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#2563EB]/25 text-[#86ecff] border border-[#06D6F0]/40'
                      : 'bg-[#0B1120]/60 text-[#94A3B8] border border-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Freeze & Capture actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFrozen}
              className="btn-cyber-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0"
            >
              {frozen ? (
                <>
                  <Play className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 text-[#06D6F0]" aria-hidden="true" />
                  <span>Freeze</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCaptureFrame}
              className="btn-cyber-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Capture Frame</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kinematic Pose Preset Bar + Diagnostic State Fault Injector */}
      <div className="hud-panel rounded-2xl p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-[#06D6F0]" aria-hidden="true" />
            <span className="label-caps text-[#94A3B8]">Kinematic Pose Target</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {GESTURE_ORDER.map((g) => {
              const active = activeGesture === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => onSelectGesture(g)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#2563EB] text-white shadow-[0_0_16px_rgba(37,99,235,0.45)] border border-[#06D6F0]/40'
                      : 'bg-[#0B1120]/70 text-[#94A3B8] border border-white/[0.06] hover:border-[#06D6F0]/40 hover:text-white'
                  }`}
                >
                  {GESTURE_LABELS[g]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px w-full bg-white/[0.06] lg:h-10 lg:w-px" />

        <div className="space-y-2">
          <span className="label-caps block text-[#94A3B8]">Diagnostic Pipeline State</span>
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'nominal', label: 'Nominal', activeClass: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50' },
                { id: 'occluded', label: 'Occlusion', activeClass: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50' },
                { id: 'lost', label: 'Tracking Loss', activeClass: 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectDiagnosticState(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  diagnosticState === opt.id
                    ? opt.activeClass
                    : 'bg-[#0B1120]/70 text-[#94A3B8] border-white/[0.06] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
