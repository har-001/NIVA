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
  const silenceTimerRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>('');
  const isHandsFreeRef = useRef<boolean>(false);
  const onTranscriptReadyRef = useRef(onTranscriptReady);

  useEffect(() => {
    onTranscriptReadyRef.current = onTranscriptReady;
  }, [onTranscriptReady]);

  // Initialize persistent engine instances once on mount
  useEffect(() => {
    const recognizer = new NivaDesktopVoiceRecognizer('en-IN');
    const synthesizer = new NivaDesktopVoiceSynthesizer();

    setGender(synthesizer.getGender());

    recognizer.onStart = () => {
      setVoiceState('listening');
    };

    const dispatchPendingTranscript = () => {
      const text = currentTranscriptRef.current.trim();
      if (text) {
        currentTranscriptRef.current = '';
        setInterimText('');
        setVoiceState('thinking');
        onTranscriptReadyRef.current(text);

        // If not in hands-free mode, stop listening after successful dispatch
        if (!isHandsFreeRef.current) {
          recognizer.stop();
        }
      }
    };

    recognizer.onResult = (text: string, isFinal: boolean) => {
      currentTranscriptRef.current = text;
      setInterimText(text);

      // Debounce final utterance by 1.2 seconds so user has time to finish their sentence
      clearTimeout(silenceTimerRef.current);
      if (isFinal) {
        silenceTimerRef.current = setTimeout(dispatchPendingTranscript, 1200);
      } else {
        silenceTimerRef.current = setTimeout(dispatchPendingTranscript, 2000);
      }
    };

    recognizer.onError = (err: string) => {
      console.warn('[VoiceOrb] Recognizer error:', err);
      if (!isHandsFreeRef.current) {
        setVoiceState('idle');
        setInterimText('');
      }
    };

    recognizer.onEnd = () => {
      if (!isHandsFreeRef.current) {
        setVoiceState('idle');
      }
    };

    // Mute mic when NIVA speaks to prevent hearing its own voice (Echo cancellation)
    synthesizer.onStart = () => {
      setVoiceState('speaking');
      recognizer.muteDuringSpeech(true);
    };

    synthesizer.onEnd = () => {
      setVoiceState(isHandsFreeRef.current ? 'listening' : 'idle');
      recognizer.muteDuringSpeech(false);
    };

    recognizerRef.current = recognizer;
    synthesizerRef.current = synthesizer;

    return () => {
      clearTimeout(silenceTimerRef.current);
      recognizer.stop();
      synthesizer.stop();
    };
  }, []);

  // Auto-speak when assistant responds
  useEffect(() => {
    if (autoSpeak && lastAssistantReply && synthesizerRef.current) {
      synthesizerRef.current.speak(lastAssistantReply);
    }
  }, [lastAssistantReply, autoSpeak]);

  const toggleListening = () => {
    if (!recognizerRef.current) return;

    if (voiceState === 'listening') {
      // Manual click while listening: if there is text, send immediately
      if (currentTranscriptRef.current.trim()) {
        clearTimeout(silenceTimerRef.current);
        const text = currentTranscriptRef.current.trim();
        currentTranscriptRef.current = '';
        setInterimText('');
        setVoiceState('thinking');
        onTranscriptReadyRef.current(text);
      }
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
    isHandsFreeRef.current = next;

    if (recognizerRef.current) {
      recognizerRef.current.setHandsFree(next);
      if (!next) {
        recognizerRef.current.stop();
        setVoiceState('idle');
      } else {
        synthesizerRef.current?.stop();
        recognizerRef.current.start();
      }
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
