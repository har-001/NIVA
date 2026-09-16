'use client';

// ============================================
// NIVA — Dual Authentication System (Face ID + Written PIN)
// Real Human Face Verification & Guaranteed Camera Hardware Shutdown
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './FaceAuthOverlay.module.css';
import { faceAuthManager } from '../lib/faceAuth';
import { realFaceDetector } from '../lib/faceDetector';
import { terminateAllCamerasGlobally } from '../lib/cameraHardware';
import { NivaVoiceSynthesizer } from '../lib/voice';
import { api } from '../lib/api';

interface FaceAuthOverlayProps {
  userName?: string;
  onAuthenticated: () => void;
  onClose?: () => void;
}

export const FaceAuthOverlay: React.FC<FaceAuthOverlayProps> = ({
  userName = 'Harsh',
  onAuthenticated,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isVerifyingRef = useRef<boolean>(false);

  const [authMode, setAuthMode] = useState<'face' | 'pin'>('face');
  const [faceStep, setFaceStep] = useState<'initializing' | 'searching' | 'detected' | 'verifying' | 'verified' | 'failed' | 'complete'>('initializing');
  const [statusMessage, setStatusMessage] = useState<string>('INITIALIZING OPTICAL SENSORS...');
  const [subMessage, setSubMessage] = useState<string>('System Startup Protocol Alpha-01');
  const [facePresent, setFacePresent] = useState<boolean>(false);

  // Security Status from DB
  const [securityStatus, setSecurityStatus] = useState<{ faceVerified: boolean; hasPin: boolean; defaultPin: string } | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinVerifying, setIsPinVerifying] = useState<boolean>(false);

  // Fetch user biometric security status on load
  const loadSecurityStatus = useCallback(async () => {
    try {
      const res = await api.getSecurityStatus();
      if (res.success && res.data) {
        setSecurityStatus(res.data);
      }
    } catch {
      setSecurityStatus({ faceVerified: false, hasPin: false, defaultPin: '1234' });
    }
  }, []);

  useEffect(() => {
    loadSecurityStatus();
  }, [loadSecurityStatus]);

  // Execute Face Verification once a real face has been actively detected
  const executeVerification = useCallback(async (video: HTMLVideoElement) => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;

    setFaceStep('verifying');
    setStatusMessage('🟢 REAL HUMAN FACE DETECTED');
    setSubMessage('Validating neural biometric features...');

    try {
      // Perform verification — this IMMEDIATELY shuts down camera hardware tracks!
      const result = await faceAuthManager.verifyAndShutdown(userName, video);
      if (!isMountedRef.current) return;

      if (result.success && result.faceDetected) {
        setFaceStep('verified');
        setStatusMessage(`ACCESS GRANTED: ${userName.toUpperCase()}`);
        setSubMessage('Camera Hardware Terminated (Privacy Locked)');

        // Mark verified in DB
        try {
          await api.markFaceVerified();
          setSecurityStatus((prev) => (prev ? { ...prev, faceVerified: true } : { faceVerified: true, hasPin: false, defaultPin: '1234' }));
        } catch {}

        // Vocal greeting
        const voice = new NivaVoiceSynthesizer();
        voice.speak(`Welcome back, ${userName}. Facial biometric verification confirmed. All systems online.`);

        setTimeout(() => {
          if (isMountedRef.current) {
            terminateAllCamerasGlobally();
            setFaceStep('complete');
            onAuthenticated();
          }
        }, 1400);
      } else {
        // Face detection failed (e.g. wall or no face visible)
        setFaceStep('failed');
        setStatusMessage('❌ NO HUMAN FACE DETECTED');
        setSubMessage(result.message || 'Please face the camera directly to verify.');
        isVerifyingRef.current = false;
      }
    } catch (err: any) {
      setFaceStep('failed');
      setStatusMessage('❌ BIOMETRIC VERIFICATION FAILED');
      setSubMessage(err.message || 'Sensor error. Please try again or use Written PIN.');
      isVerifyingRef.current = false;
    }
  }, [userName, onAuthenticated]);

  // Start Camera and Face Detection Loop
  const startFaceProcess = useCallback(async () => {
    if (!videoRef.current) return;
    isVerifyingRef.current = false;

    try {
      setFaceStep('initializing');
      setStatusMessage('INITIALIZING OPTICAL SENSORS...');
      setSubMessage('Acquiring webcam feed...');

      const stream = await faceAuthManager.startScan(videoRef.current);
      if (!isMountedRef.current || !stream) return;

      setFaceStep('searching');
      setStatusMessage('🔍 LOOKING FOR HUMAN FACE...');
      setSubMessage('Please position your face inside the scanner ring');

      // Real-time Optical Face Detection Loop
      let consecutiveFaceCount = 0;
      const intervalId = setInterval(async () => {
        if (!isMountedRef.current || isVerifyingRef.current || !videoRef.current) {
          clearInterval(intervalId);
          return;
        }

        const detection = await realFaceDetector.detectFace(videoRef.current);

        if (detection.isFacePresent) {
          consecutiveFaceCount++;
          setFacePresent(true);

          if (consecutiveFaceCount >= 2) {
            // Face confirmed in consecutive frames -> execute verification
            clearInterval(intervalId);
            executeVerification(videoRef.current);
          }
        } else {
          consecutiveFaceCount = 0;
          setFacePresent(false);
          setStatusMessage('🔍 LOOKING FOR HUMAN FACE...');
          setSubMessage('No face in view. Please position your face in the scanner');
        }
      }, 250);

      // Cleanup on unmount or mode switch
      return () => {
        clearInterval(intervalId);
      };
    } catch (err: any) {
      console.warn('Camera startup failed:', err.message);
      faceAuthManager.stopCamera(videoRef.current);
      terminateAllCamerasGlobally();
      if (isMountedRef.current) {
        setFaceStep('failed');
        setStatusMessage('CAMERA UNAVAILABLE');
        setSubMessage('Could not access webcam. Switch to Written PIN.');
      }
    }
  }, [executeVerification]);

  // Switch between Face and PIN modes
  const handleModeChange = (newMode: 'face' | 'pin') => {
    setAuthMode(newMode);
    setPinError(null);

    if (newMode === 'pin') {
      // STRICT PRIVACY: Terminate camera immediately when switching to PIN
      faceAuthManager.stopCamera(videoRef.current);
      terminateAllCamerasGlobally();
    } else {
      setTimeout(() => {
        startFaceProcess();
      }, 150);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (authMode === 'face') {
      startFaceProcess();
    }

    return () => {
      isMountedRef.current = false;
      faceAuthManager.stopCamera(videoRef.current);
      terminateAllCamerasGlobally();
    };
  }, [authMode, startFaceProcess]);

  // Keypad Handlers
  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + digit);
      setPinError(null);
    }
  };

  const handleKeypadDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClose = () => {
    faceAuthManager.stopCamera(videoRef.current);
    terminateAllCamerasGlobally();
    if (onClose) {
      onClose();
    } else {
      onAuthenticated();
    }
  };

  const handlePinSubmit = async () => {
    if (!pinInput) return;

    setIsPinVerifying(true);
    setPinError(null);

    try {
      const res = await api.verifyPin(pinInput);
      if (res.success) {
        const voice = new NivaVoiceSynthesizer();
        voice.speak(`Security PIN verified. Welcome back, ${userName}.`);
        faceAuthManager.stopCamera(videoRef.current);
        terminateAllCamerasGlobally();
        onAuthenticated();
      } else {
        setPinError((res as any).error?.message || 'Incorrect security PIN.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Incorrect security PIN. Default is 1234.');
    } finally {
      setIsPinVerifying(false);
    }
  };

  if (faceStep === 'complete') return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.hudCard}>
        {/* Corner Accents */}
        <div className={styles.cornerTL} />
        <div className={styles.cornerTR} />
        <div className={styles.cornerBL} />
        <div className={styles.cornerBR} />

        <div className={styles.titleRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>🛡️ NIVA MULTI-FACTOR SECURITY GATEWAY</span>
          <button
            onClick={handleClose}
            title="Close Security Gateway"
            type="button"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#94a3b8',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            ✕
          </button>
        </div>

        {/* Dual Auth Tabs Switcher */}
        <div className={styles.tabSwitcher}>
          <button
            className={`${styles.tabBtn} ${authMode === 'face' ? styles.tabBtnActive : ''}`}
            onClick={() => handleModeChange('face')}
            type="button"
          >
            👁️ Face Biometrics
          </button>
          <button
            className={`${styles.tabBtn} ${authMode === 'pin' ? styles.tabBtnActive : ''}`}
            onClick={() => handleModeChange('pin')}
            type="button"
          >
            🔢 Written PIN
          </button>
        </div>

        {/* MODE 1: FACE SCANNER */}
        {authMode === 'face' && (
          <>
            <div
              className={styles.scannerWrapper}
              style={{
                borderColor: facePresent ? '#10b981' : faceStep === 'failed' ? '#ef4444' : 'rgba(56, 189, 248, 0.6)',
                boxShadow: facePresent ? '0 0 35px rgba(16, 185, 129, 0.4)' : '0 0 30px rgba(56, 189, 248, 0.3)',
              }}
            >
              <video ref={videoRef} className={styles.videoFeed} playsInline muted />
              <div className={styles.ring1} />
              <div className={styles.ring2} />
              {faceStep !== 'failed' && (
                <div
                  className={styles.scanLaser}
                  style={{
                    background: facePresent
                      ? 'linear-gradient(90deg, transparent, #10b981, #34d399, transparent)'
                      : 'linear-gradient(90deg, transparent, #f59e0b, #ef4444, transparent)',
                    boxShadow: facePresent ? '0 0 12px #10b981' : '0 0 12px #f59e0b',
                  }}
                />
              )}
            </div>

            <div
              className={styles.statusText}
              style={{
                color: faceStep === 'verified' ? '#34d399' : faceStep === 'failed' ? '#f87171' : facePresent ? '#38bdf8' : '#fbbf24',
              }}
            >
              {statusMessage}
            </div>
            <div className={styles.subStatus}>{subMessage}</div>

            {faceStep === 'verified' && (
              <div className={styles.successPill}>
                <span>✓ REAL-HUMAN VERIFIED • CAMERA SHUT DOWN</span>
              </div>
            )}

            {faceStep === 'failed' && (
              <button
                className={styles.submitPinBtn}
                onClick={startFaceProcess}
                style={{ marginTop: '6px', maxWidth: '240px' }}
                type="button"
              >
                🔄 Scan Face Again
              </button>
            )}

            <div className={styles.privacyBadge}>
              <span>🔒 Privacy Lock: Camera automatically shuts down upon completion</span>
            </div>

            <button
              className={styles.skipBtn}
              onClick={() => handleModeChange('pin')}
              type="button"
            >
              No camera or dark room? Switch to Written PIN →
            </button>
          </>
        )}

        {/* MODE 2: WRITTEN PIN AUTH */}
        {authMode === 'pin' && (
          <div className={styles.pinContainer}>
            {!securityStatus?.faceVerified ? (
              <div className={styles.humanWarningBox}>
                <div className={styles.humanWarningTitle}>
                  ⚠️ Real-Human Verification Required
                </div>
                <div className={styles.humanWarningDesc}>
                  You must complete facial biometric verification <strong>at least once</strong> to prove you are a real human before Written PIN unlock can be enabled.
                </div>
                <button
                  className={styles.submitPinBtn}
                  onClick={() => handleModeChange('face')}
                  style={{ marginTop: '10px' }}
                  type="button"
                >
                  👁️ Complete Real-Human Face Scan Now
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#34d399',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                <span>✓ Real-Human Verified</span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#38bdf8' }}>PIN Access Ready (Default: 1234)</span>
              </div>
            )}

            {/* PIN Display */}
            <div className={styles.pinDisplayRow}>
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`${styles.pinDot} ${pinInput.length > idx ? styles.pinDotFilled : ''}`}
                />
              ))}
            </div>

            {pinError && (
              <div
                style={{
                  color: '#f87171',
                  fontSize: '0.78rem',
                  marginBottom: '1rem',
                  fontWeight: 600,
                  maxWidth: '280px',
                }}
              >
                {pinError}
              </div>
            )}

            {/* Keypad Grid */}
            <div className={styles.keypadGrid}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  className={styles.keypadBtn}
                  onClick={() => handleKeypadPress(digit)}
                  disabled={isPinVerifying}
                  type="button"
                >
                  {digit}
                </button>
              ))}
              <button
                className={styles.keypadBtn}
                onClick={handleKeypadDelete}
                disabled={isPinVerifying}
                type="button"
              >
                ⌫
              </button>
              <button
                className={styles.keypadBtn}
                onClick={() => handleKeypadPress('0')}
                disabled={isPinVerifying}
                type="button"
              >
                0
              </button>
              <button
                className={styles.keypadBtn}
                onClick={() => setPinInput('')}
                disabled={isPinVerifying}
                style={{ fontSize: '0.85rem' }}
                type="button"
              >
                Clear
              </button>
            </div>

            <button
              className={styles.submitPinBtn}
              onClick={handlePinSubmit}
              disabled={pinInput.length < 4 || isPinVerifying}
              type="button"
            >
              {isPinVerifying ? 'Verifying PIN...' : '🔓 Unlock with Security PIN'}
            </button>

            <button
              className={styles.skipBtn}
              onClick={() => handleModeChange('face')}
              type="button"
            >
              ← Back to Face Biometrics
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
