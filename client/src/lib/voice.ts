// ============================================
// NIVA — High-Fidelity Voice Controller (STT & TTS)
// Natural Voice Selection, Chunked Speech & Text Preprocessing
// ============================================

export interface NormalizedVoiceResult {
  cleaned: string;
  isWakeWordOnly: boolean;
  original: string;
}

/**
 * Phonetically normalizes Chromium Web Speech API acoustic transcriptions.
 * Specifically corrects Indian-accent mishearings where "Hey NIVA" is transcribed as "I never", "in ever", etc.
 */
export function normalizeAcousticTranscript(raw: string): NormalizedVoiceResult {
  if (!raw) return { cleaned: '', isWakeWordOnly: false, original: '' };

  const original = raw.trim();
  let text = original;

  // 1. Acoustic phonetic patterns for "Hey NIVA" / "NIVA"
  const wakeWordPattern = /^(?:i\s*never|hey\s*never|hi\s*never|in\s*ever|he\s*never|hay\s*never|high\s*never|hey\s*niva|hi\s*niva|namaste\s*niva|suno\s*niva|hey\s*neeva|hi\s*neeva|hey\s*niba|hi\s*niba|aniva|aniwa|univa|eniva|niva|neeva|niba|jarvis)[,\s:\-]*/i;

  const hadWakeWord = wakeWordPattern.test(text);
  let cleaned = text.replace(wakeWordPattern, '').trim();

  // Strip leading casual greetings
  cleaned = cleaned.replace(/^(?:hello|hi|arre|bhai|yaar|suno|namaste)\s+(?:i\s*never|hey\s*never|niva|neeva|niba)[,\s:\-]*/i, '').trim();

  // Phonetic correction for app names in Hinglish speech
  cleaned = cleaned
    .replace(/\b(?:you\s+tube|u\s*tube|yt)\b/gi, 'YouTube')
    .replace(/\b(?:whats\s*app|what's\s*app|what\s*app|whastapp)\b/gi, 'WhatsApp')
    .replace(/\b(?:not\s*pad|node\s*pad)\b/gi, 'Notepad')
    .replace(/\b(?:vs\s*code|v\s*s\s*code|visual\s*studio\s*code)\b/gi, 'VS Code')
    .replace(/\b(?:crome|google\s*crome)\b/gi, 'Chrome');

  const isWakeWordOnly = hadWakeWord && (!cleaned || cleaned.length < 2);

  return { cleaned, isWakeWordOnly, original };
}

/**
 * Speech Recognition using Google Speech Engine (Chromium Web Speech API)
 */
export class NivaVoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLang: string = 'en-IN';

  public onStart?: () => void;
  public onResult?: (transcript: string, isFinal: boolean, isWakeWordOnly?: boolean) => void;
  public onError?: (error: string) => void;
  public onEnd?: () => void;

  constructor(lang: string = 'en-IN') {
    this.currentLang = lang;
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false; // Capture discrete phrases cleanly
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLang;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onStart?.();
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              finalTranscript += res[0].transcript;
            } else {
              interimTranscript += res[0].transcript;
            }
          }

          if (finalTranscript.trim()) {
            const norm = normalizeAcousticTranscript(finalTranscript);
            this.onResult?.(norm.cleaned || norm.original, true, norm.isWakeWordOnly);
          } else if (interimTranscript.trim()) {
            const norm = normalizeAcousticTranscript(interimTranscript);
            this.onResult?.(norm.cleaned || norm.original, false, norm.isWakeWordOnly);
          }
        };

        this.recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.warn('Google Speech recognition error:', event.error);
          }
          this.onError?.(event.error);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onEnd?.();
        };
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public setLanguage(lang: string): void {
    this.currentLang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start(): void {
    if (!this.recognition) {
      this.onError?.('not-supported');
      return;
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (err: any) {
      // Ignore if recognition already started
      if (err?.name === 'InvalidStateError' || err?.message?.includes('already started')) {
        this.isListening = true;
        return;
      }
      console.warn('Failed to start recognition:', err);
      this.onError?.(err?.name || err?.message || 'start-failed');
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Failed to stop recognition:', err);
      } finally {
        this.isListening = false;
      }
    }
  }

  public get active(): boolean {
    return this.isListening;
  }
}

export type VoiceGender = 'male' | 'female';

/**
 * Natural Neural Text-to-Speech Synthesizer
 * With text sanitization, emoji removal, dynamic male/female voice switching, and sentence-chunked sequential delivery
 */
export class NivaVoiceSynthesizer {
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private speechQueue: string[] = [];
  private isSpeakingInternal: boolean = false;
  private currentGender: VoiceGender = 'male';

  public onStart?: () => void;
  public onEnd?: () => void;
  public onGenderChange?: (gender: VoiceGender) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('niva_voice_gender') as VoiceGender | null;
      if (saved === 'male' || saved === 'female') {
        this.currentGender = saved;
      }
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadBestVoice();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = () => this.loadBestVoice();
        }
      }
    }
  }

  /**
   * Set preferred voice gender and reload voice
   */
  public setGender(gender: VoiceGender): void {
    this.currentGender = gender;
    if (typeof window !== 'undefined') {
      localStorage.setItem('niva_voice_gender', gender);
    }
    this.loadBestVoice();
    this.onGenderChange?.(gender);
  }

  /**
   * Get active voice gender
   */
  public getGender(): VoiceGender {
    return this.currentGender;
  }

  /**
   * Score and choose the clearest, most natural voice according to current gender preference
   */
  private loadBestVoice(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Check if user has an explicit saved voice URI preference
    if (typeof window !== 'undefined') {
      const savedURI = localStorage.getItem('niva_selected_voice_uri');
      if (savedURI) {
        const found = voices.find((v) => v.voiceURI === savedURI || v.name === savedURI);
        if (found) {
          this.selectedVoice = found;
          return;
        }
      }
    }

    const isMaleMode = this.currentGender === 'male';

    const scoredVoices = voices.map((voice) => {
      let score = 0;
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();

      // Explicit female keywords (Google US English and Google Hindi in Chrome are female!)
      const isFemaleVoice =
        name.includes('female') ||
        name.includes('woman') ||
        name.includes('girl') ||
        name.includes('हिन्दी') ||
        name.includes('google hindi') ||
        name.includes('google us english') ||
        name.includes('google uk english female') ||
        name.includes('heera') ||
        name.includes('neerja') ||
        name.includes('swara') ||
        name.includes('kalpana') ||
        name.includes('ananya') ||
        name.includes('aditi') ||
        name.includes('zira') ||
        name.includes('samantha') ||
        name.includes('victoria') ||
        name.includes('karen') ||
        name.includes('hazel') ||
        name.includes('susan') ||
        name.includes('catherine') ||
        name.includes('linda') ||
        name.includes('elena') ||
        name.includes('aria') ||
        name.includes('cortana') ||
        name.includes('jenny');

      // Explicit male keywords
      const isMaleVoice =
        (name.includes('male') && !name.includes('female')) ||
        name.includes('david') ||
        name.includes('mark') ||
        name.includes('ravi') ||
        name.includes('madhur') ||
        name.includes('prabhat') ||
        name.includes('george') ||
        name.includes('alex') ||
        name.includes('daniel') ||
        name.includes('guy') ||
        name.includes('ryan') ||
        name.includes('oliver') ||
        name.includes('james') ||
        name.includes('eric') ||
        name.includes('brian') ||
        name.includes('andrew') ||
        name.includes('christopher') ||
        name.includes('uk english male') ||
        name.includes('english male');

      const isIndian =
        lang.includes('en-in') ||
        lang.includes('hi-in') ||
        lang.startsWith('hi') ||
        name.includes('india') ||
        name.includes('indian') ||
        name.includes('hindi') ||
        name.includes('ravi') ||
        name.includes('heera') ||
        name.includes('neerja') ||
        name.includes('madhur') ||
        name.includes('swara') ||
        name.includes('prabhat');

      if (isMaleMode) {
        // STRICTLY REJECT ANY FEMALE VOICE IN MALE MODE
        if (isFemaleVoice) {
          score -= 50000;
        } else {
          // 1. Indian male voice highest priority
          if (isIndian && (name.includes('ravi') || name.includes('madhur') || name.includes('prabhat') || isMaleVoice)) {
            score += 10000;
          }
          // 2. Clear known desktop male voices (Windows & Chrome)
          if (name.includes('uk english male') || name.includes('english male')) {
            score += 8000;
          }
          if (name.includes('david') || name.includes('mark') || name.includes('george')) {
            score += 7000;
          }
          if (isMaleVoice) {
            score += 6000;
          }
          if (lang.startsWith('en')) {
            score += 1000;
          }
        }
      } else {
        // STRICTLY REJECT ANY MALE VOICE IN FEMALE MODE
        if (isMaleVoice) {
          score -= 50000;
        } else {
          // 1. Indian female voice highest priority
          if (isIndian || name.includes('हिन्दी') || name.includes('heera') || name.includes('neerja') || name.includes('swara')) {
            score += 10000;
          }
          if (name.includes('uk english female') || name.includes('zira')) {
            score += 7000;
          }
          if (isFemaleVoice) {
            score += 5000;
          }
          if (lang.startsWith('en')) {
            score += 1000;
          }
        }
      }

      if (name.includes('natural') || name.includes('neural') || name.includes('online')) {
        score += 300;
      }

      return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);
    const valid = scoredVoices.find((v) => v.score > 0);
    this.selectedVoice = valid ? valid.voice : scoredVoices[0]?.voice || voices[0];
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public setSpecificVoice(voiceURI: string): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    const match = voices.find((v) => v.voiceURI === voiceURI || v.name === voiceURI);
    if (match) {
      this.selectedVoice = match;
      if (typeof window !== 'undefined') {
        localStorage.setItem('niva_selected_voice_uri', voiceURI);
      }
    }
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  public getSelectedVoiceName(): string {
    return this.selectedVoice ? `${this.selectedVoice.name} (${this.selectedVoice.lang})` : 'Default Voice';
  }

  /**
   * Clean text of images, technical links, code blocks, and markdown symbols so speech sounds completely natural
   */
  private sanitizeForSpeech(rawText: string): string {
    return rawText
      // Strip all HTML comments (e.g. metadata JSON payload tokens)
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove markdown images entirely so they are not read aloud
      .replace(/!\[.*?\]\(.*?\)/g, '')
      // Remove metadata rows from generated output (direct links, workspace paths, run commands)
      .replace(/-\s*\*\*Direct URL\*\*:[^\n]+/gi, '')
      .replace(/-\s*\*\*Style\*\*:[^\n]+/gi, '')
      .replace(/-\s*\*\*Aspect Ratio\*\*:[^\n]+/gi, '')
      .replace(/📂\s*\*\*Saved to Workspace\*\*:[^\n]+/gi, '')
      .replace(/💻\s*\*\*IDE\*\*:[^\n]+/gi, '')
      .replace(/▶️\s*\*\*Run command\*\*:[^\n]+/gi, '')
      // Replace code blocks with concise spoken description
      .replace(/```[\s\S]*?```/g, ' Code aapke chat aur IDE me display kar diya hai. ')
      // Replace inline code snippets
      .replace(/`([^`]+)`/g, '$1')
      // Clean markdown links — read ONLY label, never URLs or the word 'link'
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Strip raw URLs completely so the assistant NEVER utters raw links
      .replace(/https?:\/\/\S+/g, '')
      // Remove emojis which sound confusing when spoken
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '')
      // Remove markdown symbols (asterisks, hashtags, pipes, brackets)
      .replace(/[*_#~>|\\=[\]{}()]/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Split sanitized text into digestible sentences for natural pauses
   */
  private splitIntoSentences(text: string): string[] {
    const sentences = text.match(/[^.!?।\n]+[.!?।\n]*/g) || [text];
    return sentences
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
  }

  /**
   * Speak response naturally chunk-by-chunk to prevent Chromium speech cutoff
   */
  public speak(text: string): void {
    if (!this.synth) return;

    this.stop();

    const clean = this.sanitizeForSpeech(text);
    if (!clean) return;

    const chunks = this.splitIntoSentences(clean);
    this.speechQueue = chunks;

    if (this.speechQueue.length > 0) {
      this.isSpeakingInternal = true;
      this.onStart?.();
      this.playNextChunk();
    }
  }

  private playNextChunk(): void {
    if (!this.synth || this.speechQueue.length === 0) {
      this.isSpeakingInternal = false;
      this.onEnd?.();
      return;
    }

    const nextSentence = this.speechQueue.shift();
    if (!nextSentence) {
      this.playNextChunk();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextSentence);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.rate = 1.0; // Natural conversational speaking pace
    // Masculine resonance (0.90) for male mode, natural pitch (1.05) for female mode
    utterance.pitch = this.currentGender === 'male' ? 0.90 : 1.05;

    utterance.onend = () => {
      // Small natural pause between sentences
      setTimeout(() => this.playNextChunk(), 80);
    };

    utterance.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      console.warn('Utterance speech notice:', e.error);
      if (this.isSpeakingInternal) {
        this.playNextChunk();
      }
    };

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.speechQueue = [];
      this.synth.cancel();
      if (this.isSpeakingInternal) {
        this.isSpeakingInternal = false;
        this.onEnd?.();
      }
    }
  }

  public get speaking(): boolean {
    return this.isSpeakingInternal || !!this.synth?.speaking;
  }
}
