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
  private continuous: boolean = false;

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
      this.recognition.continuous = this.continuous;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStart?.();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
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
        console.warn('[DesktopVoice] Recognition error:', event.error);
        this.onError?.(event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEnd?.();
      };
    } catch (err) {
      console.warn('[DesktopVoice] Initialization failed:', err);
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public setContinuous(continuous: boolean): void {
    this.continuous = continuous;
    if (this.recognition) {
      this.recognition.continuous = continuous;
    }
  }

  public setHandsFree(enabled: boolean): void {
    this.setContinuous(enabled);
  }

  public isHandsFreeMode(): boolean {
    return this.continuous;
  }

  public start(): boolean {
    if (!this.recognition) {
      this.initEngine();
    }
    if (!this.recognition) return false;

    if (!this.isListening) {
      try {
        this.recognition.start();
        return true;
      } catch (err) {
        console.warn('[DesktopVoice] Start error:', err);
        return false;
      }
    }
    return true;
  }

  public stop(): void {
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
