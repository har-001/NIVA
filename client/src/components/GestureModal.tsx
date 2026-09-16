'use client';

// ============================================
// NIVA — Real Optical Hand Gesture & Air Drawing Modal
// Guaranteed Hardware Shutdown & Enhanced Palm Detection
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './GestureModal.module.css';
import { opticalGestureRecognizer, OpticalGestureResult } from '../lib/gestures';
import { registerCameraStream, stopStreamCompletely, terminateAllCamerasGlobally } from '../lib/cameraHardware';

interface GestureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (actionName: string) => void;
}

export const GestureModal: React.FC<GestureModalProps> = ({
  isOpen,
  onClose,
  onTriggerAction,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [isCameraPowered, setIsCameraPowered] = useState<boolean>(true);
  const [detectedGesture, setDetectedGesture] = useState<OpticalGestureResult | null>(null);
  const [isAirDrawingMode, setIsAirDrawingMode] = useState<boolean>(true);
  const [activeColor, setActiveColor] = useState<string>('#38bdf8');
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Strict Camera Shutdown: Guarantees hardware stops immediately and cannot leak
  const stopCamera = useCallback(() => {
    isCancelledRef.current = true;
    if (streamRef.current) {
      stopStreamCompletely(streamRef.current, videoRef.current);
      streamRef.current = null;
    } else if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.load();
      } catch {}
    }
    terminateAllCamerasGlobally();
    setStreamActive(false);
  }, []);

  // Start Camera with race-condition immunity
  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      isCancelledRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      // If user closed modal while awaiting camera permission/hardware
      if (isCancelledRef.current) {
        stopStreamCompletely(stream, videoRef.current);
        terminateAllCamerasGlobally();
        return;
      }

      streamRef.current = stream;
      registerCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setStreamActive(true);
      }
    } catch (err) {
      console.warn('Gesture camera error:', err);
      stopCamera();
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen && isCameraPowered) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, isCameraPowered, startCamera, stopCamera]);

  // Real Optical Hand & Palm Processing Loop
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const hudCanvas = hudCanvasRef.current;
      const drawCanvas = drawingCanvasRef.current;
      const video = videoRef.current;

      if (!hudCanvas || !video || !streamActive || video.readyState < 2) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = hudCanvas.getContext('2d');
      if (!ctx) return;

      hudCanvas.width = video.videoWidth || 640;
      hudCanvas.height = video.videoHeight || 480;
      if (drawCanvas && (drawCanvas.width === 0 || drawCanvas.width !== hudCanvas.width)) {
        drawCanvas.width = hudCanvas.width;
        drawCanvas.height = hudCanvas.height;
      }

      ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

      // Run real computer vision analysis on actual webcam video frames
      const result = opticalGestureRecognizer.processFrame(video, hudCanvas.width, hudCanvas.height);
      setDetectedGesture(result);

      // Draw real detected hand bounding box & centroid on HUD
      if (result.handBox) {
        const { x, y, width, height } = result.handBox;
        const isPalm = result.gesture === 'OPEN_PALM';

        // Bounding Box
        ctx.strokeStyle = isPalm ? '#10b981' : '#38bdf8';
        ctx.lineWidth = isPalm ? 3 : 2;
        ctx.strokeRect(x, y, width, height);

        // Corner accents
        const cLen = 16;
        ctx.lineWidth = 4;
        ctx.strokeStyle = isPalm ? '#34d399' : '#60a5fa';

        // TL
        ctx.beginPath();
        ctx.moveTo(x, y + cLen); ctx.lineTo(x, y); ctx.lineTo(x + cLen, y); ctx.stroke();
        // TR
        ctx.beginPath();
        ctx.moveTo(x + width - cLen, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cLen); ctx.stroke();
        // BL
        ctx.beginPath();
        ctx.moveTo(x, y + height - cLen); ctx.lineTo(x, y + height); ctx.lineTo(x + cLen, y + height); ctx.stroke();
        // BR
        ctx.beginPath();
        ctx.moveTo(x + width - cLen, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cLen); ctx.stroke();

        // Distinct Palm Target Visualizer
        if (result.centroid) {
          if (isPalm) {
            // Concentric glowing palm target rings
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(result.centroid.x, result.centroid.y, 30, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(result.centroid.x, result.centroid.y, 16, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.fill();
            ctx.stroke();

            // Palm label tag
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('✋ PALM LOCK', result.centroid.x - 40, result.centroid.y - 38);
          } else {
            ctx.beginPath();
            ctx.arc(result.centroid.x, result.centroid.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fill();
          }
        }

        // Finger Peaks
        result.fingerPeaks.forEach((pt, i) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Peak index text
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`F${i + 1}`, pt.x + 8, pt.y + 4);
        });

        // Air Drawing with Pointing finger
        if (isAirDrawingMode && drawCanvas && result.gesture === 'POINTING' && result.fingerPeaks.length > 0) {
          const pt = result.fingerPeaks[0];
          const drawCtx = drawCanvas.getContext('2d');
          if (drawCtx) {
            if (lastPoint) {
              drawCtx.strokeStyle = activeColor;
              drawCtx.lineWidth = 4;
              drawCtx.lineCap = 'round';
              drawCtx.shadowBlur = 8;
              drawCtx.shadowColor = activeColor;
              drawCtx.beginPath();
              drawCtx.moveTo(lastPoint.x, lastPoint.y);
              drawCtx.lineTo(pt.x, pt.y);
              drawCtx.stroke();
            }
            setLastPoint(pt);
          }
        } else {
          setLastPoint(null);
        }

        // Trigger action if hold duration passed
        if (opticalGestureRecognizer.canTrigger()) {
          if (result.gesture === 'OPEN_PALM') {
            onTriggerAction?.('mute_speech');
          } else if (result.gesture === 'PEACE') {
            onTriggerAction?.('system_screenshot');
          } else if (result.gesture === 'FIST') {
            handleCloseModal();
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    if (streamActive) {
      animId = requestAnimationFrame(renderLoop);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [streamActive, isAirDrawingMode, activeColor, lastPoint, onTriggerAction]);

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    onClose();
  };

  const toggleCameraPower = () => {
    if (isCameraPowered) {
      stopCamera();
      setIsCameraPowered(false);
    } else {
      setIsCameraPowered(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleCloseModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <span>✋ NIVA Optical Gesture &amp; Palm Tracking</span>
            <span
              className={styles.activeBadge}
              style={{
                color: streamActive ? '#10b981' : '#ef4444',
                borderColor: streamActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
              }}
            >
              {streamActive ? '● Camera Active' : '○ Camera OFF / Standby'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={styles.toolBtn}
              onClick={toggleCameraPower}
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                backgroundColor: isCameraPowered ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isCameraPowered ? '#f87171' : '#34d399',
                borderColor: isCameraPowered ? '#f87171' : '#34d399',
              }}
              type="button"
            >
              {isCameraPowered ? '🛑 Turn Off Camera' : '▶️ Turn On Camera'}
            </button>
            <button className={styles.closeBtn} onClick={handleCloseModal} type="button">
              &times;
            </button>
          </div>
        </div>

        {/* Video & Tracking Canvas Area */}
        <div className={styles.stageArea}>
          <video ref={videoRef} className={styles.videoElement} playsInline muted />
          <canvas ref={hudCanvasRef} className={styles.hudCanvas} />
          <canvas ref={drawingCanvasRef} className={styles.drawingCanvas} />

          {/* Detected Gesture HUD Card */}
          {detectedGesture && (
            <div className={styles.gestureHUDCard}>
              <span
                className={styles.gestureName}
                style={{
                  color: detectedGesture.gesture === 'OPEN_PALM' ? '#34d399' : '#38bdf8',
                }}
              >
                {detectedGesture.label}
              </span>
              <span className={styles.gestureAction}>{detectedGesture.actionDescription}</span>
              <div className={styles.confidenceBar}>
                <div
                  className={styles.confidenceFill}
                  style={{
                    width: `${detectedGesture.confidence}%`,
                    backgroundColor: detectedGesture.gesture === 'OPEN_PALM' ? '#10b981' : '#38bdf8',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className={styles.legendRow}>
          <div className={styles.legendItem}><span>✋</span> Open Palm: Mute Speech</div>
          <div className={styles.legendItem}><span>✌️</span> Peace: Screenshot</div>
          <div className={styles.legendItem}><span>☝️</span> Point: Air Draw</div>
          <div className={styles.legendItem}><span>✊</span> Fist: Minimize</div>
        </div>

        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.btnGroup}>
            <button
              className={`${styles.toolBtn} ${isAirDrawingMode ? styles.activeToolBtn : ''}`}
              onClick={() => setIsAirDrawingMode(!isAirDrawingMode)}
              type="button"
            >
              ✏️ {isAirDrawingMode ? 'Air Drawing: ON' : 'Air Drawing: OFF'}
            </button>
            <button className={styles.toolBtn} onClick={clearDrawing} type="button">
              🧹 Clear Canvas
            </button>
          </div>

          <div className={styles.btnGroup}>
            {['#38bdf8', '#34d399', '#f43f5e', '#a855f7'].map((c) => (
              <button
                key={c}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c,
                  border: activeColor === c ? '2px solid white' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveColor(c)}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
