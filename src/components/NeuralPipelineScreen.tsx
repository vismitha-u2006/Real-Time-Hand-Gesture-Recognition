import { useMemo, useState } from 'react';
import { Cpu, Layers, Zap, Check } from 'lucide-react';
import {
  HardwareBackend,
  ModelVariant,
  ModelVariantId,
  PipelineStage,
} from '../types/hud';
import { MODEL_VARIANTS, PIPELINE_STAGES } from '../data/initialData';

interface NeuralPipelineScreenProps {
  activeModelId: ModelVariantId;
  onSelectModel: (id: ModelVariantId) => void;
  backend: HardwareBackend;
  onSelectBackend: (b: HardwareBackend) => void;
  liveLatencyMs: number;
  liveFps: number;
}

const BACKENDS: Array<{
  id: HardwareBackend;
  multiplier: number;
  note: string;
}> = [
  { id: 'WebGPU', multiplier: 1.0, note: 'Zero-copy compute shaders' },
  { id: 'WebGL2', multiplier: 1.32, note: 'Fragment texture fallback' },
  { id: 'WASM SIMD', multiplier: 1.75, note: '128-bit CPU vectorized' },
];

export function NeuralPipelineScreen({
  activeModelId,
  onSelectModel,
  backend,
  onSelectBackend,
  liveLatencyMs,
  liveFps,
}: NeuralPipelineScreenProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>(PIPELINE_STAGES[2].id);

  const activeModel: ModelVariant =
    MODEL_VARIANTS.find((m) => m.id === activeModelId) ?? MODEL_VARIANTS[1];

  const backendInfo =
    BACKENDS.find((b) => b.id === backend) ?? BACKENDS[0];

  const modelLatencyScale = activeModel.baseLatencyMs / 7.4;

  const computedStages = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => {
      const scaledLatency = Number(
        (stage.baseLatencyMs * modelLatencyScale * backendInfo.multiplier).toFixed(2)
      );
      const scaledMem = Math.round(stage.memoryMb * (activeModel.vramMb / 284));
      return {
        ...stage,
        scaledLatency,
        scaledMem,
      };
    });
  }, [modelLatencyScale, backendInfo.multiplier, activeModel.vramMb]);

  const totalStageMs = computedStages.reduce((acc, s) => acc + s.scaledLatency, 0);
  const totalVramMb = computedStages.reduce((acc, s) => acc + s.scaledMem, 0);

  const selectedStage =
    computedStages.find((s) => s.id === selectedStageId) ?? computedStages[2];

  const budget120Pct = Math.min(100, (totalStageMs / 8.33) * 100);
  const budget60Pct = Math.min(100, (totalStageMs / 16.67) * 100);

  return (
    <div className="space-y-6">
      {/* Header + Compute Backend Switcher */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Neural Pipeline & Inference Architecture
          </h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Select tracking backbones and compute runtimes to inspect per-stage latency budgets and live accuracy trade-offs.
          </p>
        </div>

        {/* Hardware Compute Backend Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl bg-[#080e1d] p-1 border border-white/[0.06] self-start lg:self-auto">
          {BACKENDS.map((item) => {
            const active = backend === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectBackend(item.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-mono font-medium transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#8B5CF6]/25 text-[#d0bcff] border border-[#8B5CF6]/55 shadow-[0_0_16px_rgba(139,92,246,0.28)]'
                    : 'text-[#94A3B8] border border-transparent hover:text-white'
                }`}
              >
                {item.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Variant Selector Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {MODEL_VARIANTS.map((variant) => {
          const isSelected = variant.id === activeModelId;
          const estLatency = variant.baseLatencyMs * backendInfo.multiplier;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelectModel(variant.id)}
              className={`text-left rounded-2xl p-5 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#06D6F0] ${
                isSelected
                  ? 'bg-[#16233B]/85 border border-[#8B5CF6]/65 shadow-[0_0_24px_rgba(139,92,246,0.22)]'
                  : 'hud-panel hover:border-[#06D6F0]/35'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">{variant.name}</h2>
                  <p className="mt-0.5 font-mono text-xs text-[#94A3B8] tabular-nums">
                    {variant.parameters} params · {variant.vramMb} MB VRAM
                  </p>
                </div>
                {isSelected && (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#8B5CF6]/25 text-[#d0bcff] border border-[#8B5CF6]/50">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-[#c3c6d7]">
                {variant.summary}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3.5 font-mono tabular-nums">
                <div>
                  <span className="block text-[10px] uppercase text-[#64748B]">Latency</span>
                  <span
                    className={`text-sm font-semibold ${
                      estLatency <= 10 ? 'text-[#10B981]' : 'text-[#F59E0B]'
                    }`}
                  >
                    {estLatency.toFixed(1)} ms
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-[#64748B]">Target</span>
                  <span className="text-sm font-semibold text-[#06D6F0]">
                    {variant.targetFps} Hz
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-[#64748B]">PCK@10</span>
                  <span className="text-sm font-semibold text-white">
                    {variant.accuracyPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 12-Column Pipeline Topology & Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left 7 Cols: 6-Stage Neural Vision Topology */}
        <div className="lg:col-span-7 hud-panel rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">
                Execution Graph & Stage Waterfall
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Click any inference stage to inspect tensor geometry and memory footprint
              </p>
            </div>
            <span className="font-mono text-xs text-[#d0bcff] tabular-nums">
              Total {totalStageMs.toFixed(2)} ms
            </span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {computedStages.map((stage: PipelineStage & { scaledLatency: number; scaledMem: number }) => {
              const isSelected = stage.id === selectedStage.id;
              const sharePct = (stage.scaledLatency / totalStageMs) * 100;
              const barGradient =
                stage.accent === 'violet'
                  ? 'linear-gradient(90deg, #7d4ce7 0%, #8B5CF6 100%)'
                  : stage.accent === 'cyan'
                    ? 'linear-gradient(90deg, #06D6F0 0%, #10B981 100%)'
                    : 'linear-gradient(90deg, #2563EB 0%, #06D6F0 100%)';

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`block w-full py-3.5 px-3 -mx-3 rounded-xl text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#06D6F0] ${
                    isSelected ? 'bg-[#2563EB]/15' : 'hover:bg-white/[0.025]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums ${
                          stage.accent === 'violet'
                            ? 'text-[#d0bcff]'
                            : stage.accent === 'cyan'
                              ? 'text-[#06D6F0]'
                              : 'text-[#b4c5ff]'
                        }`}
                      >
                        0{stage.order}
                      </span>
                      <span className="text-sm font-medium text-white truncate">
                        {stage.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs tabular-nums shrink-0">
                      <span className="text-[#94A3B8] hidden sm:inline">
                        {stage.precision}
                      </span>
                      <span className="text-white font-semibold">
                        {stage.scaledLatency.toFixed(2)} ms
                      </span>
                    </div>
                  </div>

                  {/* Proportional Waterfall Bar */}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${Math.max(4, sharePct)}%`,
                          background: barGradient,
                        }}
                      />
                    </div>
                    <span className="w-11 text-right font-mono text-[11px] text-[#64748B] tabular-nums">
                      {sharePct.toFixed(0)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Selected Stage Inspector + Real-Time Frame Budget */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="hud-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-[#d0bcff]">
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span className="label-caps">Stage 0{selectedStage.order} Inspector</span>
              </div>
              <span className="font-mono text-xs text-[#86ecff]">
                {selectedStage.precision}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                {selectedStage.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#c3c6d7]">
                {selectedStage.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 font-mono tabular-nums">
              <div>
                <span className="label-caps block text-[#64748B]">Tensor I/O</span>
                <span className="mt-1 block text-xs text-white">
                  {selectedStage.tensorShape}
                </span>
              </div>
              <div>
                <span className="label-caps block text-[#64748B]">Stage Latency</span>
                <span className="mt-1 block text-sm font-semibold text-[#06D6F0]">
                  {selectedStage.scaledLatency.toFixed(2)} ms
                </span>
              </div>
              <div>
                <span className="label-caps block text-[#64748B]">Allocated VRAM</span>
                <span className="mt-1 block text-sm font-semibold text-white">
                  {selectedStage.scaledMem} MB
                </span>
              </div>
              <div>
                <span className="label-caps block text-[#64748B]">Compute Runtime</span>
                <span className="mt-1 block text-xs text-[#d0bcff]">
                  {backend} ({backendInfo.note})
                </span>
              </div>
            </div>
          </div>

          {/* Real-Time Refresh Budget Gauges */}
          <div className="hud-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-[#06D6F0]">
                <Zap className="h-4 w-4" aria-hidden="true" />
                <span className="label-caps">Frame Budget Headroom</span>
              </div>
              <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                Live {liveLatencyMs.toFixed(1)} ms · {liveFps.toFixed(0)} FPS
              </span>
            </div>

            <div className="space-y-4">
              {/* 120Hz Budget */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#dde2f8]">120 Hz Passthrough Target (8.33 ms)</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      totalStageMs <= 8.33 ? 'text-[#10B981]' : 'text-[#F59E0B]'
                    }`}
                  >
                    {totalStageMs <= 8.33 ? 'Within Budget' : `+${(totalStageMs - 8.33).toFixed(1)} ms Over`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${budget120Pct}%`,
                      background:
                        totalStageMs <= 8.33
                          ? 'linear-gradient(90deg, #06D6F0 0%, #10B981 100%)'
                          : 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)',
                    }}
                  />
                </div>
              </div>

              {/* 60Hz Budget */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#dde2f8]">60 Hz Spatial HUD Target (16.67 ms)</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      totalStageMs <= 16.67 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {totalStageMs <= 16.67
                      ? `${(16.67 - totalStageMs).toFixed(1)} ms Spare`
                      : `+${(totalStageMs - 16.67).toFixed(1)} ms Over`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${budget60Pct}%`,
                      background:
                        totalStageMs <= 16.67
                          ? 'linear-gradient(90deg, #06D6F0 0%, #10B981 100%)'
                          : 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.06] pt-3.5 font-mono text-xs text-[#94A3B8] tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                Total Pipeline Footprint
              </span>
              <span className="text-white font-semibold">{totalVramMb} MB VRAM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
