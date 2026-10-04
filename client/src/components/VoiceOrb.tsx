'use client';

// ============================================
// NIVA — Neural Voice Orb Component
// Google Voice Gathering Engine (en-IN Hinglish & hi-IN Hindi)
// Realtime Web Speech + MediaRecorder to Google Gemini 2.0 Audio
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import styles from './VoiceOrb.module.css';
import { NivaVoiceRecognizer, NivaVoiceSynthesizer, VoiceGender } from '../lib/voice';
import { api } from '../lib/api';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  state: VoiceState;
  onTranscriptReady: (transcript: string) => void;
  autoSpeakResponse?: boolean;
  lastAssistantResponse?: string;
  gender?: VoiceGender;
  onGenderChange?: (gender: VoiceGender) => void;
  autoStart?: boolean;
  onClose?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state: parentState,
  onTranscriptReady,
  autoSpeakResponse = true,
  lastAssistantResponse,
  gender,
  onGenderChange,
  autoStart = false,
  onClose,
}) => {
  const [internalState, setInternalState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [currentGender, setCurrentGender] = useState<VoiceGender>(gender || 'male');
  const [activeVoiceName, setActiveVoiceName] = useState<string>('');
  const [language, setLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [isRecordingMedia, setIsRecordingMedia] = useState<boolean>(false);
  const [isTranscribingWithGemini, setIsTranscribingWithGemini] = useState<boolean>(false);

  const recognizerRef = useRef<NivaVoiceRecognizer | null>(null);
  const synthesizerRef = useRef<NivaVoiceSynthesizer | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const onTranscriptReadyRef = useRef(onTranscriptReady);
  const isContinuousRef = useRef(isContinuousMode);
  const hasDeliveredTranscriptRef = useRef(false);

  // Computed state combining parent state and local voice activity
  const currentState: VoiceState =
    isTranscribingWithGemini || parentState === 'thinking'
      ? 'thinking'
      : internalState !== 'idle'
      ? internalState
      : parentState;

  useEffect(() => {
    onTranscriptReadyRef.current = onTranscriptReady;
  }, [onTranscriptReady]);

  useEffect(() => {
    isContinuousRef.current = isContinuousMode;
  }, [isContinuousMode]);

  const toggleLanguage = () => {
    const nextLang: 'en-IN' | 'hi-IN' = language === 'en-IN' ? 'hi-IN' : 'en-IN';
    setLanguage(nextLang);
    recognizerRef.current?.setLanguage(nextLang);
    if (synthesizerRef.current) {
      synthesizerRef.current.speak(
        nextLang === 'hi-IN'
          ? 'Maine Google Hindi voice engine select kar liya hai.'
          : 'Maine Google Indian English voice engine select kar liya hai.'
      );
    }
  };

  // Helper to send transcript to chat pipeline
  const deliverTranscript = (text: string) => {
    const cleaned = text
      .replace(/^(?:hey\s+niva|niva|jarvis|namaste\s+niva|suno\s+niva)[,\s:]*/i, '')
      .trim();
    const finalMsg = cleaned || text.trim();
    if (finalMsg) {
      hasDeliveredTranscriptRef.current = true;
      setTranscript(finalMsg);
      onTranscriptReadyRef.current?.(finalMsg);
      // Reset delivery lock after 1.5s so subsequent voice commands capture seamlessly!
      setTimeout(() => {
        hasDeliveredTranscriptRef.current = false;
        setTranscript('');
      }, 1500);
    }
  };

  // Google MediaRecorder fallback capturing real audio stream
  const startMediaRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsRecordingMedia(false);

        // If Web Speech already delivered, no need to query Gemini audio
        if (hasDeliveredTranscriptRef.current) {
          return;
        }

        if (audioChunksRef.current.length > 0) {
          try {
            setIsTranscribingWithGemini(true);
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            if (audioBlob.size > 1000) {
              const reader = new FileReader();
              reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                try {
                  const res = await api.transcribeAudio(base64Audio, mimeType, language);
                  if (res.data?.text && !hasDeliveredTranscriptRef.current) {
                    deliverTranscript(res.data.text);
                  }
                } catch (transcribeErr) {
                  console.warn('Google Gemini voice transcription error:', transcribeErr);
                } finally {
                  setIsTranscribingWithGemini(false);
                  setInternalState('idle');
                }
              };
              reader.readAsDataURL(audioBlob);
              return;
            }
          } catch (e) {
            console.warn('Error processing audio chunks:', e);
          }
        }
        setIsTranscribingWithGemini(false);
        setInternalState('idle');
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecordingMedia(true);
    } catch (err: any) {
      console.warn('Microphone stream error:', err);
      if (err.name === 'NotAllowedError') {
        setVoiceError('Microphone permission blocked. Click the lock 🔒 in the browser address bar to Allow.');
      }
    }
  };

  const stopMediaRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Stop recorder error:', e);
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    // Initialize Voice Recognizer & Synthesizer ONCE
    const recognizer = new NivaVoiceRecognizer('en-IN');
    const synthesizer = new NivaVoiceSynthesizer();

    if (gender) {
      synthesizer.setGender(gender);
    }
    setCurrentGender(synthesizer.getGender());

    const supported = recognizer.isSupported();
    setIsSupported(supported);

    recognizer.onStart = () => {
      setVoiceError(null);
      hasDeliveredTranscriptRef.current = false;
      setInternalState('listening');
    };

    recognizer.onResult = (text: string, isFinal: boolean) => {
      setTranscript(text);
      if (isFinal && text.trim()) {
        deliverTranscript(text.trim());
      }
    };

    recognizer.onError = (err) => {
      console.warn('Google Speech recognition note:', err);
      if (err === 'not-allowed') {
        setVoiceError('Microphone permission blocked. Click the lock 🔒 icon in browser URL bar to Allow.');
      } else if (err === 'network') {
        setVoiceError('Google Speech Network issue. Using Gemini Audio Engine.');
      }
    };

    recognizer.onEnd = () => {
      if (isContinuousRef.current) {
        setTimeout(() => recognizer.start(), 300);
      } else {
        setInternalState('idle');
      }
    };

    synthesizer.onStart = () => {
      setInternalState('speaking');
      // Mute microphone while assistant is talking to eliminate speaker echo
      recognizer.stop();
      stopMediaRecording();
    };

    synthesizer.onEnd = () => {
      setInternalState('idle');
      // Resume listening cleanly after NIVA finishes vocalizing
      if (isContinuousRef.current) {
        setTimeout(() => {
          hasDeliveredTranscriptRef.current = false;
          recognizer.start();
        }, 350);
      }
    };

    recognizerRef.current = recognizer;
    synthesizerRef.current = synthesizer;
    setActiveVoiceName(synthesizer.getSelectedVoiceName());

    if (autoStart && supported) {
      setTimeout(() => {
        try {
          recognizer.start();
        } catch (e) {
          console.warn('AutoStart error:', e);
        }
      }, 250);
    }

    return () => {
      recognizer.stop();
      synthesizer.stop();
      stopMediaRecording();
    };
  }, []); // Run ONCE on mount

  // Sync with prop changes if parent updates gender
  useEffect(() => {
    if (gender && synthesizerRef.current && synthesizerRef.current.getGender() !== gender) {
      synthesizerRef.current.setGender(gender);
      setCurrentGender(gender);
      setActiveVoiceName(synthesizerRef.current.getSelectedVoiceName());
    }
  }, [gender]);

  // Vocalize assistant response when received in auto-speak mode
  useEffect(() => {
    if (autoSpeakResponse && lastAssistantResponse && synthesizerRef.current) {
      synthesizerRef.current.speak(lastAssistantResponse);
    }
  }, [lastAssistantResponse, autoSpeakResponse]);

  const toggleVoiceGender = (explicitGender?: VoiceGender) => {
    const nextGender: VoiceGender = explicitGender || (currentGender === 'male' ? 'female' : 'male');
    setCurrentGender(nextGender);
    if (synthesizerRef.current) {
      synthesizerRef.current.setGender(nextGender);
      setActiveVoiceName(synthesizerRef.current.getSelectedVoiceName());
      synthesizerRef.current.speak(
        nextGender === 'female'
          ? 'NIVA Female voice active ho gayi hai.'
          : 'NIVA Male voice active ho gaya hai.'
      );
    }
    onGenderChange?.(nextGender);
  };

  const toggleListening = () => {
    setVoiceError(null);

    if (currentState === 'listening') {
      // User tapped to finish speaking
      recognizerRef.current?.stop();
      stopMediaRecording();
      setInternalState('idle');
    } else {
      // User tapped to start speaking
      hasDeliveredTranscriptRef.current = false;
      synthesizerRef.current?.stop();
      setInternalState('listening');

      // 1. Start Google Speech Recognition
      if (recognizerRef.current?.isSupported()) {
        try {
          recognizerRef.current.start();
        } catch (err: any) {
          console.warn('Recognizer start notice:', err);
        }
      }

      // 2. Start parallel MediaRecorder as reliable Google Gemini audio fallback
      startMediaRecording();
    }
  };

  const toggleContinuous = () => {
    const next = !isContinuousMode;
    setIsContinuousMode(next);
    if (!next) {
      recognizerRef.current?.stop();
      stopMediaRecording();
      setInternalState('idle');
    } else {
      recognizerRef.current?.start();
      startMediaRecording();
    }
  };

  const triggerPresetVoiceCommand = (commandText: string) => {
    setTranscript(commandText);
    deliverTranscript(commandText);
    if (synthesizerRef.current) {
      synthesizerRef.current.speak(`Executing: ${commandText}`);
    }
  };

  const getContainerStateClass = () => {
    switch (currentState) {
      case 'listening': return styles.stateListening;
      case 'thinking': return styles.stateThinking;
      case 'speaking': return styles.stateSpeaking;
      default: return '';
    }
  };

  const getStatusLabel = () => {
    switch (currentState) {
      case 'listening':
        return `🎙️ Google Voice Engine Active (${language === 'en-IN' ? 'Hinglish / en-IN' : 'हिन्दी / hi-IN'})... Click core when finished speaking.`;
      case 'thinking':
        return isTranscribingWithGemini
          ? '🧠 Google Gemini 2.0 Flash Transcribing Audio...'
          : '🧠 NIVA is thinking & processing...';
      case 'speaking':
        return `🔊 NIVA Vocalizing (${currentGender === 'male' ? 'Male Voice' : 'Female Voice'})...`;
      default:
        return 'Click Arc Reactor or say "Hey NIVA" to speak';
    }
  };

  return (
    <div className={`${styles.orbContainer} ${getContainerStateClass()}`}>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          title="Close Voice Orb"
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            zIndex: 10,
          }}
        >
          ✕
        </button>
      )}

      {/* Holographic Arc Reactor Orb (Clickable to start/stop listening) */}
      <div
        className={styles.orbWrapper}
        onClick={toggleListening}
        title={currentState === 'listening' ? 'Click to stop listening and send' : 'Click Arc Reactor to talk with NIVA'}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <div className={styles.ring3} />
        <div className={styles.ring2} />
        <div className={styles.ring1} />
        <div className={styles.orbCore} />
      </div>

      {/* Frequency Waveform */}
      <div className={styles.waveform}>
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
      </div>

      <div className={styles.statusLabel}>{getStatusLabel()}</div>

      {/* Wake Word Helper Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.76rem',
          color: '#94a3b8',
          marginTop: '-4px',
          marginBottom: '8px',
        }}
      >
        <span>⚡ Wake Word:</span>
        <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
          "Hey NIVA"
        </code>
        <span>or</span>
        <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
          "NIVA"
        </code>
      </div>

      {voiceError && (
        <div
          style={{
            margin: '8px 16px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️ {voiceError}</span>
          <button
            onClick={() => {
              setVoiceError(null);
              toggleListening();
            }}
            type="button"
            style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              padding: '3px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {transcript && <div className={styles.transcriptPreview}>"{transcript}"</div>}

      {/* One-Click Voice Demonstration Pills (Guaranteed viva presentation fallback) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          margin: '6px 0 10px',
        }}
      >
        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Quick Test:</span>
        <button
          onClick={() => triggerPresetVoiceCommand('NIVA, system health and laptop status report do')}
          type="button"
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.75rem',
            color: '#7dd3fc',
            cursor: 'pointer',
          }}
        >
          📊 System Status
        </button>
        <button
          onClick={() => triggerPresetVoiceCommand('NIVA, open YouTube and play Bollywood hits')}
          type="button"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.75rem',
            color: '#fca5a5',
            cursor: 'pointer',
          }}
        >
          ▶️ Play YouTube
        </button>
        <button
          onClick={() => triggerPresetVoiceCommand('NIVA, open Notepad on my laptop')}
          type="button"
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.75rem',
            color: '#6ee7b7',
            cursor: 'pointer',
          }}
        >
          📝 Open Notepad
        </button>
        <button
          onClick={() => triggerPresetVoiceCommand('NIVA, write a quick Python script to check system CPU')}
          type="button"
          style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.75rem',
            color: '#d8b4fe',
            cursor: 'pointer',
          }}
        >
          💻 Code Script
        </button>
      </div>

      <div className={styles.controlsRow}>
        <button
          className={`${styles.controlBtn} ${currentState === 'listening' ? styles.activeModeBtn : ''}`}
          onClick={toggleListening}
          type="button"
          style={{
            borderColor: currentState === 'listening' ? '#ef4444' : '#22c55e',
            color: currentState === 'listening' ? '#fca5a5' : '#4ade80',
            background: currentState === 'listening' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.15)',
            fontWeight: 700,
            padding: '6px 14px',
          }}
        >
          <span>{currentState === 'listening' ? '🛑 Click to Send Voice' : '🎙️ Tap to Speak'}</span>
        </button>

        <button
          className={`${styles.controlBtn} ${currentGender === 'male' ? styles.activeModeBtn : ''}`}
          onClick={() => toggleVoiceGender('male')}
          type="button"
          title="Switch to Male AI Voice"
          style={{
            borderColor: currentGender === 'male' ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
            color: currentGender === 'male' ? '#60a5fa' : '#94a3b8',
            background: currentGender === 'male' ? 'rgba(59, 130, 246, 0.22)' : 'transparent',
            fontWeight: currentGender === 'male' ? 700 : 500,
          }}
        >
          <span>♂️ Male Voice</span>
        </button>

        <button
          className={`${styles.controlBtn} ${currentGender === 'female' ? styles.activeModeBtn : ''}`}
          onClick={() => toggleVoiceGender('female')}
          type="button"
          title="Switch to Female AI Voice"
          style={{
            borderColor: currentGender === 'female' ? '#ec4899' : 'rgba(255, 255, 255, 0.15)',
            color: currentGender === 'female' ? '#f472b6' : '#94a3b8',
            background: currentGender === 'female' ? 'rgba(236, 72, 153, 0.22)' : 'transparent',
            fontWeight: currentGender === 'female' ? 700 : 500,
          }}
        >
          <span>♀️ Female Voice</span>
        </button>

        <button
          className={`${styles.controlBtn} ${language === 'hi-IN' ? styles.activeModeBtn : ''}`}
          onClick={toggleLanguage}
          type="button"
          title={`Google Speech Language: ${language === 'en-IN' ? 'Indian English / Hinglish' : 'Pure Hindi'}`}
          style={{
            borderColor: language === 'hi-IN' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(16, 185, 129, 0.4)',
            color: language === 'hi-IN' ? '#fde047' : '#6ee7b7',
          }}
        >
          <span>{language === 'en-IN' ? '🇮🇳 Hinglish (en-IN)' : '🇮🇳 हिन्दी (hi-IN)'}</span>
        </button>

        <button
          className={`${styles.controlBtn} ${isContinuousMode ? styles.activeModeBtn : ''}`}
          onClick={toggleContinuous}
          type="button"
        >
          <span>{isContinuousMode ? '🟢 Auto-Listen: ON' : '⚪ Auto-Listen: OFF'}</span>
        </button>

        {currentState === 'speaking' && (
          <button
            className={styles.controlBtn}
            onClick={() => synthesizerRef.current?.stop()}
            type="button"
          >
            ⏹️ Mute Speech
          </button>
        )}
      </div>

      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
        🔊 Active Voice: <span style={{ color: '#818cf8', fontWeight: 600 }}>{activeVoiceName || (currentGender === 'male' ? 'Indian Male Engine' : 'Indian Female Engine')}</span>
      </div>
    </div>
  );
};
