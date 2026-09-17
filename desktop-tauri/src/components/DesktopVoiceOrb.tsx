import React, { useState, useEffect, useRef } from 'react';
import styles from './DesktopVoiceOrb.module.css';
import { NivaDesktopVoiceRecognizer, VoiceListeningState } from '../lib/voiceRecognizer';
import { NivaDesktopVoiceSynthesizer, DesktopVoiceGender } from '../lib/voiceSynthesizer';

interface DesktopVoiceOrbProps {
  onTranscriptReady: (transcript: string) => void;
  lastAssistantReply?: string;
  autoSpeak?: boolean;
}

export const DesktopVoiceOrb: React.FC<DesktopVoiceOrbProps> = ({
  onTranscriptReady,
  lastAssistantReply,
  autoSpeak = true,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceListeningState>('idle');
  const [interimText, setInterimText] = useState<string>('');
  const [gender, setGender] = useState<DesktopVoiceGender>('male');
  const [isHandsFree, setIsHandsFree] = useState<boolean>(false);

  const recognizerRef = useRef<NivaDesktopVoiceRecognizer | null>(null);
  const synthesizerRef = useRef<NivaDesktopVoiceSynthesizer | null>(null);

  useEffect(() => {
    const recognizer = new NivaDesktopVoiceRecognizer('en-IN');
    const synthesizer = new NivaDesktopVoiceSynthesizer();

    setGender(synthesizer.getGender());

    recognizer.onStart = () => {
      setVoiceState('listening');
    };

    recognizer.onResult = (text: string, isFinal: boolean) => {
      if (isFinal) {
        setInterimText('');
        setVoiceState('thinking');
        onTranscriptReady(text);
      } else {
        setInterimText(text);
      }
    };

    recognizer.onError = () => {
      setVoiceState('idle');
      setInterimText('');
    };

    recognizer.onEnd = () => {
      if (isHandsFree) {
        setTimeout(() => recognizer.start(), 300);
      } else {
        setVoiceState('idle');
      }
    };

    synthesizer.onStart = () => {
      setVoiceState('speaking');
    };

    synthesizer.onEnd = () => {
      setVoiceState('idle');
    };

    recognizerRef.current = recognizer;
    synthesizerRef.current = synthesizer;

    return () => {
      recognizer.stop();
      synthesizer.stop();
    };
  }, [isHandsFree, onTranscriptReady]);

  // Auto-speak when assistant responds
  useEffect(() => {
    if (autoSpeak && lastAssistantReply && synthesizerRef.current) {
      synthesizerRef.current.speak(lastAssistantReply);
    }
  }, [lastAssistantReply, autoSpeak]);

  const toggleListening = () => {
    if (!recognizerRef.current) return;

    if (voiceState === 'listening') {
      recognizerRef.current.stop();
      setVoiceState('idle');
    } else {
      synthesizerRef.current?.stop();
      recognizerRef.current.start();
    }
  };

  const toggleHandsFree = () => {
    const next = !isHandsFree;
    setIsHandsFree(next);
    if (!next) {
      recognizerRef.current?.stop();
      setVoiceState('idle');
    } else {
      recognizerRef.current?.start();
    }
  };

  const toggleVoiceGender = () => {
    const nextGender: DesktopVoiceGender = gender === 'male' ? 'female' : 'male';
    setGender(nextGender);
    if (synthesizerRef.current) {
      synthesizerRef.current.setGender(nextGender);
      synthesizerRef.current.speak(
        nextGender === 'female'
          ? 'Maine female voice select kar li hai.'
          : 'Maine male voice select kar li hai.'
      );
    }
  };

  const getStateClass = () => {
    if (voiceState === 'listening') return styles.stateListening;
    if (voiceState === 'speaking') return styles.stateSpeaking;
    return '';
  };

  const getStatusText = () => {
    if (voiceState === 'listening') return '🎙️ NIVA Listening (Visible Audio Engine)...';
    if (voiceState === 'speaking') return `🔊 NIVA Speaking (${gender === 'male' ? 'Baritone Male' : 'Female'})...`;
    if (voiceState === 'thinking') return '🧠 Processing command...';
    return 'Tap Arc Core or use microphone to speak';
  };

  return (
    <div className={`${styles.voiceOrbContainer} ${getStateClass()}`}>
      {/* 3D Holographic Concentric Rings Core */}
      <div
        className={styles.orbCoreWrapper}
        onClick={toggleListening}
        title={voiceState === 'listening' ? 'Click to stop listening' : 'Click to talk to NIVA'}
      >
        <div className={styles.ring1} />
        <div className={styles.ring2} />
        <div className={styles.ring3} />
        <div className={styles.orbCenter}>
          {voiceState === 'listening' ? '🎙️' : voiceState === 'speaking' ? '🔊' : 'N'}
        </div>
      </div>

      {/* Dynamic Waveform Audio Visualization */}
      <div className={`${styles.waveform} ${voiceState !== 'idle' ? styles.activeWave : ''}`}>
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
        <div className={styles.waveBar} />
      </div>

      {/* Status Output */}
      <div className={styles.statusLabel}>{getStatusText()}</div>

      {/* Interim Transcripts */}
      {interimText && <div className={styles.interimText}>"{interimText}"</div>}

      {/* Mode & Voice Controls */}
      <div className={styles.controlsRow}>
        <button
          className={`${styles.controlPill} ${isHandsFree ? styles.activeMode : ''}`}
          onClick={toggleHandsFree}
        >
          <span>{isHandsFree ? '🟢 Hands-Free: ON' : '⚪ Hands-Free: OFF'}</span>
        </button>

        <button
          className={styles.controlPill}
          onClick={toggleVoiceGender}
          style={{
            borderColor: gender === 'male' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)',
            color: gender === 'male' ? '#93c5fd' : '#f472b6',
          }}
          title="Switch Voice Gender"
        >
          <span>{gender === 'male' ? '♂ Voice: Male' : '♀ Voice: Female'}</span>
        </button>

        {voiceState === 'speaking' && (
          <button
            className={styles.controlPill}
            onClick={() => synthesizerRef.current?.stop()}
            title="Mute current speech"
          >
            ⏹️ Stop
          </button>
        )}
      </div>
    </div>
  );
};
