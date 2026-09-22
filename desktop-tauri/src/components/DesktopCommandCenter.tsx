import React, { useState, useEffect, useRef } from 'react';
import styles from './DesktopCommandCenter.module.css';
import {
  getSystemTelemetry,
  getDeviceIdentity,
  launchAllowedApp,
  toggleHUD,
  lockWorkstation,
  restartPC,
  shutdownPC,
  showNativeNotification,
} from '../lib/tauriBridge';
import { apiClient } from '../lib/apiClient';
import { SystemTelemetry, DeviceIdentity, AllowedApp, ChatMessage } from '../types/desktop';
import type { GestureType } from '../types/desktop';
import { DesktopVoiceOrb } from './DesktopVoiceOrb';
import { ConfirmationModal } from './ConfirmationModal';
import { VisionGesturePanel } from './VisionGesturePanel';

interface DesktopCommandCenterProps {
  onSwitchToHUD: () => void;
}

export const DesktopCommandCenter: React.FC<DesktopCommandCenterProps> = ({ onSwitchToHUD }) => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Jarvis Desktop OS online. Connected to native Tauri subsystem. Kahiye, main aapki kya madad karoon?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [lastAssistantReply, setLastAssistantReply] = useState<string>('');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);

  // Power action confirmation modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: 'restart' | 'shutdown' | null;
    title: string;
    subtext?: string;
    message: string;
  }>({
    isOpen: false,
    action: null,
    title: '',
    message: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial hardware & server handshake
    const loadHardware = async () => {
      try {
        const id = await getDeviceIdentity();
        setIdentity(id);
        await apiClient.registerDevice(id);
      } catch (e) {
        console.warn('Identity load error:', e);
      }

      const health = await apiClient.checkHealth();
      setServerOnline(health.online);
    };

    loadHardware();

    const fetchTelemetry = async () => {
      try {
        const data = await getSystemTelemetry();
        setTelemetry(data);
      } catch (e) {
        console.warn('Telemetry error:', e);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendCustomMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isProcessing) return;

    const userText = textToSend.trim();
    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    // Client-side execution for local apps and core Jarvis commands
    let directReply: string | null = null;
    const lower = userText.toLowerCase();

    if (lower.includes('notepad')) {
      handleAppClick('notepad');
      directReply = 'Maine Notepad launch kar diya hai.';
    } else if (lower.includes('calc')) {
      handleAppClick('calculator');
      directReply = 'Maine Calculator open kar diya hai.';
    } else if (lower.includes('chrome') || lower.includes('browser')) {
      handleAppClick('chrome');
      directReply = 'Maine Chrome browser open kar diya hai.';
    } else if (lower.includes('code') || lower.includes('vscode')) {
      handleAppClick('vscode');
      directReply = 'Maine VS Code editor open kar diya hai.';
    } else if (lower.includes('terminal') || lower.includes('cmd')) {
      handleAppClick('terminal');
      directReply = 'Maine Terminal open kar diya hai.';
    } else if (lower.includes('lock') && (lower.includes('screen') || lower.includes('laptop') || lower.includes('pc'))) {
      handleLockWorkstation();
      directReply = 'Workstation lock kar diya gaya hai.';
    } else if (lower.includes('restart') && (lower.includes('pc') || lower.includes('laptop'))) {
      openPowerConfirmation('restart');
      directReply = 'System restart confirmation dialog open kar diya hai.';
    } else if ((lower.includes('shutdown') || lower.includes('band kar')) && (lower.includes('pc') || lower.includes('laptop'))) {
      openPowerConfirmation('shutdown');
      directReply = 'System shutdown confirmation dialog open kar diya hai.';
    } else if (lower.includes('hello') || lower.includes('namaste') || lower.includes('hi niva') || lower === 'hi') {
      directReply = 'Namaste! Main NIVA hoon. Main aapki kya madad kar sakti hoon?';
    } else if (lower.includes('kaise ho') || lower.includes('how are you')) {
      directReply = 'Main bilkul theek hoon! Aapka laptop aur NIVA desktop engine active hain.';
    } else if (lower.includes('who are you') || lower.includes('tum kaun ho')) {
      directReply = 'Main NIVA hoon — aapka Neural Intelligent Virtual Assistant aur personal Jarvis.';
    }

    let replyText = directReply;
    if (!replyText) {
      const res = await apiClient.sendMessage(userText);
      replyText = res.text;
    }

    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setLastAssistantReply(replyText);
    setIsProcessing(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputVal.trim()) return;
    const current = inputVal;
    setInputVal('');
    await handleSendCustomMessage(current);
  };

  const handleAppClick = async (appName: AllowedApp) => {
    setActionNotice(`Executing ${appName}...`);
    const res = await launchAllowedApp(appName);
    if (res.success) {
      setActionNotice(`✓ Launched ${appName}`);
    } else {
      setActionNotice(`✗ ${res.error || 'Failed'}`);
    }
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Safe Power Management Handlers
  const handleLockWorkstation = async () => {
    setActionNotice('Locking workstation...');
    const res = await lockWorkstation();
    if (res.success) {
      setActionNotice('✓ Workstation locked securely');
      showNativeNotification('NIVA Security Gateway', 'Workstation screen locked successfully.');
    } else {
      setActionNotice(`✗ ${res.error || 'Lock failed'}`);
    }
    setTimeout(() => setActionNotice(null), 3500);
  };

  const openPowerConfirmation = (action: 'restart' | 'shutdown') => {
    if (action === 'restart') {
      setModalState({
        isOpen: true,
        action: 'restart',
        title: 'CONFIRM SYSTEM RESTART',
        subtext: 'SECONDARY AUTHORIZATION REQUIRED',
        message:
          'Kya aap sach me system restart karna chahte hain? NIVA safe restart command trigger karegi (5-second countdown).',
      });
    } else {
      setModalState({
        isOpen: true,
        action: 'shutdown',
        title: 'CONFIRM SYSTEM SHUTDOWN',
        subtext: 'CRITICAL POWER ACTION GATED',
        message:
          'Kya aap sach me system band karna chahte hain? NIVA safe shutdown command trigger karegi (5-second countdown).',
      });
    }
  };

  const handleConfirmPower = async () => {
    const action = modalState.action;
    setModalState({ isOpen: false, action: null, title: '', message: '' });
    if (!action) return;

    if (action === 'restart') {
      setActionNotice('Initiating system restart...');
      const res = await restartPC(true);
      if (res.success) {
        setActionNotice('✓ System restart initiated (5s countdown)');
        showNativeNotification('NIVA Power System', 'System restart initiated in 5s.');
      } else {
        setActionNotice(`✗ ${res.error}`);
      }
    } else if (action === 'shutdown') {
      setActionNotice('Initiating system shutdown...');
      const res = await shutdownPC(true);
      if (res.success) {
        setActionNotice('✓ System shutdown initiated (5s countdown)');
        showNativeNotification('NIVA Power System', 'System shutdown initiated in 5s.');
      } else {
        setActionNotice(`✗ ${res.error}`);
      }
    }
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Voice transcript handler from DesktopVoiceOrb
  const handleVoiceTranscript = (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();

    // Direct Voice Command Detection
    if (lower.includes('lock') && (lower.includes('screen') || lower.includes('laptop') || lower.includes('pc') || lower.includes('system'))) {
      handleLockWorkstation();
      return;
    }
    if (lower.includes('restart') && (lower.includes('pc') || lower.includes('laptop') || lower.includes('system'))) {
      openPowerConfirmation('restart');
      return;
    }
    if ((lower.includes('shutdown') || lower.includes('band kar') || lower.includes('turn off')) && (lower.includes('pc') || lower.includes('laptop') || lower.includes('system'))) {
      openPowerConfirmation('shutdown');
      return;
    }

    // Default: Dispatch as conversation message
    handleSendCustomMessage(text);
  };

  return (
    <div className={styles.commandCenter}>
      {/* Header Bar */}
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.logoIcon}>N</div>
          <div>
            <div className={styles.title}>NIVA COMMAND CENTER</div>
            <div className={styles.subtitle}>Tauri Native Desktop Jarvis OS</div>
          </div>
        </div>

        <div className={styles.navBadges}>
          {actionNotice && <div className={styles.actionBanner}>{actionNotice}</div>}
          <div className={`${styles.badge} ${serverOnline ? styles.onlineBadge : ''}`}>
            <span>●</span>
            <span>{serverOnline ? 'Backend API (3001) Connected' : 'Local Standalone Mode'}</span>
          </div>
          <button
            className={styles.hudSwitchBtn}
            onClick={() => {
              toggleHUD();
              onSwitchToHUD();
            }}
            title="Switch to Floating Arc Core HUD"
          >
            Switch to Floating HUD ⛶
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className={styles.mainContent}>
        {/* Left Column: Live Hardware Telemetry & Allowed Apps & Safe Power */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Hardware Telemetry</span>
          </div>

          <div className={styles.metricRow}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>
                <span>CPU UTILIZATION</span>
                <span>{telemetry ? `${telemetry.cpu_usage}%` : '18.4%'}</span>
              </div>
              <div className={styles.metricVal}>
                {telemetry ? `${telemetry.cpu_usage}%` : '18.4%'}
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.min(100, telemetry?.cpu_usage || 18)}%` }}
                />
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>
                <span>SYSTEM RAM</span>
                <span>
                  {telemetry
                    ? `${telemetry.used_memory_gb} / ${telemetry.total_memory_gb} GB`
                    : '15.2 / 15.82 GB'}
                </span>
              </div>
              <div className={styles.metricVal}>
                {telemetry ? `${telemetry.used_memory_gb} GB` : '15.2 GB'}
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${
                      telemetry
                        ? Math.min(100, (telemetry.used_memory_gb / telemetry.total_memory_gb) * 100)
                        : 95
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>
                <span>SYSTEM UPTIME</span>
                <span>ACTIVE</span>
              </div>
              <div className={styles.metricVal}>
                {telemetry ? `${telemetry.uptime_hours} hrs` : '3.8 hrs'}
              </div>
            </div>
          </div>

          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Allowed PC Apps</span>
          </div>

          <div className={styles.appGrid}>
            <button className={styles.appButton} onClick={() => handleAppClick('notepad')}>
              <span>📝</span>
              <span>Notepad</span>
            </button>
            <button className={styles.appButton} onClick={() => handleAppClick('calculator')}>
              <span>🧮</span>
              <span>Calculator</span>
            </button>
            <button className={styles.appButton} onClick={() => handleAppClick('chrome')}>
              <span>🌐</span>
              <span>Chrome</span>
            </button>
            <button className={styles.appButton} onClick={() => handleAppClick('vscode')}>
              <span>💻</span>
              <span>VS Code</span>
            </button>
            <button className={styles.appButton} onClick={() => handleAppClick('explorer')}>
              <span>📁</span>
              <span>Explorer</span>
            </button>
            <button className={styles.appButton} onClick={() => handleAppClick('terminal')}>
              <span>⚡</span>
              <span>Terminal</span>
            </button>
          </div>

          <div className={styles.panelHeader} style={{ marginTop: '16px' }}>
            <span className={styles.panelTitle}>Safe Power Controls</span>
          </div>

          <div className={styles.powerControlGrid}>
            <button
              className={`${styles.powerBtn} ${styles.lockBtn}`}
              onClick={handleLockWorkstation}
              title="Instantly lock screen"
            >
              <span>🔒</span>
              <span>Lock PC</span>
            </button>
            <button
              className={`${styles.powerBtn} ${styles.restartBtn}`}
              onClick={() => openPowerConfirmation('restart')}
              title="Restart with confirmation"
            >
              <span>🔄</span>
              <span>Restart</span>
            </button>
            <button
              className={`${styles.powerBtn} ${styles.shutdownBtn}`}
              onClick={() => openPowerConfirmation('shutdown')}
              title="Shutdown with confirmation"
            >
              <span>⏻</span>
              <span>Shutdown</span>
            </button>
          </div>
        </div>

        {/* Middle Column: Interactive NIVA Agent Stream */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Neural Conversational Stream</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Dual Voice Engine Active</span>
          </div>

          <div className={styles.chatContainer}>
            <div className={styles.messagesList}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.message} ${
                    m.role === 'user' ? styles.userMsg : styles.assistantMsg
                  }`}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: m.role === 'user' ? '#93c5fd' : '#64748b',
                      marginTop: '4px',
                      textAlign: m.role === 'user' ? 'right' : 'left',
                    }}
                  >
                    {m.timestamp}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className={`${styles.message} ${styles.assistantMsg}`}>
                  <span style={{ color: '#38bdf8' }}>🧠 NIVA thinking & executing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputRow} onSubmit={handleSendMessage}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder="Give command (e.g. 'Notepad kholo', 'laptop lock kardo', 'telemetry')..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
              <button type="submit" className={styles.sendBtn} disabled={isProcessing}>
                SEND ➔
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Voice, Vision & Device Identity */}
        <div className={styles.panel} style={{ overflowY: 'auto' }}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Arc Voice Engine</span>
          </div>

          {/* Desktop Voice Orb with visible states & waveform bars */}
          <div className={styles.voiceSection}>
            <DesktopVoiceOrb
              onTranscriptReady={handleVoiceTranscript}
              lastAssistantReply={lastAssistantReply}
              autoSpeak={autoSpeak}
            />

            <div className={styles.ttsControls}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Voice Read-Aloud</span>
              <button
                type="button"
                className={styles.ttsToggleBtn}
                onClick={() => setAutoSpeak(!autoSpeak)}
              >
                {autoSpeak ? '🔊 TTS: ON' : '🔇 TTS: MUTED'}
              </button>
            </div>
          </div>

          <div className={styles.panelHeader} style={{ marginTop: '10px' }}>
            <span className={styles.panelTitle}>Vision & Hand Gestures</span>
          </div>

          <VisionGesturePanel
            onGestureAction={(action: string, _gesture: GestureType) => {
              switch (action) {
                case 'mute_voice':
                  setAutoSpeak((prev) => !prev);
                  setActionNotice(autoSpeak ? '✊ Voice muted via gesture' : '✊ Voice unmuted via gesture');
                  setTimeout(() => setActionNotice(null), 2500);
                  break;
                case 'stop_action':
                  setActionNotice('✋ Action cancelled via gesture');
                  setTimeout(() => setActionNotice(null), 2500);
                  break;
                case 'toggle_hud':
                  toggleHUD();
                  setActionNotice('✌️ HUD toggled via gesture');
                  setTimeout(() => setActionNotice(null), 2500);
                  break;
                case 'confirm':
                  if (modalState.isOpen) {
                    handleConfirmPower();
                    setActionNotice('👍 Power action confirmed via gesture');
                    setTimeout(() => setActionNotice(null), 3000);
                  } else {
                    setActionNotice('👍 Confirmed via gesture');
                    setTimeout(() => setActionNotice(null), 2500);
                  }
                  break;
                case 'lock_pc':
                  handleLockWorkstation();
                  break;
                case 'volume_up':
                  setActionNotice('👆 Volume / Scroll Up');
                  setTimeout(() => setActionNotice(null), 2000);
                  break;
                case 'volume_down':
                  setActionNotice('👇 Volume / Scroll Down');
                  setTimeout(() => setActionNotice(null), 2000);
                  break;
                default:
                  break;
              }
            }}
          />

          <div className={styles.panelHeader} style={{ marginTop: '10px' }}>
            <span className={styles.panelTitle}>Device Identity</span>
          </div>

          <div className={styles.identityCard}>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>Device ID:</span>
              <span className={styles.idValue}>
                {identity?.device_id || 'NIVA-PC-HARSHIT-1582'}
              </span>
            </div>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>Host Name:</span>
              <span className={styles.idValue}>{identity?.hostname || 'HARSHIT'}</span>
            </div>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>OS:</span>
              <span className={styles.idValue}>{identity?.os_name || 'Windows 11'}</span>
            </div>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>Processor:</span>
              <span className={styles.idValue} style={{ fontSize: '10px' }}>
                {identity?.cpu_brand || 'AMD Ryzen 7 7435HS'}
              </span>
            </div>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>RAM:</span>
              <span className={styles.idValue}>
                {identity ? `${identity.total_memory_gb} GB` : '15.82 GB'}
              </span>
            </div>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>Security:</span>
              <span className={styles.idValue} style={{ color: '#4ade80' }}>
                GATED + VISION + VOICE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gated Human-In-The-Loop Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        subtext={modalState.subtext}
        message={modalState.message}
        confirmLabel={
          modalState.action === 'restart' ? 'CONFIRM RESTART PC' : 'CONFIRM SHUTDOWN PC'
        }
        cancelLabel="ABORT"
        onConfirm={handleConfirmPower}
        onCancel={() => setModalState({ isOpen: false, action: null, title: '', message: '' })}
      />
    </div>
  );
};
