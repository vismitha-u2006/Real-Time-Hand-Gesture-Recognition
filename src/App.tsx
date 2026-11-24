import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalibrationParams,
  CapturedFrame,
  DiagnosticState,
  GestureBinding,
  GestureId,
  HardwareBackend,
  Landmark3D,
  ModelVariantId,
  ScreenId,
  TelemetrySample,
  ViewportLayers,
} from './types/hud';
import {
  DEFAULT_CALIBRATION,
  INITIAL_BINDINGS,
  INITIAL_CAPTURES,
  MODEL_VARIANTS,
} from './data/initialData';
import {
  computeGestureProbabilities,
  computeHandLandmarks,
  computePinchApertureMm,
  GESTURE_LABELS,
  lerp,
} from './utils/handKinematics';
import { TopBar } from './components/TopBar';
import { LiveVisionScreen } from './components/LiveVisionScreen';
import { CalibrationScreen } from './components/CalibrationScreen';
import { NeuralPipelineScreen } from './components/NeuralPipelineScreen';
import { SessionsScreen } from './components/SessionsScreen';

const BACKEND_MULT: Record<HardwareBackend, number> = {
  WebGPU: 1.0,
  WebGL2: 1.32,
  'WASM SIMD': 1.75,
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('vision');

  // Tracking & model configuration state (shared across all 4 screens)
  const [activeGesture, setActiveGesture] = useState<GestureId>('open_palm');
  const [diagnosticState, setDiagnosticState] = useState<DiagnosticState>('nominal');
  const [activeModelId, setActiveModelId] = useState<ModelVariantId>('full-21');
  const [backend, setBackend] = useState<HardwareBackend>('WebGPU');
  const [calibration, setCalibration] = useState<CalibrationParams>(DEFAULT_CALIBRATION);
  const [bindings, setBindings] = useState<GestureBinding[]>(INITIAL_BINDINGS);
  const [captures, setCaptures] = useState<CapturedFrame[]>(INITIAL_CAPTURES);
  const [selectedCaptureId, setSelectedCaptureId] = useState<string | null>(
    INITIAL_CAPTURES[0].id
  );

  // Viewport interaction state
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<number | null>(8);
  const [frozen, setFrozen] = useState(false);
  const [layers, setLayers] = useState<ViewportLayers>({
    skeleton: true,
    boundingBox: true,
    depthVectors: true,
    opticalGrid: true,
    jointIndices: false,
  });

  // Camera stream state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Capture confirmation feedback
  const [captureFlash, setCaptureFlash] = useState(false);
  const [captureToast, setCaptureToast] = useState<string | null>(null);

  // Live animation refs for smooth 60Hz spring interpolation without render thrashing
  const targetPoseRef = useRef({
    centerX: 0.5,
    centerY: 0.54,
    yawRad: 0.08,
    pitchRad: -0.04,
    depthScale: 1.0,
    pinchTarget: 0,
  });

  const currentPoseRef = useRef({
    centerX: 0.5,
    centerY: 0.54,
    yawRad: 0.08,
    pitchRad: -0.04,
    depthScale: 1.0,
    pinchBlend: 0,
  });

  const activeModel = useMemo(
    () => MODEL_VARIANTS.find((m) => m.id === activeModelId) ?? MODEL_VARIANTS[1],
    [activeModelId]
  );

  // Live frame state
  const [landmarks, setLandmarks] = useState<Landmark3D[]>(() =>
    computeHandLandmarks({
      gesture: 'open_palm',
      pinchBlend: 0,
      centerX: 0.5,
      centerY: 0.54,
      yawRad: 0.08,
      pitchRad: -0.04,
      depthScale: 1.0,
      jitterSigma: activeModel.jitterSigma,
      diagnosticState: 'nominal',
      timeSec: 0,
    })
  );

  const [gestureProbs, setGestureProbs] = useState<Record<GestureId, number>>(() =>
    computeGestureProbabilities('open_palm', 0, 'nominal', 0)
  );
  const [fps, setFps] = useState(60.2);
  const [latencyMs, setLatencyMs] = useState(7.4);
  const [confidence, setConfidence] = useState(97.6);
  const [pinchApertureMm, setPinchApertureMm] = useState(46.2);

  const [telemetryHistory, setTelemetryHistory] = useState<TelemetrySample[]>(() => {
    const now = Date.now();
    return Array.from({ length: 36 }, (_, i) => ({
      timestamp: now - (36 - i) * 250,
      fps: 59.5 + Math.sin(i * 0.4) * 1.4,
      latencyMs: 7.2 + Math.cos(i * 0.35) * 0.55,
      confidence: 97.2 + Math.sin(i * 0.25) * 0.8,
      pinchApertureMm: 44,
    }));
  });

  // Main real-time kinematics loop
  useEffect(() => {
    if (frozen) return;

    let rafId = 0;
    let lastUiUpdate = 0;
    let lastHistoryPush = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      const smoothAlpha = Math.max(0.08, 1 - calibration.smoothingFactor * 0.82);

      const cur = currentPoseRef.current;
      const tgt = targetPoseRef.current;

      cur.centerX = lerp(cur.centerX, tgt.centerX, smoothAlpha);
      cur.centerY = lerp(cur.centerY, tgt.centerY, smoothAlpha);
      cur.yawRad = lerp(cur.yawRad, tgt.yawRad, smoothAlpha);
      cur.pitchRad = lerp(cur.pitchRad, tgt.pitchRad, smoothAlpha);
      cur.depthScale = lerp(cur.depthScale, tgt.depthScale, smoothAlpha);
      cur.pinchBlend = lerp(cur.pinchBlend, tgt.pinchTarget, 0.22);

      // Update React UI at ~30fps for buttery smooth visuals & low CPU overhead
      if (now - lastUiUpdate >= 33) {
        lastUiUpdate = now;

        const nextLandmarks = computeHandLandmarks({
          gesture: activeGesture,
          pinchBlend: cur.pinchBlend,
          centerX: cur.centerX,
          centerY: cur.centerY,
          yawRad: cur.yawRad,
          pitchRad: cur.pitchRad,
          depthScale: cur.depthScale * (0.85 + calibration.depthSensitivity * 0.14),
          jitterSigma: activeModel.jitterSigma * (1.25 - calibration.smoothingFactor * 0.7),
          diagnosticState,
          timeSec: elapsedSec,
        });

        const nextPinch = computePinchApertureMm(nextLandmarks);
        const nextProbs = computeGestureProbabilities(
          activeGesture,
          cur.pinchBlend,
          diagnosticState,
          elapsedSec
        );

        const avgConf =
          (nextLandmarks.reduce((sum, lm) => sum + lm.confidence, 0) /
            nextLandmarks.length) *
          100;

        const backendMult = BACKEND_MULT[backend];
        const diagPenaltyMs =
          diagnosticState === 'nominal'
            ? 0
            : diagnosticState === 'occluded'
              ? 3.1
              : 7.4;

        const nextLatency =
          activeModel.baseLatencyMs * backendMult +
          diagPenaltyMs +
          Math.sin(elapsedSec * 3.7) * 0.45 +
          Math.cos(elapsedSec * 7.1) * 0.2;

        const targetFpsAdjusted =
          Math.min(
            activeModel.targetFps,
            1000 / Math.max(8, nextLatency * 1.45)
          ) +
          Math.sin(elapsedSec * 2.4) * 1.2;

        setLandmarks(nextLandmarks);
        setPinchApertureMm(nextPinch);
        setGestureProbs(nextProbs);
        setConfidence(avgConf);
        setLatencyMs(nextLatency);
        setFps(Math.max(18, targetFpsAdjusted));

        if (now - lastHistoryPush >= 260) {
          lastHistoryPush = now;
          setTelemetryHistory((prev) => [
            ...prev.slice(-35),
            {
              timestamp: Date.now(),
              fps: Math.max(18, targetFpsAdjusted),
              latencyMs: nextLatency,
              confidence: avgConf,
              pinchApertureMm: nextPinch,
            },
          ]);
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [
    frozen,
    activeGesture,
    diagnosticState,
    activeModel,
    backend,
    calibration.smoothingFactor,
    calibration.depthSensitivity,
  ]);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoStream]);

  const handleToggleCamera = useCallback(async () => {
    if (cameraActive) {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      setVideoStream(null);
      setCameraActive(false);
      setCameraError(null);
      return;
    }

    setActiveScreen('vision');
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser camera API unavailable in this environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setVideoStream(stream);
      setCameraActive(true);
    } catch {
      setCameraError('Camera access was declined or no webcam device was detected.');
      setCameraActive(false);
    }
  }, [cameraActive, videoStream]);

  const handlePointerPoseChange = useCallback(
    (pose: { centerX: number; centerY: number; yawRad: number; pitchRad: number }) => {
      targetPoseRef.current.centerX = pose.centerX;
      targetPoseRef.current.centerY = pose.centerY;
      targetPoseRef.current.yawRad = pose.yawRad;
      targetPoseRef.current.pitchRad = pose.pitchRad;
    },
    []
  );

  const handlePinchHoldChange = useCallback((holding: boolean) => {
    targetPoseRef.current.pinchTarget = holding ? 1 : 0;
  }, []);

  const handleDepthDelta = useCallback((delta: number) => {
    const next = Math.min(1.26, Math.max(0.76, targetPoseRef.current.depthScale + delta));
    targetPoseRef.current.depthScale = next;
  }, []);

  const handleToggleLayer = useCallback((layer: keyof ViewportLayers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleCaptureFrame = useCallback(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const runNum = 8842 + captures.length;
    const effectiveGesture: GestureId =
      pinchApertureMm <= calibration.pinchThresholdMm
        ? 'precision_pinch'
        : activeGesture;

    const newCapture: CapturedFrame = {
      id: `cap-${Date.now()}`,
      capturedAt: formatted,
      sessionCode: `RUN-${runNum}`,
      gesture: effectiveGesture,
      gestureLabel: GESTURE_LABELS[effectiveGesture],
      diagnosticState,
      fps: Number(fps.toFixed(1)),
      latencyMs: Number(latencyMs.toFixed(1)),
      confidence: Number(confidence.toFixed(1)),
      pinchApertureMm: Number(pinchApertureMm.toFixed(1)),
      modelId: activeModelId,
      backend,
      notes: `Live viewport capture using ${activeModel.name} on ${backend}. Pinch aperture ${pinchApertureMm.toFixed(
        1
      )} mm.`,
      landmarks: landmarks.map((lm) => ({ ...lm })),
    };

    setCaptures((prev) => [newCapture, ...prev]);
    setSelectedCaptureId(newCapture.id);

    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 180);

    setCaptureToast(newCapture.sessionCode);
    setTimeout(() => {
      setCaptureToast((current) =>
        current === newCapture.sessionCode ? null : current
      );
    }, 4500);
  }, [
    captures.length,
    pinchApertureMm,
    calibration.pinchThresholdMm,
    activeGesture,
    diagnosticState,
    fps,
    latencyMs,
    confidence,
    activeModelId,
    backend,
    activeModel.name,
    landmarks,
  ]);

  const handleToggleBinding = useCallback((id: string) => {
    setBindings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  }, []);

  const handleDeleteBinding = useCallback((id: string) => {
    setBindings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleAddBinding = useCallback((binding: Omit<GestureBinding, 'id'>) => {
    setBindings((prev) => [...prev, { ...binding, id: `bind-${Date.now()}` }]);
  }, []);

  const handleUpdateCaptureNotes = useCallback((id: string, notes: string) => {
    setCaptures((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notes } : c))
    );
  }, []);

  const handleDeleteCapture = useCallback((id: string) => {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#dde2f8] flex flex-col">
      <TopBar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        cameraActive={cameraActive}
        onToggleCamera={handleToggleCamera}
      />

      {/* Capture Confirmation Toast */}
      {captureToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 hud-overlay shadow-[0_0_24px_rgba(6,214,240,0.28)]">
          <span className="font-mono text-xs text-[#10B981] font-semibold">
            CAPTURED {captureToast}
          </span>
          <button
            type="button"
            onClick={() => {
              setCaptureToast(null);
              setActiveScreen('sessions');
            }}
            className="text-xs font-semibold text-[#06D6F0] hover:underline whitespace-nowrap"
          >
            Inspect Frame
          </button>
        </div>
      )}

      {/* Main 12-Column Responsive Canvas Workspace */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
        {activeScreen === 'vision' && (
          <LiveVisionScreen
            landmarks={landmarks}
            activeGesture={activeGesture}
            onSelectGesture={setActiveGesture}
            gestureProbabilities={gestureProbs}
            diagnosticState={diagnosticState}
            onSelectDiagnosticState={setDiagnosticState}
            fps={fps}
            latencyMs={latencyMs}
            confidence={confidence}
            pinchApertureMm={pinchApertureMm}
            telemetryHistory={telemetryHistory}
            calibration={calibration}
            activeModel={activeModel}
            backend={backend}
            bindings={bindings}
            selectedLandmarkId={selectedLandmarkId}
            onSelectLandmarkId={setSelectedLandmarkId}
            layers={layers}
            onToggleLayer={handleToggleLayer}
            frozen={frozen}
            onToggleFrozen={() => setFrozen((f) => !f)}
            cameraActive={cameraActive}
            cameraError={cameraError}
            videoStream={videoStream}
            onPointerPoseChange={handlePointerPoseChange}
            onPinchHoldChange={handlePinchHoldChange}
            onDepthDelta={handleDepthDelta}
            onCaptureFrame={handleCaptureFrame}
            captureFlash={captureFlash}
          />
        )}

        {activeScreen === 'calibration' && (
          <CalibrationScreen
            calibration={calibration}
            onUpdateCalibration={setCalibration}
            bindings={bindings}
            onToggleBinding={handleToggleBinding}
            onDeleteBinding={handleDeleteBinding}
            onAddBinding={handleAddBinding}
            livePinchMm={pinchApertureMm}
            liveConfidence={confidence}
          />
        )}

        {activeScreen === 'pipeline' && (
          <NeuralPipelineScreen
            activeModelId={activeModelId}
            onSelectModel={setActiveModelId}
            backend={backend}
            onSelectBackend={setBackend}
            liveLatencyMs={latencyMs}
            liveFps={fps}
          />
        )}

        {activeScreen === 'sessions' && (
          <SessionsScreen
            captures={captures}
            selectedCaptureId={selectedCaptureId}
            onSelectCaptureId={setSelectedCaptureId}
            onUpdateNotes={handleUpdateCaptureNotes}
            onDeleteCapture={handleDeleteCapture}
            onJumpToVision={() => setActiveScreen('vision')}
          />
        )}
      </main>
    </div>
  );
}
