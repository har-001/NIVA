// ============================================
// NIVA — Mobile Voice Interaction Engine (STT & TTS)
// Manages Speech Synthesis (Vocalizing) & Voice Recognition (Listening)
// ============================================

import { VoiceSettings } from '../types/mobile';
import { mobileStorage } from './storage';

class NivaMobileVoiceService {
  private settings: VoiceSettings = {
    gender: 'female',
    rate: 1.0,
    pitch: 1.05,
    autoSpeak: true,
  };
  private isSpeaking = false;
  private isListening = false;

  constructor() {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    const saved = await mobileStorage.getItem('voice_settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch {}
    }
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  public async updateSettings(newSettings: Partial<VoiceSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await mobileStorage.setItem('voice_settings', JSON.stringify(this.settings));
  }

  public setGender(gender: 'male' | 'female'): void {
    this.settings.gender = gender;
    this.settings.pitch = gender === 'male' ? 0.85 : 1.1;
    mobileStorage.setItem('voice_settings', JSON.stringify(this.settings));
  }

  /**
   * Vocalize AI response text
   */
  public speak(text: string, onEnd?: () => void): void {
    if (!this.settings.autoSpeak || !text) {
      onEnd?.();
      return;
    }

    // Strip code blocks and Markdown links before vocalizing
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .trim();

    this.isSpeaking = true;

    // Web / DOM SpeechSynthesis fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;

      utterance.onend = () => {
        this.isSpeaking = false;
        onEnd?.();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    // Audio duration simulation fallback for mobile devices
    const isTest = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || !process.env?.EXPO_OS);
    const estimatedWords = cleanText.split(/\s+/).length;
    const durationMs = isTest ? 50 : Math.min(Math.max(estimatedWords * 280, 1500), 7000);

    setTimeout(() => {
      this.isSpeaking = false;
      onEnd?.();
    }, durationMs);
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  private recognitionInstance: any = null;

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          this.recognitionInstance = new SpeechRecognition();
          this.recognitionInstance.continuous = false;
          this.recognitionInstance.interimResults = true;
          this.recognitionInstance.lang = 'en-IN';

          this.recognitionInstance.onstart = () => {
            this.isListening = true;
          };

          this.recognitionInstance.onresult = (event: any) => {
            let transcript = '';
            let isFinal = false;
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcript += event.results[i][0].transcript;
              if (event.results[i].isFinal) isFinal = true;
            }
            onResult(transcript.trim(), isFinal);
          };

          this.recognitionInstance.onerror = (e: any) => {
            this.isListening = false;
            onError?.(e.error || 'speech-error');
          };

          this.recognitionInstance.onend = () => {
            this.isListening = false;
            onEnd?.();
          };

          this.recognitionInstance.start();
          this.isListening = true;
          return;
        } catch (err: any) {
          this.isListening = false;
          onError?.(err?.message || 'start-failed');
          return;
        }
      }
    }
    // Simulation / headless fallback
    this.isListening = true;
    setTimeout(() => {
      this.isListening = false;
      onEnd?.();
    }, 2000);
  }

  public stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {}
      this.recognitionInstance = null;
    }
    this.isListening = false;
  }

  public getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  public getListeningStatus(): boolean {
    return this.isListening;
  }
}

export const mobileVoiceService = new NivaMobileVoiceService();
export const voiceService = mobileVoiceService;
