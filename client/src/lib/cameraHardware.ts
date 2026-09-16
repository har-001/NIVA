// ============================================
// NIVA — Bulletproof Camera Hardware Controller
// Guarantees zero hardware track leaks across the entire browser window
// ============================================

const activeStreams = new Set<MediaStream>();

/**
 * Register an active camera stream
 */
export function registerCameraStream(stream: MediaStream): void {
  activeStreams.add(stream);

  // Auto clean when all tracks naturally end
  stream.getTracks().forEach((track) => {
    track.addEventListener('ended', () => {
      if (stream.getTracks().every((t) => t.readyState === 'ended')) {
        activeStreams.delete(stream);
      }
    });
  });
}

/**
 * Completely stops a specific MediaStream and detaches from video element
 */
export function stopStreamCompletely(
  stream: MediaStream | null,
  videoElement?: HTMLVideoElement | null
): void {
  if (stream) {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
        track.enabled = false;
      } catch (err) {
        console.warn('Track stop error:', err);
      }
    });
    activeStreams.delete(stream);
  }

  if (videoElement) {
    try {
      videoElement.pause();
      if (videoElement.srcObject instanceof MediaStream) {
        videoElement.srcObject.getTracks().forEach((t) => {
          try {
            t.stop();
            t.enabled = false;
          } catch {}
        });
      }
      videoElement.srcObject = null;
      // Force hardware video sink release in Chromium/Electron
      videoElement.load();
    } catch {}
  }
}

/**
 * NUCLEAR HARDWARE SHUTDOWN:
 * Stops EVERY active MediaStream and clears ALL video elements across the entire page
 */
export function terminateAllCamerasGlobally(): void {
  // 1. Stop all registered streams
  activeStreams.forEach((stream) => {
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {}
      });
    } catch {}
  });
  activeStreams.clear();

  // 2. Clear all video elements in DOM
  if (typeof document !== 'undefined') {
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach((video) => {
        try {
          if (video.srcObject instanceof MediaStream) {
            video.srcObject.getTracks().forEach((t) => {
              try {
                t.stop();
                t.enabled = false;
              } catch {}
            });
          }
          video.pause();
          video.srcObject = null;
          video.load();
        } catch {}
      });
    } catch {}
  }
}
