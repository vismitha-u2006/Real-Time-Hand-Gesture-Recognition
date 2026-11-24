import { useMemo, useState } from 'react';
import { Download, Search, Trash2, Camera } from 'lucide-react';
import { CapturedFrame, DiagnosticState } from '../types/hud';
import { HAND_CONNECTIONS } from '../utils/handKinematics';

interface SessionsScreenProps {
  captures: CapturedFrame[];
  selectedCaptureId: string | null;
  onSelectCaptureId: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDeleteCapture: (id: string) => void;
  onJumpToVision: () => void;
}

const STATE_FILTERS: Array<{ id: 'all' | DiagnosticState; label: string }> = [
  { id: 'all', label: 'All States' },
  { id: 'nominal', label: 'Nominal' },
  { id: 'occluded', label: 'Occlusion' },
  { id: 'lost', label: 'Tracking Loss' },
];

export function SessionsScreen({
  captures,
  selectedCaptureId,
  onSelectCaptureId,
  onUpdateNotes,
  onDeleteCapture,
  onJumpToVision,
}: SessionsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | DiagnosticState>('all');

  const filteredCaptures = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return captures.filter((c) => {
      if (stateFilter !== 'all' && c.diagnosticState !== stateFilter) return false;
      if (!q) return true;
      return (
        c.sessionCode.toLowerCase().includes(q) ||
        c.gestureLabel.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        c.modelId.toLowerCase().includes(q) ||
        c.backend.toLowerCase().includes(q)
      );
    });
  }, [captures, searchQuery, stateFilter]);

  const activeCapture =
    filteredCaptures.find((c) => c.id === selectedCaptureId) ??
    filteredCaptures[0] ??
    null;

  const handleExportJson = (capture: CapturedFrame) => {
    const payload = JSON.stringify(capture, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${capture.sessionCode.toLowerCase()}-${capture.gesture}-telemetry.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const renderStatusText = (state: DiagnosticState) => {
    if (state === 'nominal') {
      return <span className="font-mono text-xs font-semibold text-[#10B981]">Nominal</span>;
    }
    if (state === 'occluded') {
      return <span className="font-mono text-xs font-semibold text-[#F59E0B]">Occlusion</span>;
    }
    return <span className="font-mono text-xs font-semibold text-[#EF4444]">Tracking Loss</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Session Telemetry & Forensic Captures
          </h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Inspect frozen 21-landmark frames captured from the live vision pipeline and export structured JSON telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={onJumpToVision}
          className="btn-cyber-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Capture New Frame</span>
        </button>
      </div>

      {/* Search + State Filter Bar */}
      <div className="hud-panel rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by run ID, gesture, model, or notes..."
            className="hud-input w-full rounded-lg pl-9 pr-3 py-2 text-xs placeholder:text-[#64748B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-[#080e1d] p-1 border border-white/[0.06]">
            {STATE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStateFilter(f.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  stateFilter === f.id
                    ? 'bg-[#16233B] text-[#06D6F0]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-[#94A3B8] tabular-nums whitespace-nowrap">
            {filteredCaptures.length} of {captures.length} frames
          </span>
        </div>
      </div>

      {/* Empty State */}
      {filteredCaptures.length === 0 ? (
        <div className="hud-panel rounded-2xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-white">No matching telemetry captures</p>
          <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
            Adjust your diagnostic filter or capture a fresh spatial snapshot from the Live Vision workspace.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {(searchQuery || stateFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStateFilter('all');
                }}
                className="btn-cyber-secondary rounded-lg px-4 py-2 text-xs font-semibold"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={onJumpToVision}
              className="btn-cyber-primary rounded-lg px-4 py-2 text-xs font-semibold"
            >
              Open Live Vision
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left 5 Cols: Capture Archive List */}
          <div className="lg:col-span-5 hud-panel rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {filteredCaptures.map((cap) => {
              const isSelected = activeCapture?.id === cap.id;
              return (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => onSelectCaptureId(cap.id)}
                  className={`block w-full p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#06D6F0] ${
                    isSelected ? 'bg-[#2563EB]/20' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-semibold text-[#06D6F0] tabular-nums">
                        {cap.sessionCode}
                      </span>
                      <span className="text-[#434655]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-sm font-semibold text-white truncate">
                        {cap.gestureLabel}
                      </span>
                    </div>
                    {renderStatusText(cap.diagnosticState)}
                  </div>

                  <p className="mt-1.5 text-xs text-[#94A3B8] line-clamp-2">
                    {cap.notes}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#64748B] tabular-nums">
                    <span>{cap.capturedAt}</span>
                    <span aria-hidden="true">/</span>
                    <span>{cap.latencyMs.toFixed(1)} ms</span>
                    <span aria-hidden="true">/</span>
                    <span>{cap.confidence.toFixed(1)}% conf</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right 7 Cols: Frame Forensic Inspector */}
          {activeCapture && (
            <div className="lg:col-span-7 hud-panel rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div>
                  <div className="flex items-center gap-2.5 text-xs font-mono text-[#94A3B8]">
                    <span className="text-[#06D6F0] font-semibold">
                      {activeCapture.sessionCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeCapture.capturedAt}</span>
                    <span aria-hidden="true">·</span>
                    {renderStatusText(activeCapture.diagnosticState)}
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    {activeCapture.gestureLabel} Forensic Snapshot
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportJson(activeCapture)}
                    className="btn-cyber-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5 text-[#06D6F0]" aria-hidden="true" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCapture(activeCapture.id)}
                    aria-label="Delete capture"
                    className="btn-cyber-secondary inline-flex items-center justify-center rounded-lg p-2 text-[#94A3B8] hover:text-[#EF4444] hover:border-[#EF4444]/50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Frozen 21-Joint SVG Reconstruction Canvas */}
              <div className="relative overflow-hidden rounded-2xl bg-[#080e1d] border border-[#06D6F0]/20">
                <svg
                  viewBox="0 0 800 380"
                  className="h-64 w-full"
                  role="img"
                  aria-label={`Frozen 21-joint hand reconstruction for ${activeCapture.sessionCode}`}
                >
                  {/* Subtle coordinate grid */}
                  <g stroke="rgba(148,163,184,0.08)" strokeWidth="1">
                    {[100, 200, 300, 400, 500, 600, 700].map((x) => (
                      <line key={x} x1={x} y1={0} x2={x} y2={380} />
                    ))}
                    {[95, 190, 285].map((y) => (
                      <line key={y} x1={0} y1={y} x2={800} y2={y} />
                    ))}
                  </g>

                  {/* Inter-bone vectors (1.5px electric blue) */}
                  {HAND_CONNECTIONS.map(([a, b]) => {
                    const lmA = activeCapture.landmarks[a];
                    const lmB = activeCapture.landmarks[b];
                    if (!lmA || !lmB) return null;
                    return (
                      <line
                        key={`${a}-${b}`}
                        x1={lmA.x * 800}
                        y1={lmA.y * 380}
                        x2={lmB.x * 800}
                        y2={lmB.y * 380}
                        stroke={
                          activeCapture.diagnosticState === 'lost'
                            ? '#EF4444'
                            : '#2563EB'
                        }
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* 4px Neon Cyan Landmarks */}
                  {activeCapture.landmarks.map((lm) => (
                    <g key={lm.id}>
                      <circle
                        cx={lm.x * 800}
                        cy={lm.y * 380}
                        r="4"
                        fill={
                          activeCapture.diagnosticState === 'lost'
                            ? '#EF4444'
                            : lm.confidence < 0.7
                              ? '#F59E0B'
                              : '#06D6F0'
                        }
                        stroke="#0B1120"
                        strokeWidth="1.2"
                      />
                    </g>
                  ))}
                </svg>

                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between font-mono text-[11px] text-[#94A3B8] tabular-nums">
                  <span>21 LANDMARKS RECONSTRUCTED</span>
                  <span>
                    {activeCapture.modelId.toUpperCase()} · {activeCapture.backend}
                  </span>
                </div>
              </div>

              {/* Capture Key Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-white/[0.06] py-4 font-mono tabular-nums">
                <div>
                  <span className="label-caps block text-[#64748B]">Frame Rate</span>
                  <span className="mt-1 block text-lg font-semibold text-[#06D6F0]">
                    {activeCapture.fps.toFixed(1)} FPS
                  </span>
                </div>
                <div>
                  <span className="label-caps block text-[#64748B]">Latency</span>
                  <span
                    className={`mt-1 block text-lg font-semibold ${
                      activeCapture.latencyMs <= 10
                        ? 'text-[#10B981]'
                        : 'text-[#F59E0B]'
                    }`}
                  >
                    {activeCapture.latencyMs.toFixed(1)} ms
                  </span>
                </div>
                <div>
                  <span className="label-caps block text-[#64748B]">Confidence</span>
                  <span className="mt-1 block text-lg font-semibold text-white">
                    {activeCapture.confidence.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="label-caps block text-[#64748B]">Pinch Aperture</span>
                  <span className="mt-1 block text-lg font-semibold text-[#d0bcff]">
                    {activeCapture.pinchApertureMm.toFixed(1)} mm
                  </span>
                </div>
              </div>

              {/* Editable Forensic Notes Well */}
              <div className="space-y-1.5">
                <label
                  htmlFor="capture-notes"
                  className="label-caps block text-[#94A3B8]"
                >
                  Engineering Annotation
                </label>
                <textarea
                  id="capture-notes"
                  rows={2}
                  value={activeCapture.notes}
                  onChange={(e) => onUpdateNotes(activeCapture.id, e.target.value)}
                  className="hud-input w-full rounded-lg px-3 py-2 text-xs leading-relaxed resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
