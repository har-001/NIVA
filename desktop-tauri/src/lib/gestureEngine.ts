// ============================================
// NIVA — Gesture Detection Engine
// Integrates MediaPipe Hands with cooldown deduplication
// ============================================

import { classifyGesture, GestureType, GestureResult, Landmark } from './gestureClassifier';

export interface GestureEvent {
  gesture: GestureType;
  confidence: number;
  timestamp: number;
}

export interface GestureActionMapping {
  gesture: GestureType;
  action: string;
  label: string;
  emoji: string;
}

// Default gesture → action mappings
export const DEFAULT_GESTURE_ACTIONS: GestureActionMapping[] = [
  { gesture: 'fist', action: 'mute_voice', label: 'Mute / Unmute Voice', emoji: '✊' },
  { gesture: 'open_palm', action: 'stop_action', label: 'Stop / Cancel', emoji: '✋' },
  { gesture: 'point_up', action: 'volume_up', label: 'Scroll Up / Volume Up', emoji: '👆' },
  { gesture: 'point_down', action: 'volume_down', label: 'Scroll Down / Volume Down', emoji: '👇' },
  { gesture: 'peace', action: 'toggle_hud', label: 'Toggle HUD', emoji: '✌️' },
  { gesture: 'thumbs_up', action: 'confirm', label: 'Confirm / Yes', emoji: '👍' },
  { gesture: 'rock', action: 'lock_pc', label: 'Lock Workstation', emoji: '🤟' },
];

const CONFIDENCE_THRESHOLD = 0.75;
const COOLDOWN_MS = 800;

export class NivaGestureEngine {
  private isRunning = false;
  private lastGesture: GestureType = 'none';
  private lastGestureTime = 0;
  private animFrameId: number | null = null;
  private hands: any = null;
  private gestureActions: GestureActionMapping[] = [...DEFAULT_GESTURE_ACTIONS];

  public onGestureDetected?: (event: GestureEvent) => void;
  public onLandmarksDetected?: (landmarks: Landmark[]) => void;
  public onHandLost?: () => void;

  /**
   * Initialize MediaPipe Hands.
   * MediaPipe is loaded via CDN script tags in index.html,
   * so the global `Hands` class should be available on window.
   */
  public async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const win = window as any;
    if (!win.Hands) {
      console.warn('[GestureEngine] MediaPipe Hands not loaded. Check CDN script tags in index.html.');
      return false;
    }

    try {
      this.hands = new win.Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // lite model for speed
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      this.hands.onResults((results: any) => {
        this.processResults(results);
      });

      return true;
    } catch (err) {
      console.error('[GestureEngine] Initialization failed:', err);
      return false;
    }
  }

  /**
   * Start processing video frames for gesture detection.
   */
  public startProcessing(videoElement: HTMLVideoElement): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const processFrame = async () => {
      if (!this.isRunning || !this.hands) return;

      if (videoElement.readyState >= 2) {
        try {
          await this.hands.send({ image: videoElement });
        } catch (err) {
          // Frame send errors are non-fatal, skip silently
        }
      }

      // ~15 FPS processing (every ~66ms) to save CPU
      this.animFrameId = window.setTimeout(() => {
        requestAnimationFrame(processFrame);
      }, 66) as unknown as number;
    };

    requestAnimationFrame(processFrame);
  }

  /**
   * Stop gesture processing loop.
   */
  public stopProcessing(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      window.clearTimeout(this.animFrameId);
      this.animFrameId = null;
    }
    this.lastGesture = 'none';
  }

  /**
   * Process MediaPipe results — extract landmarks and classify gesture.
   */
  private processResults(results: any): void {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.onHandLost?.();
      return;
    }

    const landmarks: Landmark[] = results.multiHandLandmarks[0];
    this.onLandmarksDetected?.(landmarks);

    const result: GestureResult = classifyGesture(landmarks);

    if (result.gesture === 'none' || result.confidence < CONFIDENCE_THRESHOLD) {
      return;
    }

    // Cooldown deduplication: don't fire same gesture within COOLDOWN_MS
    const now = Date.now();
    if (result.gesture === this.lastGesture && (now - this.lastGestureTime) < COOLDOWN_MS) {
      return;
    }

    this.lastGesture = result.gesture;
    this.lastGestureTime = now;

    const event: GestureEvent = {
      gesture: result.gesture,
      confidence: result.confidence,
      timestamp: now,
    };

    this.onGestureDetected?.(event);
  }

  /**
   * Get the action mapping for a given gesture type.
   */
  public getActionForGesture(gesture: GestureType): GestureActionMapping | undefined {
    return this.gestureActions.find((m) => m.gesture === gesture);
  }

  /**
   * Update gesture-to-action mappings (for custom gestures).
   */
  public setGestureActions(actions: GestureActionMapping[]): void {
    this.gestureActions = actions;
  }

  /**
   * Get the current mapping table.
   */
  public getGestureActions(): GestureActionMapping[] {
    return [...this.gestureActions];
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const gestureEngine = new NivaGestureEngine();
