export type ScreenId = 'vision' | 'calibration' | 'pipeline' | 'sessions';

export type GestureId =
  | 'open_palm'
  | 'precision_pinch'
  | 'index_point'
  | 'closed_fist'
  | 'dual_rotate';

export type DiagnosticState = 'nominal' | 'occluded' | 'lost';

export type HardwareBackend = 'WebGPU' | 'WASM SIMD' | 'WebGL2';

export type ModelVariantId = 'lite-21' | 'full-21' | 'stereo-3d';

export interface Landmark3D {
  id: number;
  name: string;
  finger: 'wrist' | 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
  x: number; // 0..1 normalized viewport
  y: number; // 0..1 normalized viewport
  z: number; // -0.25..0.25 meters relative to wrist
  confidence: number; // 0..1
}

export interface TelemetrySample {
  timestamp: number;
  fps: number;
  latencyMs: number;
  confidence: number;
  pinchApertureMm: number;
}

export interface CalibrationParams {
  pinchThresholdMm: number; // 10..40 mm
  smoothingFactor: number; // 0.1..0.95
  depthSensitivity: number; // 0.5..2.0
  velocityDampening: number; // 0.1..0.9
  occlusionRecoveryMs: number; // 40..300 ms
  angularToleranceDeg: number; // 5..45 deg
  minConfidenceCutoff: number; // 0.50..0.95
}

export interface GestureBinding {
  id: string;
  gesture: GestureId;
  gestureLabel: string;
  actionName: string;
  targetChannel: string;
  minConfidence: number;
  holdDurationMs: number;
  enabled: boolean;
}

export interface PipelineStage {
  id: string;
  order: number;
  name: string;
  tensorShape: string;
  precision: 'FP32' | 'FP16' | 'INT8';
  baseLatencyMs: number;
  memoryMb: number;
  description: string;
  accent: 'electric' | 'cyan' | 'violet';
}

export interface ModelVariant {
  id: ModelVariantId;
  name: string;
  parameters: string;
  targetFps: number;
  baseLatencyMs: number;
  jitterSigma: number;
  accuracyPct: number;
  vramMb: number;
  summary: string;
}

export interface CapturedFrame {
  id: string;
  capturedAt: string;
  sessionCode: string;
  gesture: GestureId;
  gestureLabel: string;
  diagnosticState: DiagnosticState;
  fps: number;
  latencyMs: number;
  confidence: number;
  pinchApertureMm: number;
  modelId: ModelVariantId;
  backend: HardwareBackend;
  notes: string;
  landmarks: Landmark3D[];
}

export interface ViewportLayers {
  skeleton: boolean;
  boundingBox: boolean;
  depthVectors: boolean;
  opticalGrid: boolean;
  jointIndices: boolean;
}
