// ============================================
// NIVA — Desktop Speech Synthesizer (TTS)
// Dual-Gender Voice Engine with Male Baritone Prioritization
// ============================================

export type DesktopVoiceGender = 'male' | 'female';

export class NivaDesktopVoiceSynthesizer {
  private gender: DesktopVoiceGender = 'male';
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  public onStart?: () => void;
  public onEnd?: () => void;

  constructor(defaultGender?: DesktopVoiceGender) {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('niva_desktop_voice_gender') as DesktopVoiceGender | null;
      this.gender = defaultGender || saved || 'male';
    }
  }

  public getGender(): DesktopVoiceGender {
    return this.gender;
  }

  public isSpeaking(): boolean {
    return this.currentUtterance !== null;
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public setGender(gender: DesktopVoiceGender): void {
    this.gender = gender;
    if (typeof window !== 'undefined') {
      localStorage.setItem('niva_desktop_voice_gender', gender);
    }
  }

  /**
   * Cleans text of raw markdown, URLs, code blocks, and technical symbols
   */
  public sanitizeForSpeech(text: string): string {
    if (!text) return '';

    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, ' ')
      // Remove markdown links but keep text [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove standalone URLs
      .replace(/(https?:\/\/[^\s]+)/g, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, 'Code block generated.')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove bold/italics/strikethrough
      .replace(/[*_~]{1,3}/g, '')
      // Remove headers & bullet points
      .replace(/^[#*>-]\s+/gm, '')
      // Remove direct metadata markers like Direct URL: etc
      .replace(/Direct URL:.*$/gmi, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Score and choose the optimal voice according to gender
   */
  private selectBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    let bestVoice: SpeechSynthesisVoice | null = null;
    let highestScore = -Infinity;

    for (const v of voices) {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      let score = 0;

      if (this.gender === 'male') {
        // High priority for proven male voices
        if (name.includes('david')) score += 300;
        if (name.includes('ravi')) score += 280;
        if (name.includes('guy') || name.includes('george') || name.includes('mark')) score += 250;
        if (name.includes('male') && !name.includes('female')) score += 200;

        // Heavy penalty for female voices
        if (
          name.includes('zira') ||
          name.includes('samantha') ||
          name.includes('female') ||
          name.includes('aria') ||
          name.includes('heera') ||
          name.includes('kalpana')
        ) {
          score -= 1000;
        }
      } else {
        // Female voice priority
        if (name.includes('zira')) score += 300;
        if (name.includes('samantha') || name.includes('aria') || name.includes('jenny')) score += 280;
        if (name.includes('female')) score += 250;
        if (name.includes('hindi') || lang.startsWith('hi')) score += 180;

        // Heavy penalty for male voices
        if (name.includes('david') || name.includes('ravi') || name.includes('guy')) {
          score -= 1000;
        }
      }

      // Language preferences: en-IN, en-GB, en-US
      if (lang.includes('in')) score += 50;
      if (lang.includes('en')) score += 30;

      if (score > highestScore) {
        highestScore = score;
        bestVoice = v;
      }
    }

    return bestVoice || voices[0];
  }

  public speak(rawText: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[DesktopTTS] speechSynthesis is unavailable in this environment.');
      return;
    }

    const clean = this.sanitizeForSpeech(rawText);
    if (!clean) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const voice = this.selectBestVoice(voices);

    if (voice) {
      utterance.voice = voice;
    }

    if (this.gender === 'male') {
      utterance.pitch = 0.85; // Deep masculine baritone
      utterance.rate = 1.0;
    } else {
      utterance.pitch = 1.05; // Bright natural female
      utterance.rate = 1.05;
    }

    utterance.onstart = () => {
      this.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('[DesktopTTS] Utterance error:', e);
      this.currentUtterance = null;
      this.onEnd?.();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
      this.onEnd?.();
    }
  }
}

export const voiceSynthesizer = new NivaDesktopVoiceSynthesizer();
