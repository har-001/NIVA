// ============================================
// NIVA — Camera Hardware Manager Singleton
// Zero Camera Leak Rule: LED never stays on when not streaming
// ============================================

export type CameraState = 'inactive' | 'requesting' | 'active' | 'error';

export class NivaCameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private state: CameraState = 'inactive';

  public onStateChange?: (state: CameraState) => void;

  public getState(): CameraState {
    return this.state;
  }

  public isActive(): boolean {
    return this.state === 'active' && this.stream !== null;
  }

  private setState(newState: CameraState): void {
    this.state = newState;
    this.onStateChange?.(newState);
  }

  /**
   * Request camera access with explicit user permission.
   * Returns the MediaStream if granted, null if denied.
   */
  public async requestCameraAccess(
    videoEl: HTMLVideoElement,
    constraints?: MediaStreamConstraints
  ): Promise<MediaStream | null> {
    if (this.state === 'active' && this.stream) {
      return this.stream;
    }

    this.setState('requesting');

    const defaultConstraints: MediaStreamConstraints = constraints || {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15, max: 20 },
        facingMode: 'user',
      },
      audio: false,
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      this.stream = mediaStream;
      this.videoElement = videoEl;
      videoEl.srcObject = mediaStream;
      await videoEl.play();
      this.setState('active');
      return mediaStream;
    } catch (err) {
      console.error('[CameraManager] Permission denied or error:', err);
      this.setState('error');
      return null;
    }
  }

  /**
   * Stop camera immediately. Kills all tracks — camera LED turns off.
   * This is the Zero Camera Leak guarantee.
   */
  public stopCamera(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.setState('inactive');
  }

  /**
   * Capture a single frame from the active camera as ImageData.
   * Returns null if camera is not active.
   */
  public captureFrame(canvas: HTMLCanvasElement): ImageData | null {
    if (!this.isActive() || !this.videoElement) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = this.videoElement.videoWidth || 640;
    canvas.height = this.videoElement.videoHeight || 480;

    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Get the video element dimensions for overlay sizing.
   */
  public getVideoDimensions(): { width: number; height: number } {
    if (!this.videoElement) return { width: 640, height: 480 };
    return {
      width: this.videoElement.videoWidth || 640,
      height: this.videoElement.videoHeight || 480,
    };
  }
}

export const cameraManager = new NivaCameraManager();
