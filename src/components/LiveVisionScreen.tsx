import { useMemo, useState } from 'react';
import {
  CalibrationParams,
  DiagnosticState,
  GestureBinding,
  GestureId,
  HardwareBackend,
  Landmark3D,
  ModelVariant,
  TelemetrySample,
  ViewportLayers,
} from '../types/hud';
import { GESTURE_LABELS } from '../utils/handKinematics';
import { HandViewport } from './HandViewport';
import { LatencyChart } from './LatencyChart';

interface LiveVisionScreenProps {
  landmarks: Landmark3D[];
  activeGesture: GestureId;
  onSelectGesture: (g: GestureId) => void;
  gestureProbabilities: Record<GestureId, number>;
  diagnosticState: DiagnosticState;
  onSelectDiagnosticState: (s: DiagnosticState) => void;
  fps: number;
  latencyMs: number;
  confidence: number;
  pinchApertureMm: number;
  telemetryHistory: TelemetrySample[];
  calibration: CalibrationParams;
  activeModel: ModelVariant;
  backend: HardwareBackend;
  bindings: GestureBinding[];
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

const FINGER_FILTERS: Array<{ id: 'all' | Landmark3D['finger']; label: string }> = [
  { id: 'all', label: 'All (21)' },
  { id: 'thumb', label: 'Thumb' },
  { id: 'index', label: 'Index' },
  { id: 'middle', label: 'Middle' },
  { id: 'ring', label: 'Ring' },
  { id: 'pinky', label: 'Pinky' },
];

export function LiveVisionScreen({
  landmarks,
  activeGesture,
  onSelectGesture,
  gestureProbabilities,
  diagnosticState,
  onSelectDiagnosticState,
  fps,
  latencyMs,
  confidence,
  pinchApertureMm,
  telemetryHistory,
  calibration,
  activeModel,
  backend,
  bindings,
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
}: LiveVisionScreenProps) {
  const [fingerFilter, setFingerFilter] = useState<'all' | Landmark3D['finger']>('all');

  const filteredLandmarks = useMemo(() => {
    if (fingerFilter === 'all') return landmarks;
    return landmarks.filter((lm) => lm.finger === fingerFilter);
  }, [landmarks, fingerFilter]);

  // Identify highest-confidence active gesture & its bound spatial action
  const sortedGestures = useMemo(() => {
    return (Object.entries(gestureProbabilities) as Array<[GestureId, number]>).sort(
      (a, b) => b[1] - a[1]
    );
  }, [gestureProbabilities]);

  const topGesture = sortedGestures[0]?.[0] ?? activeGesture;
  const matchedBinding = bindings.find(
    (b) => b.enabled && b.gesture === topGesture && confidence / 100 >= b.minConfidence
  );

  const wrist = landmarks[0];
  const palmDepthCm = wrist ? Math.abs(42 + wrist.z * 100) : 42;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Primary 70% Vision Pipeline Column */}
      <section className="lg:col-span-8 flex flex-col gap-6" aria-label="Vision Pipeline Viewport">
        <HandViewport
          landmarks={landmarks}
          activeGesture={activeGesture}
          onSelectGesture={onSelectGesture}
          diagnosticState={diagnosticState}
          onSelectDiagnosticState={onSelectDiagnosticState}
          fps={fps}
          latencyMs={latencyMs}
          confidence={confidence}
          pinchApertureMm={pinchApertureMm}
          calibration={calibration}
          selectedLandmarkId={selectedLandmarkId}
          onSelectLandmarkId={onSelectLandmarkId}
          layers={layers}
          onToggleLayer={onToggleLayer}
          frozen={frozen}
          onToggleFrozen={onToggleFrozen}
          cameraActive={cameraActive}
          cameraError={cameraError}
          videoStream={videoStream}
          onPointerPoseChange={onPointerPoseChange}
          onPinchHoldChange={onPinchHoldChange}
          onDepthDelta={onDepthDelta}
          onCaptureFrame={onCaptureFrame}
          captureFlash={captureFlash}
        />

        {/* Single-Elevation 4-Metric Optical Telemetry Strip */}
        <div className="hud-panel rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
          <div className="p-4 sm:p-5">
            <p className="label-caps text-[#64748B]">Pinch Aperture</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-semibold text-white tabular-nums">
                {pinchApertureMm.toFixed(1)}
              </span>
              <span className="font-mono text-xs text-[#94A3B8]">mm</span>
            </div>
            <p className="mt-1 text-xs font-mono tabular-nums text-[#94A3B8]">
              {pinchApertureMm <= calibration.pinchThresholdMm ? (
                <span className="text-[#d0bcff]">Actuated · &le; {calibration.pinchThresholdMm.toFixed(1)} mm</span>
              ) : (
                <span>Threshold {calibration.pinchThresholdMm.toFixed(1)} mm</span>
              )}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="label-caps text-[#64748B]">Metric Depth (Z)</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-semibold text-white tabular-nums">
                {palmDepthCm.toFixed(1)}
              </span>
              <span className="font-mono text-xs text-[#94A3B8]">cm</span>
            </div>
            <p className="mt-1 text-xs text-[#94A3B8]">Scroll viewport to adjust Z</p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="label-caps text-[#64748B]">Active Backbone</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-sans text-lg font-semibold text-white truncate">
                {activeModel.name.replace('Kinetix ', '')}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-[#86ecff] tabular-nums">
              {backend} · {activeModel.parameters}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="label-caps text-[#64748B]">Spatial Action Bus</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-sans text-sm font-semibold text-white truncate">
                {matchedBinding ? matchedBinding.actionName : 'Idle / Standby'}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-[#d0bcff] truncate">
              {matchedBinding ? matchedBinding.targetChannel : 'No binding triggered'}
            </p>
          </div>
        </div>
      </section>

      {/* Lateral 30% Diagnostic & Telemetry Column */}
      <aside className="lg:col-span-4 flex flex-col gap-6" aria-label="Diagnostic Telemetry Feed">
        {/* Module 1: Gesture Classifier & Segmented Confidence Bars */}
        <div className="hud-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">Gesture Inference</h2>
              <p className="text-xs text-[#94A3B8]">
                Softmax probabilities · cutoff {(calibration.minConfidenceCutoff * 100).toFixed(0)}%
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-[#d0bcff]">
              {GESTURE_LABELS[topGesture]}
            </span>
          </div>

          <div className="space-y-3">
            {sortedGestures.map(([gestureId, prob]) => {
              const pct = prob * 100;
              const isPrimary = gestureId === topGesture && diagnosticState !== 'lost';
              const isWarning = isPrimary && diagnosticState === 'occluded';
              return (
                <button
                  key={gestureId}
                  type="button"
                  onClick={() => onSelectGesture(gestureId)}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#06D6F0] rounded-md"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span
                      className={`font-medium transition-colors ${
                        isPrimary
                          ? 'text-white'
                          : 'text-[#94A3B8] group-hover:text-[#dde2f8]'
                      }`}
                    >
                      {GESTURE_LABELS[gestureId]}
                    </span>
                    <span
                      className={`font-mono tabular-nums ${
                        isWarning
                          ? 'text-[#F59E0B]'
                          : isPrimary
                            ? 'text-[#06D6F0] font-semibold'
                            : 'text-[#64748B]'
                      }`}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  {/* Segmented Linear Gauge */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full transition-all duration-150"
                      style={{
                        width: `${Math.min(100, Math.max(1.5, pct))}%`,
                        background: isWarning
                          ? 'linear-gradient(90deg, #F59E0B 0%, #fbbf24 100%)'
                          : isPrimary
                            ? 'linear-gradient(90deg, #06D6F0 0%, #10B981 100%)'
                            : 'rgba(139, 92, 246, 0.45)',
                      }}
                    />
                    {/* Subtle segmented calibration ticks */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 flex justify-between px-[20%]"
                    >
                      <span className="h-full w-px bg-[#0B1120]/70" />
                      <span className="h-full w-px bg-[#0B1120]/70" />
                      <span className="h-full w-px bg-[#0B1120]/70" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Module 2: Low-Latency Pipeline Telemetry Chart */}
        <div className="hud-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Pipeline Latency</h2>
            <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
              {frozen ? 'PAUSED' : 'LIVE STREAM'}
            </span>
          </div>
          <LatencyChart samples={telemetryHistory} />
        </div>

        {/* Module 3: 21-Landmark Cartesian Coordinate Table */}
        <div className="hud-panel rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">Landmark Telemetry</h2>
              <p className="text-xs text-[#94A3B8]">
                Select any joint to lock viewport reticle
              </p>
            </div>
            {selectedLandmarkId !== null && (
              <button
                type="button"
                onClick={() => onSelectLandmarkId(null)}
                className="font-mono text-xs text-[#06D6F0] hover:underline whitespace-nowrap shrink-0"
              >
                Clear Lock
              </button>
            )}
          </div>

          {/* Interactive Finger Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#080e1d] p-1 border border-white/[0.06]">
            {FINGER_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFingerFilter(f.id)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  fingerFilter === f.id
                    ? 'bg-[#16233B] text-[#06D6F0]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tabular Cartesian Table */}
          <div className="max-h-64 overflow-y-auto -mx-1 px-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#131e33] z-10">
                <tr className="border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  <th className="py-2 pl-2 font-semibold">Joint</th>
                  <th className="py-2 text-right font-semibold">X</th>
                  <th className="py-2 text-right font-semibold">Y</th>
                  <th className="py-2 text-right font-semibold">Z (m)</th>
                  <th className="py-2 pr-2 text-right font-semibold">Conf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono text-xs tabular-nums">
                {filteredLandmarks.map((lm) => {
                  const isSelected = selectedLandmarkId === lm.id;
                  return (
                    <tr
                      key={lm.id}
                      onClick={() =>
                        onSelectLandmarkId(isSelected ? null : lm.id)
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#2563EB]/25 text-white'
                          : 'text-[#c3c6d7] hover:bg-white/[0.04]'
                      }`}
                    >
                      <td className="py-1.5 pl-2 whitespace-nowrap">
                        <span className="text-[#64748B] mr-1.5">
                          {String(lm.id).padStart(2, '0')}
                        </span>
                        <span className={isSelected ? 'text-[#06D6F0] font-semibold' : ''}>
                          {lm.name}
                        </span>
                      </td>
                      <td className="py-1.5 text-right">{lm.x.toFixed(3)}</td>
                      <td className="py-1.5 text-right">{lm.y.toFixed(3)}</td>
                      <td className="py-1.5 text-right text-[#94A3B8]">
                        {lm.z >= 0 ? '+' : ''}
                        {lm.z.toFixed(3)}
                      </td>
                      <td
                        className={`py-1.5 pr-2 text-right ${
                          lm.confidence >= 0.85
                            ? 'text-[#10B981]'
                            : lm.confidence >= 0.65
                              ? 'text-[#F59E0B]'
                              : 'text-[#EF4444]'
                        }`}
                      >
                        {(lm.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </aside>
    </div>
  );
}
