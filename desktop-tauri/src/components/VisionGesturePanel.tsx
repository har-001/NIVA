import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './VisionGesturePanel.module.css';
import { NivaCameraManager } from '../lib/cameraManager';
import { NivaGestureEngine, DEFAULT_GESTURE_ACTIONS } from '../lib/gestureEngine';
import type { Landmark, GestureType } from '../lib/gestureClassifier';

interface GestureLogEntry {
  emoji: string;
  action: string;
  gesture: GestureType;
  confidence: number;
  time: string;
}

interface VisionGesturePanelProps {
  onGestureAction?: (action: string, gesture: GestureType) => void;
}

export const VisionGesturePanel: React.FC<VisionGesturePanelProps> = ({ onGestureAction }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<{
    gesture: GestureType;
    confidence: number;
    emoji: string;
  } | null>(null);
  const [gestureLog, setGestureLog] = useState<GestureLogEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<NivaCameraManager | null>(null);
  const engineRef = useRef<NivaGestureEngine | null>(null);
  const gestureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize camera & engine refs
  useEffect(() => {
    cameraRef.current = new NivaCameraManager();
    engineRef.current = new NivaGestureEngine();

    return () => {
      // Cleanup: Zero Camera Leak Rule
      cameraRef.current?.stopCamera();
      engineRef.current?.stopProcessing();
    };
  }, []);

  const drawLandmarks = useCallback((landmarks: Landmark[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    if (video) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections between landmarks
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // index
      [0, 9], [9, 10], [10, 11], [11, 12],  // middle
      [0, 13], [13, 14], [14, 15], [15, 16], // ring
      [0, 17], [17, 18], [18, 19], [19, 20], // pinky
      [5, 9], [9, 13], [13, 17],             // palm
    ];

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 2;

    for (const [a, b] of connections) {
      const la = landmarks[a];
      const lb = landmarks[b];
      ctx.beginPath();
      ctx.moveTo(la.x * canvas.width, la.y * canvas.height);
      ctx.lineTo(lb.x * canvas.width, lb.y * canvas.height);
      ctx.stroke();
    }

    // Draw landmark dots
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const x = lm.x * canvas.width;
      const y = lm.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      // Fingertips get brighter color
      if ([4, 8, 12, 16, 20].includes(i)) {
        ctx.fillStyle = '#38bdf8';
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      }
      ctx.fill();
    }
  }, []);

  const clearLandmarks = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleStartVision = async () => {
    if (!videoRef.current || !cameraRef.current || !engineRef.current) return;

    setErrorMsg(null);

    const stream = await cameraRef.current.requestCameraAccess(videoRef.current);
    if (!stream) {
      setErrorMsg('Camera access denied. Please allow camera permission.');
      return;
    }

    setCameraActive(true);

    const initialized = await engineRef.current.initialize();
    if (!initialized) {
      // MediaPipe not loaded — still show camera but no gesture detection
      setErrorMsg('MediaPipe not loaded. Camera active, gestures disabled.');
      return;
    }

    // Wire up gesture callbacks
    engineRef.current.onLandmarksDetected = drawLandmarks;
    engineRef.current.onHandLost = clearLandmarks;

    engineRef.current.onGestureDetected = (event) => {
      const mapping = engineRef.current?.getActionForGesture(event.gesture);
      if (!mapping) return;

      setCurrentGesture({
        gesture: event.gesture,
        confidence: event.confidence,
        emoji: mapping.emoji,
      });

      // Clear gesture badge after 1.5s
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
      gestureTimeoutRef.current = setTimeout(() => setCurrentGesture(null), 1500);

      // Add to log (keep last 5)
      const entry: GestureLogEntry = {
        emoji: mapping.emoji,
        action: mapping.label,
        gesture: event.gesture,
        confidence: event.confidence,
        time: new Date().toLocaleTimeString(),
      };
      setGestureLog((prev) => [entry, ...prev].slice(0, 5));

      // Dispatch action to parent
      onGestureAction?.(mapping.action, event.gesture);
    };

    engineRef.current.startProcessing(videoRef.current);
  };

  const handleStopVision = () => {
    engineRef.current?.stopProcessing();
    cameraRef.current?.stopCamera();
    setCameraActive(false);
    setCurrentGesture(null);
    clearLandmarks();
  };

  return (
    <div className={styles.visionPanel}>
      <div className={styles.cameraContainer}>
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              className={styles.cameraFeed}
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className={styles.landmarkCanvas} />

            <div className={styles.liveIndicator}>
              <div className={styles.liveDot} />
              CAMERA LIVE
            </div>

            {currentGesture && (
              <div className={styles.gestureBadge}>
                <span>{currentGesture.emoji}</span>
                <span>{currentGesture.gesture.replace('_', ' ').toUpperCase()}</span>
                <div className={styles.confidenceBar}>
                  <div
                    className={styles.confidenceFill}
                    style={{ width: `${Math.round(currentGesture.confidence * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <video ref={videoRef} style={{ display: 'none' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className={styles.cameraInactive}>
              📷 Camera Off<br />
              Click &quot;Start Vision&quot; to enable hand gesture control
            </div>
          </>
        )}
      </div>

      {errorMsg && (
        <div style={{ fontSize: '10px', color: '#f87171', padding: '4px 0' }}>{errorMsg}</div>
      )}

      <div className={styles.visionControls}>
        {!cameraActive ? (
          <button
            type="button"
            className={`${styles.visionBtn} ${styles.startBtn}`}
            onClick={handleStartVision}
          >
            👁️ Start Vision
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.visionBtn} ${styles.stopBtn}`}
            onClick={handleStopVision}
          >
            ⏹ Stop Vision
          </button>
        )}
      </div>

      {/* Gesture action log */}
      {gestureLog.length > 0 && (
        <div className={styles.gestureLog}>
          {gestureLog.map((entry, i) => (
            <div key={`${entry.time}-${i}`} className={styles.gestureLogItem}>
              <span className={styles.gestureLogEmoji}>{entry.emoji}</span>
              <span className={styles.gestureLogAction}>{entry.action}</span>
              <span className={styles.gestureLogTime}>{entry.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gesture mapping reference */}
      <div className={styles.mappingGrid}>
        {DEFAULT_GESTURE_ACTIONS.map((m) => (
          <div key={m.gesture} className={styles.mappingItem}>
            <span className={styles.mappingEmoji}>{m.emoji}</span>
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
