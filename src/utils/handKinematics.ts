import { DiagnosticState, GestureId, Landmark3D } from '../types/hud';

export const LANDMARK_META: Array<{
  id: number;
  name: string;
  finger: Landmark3D['finger'];
}> = [
  { id: 0, name: 'WRIST', finger: 'wrist' },
  { id: 1, name: 'THUMB_CMC', finger: 'thumb' },
  { id: 2, name: 'THUMB_MCP', finger: 'thumb' },
  { id: 3, name: 'THUMB_IP', finger: 'thumb' },
  { id: 4, name: 'THUMB_TIP', finger: 'thumb' },
  { id: 5, name: 'INDEX_MCP', finger: 'index' },
  { id: 6, name: 'INDEX_PIP', finger: 'index' },
  { id: 7, name: 'INDEX_DIP', finger: 'index' },
  { id: 8, name: 'INDEX_TIP', finger: 'index' },
  { id: 9, name: 'MIDDLE_MCP', finger: 'middle' },
  { id: 10, name: 'MIDDLE_PIP', finger: 'middle' },
  { id: 11, name: 'MIDDLE_DIP', finger: 'middle' },
  { id: 12, name: 'MIDDLE_TIP', finger: 'middle' },
  { id: 13, name: 'RING_MCP', finger: 'ring' },
  { id: 14, name: 'RING_PIP', finger: 'ring' },
  { id: 15, name: 'RING_DIP', finger: 'ring' },
  { id: 16, name: 'RING_TIP', finger: 'ring' },
  { id: 17, name: 'PINKY_MCP', finger: 'pinky' },
  { id: 18, name: 'PINKY_PIP', finger: 'pinky' },
  { id: 19, name: 'PINKY_DIP', finger: 'pinky' },
  { id: 20, name: 'PINKY_TIP', finger: 'pinky' },
];

export const HAND_CONNECTIONS: Array<[number, number]> = [
  // Palm arch
  [0, 1],
  [0, 5],
  [0, 17],
  [5, 9],
  [9, 13],
  [13, 17],
  // Thumb
  [1, 2],
  [2, 3],
  [3, 4],
  // Index
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky
  [17, 18],
  [18, 19],
  [19, 20],
];

export const GESTURE_LABELS: Record<GestureId, string> = {
  open_palm: 'Open Palm',
  precision_pinch: 'Precision Pinch',
  index_point: 'Index Vector',
  closed_fist: 'Closed Grasp',
  dual_rotate: 'Dual-Axis Rotate',
};

type Vec3 = [number, number, number];

// Canonical right-hand 3D joint positions centered around palm origin (units in ~normalized canvas span)
const BASE_POSES: Record<GestureId, Vec3[]> = {
  open_palm: [
    [0.0, 0.28, 0.0], // 0 WRIST
    [-0.1, 0.21, -0.02], // 1 THUMB_CMC
    [-0.17, 0.12, -0.035], // 2 THUMB_MCP
    [-0.22, 0.03, -0.045], // 3 THUMB_IP
    [-0.26, -0.06, -0.055], // 4 THUMB_TIP
    [-0.085, 0.03, -0.01], // 5 INDEX_MCP
    [-0.11, -0.09, -0.025], // 6 INDEX_PIP
    [-0.125, -0.18, -0.035], // 7 INDEX_DIP
    [-0.135, -0.26, -0.045], // 8 INDEX_TIP
    [-0.015, 0.01, 0.0], // 9 MIDDLE_MCP
    [-0.02, -0.12, -0.015], // 10 MIDDLE_PIP
    [-0.022, -0.22, -0.025], // 11 MIDDLE_DIP
    [-0.022, -0.31, -0.035], // 12 MIDDLE_TIP
    [0.055, 0.03, 0.01], // 13 RING_MCP
    [0.07, -0.09, 0.0], // 14 RING_PIP
    [0.082, -0.19, -0.01], // 15 RING_DIP
    [0.092, -0.27, -0.02], // 16 RING_TIP
    [0.12, 0.08, 0.022], // 17 PINKY_MCP
    [0.155, -0.02, 0.015], // 18 PINKY_PIP
    [0.18, -0.095, 0.008], // 19 PINKY_DIP
    [0.2, -0.165, 0.0], // 20 PINKY_TIP
  ],
  precision_pinch: [
    [0.0, 0.28, 0.0],
    [-0.095, 0.2, -0.025],
    [-0.145, 0.1, -0.055],
    [-0.14, 0.0, -0.085],
    [-0.1, -0.085, -0.105], // 4 THUMB_TIP meeting INDEX_TIP
    [-0.08, 0.03, -0.01],
    [-0.115, -0.065, -0.055],
    [-0.115, -0.11, -0.09],
    [-0.092, -0.092, -0.108], // 8 INDEX_TIP pinched
    [-0.01, 0.015, 0.005],
    [-0.005, -0.105, -0.005],
    [0.0, -0.2, -0.012],
    [0.005, -0.285, -0.02],
    [0.058, 0.038, 0.015],
    [0.075, -0.075, 0.008],
    [0.088, -0.165, 0.002],
    [0.098, -0.24, -0.005],
    [0.12, 0.085, 0.026],
    [0.15, -0.005, 0.022],
    [0.172, -0.075, 0.016],
    [0.19, -0.14, 0.01],
  ],
  index_point: [
    [0.0, 0.28, 0.0],
    [-0.095, 0.2, -0.025],
    [-0.135, 0.11, -0.05],
    [-0.09, 0.055, -0.075],
    [-0.04, 0.035, -0.09],
    [-0.08, 0.025, -0.015],
    [-0.095, -0.1, -0.03],
    [-0.105, -0.2, -0.045],
    [-0.112, -0.295, -0.06], // 8 INDEX_TIP fully extended
    [-0.01, 0.02, 0.0],
    [-0.01, -0.045, -0.055],
    [-0.01, 0.02, -0.085],
    [-0.01, 0.075, -0.065],
    [0.055, 0.04, 0.01],
    [0.058, -0.02, -0.045],
    [0.052, 0.04, -0.072],
    [0.048, 0.085, -0.052],
    [0.115, 0.085, 0.02],
    [0.118, 0.035, -0.03],
    [0.108, 0.08, -0.055],
    [0.1, 0.115, -0.038],
  ],
  closed_fist: [
    [0.0, 0.28, 0.0],
    [-0.095, 0.2, -0.02],
    [-0.13, 0.11, -0.055],
    [-0.07, 0.045, -0.088],
    [-0.005, 0.03, -0.1],
    [-0.08, 0.03, -0.01],
    [-0.082, -0.03, -0.065],
    [-0.07, 0.035, -0.095],
    [-0.062, 0.088, -0.072],
    [-0.012, 0.018, 0.0],
    [-0.012, -0.042, -0.06],
    [-0.008, 0.03, -0.09],
    [-0.006, 0.085, -0.068],
    [0.052, 0.038, 0.01],
    [0.054, -0.018, -0.05],
    [0.048, 0.045, -0.078],
    [0.045, 0.092, -0.056],
    [0.112, 0.08, 0.02],
    [0.112, 0.03, -0.035],
    [0.102, 0.08, -0.062],
    [0.096, 0.118, -0.042],
  ],
  dual_rotate: [
    [0.0, 0.28, 0.0],
    [-0.105, 0.2, -0.025],
    [-0.18, 0.11, -0.04],
    [-0.24, 0.01, -0.055],
    [-0.285, -0.09, -0.07],
    [-0.085, 0.025, -0.01],
    [-0.11, -0.1, -0.025],
    [-0.125, -0.2, -0.04],
    [-0.138, -0.29, -0.055],
    [-0.01, 0.015, 0.005],
    [0.015, -0.105, -0.01],
    [0.038, -0.205, -0.025],
    [0.055, -0.295, -0.04],
    [0.058, 0.045, 0.015],
    [0.056, -0.01, -0.04],
    [0.05, 0.05, -0.065],
    [0.046, 0.095, -0.045],
    [0.118, 0.085, 0.024],
    [0.118, 0.035, -0.025],
    [0.11, 0.082, -0.048],
    [0.102, 0.118, -0.032],
  ],
};

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface HandPoseOptions {
  gesture: GestureId;
  pinchBlend: number; // 0..1 overrides toward precision_pinch when user clicks & holds
  centerX: number; // 0.2..0.8
  centerY: number; // 0.25..0.8
  yawRad: number; // -0.6..0.6
  pitchRad: number; // -0.45..0.45
  depthScale: number; // 0.75..1.25
  jitterSigma: number;
  diagnosticState: DiagnosticState;
  timeSec: number;
}

export function computeHandLandmarks(opts: HandPoseOptions): Landmark3D[] {
  const base = BASE_POSES[opts.gesture];
  const pinchPose = BASE_POSES.precision_pinch;
  const cosY = Math.cos(opts.yawRad);
  const sinY = Math.sin(opts.yawRad);
  const cosP = Math.cos(opts.pitchRad);
  const sinP = Math.sin(opts.pitchRad);

  const diagConfidenceBase =
    opts.diagnosticState === 'nominal'
      ? 0.975
      : opts.diagnosticState === 'occluded'
        ? 0.71
        : 0.24;

  const diagJitterMult =
    opts.diagnosticState === 'nominal'
      ? 1
      : opts.diagnosticState === 'occluded'
        ? 4.2
        : 10.5;

  return LANDMARK_META.map((meta, idx) => {
    const [bx, by, bz] = base[idx];
    const [px, py, pz] = pinchPose[idx];

    const mx = lerp(bx, px, opts.pinchBlend);
    const my = lerp(by, py, opts.pinchBlend);
    const mz = lerp(bz, pz, opts.pinchBlend);

    // Subtle organic micro-breathing motion
    const phase = opts.timeSec * 1.9 + idx * 0.42;
    const microX = Math.sin(phase) * 0.0018;
    const microY = Math.cos(phase * 0.85) * 0.0022;

    // Sensor noise scaled by model jitter and diagnostic state
    const noiseX =
      Math.sin(opts.timeSec * 23.7 + idx * 7.13) * opts.jitterSigma * diagJitterMult;
    const noiseY =
      Math.cos(opts.timeSec * 19.3 + idx * 5.71) * opts.jitterSigma * diagJitterMult;

    const x0 = (mx + microX + noiseX) * opts.depthScale;
    const y0 = (my + microY + noiseY) * opts.depthScale;
    const z0 = mz * opts.depthScale;

    // 3D rotation around Y (yaw) and X (pitch)
    const x1 = x0 * cosY + z0 * sinY;
    const z1 = -x0 * sinY + z0 * cosY;
    const y2 = y0 * cosP - z1 * sinP;
    const z2 = y0 * sinP + z1 * cosP;

    // Weak perspective projection
    const perspective = 1 / (1 + z2 * 0.65);

    const x = Math.min(0.96, Math.max(0.04, opts.centerX + x1 * perspective));
    const y = Math.min(0.94, Math.max(0.06, opts.centerY + y2 * perspective));

    // Occlusion degrades distal pinky/ring/thumb confidence realistically
    const occlusionDrop =
      opts.diagnosticState === 'occluded' && idx >= 13 ? 0.16 : 0;
    const rawConf =
      diagConfidenceBase -
      occlusionDrop -
      Math.abs(Math.sin(opts.timeSec * 3.1 + idx)) * 0.028;

    return {
      id: meta.id,
      name: meta.name,
      finger: meta.finger,
      x,
      y,
      z: Number(z2.toFixed(4)),
      confidence: Math.max(0.08, Math.min(0.998, rawConf)),
    };
  });
}

export function computePinchApertureMm(landmarks: Landmark3D[]): number {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  if (!thumbTip || !indexTip) return 0;
  const dx = thumbTip.x - indexTip.x;
  const dy = thumbTip.y - indexTip.y;
  const dz = thumbTip.z - indexTip.z;
  const distNorm = Math.sqrt(dx * dx + dy * dy + dz * dz);
  // Map normalized distance (~0.018 pinched -> ~0.26 open) to realistic 4mm..96mm range
  return Math.max(3.2, Math.min(110, distNorm * 340));
}

export function computeGestureProbabilities(
  activeGesture: GestureId,
  pinchBlend: number,
  diagnosticState: DiagnosticState,
  timeSec: number
): Record<GestureId, number> {
  const effectiveGesture: GestureId =
    pinchBlend > 0.55 ? 'precision_pinch' : activeGesture;
  const jitter = Math.sin(timeSec * 2.6) * 0.012;
  const primaryBase =
    diagnosticState === 'nominal'
      ? 0.945 + jitter
      : diagnosticState === 'occluded'
        ? 0.68 + jitter * 2
        : 0.22;

  const gestures: GestureId[] = [
    'open_palm',
    'precision_pinch',
    'index_point',
    'closed_fist',
    'dual_rotate',
  ];
  const remainder = Math.max(0.02, 1 - primaryBase);
  const result = {} as Record<GestureId, number>;

  let sumOthers = 0;
  const rawWeights: Record<GestureId, number> = {
    open_palm: 0.25 + Math.abs(Math.sin(timeSec * 1.1)) * 0.1,
    precision_pinch: 0.3 + Math.abs(Math.cos(timeSec * 1.3)) * 0.12,
    index_point: 0.2 + Math.abs(Math.sin(timeSec * 0.9)) * 0.08,
    closed_fist: 0.15 + Math.abs(Math.cos(timeSec * 0.7)) * 0.08,
    dual_rotate: 0.18 + Math.abs(Math.sin(timeSec * 1.5)) * 0.09,
  };

  for (const g of gestures) {
    if (g !== effectiveGesture) {
      sumOthers += rawWeights[g];
    }
  }

  for (const g of gestures) {
    if (g === effectiveGesture) {
      result[g] = Math.min(0.992, Math.max(0.12, primaryBase));
    } else {
      result[g] = Number(((rawWeights[g] / sumOthers) * remainder).toFixed(3));
    }
  }

  return result;
}
