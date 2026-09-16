'use client';

// ============================================
// NIVA — Vision & Face Recognition Modal
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './VisionModal.module.css';
import { registerCameraStream, stopStreamCompletely, terminateAllCamerasGlobally } from '../lib/cameraHardware';

interface VisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisResult?: (description: string) => void;
  token?: string | null;
}

export const VisionModal: React.FC<VisionModalProps> = ({
  isOpen,
  onClose,
  onAnalysisResult,
  token,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const isCancelledRef = useRef<boolean>(false);

  // Stop Camera Feed with guaranteed track release
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

  // Start Camera Feed
  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      isCancelledRef.current = false;
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

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
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Camera permission denied or camera unavailable');
      stopCamera();
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Simulated HUD Face Tracking Overlay on Canvas
  useEffect(() => {
    let animationFrameId: number;

    const drawHUD = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || !streamActive) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw simulated face detection bounding box in center
      const boxW = canvas.width * 0.35;
      const boxH = canvas.height * 0.45;
      const boxX = (canvas.width - boxW) / 2;
      const boxY = (canvas.height - boxH) / 2 - 20;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Corner indicators
      const cornerLen = 20;
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 4;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + cornerLen);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + cornerLen, boxY);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - cornerLen, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - cornerLen);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + cornerLen, boxY + boxH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
      ctx.stroke();

      // Face tracking status tag
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(boxX, boxY - 26, 170, 22);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('👤 FACE LOCK 98.4%', boxX + 8, boxY - 10);

      animationFrameId = requestAnimationFrame(drawHUD);
    };

    if (streamActive) {
      animationFrameId = requestAnimationFrame(drawHUD);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [streamActive]);

  // Capture frame and send to NIVA Vision API
  const handleCaptureAndAnalyze = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Capture frame to temporary canvas
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = video.videoWidth || 640;
      snapCanvas.height = video.videoHeight || 480;
      const snapCtx = snapCanvas.getContext('2d');
      if (snapCtx) {
        snapCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
      }
      const base64Data = snapCanvas.toDataURL('image/jpeg', 0.85);

      // Immediately shut down and release camera hardware for privacy
      stopCamera();

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const authToken = token || localStorage.getItem('niva_token');

      const response = await fetch(`${API_URL}/api/v1/vision/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          image: base64Data,
          prompt: 'Identify the user, analyze their expression, detect visible objects, and describe what is visible.',
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setAnalysisResult(data.data);
      } else {
        setAnalysisResult({
          description: data.error || 'Could not analyze image.',
          source: 'error',
        });
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setAnalysisResult({
        description: `Analysis request error: ${err.message}`,
        source: 'error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendToChat = () => {
    if (analysisResult?.description && onAnalysisResult) {
      onAnalysisResult(analysisResult.description);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <span>👁️ NIVA Vision & Face Recognition</span>
            <span className={styles.statusPill}>
              {streamActive ? '● Camera Live' : '○ Standby'}
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {/* Viewport with Video and Canvas HUD */}
        <div className={styles.viewportArea}>
          {cameraError ? (
            <div style={{ color: '#f87171', padding: '2rem', textAlign: 'center' }}>
              ⚠️ {cameraError}
            </div>
          ) : (
            <>
              <video ref={videoRef} className={styles.videoElement} playsInline muted />
              <canvas ref={canvasRef} className={styles.canvasOverlay} />
              <div className={styles.scannerCrosshair}>
                <div className={styles.scannerLine} />
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className={styles.controlsBar}>
          <button
            className={`${styles.actionBtn} ${styles.primaryScanBtn}`}
            onClick={handleCaptureAndAnalyze}
            disabled={isAnalyzing || !streamActive}
            type="button"
          >
            {isAnalyzing ? '⚡ Analyzing with NIVA...' : '📸 Capture & Recognize'}
          </button>

          {analysisResult && (
            <button
              className={`${styles.actionBtn} ${styles.secondaryBtn}`}
              onClick={handleSendToChat}
              type="button"
            >
              💬 Send to Chat
            </button>
          )}
        </div>

        {/* Results Panel */}
        {analysisResult && (
          <div className={styles.resultsPanel}>
            <div className={styles.resultsTitle}>
              🔍 Visual Recognition Summary ({analysisResult.source.toUpperCase()})
            </div>
            <div className={styles.resultsDescription}>
              {analysisResult.description}
            </div>
            {analysisResult.detectedObjects && (
              <div className={styles.tagsRow}>
                {analysisResult.detectedObjects.map((obj: string, i: number) => (
                  <span key={i} className={styles.detectedTag}>
                    🏷️ {obj}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
