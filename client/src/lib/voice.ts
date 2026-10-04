// ============================================
// NIVA — High-Fidelity Voice Controller (STT & TTS)
// Natural Voice Selection, Chunked Speech & Text Preprocessing
// ============================================

/**
 * Speech Recognition using Google Speech Engine (Chromium Web Speech API)
 */
export class NivaVoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLang: string = 'en-IN';

  public onStart?: () => void;
  public onResult?: (transcript: string, isFinal: boolean) => void;
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
            const raw = finalTranscript.trim();
            // Automatically strip wake-words so user can say "Hey NIVA, open youtube"
            const cleaned = raw.replace(/^(?:hey\s+niva|niva|jarvis|namaste\s+niva|suno\s+niva)[,\s:]*/i, '').trim();
            this.onResult?.(cleaned || raw, true);
          } else if (interimTranscript.trim()) {
            this.onResult?.(interimTranscript.trim(), false);
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

    const isMaleMode = this.currentGender === 'male';

    const scoredVoices = voices.map((voice) => {
      let score = 0;
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();

      // === 1. TOP PRIORITY: AUTHENTIC INDIAN ACCENT & HINDI/ENGLISH (INDIA) ===
      const isIndian =
        lang.includes('en-in') ||
        lang.includes('hi-in') ||
        lang.startsWith('hi') ||
        name.includes('india') ||
        name.includes('indian') ||
        name.includes('hindi') ||
        name.includes('हिन्दी') ||
        name.includes('ravi') ||
        name.includes('heera') ||
        name.includes('neerja') ||
        name.includes('madhur') ||
        name.includes('swara') ||
        name.includes('prabhat') ||
        name.includes('kalpana') ||
        name.includes('ananya') ||
        name.includes('aditi');

      if (isIndian) {
        score += 2500; // Massively prioritize Indian voices!
      }

      // === 2. GENDER MATCHING ===
      if (isMaleMode) {
        // High quality Indian male voices
        if (
          name.includes('ravi') ||
          name.includes('madhur') ||
          name.includes('prabhat') ||
          (name.includes('google') && (lang.includes('en-in') || lang.includes('hi-in') || name.includes('हिन्दी')))
        ) {
          score += 800;
        }

        if (name.includes('male') && !name.includes('female')) {
          score += 300;
        }

        // Strongly disqualify female voices in male mode
        if (
          name.includes('female') ||
          name.includes('woman') ||
          name.includes('girl') ||
          name.includes('heera') ||
          name.includes('neerja') ||
          name.includes('swara') ||
          name.includes('kalpana') ||
          name.includes('ananya') ||
          name.includes('aditi') ||
          name.includes('zira') ||
          name.includes('samantha')
        ) {
          score -= 3000;
        }
      } else {
        // High quality Indian female voices
        if (
          name.includes('heera') ||
          name.includes('neerja') ||
          name.includes('swara') ||
          name.includes('kalpana') ||
          name.includes('ananya') ||
          name.includes('aditi') ||
          (name.includes('google') && (lang.includes('en-in') || lang.includes('hi-in') || name.includes('हिन्दी')))
        ) {
          score += 800;
        }

        if (name.includes('female') && !name.includes('male')) {
          score += 300;
        }

        // Strongly disqualify male voices in female mode
        if (
          name.includes('male') ||
          name.includes('ravi') ||
          name.includes('madhur') ||
          name.includes('prabhat') ||
          name.includes('david') ||
          name.includes('george')
        ) {
          score -= 3000;
        }
      }

      // === 3. Natural / Neural / Online Boost ===
      if (name.includes('natural') || name.includes('neural') || name.includes('online')) {
        score += 250;
      }
      if (name.includes('google')) {
        score += 150;
      }

      return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);
    const bestMatch = scoredVoices[0];
    this.selectedVoice = bestMatch?.voice || voices[0];
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
    utterance.pitch = 1.0; // Authentic human pitch (no artificial robotic distortion)

    utterance.onend = () => {
      // Small natural pause between sentences
      setTimeout(() => this.playNextChunk(), 80);
    };

    utterance.onerror = (e) => {
      console.warn('Utterance speech error:', e);
      this.playNextChunk();
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
