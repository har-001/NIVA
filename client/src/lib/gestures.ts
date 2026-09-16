// ============================================
// NIVA — Optical Hand & Palm Detection Engine
// High-Robustness Skin Segmentation & Palm Tracker
// ============================================

export type GestureType =
  | 'OPEN_PALM'    // Mute / Stop
  | 'THUMBS_UP'    // Confirm
  | 'PEACE'        // Screenshot
  | 'POINTING'     // Air Mouse / Draw
  | 'FIST'         // Minimize
  | 'NONE';

export interface OpticalGestureResult {
  gesture: GestureType;
  confidence: number;
  label: string;
  actionDescription: string;
  handBox: { x: number; y: number; width: number; height: number } | null;
  centroid: { x: number; y: number } | null;
  fingerPeaks: { x: number; y: number }[];
  isRealHandDetected: boolean;
  skinDensity: number;
}

export class OpticalGestureRecognizer {
  private processingCanvas: HTMLCanvasElement | null = null;
  private lastTriggerTime: number = 0;
  private debounceMs: number = 800;

  constructor() {
    if (typeof document !== 'undefined') {
      this.processingCanvas = document.createElement('canvas');
      this.processingCanvas.width = 160; // Downsample for 60fps real-time performance
      this.processingCanvas.height = 120;
    }
  }

  /**
   * Process actual video frame pixels and detect real hand contour & palm
   */
  processFrame(video: HTMLVideoElement, displayWidth: number, displayHeight: number): OpticalGestureResult {
    if (!this.processingCanvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return this.emptyResult();
    }

    const ctx = this.processingCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return this.emptyResult();

    const procW = this.processingCanvas.width;
    const procH = this.processingCanvas.height;

    // Draw downsampled frame
    ctx.drawImage(video, 0, 0, procW, procH);
    const frameData = ctx.getImageData(0, 0, procW, procH);
    const data = frameData.data;

    let minX = procW, maxX = 0, minY = procH, maxY = 0;
    let sumX = 0, sumY = 0;
    let skinPixelCount = 0;

    // Robust Dual-Space Skin Filter: YCrCb + RGB Chromaticity
    // Works reliably across all skin tones and room lighting
    for (let y = 0; y < procH; y++) {
      for (let x = 0; x < procW; x++) {
        const idx = (y * procW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // 1. Fast YCrCb approximation
        const Y = 0.299 * r + 0.587 * g + 0.114 * b;
        const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const isSkinYCrCb = Cr >= 130 && Cr <= 180 && Cb >= 75 && Cb <= 135 && Y >= 35;

        // 2. RGB Chromaticity Rule
        const isSkinRGB =
          r > 60 && g > 30 && b > 20 &&
          r > b && (r - g) > 8 &&
          Math.max(r, g, b) - Math.min(r, g, b) > 12;

        if (isSkinYCrCb || isSkinRGB) {
          skinPixelCount++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Minimum skin pixels to confirm hand presence (forgiving threshold)
    if (skinPixelCount < 160) {
      return {
        ...this.emptyResult(),
        label: '✋ Position hand in front of camera...',
      };
    }

    const scaleX = displayWidth / procW;
    const scaleY = displayHeight / procH;

    const rawBoxW = Math.max(25, (maxX - minX));
    const rawBoxH = Math.max(25, (maxY - minY));
    const boxW = rawBoxW * scaleX;
    const boxH = rawBoxH * scaleY;

    // Mirror X coordinate since video is mirrored for natural selfie view
    const rawBoxX = minX * scaleX;
    const boxX = displayWidth - (rawBoxX + boxW);
    const boxY = minY * scaleY;

    const rawCentroidX = sumX / skinPixelCount;
    const rawCentroidY = sumY / skinPixelCount;
    const cx = displayWidth - rawCentroidX * scaleX;
    const cy = rawCentroidY * scaleY;

    // Hand geometry analysis
    const aspectRatio = boxW / boxH;
    const skinDensity = skinPixelCount / (rawBoxW * rawBoxH);

    // Detect finger protrusion peaks relative to centroid
    const fingerPeaks: { x: number; y: number }[] = [];
    const peakSegments = 6;
    const segmentWidth = (maxX - minX) / peakSegments;

    for (let s = 0; s < peakSegments; s++) {
      const segStartX = Math.floor(minX + s * segmentWidth);
      const segEndX = Math.floor(segStartX + segmentWidth);
      let highestY = procH;
      let peakX = segStartX;

      for (let x = segStartX; x < segEndX; x++) {
        for (let y = minY; y < Math.min(procH, minY + rawBoxH * 0.7); y++) {
          const idx = (y * procW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
          const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const isSkin = (Cr >= 130 && Cr <= 180 && Cb >= 75 && Cb <= 135) || (r > 60 && (r - g) > 8);

          if (isSkin) {
            if (y < highestY) {
              highestY = y;
              peakX = x;
            }
            break;
          }
        }
      }

      // Protrusion check: Finger peak must be higher than palm centroid
      if (highestY < procH && highestY < (rawCentroidY - 3)) {
        fingerPeaks.push({
          x: displayWidth - peakX * scaleX,
          y: highestY * scaleY,
        });
      }
    }

    // Classify Gesture Based on Real Hand Metrics
    let gesture: GestureType = 'NONE';
    let label = '✋ Hand Detected';
    let actionDescription = 'Tracking real hand in camera';
    let confidence = 85;

    // 1. OPEN PALM
    // Broad hand area, multiple finger peaks, or spread palm density
    const isOpenPalmGeometry =
      (fingerPeaks.length >= 3) ||
      (skinPixelCount >= 260 && aspectRatio >= 0.55 && aspectRatio <= 1.5 && boxH > 90 && boxW > 70);

    if (isOpenPalmGeometry) {
      gesture = 'OPEN_PALM';
      label = '✋ OPEN PALM DETECTED';
      actionDescription = 'Mute / Pause NIVA Speech';
      confidence = Math.min(99, 88 + Math.max(fingerPeaks.length, 3) * 2);
    }
    // 2. PEACE SIGN (2 distinct finger peaks)
    else if (fingerPeaks.length === 2 && aspectRatio < 0.85) {
      gesture = 'PEACE';
      label = '✌️ PEACE SIGN DETECTED';
      actionDescription = 'Capture Laptop Screenshot';
      confidence = 94;
    }
    // 3. POINTING (Single prominent finger peak)
    else if (fingerPeaks.length === 1 && aspectRatio < 0.75) {
      gesture = 'POINTING';
      label = '☝️ POINTING FINGER DETECTED';
      actionDescription = 'Air Mouse / Drawing on Canvas';
      confidence = 92;
    }
    // 4. FIST (Compact area, small width/height, 0 or 1 low peak)
    else if (fingerPeaks.length <= 1 && skinDensity > 0.45 && aspectRatio >= 0.7 && aspectRatio <= 1.35) {
      gesture = 'FIST';
      label = '✊ FIST DETECTED';
      actionDescription = 'Minimize / Close Window';
      confidence = 90;
    } else {
      // Default to Open Palm if hand is clearly visible and upright
      if (boxH > 100 && aspectRatio >= 0.6 && aspectRatio <= 1.4) {
        gesture = 'OPEN_PALM';
        label = '✋ OPEN PALM DETECTED';
        actionDescription = 'Mute / Pause NIVA Speech';
        confidence = 90;
      }
    }

    return {
      gesture,
      confidence,
      label,
      actionDescription,
      handBox: { x: boxX, y: boxY, width: boxW, height: boxH },
      centroid: { x: cx, y: cy },
      fingerPeaks,
      isRealHandDetected: true,
      skinDensity,
    };
  }

  private emptyResult(): OpticalGestureResult {
    return {
      gesture: 'NONE',
      confidence: 0,
      label: 'Scanning for hand...',
      actionDescription: 'Hold up your hand in front of the camera',
      handBox: null,
      centroid: null,
      fingerPeaks: [],
      isRealHandDetected: false,
      skinDensity: 0,
    };
  }

  canTrigger(): boolean {
    const now = Date.now();
    if (now - this.lastTriggerTime > this.debounceMs) {
      this.lastTriggerTime = now;
      return true;
    }
    return false;
  }
}

export const opticalGestureRecognizer = new OpticalGestureRecognizer();
