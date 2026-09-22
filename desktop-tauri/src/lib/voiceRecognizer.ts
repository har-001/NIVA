// ============================================
// NIVA — Desktop Speech-to-Text Recognizer (Web Speech API)
// Visible, typed, with zero silent recording
// ============================================

export type VoiceListeningState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export class NivaDesktopVoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private lang: string = 'en-IN';
  private continuous: boolean = true;
  private isMuted: boolean = false;
  private restartTimeout: any = null;
  private shouldKeepListening: boolean = false;

  public onStart?: () => void;
  public onResult?: (transcript: string, isFinal: boolean) => void;
  public onError?: (error: string) => void;
  public onEnd?: () => void;

  constructor(lang: string = 'en-IN') {
    this.lang = lang;
    this.initEngine();
  }

  private initEngine(): void {
    if (typeof window === 'undefined') return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[DesktopVoice] Web SpeechRecognition is not supported in this environment.');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true; // Always continuous to prevent 1-second cutoff
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStart?.();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Echo cancellation / self-listening guard: ignore when NIVA is speaking
        if (this.isMuted) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          this.onResult?.(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          this.onResult?.(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // 'no-speech' is non-fatal: user just paused for a moment
        if (event.error === 'no-speech') {
          return;
        }

        // 'aborted' is intentional on stop/restart
        if (event.error === 'aborted') {
          return;
        }

        console.warn('[DesktopVoice] Recognition warning/error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.isListening = false;
          this.shouldKeepListening = false;
          this.onError?.(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;

        // Auto-restart if hands-free or active listening mode is enabled
        if (this.shouldKeepListening && !this.isMuted) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.shouldKeepListening && !this.isMuted) {
              this.safeStart();
            }
          }, 250);
        } else {
          this.onEnd?.();
        }
      };
    } catch (err) {
      console.warn('[DesktopVoice] Initialization failed:', err);
    }
  }

  private safeStart(): boolean {
    if (!this.recognition) {
      this.initEngine();
    }
    if (!this.recognition) return false;

    if (!this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        return true;
      } catch (err: any) {
        // If already started, ignore DOMException
        if (err.name !== 'InvalidStateError') {
          console.warn('[DesktopVoice] Start error:', err);
        }
        return false;
      }
    }
    return true;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public setContinuous(continuous: boolean): void {
    this.continuous = continuous;
  }

  public setHandsFree(enabled: boolean): void {
    this.setContinuous(enabled);
    if (enabled && !this.isListening) {
      this.start();
    }
  }

  public isHandsFreeMode(): boolean {
    return this.continuous;
  }

  public muteDuringSpeech(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      // Pause active recognition while NIVA speaks so NIVA does not hear itself
      try {
        if (this.recognition && this.isListening) {
          this.recognition.abort();
          this.isListening = false;
        }
      } catch {}
    } else {
      // Resume listening if in hands-free mode
      if (this.shouldKeepListening) {
        setTimeout(() => {
          if (this.shouldKeepListening && !this.isMuted) {
            this.safeStart();
          }
        }, 400);
      }
    }
  }

  public start(): boolean {
    this.shouldKeepListening = true;
    return this.safeStart();
  }

  public stop(): void {
    this.shouldKeepListening = false;
    clearTimeout(this.restartTimeout);
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('[DesktopVoice] Stop error:', err);
      }
      this.isListening = false;
    }
  }

  public getListeningState(): boolean {
    return this.isListening;
  }
}
