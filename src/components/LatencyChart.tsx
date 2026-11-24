import { useState } from 'react';
import { TelemetrySample } from '../types/hud';

interface LatencyChartProps {
  samples: TelemetrySample[];
}

export function LatencyChart({ samples }: LatencyChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 420;
  const height = 148;
  const padL = 34;
  const padR = 32;
  const padT = 14;
  const padB = 22;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const safeSamples = samples.length > 1 ? samples : [];
  const maxLatency = 24;
  const maxFps = 130;

  const getX = (index: number) =>
    padL +
    (safeSamples.length > 1
      ? (index / (safeSamples.length - 1)) * plotW
      : 0);

  const getLatY = (ms: number) =>
    padT + plotH - Math.min(1, Math.max(0, ms / maxLatency)) * plotH;

  const getFpsY = (fps: number) =>
    padT + plotH - Math.min(1, Math.max(0, fps / maxFps)) * plotH;

  const latPath = safeSamples
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getLatY(s.latencyMs).toFixed(1)}`)
    .join(' ');

  const latArea =
    safeSamples.length > 1
      ? `${latPath} L ${getX(safeSamples.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${padL} ${(padT + plotH).toFixed(1)} Z`
      : '';

  const fpsPath = safeSamples
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getFpsY(s.fps).toFixed(1)}`)
    .join(' ');

  const inspected =
    hoverIdx !== null && safeSamples[hoverIdx]
      ? safeSamples[hoverIdx]
      : safeSamples[safeSamples.length - 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (safeSamples.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const norm = Math.min(1, Math.max(0, (relX - padL) / plotW));
    const idx = Math.round(norm * (safeSamples.length - 1));
    setHoverIdx(idx);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <span className="inline-flex items-center gap-1.5 text-[#06D6F0]">
            <span className="h-[2px] w-3 bg-[#06D6F0]" aria-hidden="true" />
            Latency {inspected ? `${inspected.latencyMs.toFixed(1)} ms` : '--'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#8B5CF6]">
            <span className="h-[2px] w-3 border-t border-dashed border-[#8B5CF6]" aria-hidden="true" />
            Throughput {inspected ? `${inspected.fps.toFixed(0)} FPS` : '--'}
          </span>
        </div>
        <span className="label-caps text-[#64748B]">10ms Budget</span>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-[#080e1d]/90 border border-white/[0.06]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-36 w-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
          role="img"
          aria-label="Real-time frame latency and FPS telemetry chart"
        >
          <defs>
            <linearGradient id="latAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06D6F0" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#06D6F0" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 6, 12, 18, 24].map((ms) => {
            const y = getLatY(ms);
            return (
              <g key={ms}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  stroke="rgba(148,163,184,0.1)"
                  strokeWidth="1"
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[#64748B] font-mono text-[9px]"
                >
                  {ms}
                </text>
              </g>
            );
          })}

          {/* Sub-10ms threshold reference line */}
          <line
            x1={padL}
            y1={getLatY(10)}
            x2={width - padR}
            y2={getLatY(10)}
            stroke="rgba(16,185,129,0.45)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Right Y axis ticks (FPS) */}
          {[0, 60, 120].map((fps) => {
            const y = getFpsY(fps);
            return (
              <text
                key={fps}
                x={width - padR + 6}
                y={y + 3}
                textAnchor="start"
                className="fill-[#64748B] font-mono text-[9px]"
              >
                {fps}
              </text>
            );
          })}

          {/* Latency fill and line */}
          {latArea && <path d={latArea} fill="url(#latAreaGrad)" />}
          {latPath && (
            <path
              d={latPath}
              fill="none"
              stroke="#06D6F0"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          )}

          {/* FPS dashed line */}
          {fpsPath && (
            <path
              d={fpsPath}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="1.35"
              strokeDasharray="4 3"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Crosshair Probe */}
          {hoverIdx !== null && safeSamples[hoverIdx] && (
            <g>
              <line
                x1={getX(hoverIdx)}
                y1={padT}
                x2={getX(hoverIdx)}
                y2={padT + plotH}
                stroke="rgba(6,214,240,0.45)"
                strokeWidth="1"
              />
              <circle
                cx={getX(hoverIdx)}
                cy={getLatY(safeSamples[hoverIdx].latencyMs)}
                r="3.5"
                fill="#06D6F0"
                stroke="#0B1120"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(hoverIdx)}
                cy={getFpsY(safeSamples[hoverIdx].fps)}
                r="3"
                fill="#8B5CF6"
                stroke="#0B1120"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={padL}
            y={height - 5}
            className="fill-[#64748B] font-mono text-[9px]"
          >
            ms (Left)
          </text>
          <text
            x={width - padR}
            y={height - 5}
            textAnchor="end"
            className="fill-[#64748B] font-mono text-[9px]"
          >
            FPS (Right)
          </text>
        </svg>
      </div>
    </div>
  );
}
