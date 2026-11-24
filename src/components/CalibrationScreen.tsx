import { useState } from 'react';
import { Plus, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { CalibrationParams, GestureBinding, GestureId } from '../types/hud';
import { DEFAULT_CALIBRATION } from '../data/initialData';
import { GESTURE_LABELS } from '../utils/handKinematics';

interface CalibrationScreenProps {
  calibration: CalibrationParams;
  onUpdateCalibration: (next: CalibrationParams) => void;
  bindings: GestureBinding[];
  onToggleBinding: (id: string) => void;
  onDeleteBinding: (id: string) => void;
  onAddBinding: (binding: Omit<GestureBinding, 'id'>) => void;
  livePinchMm: number;
  liveConfidence: number;
}

export function CalibrationScreen({
  calibration,
  onUpdateCalibration,
  bindings,
  onToggleBinding,
  onDeleteBinding,
  onAddBinding,
  livePinchMm,
  liveConfidence,
}: CalibrationScreenProps) {
  const [newGesture, setNewGesture] = useState<GestureId>('precision_pinch');
  const [newAction, setNewAction] = useState('');
  const [newChannel, setNewChannel] = useState('');
  const [newConfidence, setNewConfidence] = useState(0.85);
  const [newHoldMs, setNewHoldMs] = useState(75);
  const [testPinchActive, setTestPinchActive] = useState(false);

  // Normalized 6-axis spider chart metrics (0.15..1.0)
  const axes = [
    {
      label: 'PINCH SENS',
      value: 1 - (calibration.pinchThresholdMm - 10) / 30,
      bound: `${calibration.pinchThresholdMm.toFixed(1)}mm`,
    },
    {
      label: 'SMOOTHING',
      value: calibration.smoothingFactor,
      bound: `${(calibration.smoothingFactor * 100).toFixed(0)}%`,
    },
    {
      label: 'DEPTH GAIN',
      value: (calibration.depthSensitivity - 0.5) / 1.5,
      bound: `${calibration.depthSensitivity.toFixed(2)}x`,
    },
    {
      label: 'DAMPENING',
      value: calibration.velocityDampening,
      bound: `${(calibration.velocityDampening * 100).toFixed(0)}%`,
    },
    {
      label: 'RECOVERY',
      value: 1 - (calibration.occlusionRecoveryMs - 40) / 260,
      bound: `${calibration.occlusionRecoveryMs}ms`,
    },
    {
      label: 'ANGULAR TOL',
      value: (calibration.angularToleranceDeg - 5) / 40,
      bound: `${calibration.angularToleranceDeg}°`,
    },
  ];

  const cx = 170;
  const cy = 148;
  const radius = 98;

  const getVertex = (index: number, rFactor: number) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius * rFactor,
      y: cy + Math.sin(angle) * radius * rFactor,
    };
  };

  const polygonPoints = axes
    .map((axis, i) => {
      const clamped = Math.min(1, Math.max(0.12, axis.value));
      const pt = getVertex(i, clamped);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAction = newAction.trim();
    const trimmedChannel = newChannel.trim();
    if (!trimmedAction || !trimmedChannel) return;

    onAddBinding({
      gesture: newGesture,
      gestureLabel: GESTURE_LABELS[newGesture],
      actionName: trimmedAction,
      targetChannel: trimmedChannel,
      minConfidence: newConfidence,
      holdDurationMs: newHoldMs,
      enabled: true,
    });
    setNewAction('');
    setNewChannel('');
  };

  const simulatedTestAperture = testPinchActive ? 11.4 : livePinchMm;
  const passesThreshold = simulatedTestAperture <= calibration.pinchThresholdMm;

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Gesture Calibration & Spatial Bindings
          </h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Tune One-Euro kinematic filters, pinch actuation thresholds, and downstream spatial channels in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onUpdateCalibration(DEFAULT_CALIBRATION)}
          className="btn-cyber-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Main 12-column Calibration Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left 5 cols: Spider Calibration Envelope + Live Verification Pad */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="hud-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Kinematic Response Envelope
              </h2>
              <span className="label-caps text-[#06D6F0]">6-Axis Profile</span>
            </div>

            <div className="flex items-center justify-center rounded-xl bg-[#080e1d]/90 border border-white/[0.06] py-3">
              <svg
                viewBox="0 0 340 296"
                className="h-64 w-full max-w-[340px]"
                role="img"
                aria-label="Six-axis kinematic calibration radar chart"
              >
                {/* Concentric polygonal rings */}
                {[0.25, 0.5, 0.75, 1].map((ring) => {
                  const pts = axes
                    .map((_, i) => {
                      const pt = getVertex(i, ring);
                      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={ring}
                      points={pts}
                      fill="none"
                      stroke="rgba(148,163,184,0.14)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Radial axes and labels */}
                {axes.map((axis, i) => {
                  const outer = getVertex(i, 1);
                  const labelPt = getVertex(i, 1.24);
                  return (
                    <g key={axis.label}>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={outer.x}
                        y2={outer.y}
                        stroke="rgba(148,163,184,0.16)"
                        strokeWidth="1"
                      />
                      <text
                        x={labelPt.x}
                        y={labelPt.y - 3}
                        textAnchor="middle"
                        className="fill-[#94A3B8] font-mono text-[8.5px] font-semibold"
                      >
                        {axis.label}
                      </text>
                      <text
                        x={labelPt.x}
                        y={labelPt.y + 8}
                        textAnchor="middle"
                        className="fill-[#06D6F0] font-mono text-[9px]"
                      >
                        {axis.bound}
                      </text>
                    </g>
                  );
                })}

                {/* Active profile polygon */}
                <polygon
                  points={polygonPoints}
                  fill="rgba(6, 214, 240, 0.18)"
                  stroke="#06D6F0"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Vertex markers */}
                {axes.map((axis, i) => {
                  const pt = getVertex(i, Math.min(1, Math.max(0.12, axis.value)));
                  return (
                    <circle
                      key={`v-${axis.label}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="3.5"
                      fill="#06D6F0"
                      stroke="#0B1120"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Interactive Threshold Verification Pad */}
          <div className="hud-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Actuation Verification Pad
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Hold button to simulate thumb-index contact against current cutoff
                </p>
              </div>
              <span
                className={`font-mono text-xs font-semibold ${
                  passesThreshold ? 'text-[#10B981]' : 'text-[#94A3B8]'
                }`}
              >
                {passesThreshold ? 'TRIGGERED' : 'OPEN'}
              </span>
            </div>

            <button
              type="button"
              onPointerDown={() => setTestPinchActive(true)}
              onPointerUp={() => setTestPinchActive(false)}
              onPointerLeave={() => setTestPinchActive(false)}
              className={`relative flex w-full flex-col items-center justify-center rounded-xl border py-7 transition-all select-none ${
                passesThreshold
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 shadow-[0_0_24px_rgba(139,92,246,0.3)]'
                  : 'border-[#06D6F0]/25 bg-[#080e1d]/80 hover:border-[#06D6F0]/55'
              }`}
            >
              <span className="font-mono text-2xl font-semibold text-white tabular-nums">
                {simulatedTestAperture.toFixed(1)} mm
              </span>
              <span className="mt-1 font-mono text-xs text-[#94A3B8] tabular-nums">
                Cutoff &le; {calibration.pinchThresholdMm.toFixed(1)} mm · Live Conf{' '}
                {liveConfidence.toFixed(1)}%
              </span>
              <span className="mt-3 text-xs font-medium text-[#86ecff]">
                {testPinchActive
                  ? 'Pinch Contact Locked — Dispatching Spatial Grab'
                  : 'Press & Hold to Verify Pinch Threshold'}
              </span>
            </button>
          </div>
        </div>

        {/* Right 7 cols: Parameter Sliders + Spatial Binding Table */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Precision Parameter Wells */}
          <div className="hud-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-white">
                Filter & Kinematic Parameters
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Changes immediately apply to the live tracking pipeline on Screen 1.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {(
                [
                  {
                    key: 'pinchThresholdMm',
                    label: 'Pinch Actuation Threshold',
                    unit: 'mm',
                    min: 10,
                    max: 40,
                    step: 0.5,
                    format: (v: number) => v.toFixed(1),
                  },
                  {
                    key: 'smoothingFactor',
                    label: 'One-Euro Smoothing (α)',
                    unit: '',
                    min: 0.1,
                    max: 0.95,
                    step: 0.01,
                    format: (v: number) => v.toFixed(2),
                  },
                  {
                    key: 'depthSensitivity',
                    label: 'Z-Axis Depth Gain',
                    unit: 'x',
                    min: 0.5,
                    max: 2.0,
                    step: 0.05,
                    format: (v: number) => v.toFixed(2),
                  },
                  {
                    key: 'velocityDampening',
                    label: 'Velocity Dampening',
                    unit: '',
                    min: 0.1,
                    max: 0.9,
                    step: 0.02,
                    format: (v: number) => v.toFixed(2),
                  },
                  {
                    key: 'occlusionRecoveryMs',
                    label: 'Occlusion Recovery Window',
                    unit: 'ms',
                    min: 40,
                    max: 300,
                    step: 10,
                    format: (v: number) => v.toFixed(0),
                  },
                  {
                    key: 'minConfidenceCutoff',
                    label: 'Min Confidence Cutoff',
                    unit: '%',
                    min: 0.5,
                    max: 0.95,
                    step: 0.01,
                    format: (v: number) => (v * 100).toFixed(0),
                  },
                ] as const
              ).map((field) => {
                const value = calibration[field.key];
                return (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`param-${field.key}`}
                        className="text-xs font-medium text-[#dde2f8]"
                      >
                        {field.label}
                      </label>
                      <span className="font-mono text-xs font-semibold text-[#06D6F0] tabular-nums">
                        {field.format(value)}
                        {field.unit ? ` ${field.unit}` : ''}
                      </span>
                    </div>
                    <input
                      id={`param-${field.key}`}
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={value}
                      onChange={(e) =>
                        onUpdateCalibration({
                          ...calibration,
                          [field.key]: Number(e.target.value),
                        })
                      }
                      className="hud-slider w-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spatial Gesture Binding Table & Creator */}
          <div className="hud-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Gesture-to-Action Bindings
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  {bindings.filter((b) => b.enabled).length} of {bindings.length} channels active
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                    <th className="py-2 pr-3 font-semibold">Gesture</th>
                    <th className="py-2 px-3 font-semibold">Spatial Action</th>
                    <th className="py-2 px-3 font-semibold">Bus Channel</th>
                    <th className="py-2 px-3 text-right font-semibold">Min Conf</th>
                    <th className="py-2 pl-3 text-right font-semibold">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {bindings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 pr-3 font-medium text-white whitespace-nowrap">
                        {b.gestureLabel}
                      </td>
                      <td className="py-3 px-3 text-[#dde2f8]">{b.actionName}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#86ecff] whitespace-nowrap">
                        {b.targetChannel}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#94A3B8]">
                        {(b.minConfidence * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleBinding(b.id)}
                            className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-medium border transition-colors ${
                              b.enabled
                                ? 'border-[#10B981]/50 bg-[#10B981]/15 text-[#10B981]'
                                : 'border-white/10 bg-[#0B1120]/70 text-[#64748B] hover:text-white'
                            }`}
                          >
                            {b.enabled ? 'Active' : 'Muted'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBinding(b.id)}
                            aria-label={`Remove ${b.actionName} binding`}
                            className="rounded-md p-1.5 text-[#64748B] transition-colors hover:bg-[#EF4444]/15 hover:text-[#EF4444]"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Binding Form (Dark Input Wells per spec) */}
            <form
              onSubmit={handleAddSubmit}
              className="border-t border-white/[0.06] pt-4 grid grid-cols-1 gap-3 sm:grid-cols-12 items-end"
            >
              <div className="sm:col-span-3 space-y-1.5">
                <label htmlFor="bind-gesture" className="label-caps text-[#94A3B8]">
                  Gesture
                </label>
                <select
                  id="bind-gesture"
                  value={newGesture}
                  onChange={(e) => setNewGesture(e.target.value as GestureId)}
                  className="hud-input w-full rounded-lg px-3 py-2 text-xs"
                >
                  {(Object.keys(GESTURE_LABELS) as GestureId[]).map((g) => (
                    <option key={g} value={g} className="bg-[#0B1120]">
                      {GESTURE_LABELS[g]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 space-y-1.5">
                <label htmlFor="bind-action" className="label-caps text-[#94A3B8]">
                  Action Name
                </label>
                <input
                  id="bind-action"
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="e.g. Zoom Depth Plane"
                  className="hud-input w-full rounded-lg px-3 py-2 text-xs placeholder:text-[#64748B]"
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label htmlFor="bind-channel" className="label-caps text-[#94A3B8]">
                  Bus Channel
                </label>
                <input
                  id="bind-channel"
                  type="text"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  placeholder="spatial.cam.zoom"
                  className="hud-input w-full rounded-lg px-3 py-2 font-mono text-xs placeholder:text-[#64748B]"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={!newAction.trim() || !newChannel.trim()}
                  className="btn-cyber-primary inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add</span>
                </button>
              </div>

              {/* Secondary confidence & hold micro-inputs */}
              <div className="sm:col-span-12 flex flex-wrap items-center gap-6 pt-1 text-xs text-[#94A3B8]">
                <label className="inline-flex items-center gap-2">
                  <span>Min Confidence:</span>
                  <input
                    type="number"
                    min={0.5}
                    max={0.99}
                    step={0.01}
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(Number(e.target.value))}
                    className="hud-input w-20 rounded-md px-2 py-1 font-mono text-xs tabular-nums"
                  />
                </label>
                <label className="inline-flex items-center gap-2">
                  <span>Hold Debounce (ms):</span>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    step={10}
                    value={newHoldMs}
                    onChange={(e) => setNewHoldMs(Number(e.target.value))}
                    className="hud-input w-20 rounded-md px-2 py-1 font-mono text-xs tabular-nums"
                  />
                </label>
                <span className="inline-flex items-center gap-1.5 text-[#10B981]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Synced to Live Bus</span>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
