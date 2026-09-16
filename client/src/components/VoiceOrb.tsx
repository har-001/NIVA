'use client';

// ============================================
// NIVA — Neural Voice Orb Component
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import styles from './VoiceOrb.module.css';
import { NivaVoiceRecognizer, NivaVoiceSynthesizer, VoiceGender } from '../lib/voice';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  state: VoiceState;
  onTranscriptReady: (transcript: string) => void;
  autoSpeakResponse?: boolean;
  lastAssistantResponse?: string;
  gender?: VoiceGender;
  onGenderChange?: (gender: VoiceGender) => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state: parentState,
  onTranscriptReady,
  autoSpeakResponse = true,
  lastAssistantResponse,
  gender,
  onGenderChange,
}) => {
  const [internalState, setInternalState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [currentGender, setCurrentGender] = useState<VoiceGender>(gender || 'male');

  const recognizerRef = useRef<NivaVoiceRecognizer | null>(null);
  const synthesizerRef = useRef<NivaVoiceSynthesizer | null>(null);

  // Computed state combining parent state and local voice activity
  const currentState: VoiceState =
    parentState === 'thinking' ? 'thinking' : internalState !== 'idle' ? internalState : parentState;

  useEffect(() => {
    // Initialize Voice Recognizer & Synthesizer
    const recognizer = new NivaVoiceRecognizer('en-IN');
    const synthesizer = new NivaVoiceSynthesizer();

    if (gender) {
      synthesizer.setGender(gender);
    }
    setCurrentGender(synthesizer.getGender());

    setIsSupported(recognizer.isSupported());

    recognizer.onStart = () => {
      setInternalState('listening');
    };

    recognizer.onResult = (text: string, isFinal: boolean) => {
      setTranscript(text);
      if (isFinal && text.trim()) {
        onTranscriptReady(text.trim());
        setTranscript('');
      }
    };

    recognizer.onError = (err) => {
      console.warn('Voice error:', err);
      setInternalState('idle');
    };

    recognizer.onEnd = () => {
      if (isContinuousMode) {
        // restart if in continuous conversation mode
        setTimeout(() => recognizer.start(), 300);
      } else {
        setInternalState('idle');
      }
    };

    synthesizer.onStart = () => {
      setInternalState('speaking');
    };

    synthesizer.onEnd = () => {
      setInternalState('idle');
    };

    recognizerRef.current = recognizer;
    synthesizerRef.current = synthesizer;

    return () => {
      recognizer.stop();
      synthesizer.stop();
    };
  }, [isContinuousMode, onTranscriptReady]);

  // Sync with prop changes if parent updates gender
  useEffect(() => {
    if (gender && synthesizerRef.current && synthesizerRef.current.getGender() !== gender) {
      synthesizerRef.current.setGender(gender);
      setCurrentGender(gender);
    }
  }, [gender]);

  // Vocalize assistant response when received in auto-speak mode
  useEffect(() => {
    if (autoSpeakResponse && lastAssistantResponse && synthesizerRef.current) {
      synthesizerRef.current.speak(lastAssistantResponse);
    }
  }, [lastAssistantResponse, autoSpeakResponse]);

  const toggleVoiceGender = () => {
    const nextGender: VoiceGender = currentGender === 'male' ? 'female' : 'male';
    setCurrentGender(nextGender);
    if (synthesizerRef.current) {
      synthesizerRef.current.setGender(nextGender);
      synthesizerRef.current.speak(
        nextGender === 'female'
          ? 'Maine female voice select kar li hai.'
          : 'Maine male voice select kar li hai.'
      );
    }
    onGenderChange?.(nextGender);
  };

  const toggleListening = () => {
    if (!recognizerRef.current) return;
    if (currentState === 'listening') {
      recognizerRef.current.stop();
      setInternalState('idle');
    } else {
      synthesizerRef.current?.stop();
      recognizerRef.current.start();
    }
  };

  const toggleContinuous = () => {
    const next = !isContinuousMode;
    setIsContinuousMode(next);
    if (!next) {
      recognizerRef.current?.stop();
      setInternalState('idle');
    } else {
      recognizerRef.current?.start();
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
      case 'listening': return '🎙️ NIVA is listening (Google Engine)...';
      case 'thinking': return '🧠 NIVA is thinking & processing...';
      case 'speaking': return `🔊 NIVA is speaking (${currentGender === 'male' ? 'Male Voice' : 'Female Voice'})...`;
      default: return 'Tap orb to speak with NIVA';
    }
  };

  return (
    <div className={`${styles.orbContainer} ${getContainerStateClass()}`}>
      <div
        className={styles.orbWrapper}
        onClick={toggleListening}
        title={currentState === 'listening' ? 'Click to stop listening' : 'Click to talk to NIVA'}
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

      {transcript && <div className={styles.transcriptPreview}>"{transcript}"</div>}

      <div className={styles.controlsRow}>
        <button
          className={`${styles.controlBtn} ${isContinuousMode ? styles.activeModeBtn : ''}`}
          onClick={toggleContinuous}
          type="button"
        >
          <span>{isContinuousMode ? '🟢 Hands-Free: ON' : '⚪ Hands-Free: OFF'}</span>
        </button>

        <button
          className={`${styles.controlBtn} ${currentGender === 'female' ? styles.activeModeBtn : ''}`}
          onClick={toggleVoiceGender}
          type="button"
          title={`Click to switch between Male and Female Voice (Current: ${currentGender === 'male' ? 'Male' : 'Female'})`}
          style={{
            borderColor: currentGender === 'male' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)',
            color: currentGender === 'male' ? '#93c5fd' : '#f472b6',
          }}
        >
          <span>{currentGender === 'male' ? '♂ Voice: Male' : '♀ Voice: Female'}</span>
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
    </div>
  );
};
