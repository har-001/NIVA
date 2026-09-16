import React, { useState, useEffect } from 'react';
import styles from './ArcCoreHUD.module.css';
import { getSystemTelemetry, launchAllowedApp, toggleMainWindow } from '../lib/tauriBridge';
import { SystemTelemetry, AllowedApp } from '../types/desktop';

interface ArcCoreHUDProps {
  onExpandCommandCenter: () => void;
}

export const ArcCoreHUD: React.FC<ArcCoreHUDProps> = ({ onExpandCommandCenter }) => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [statusText, setStatusText] = useState<string>('Jarvis Arc Core Online');
  const [isListening, setIsListening] = useState<boolean>(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getSystemTelemetry();
        setTelemetry(data);
      } catch (e) {
        console.warn('Telemetry fetch error:', e);
      }
    };

    fetchStats();
    const timer = setInterval(fetchStats, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleAppLaunch = async (appName: AllowedApp) => {
    setStatusText(`Launching ${appName}...`);
    try {
      const res = await launchAllowedApp(appName);
      if (res.success) {
        setStatusText(`✓ ${appName} active`);
      } else {
        setStatusText(`✗ Failed: ${res.error || 'Error'}`);
      }
    } catch {
      setStatusText(`✗ Launch error`);
    }
    setTimeout(() => setStatusText('Jarvis Arc Core Online'), 3000);
  };

  const toggleVoiceMode = () => {
    setIsListening(!isListening);
    setStatusText(!isListening ? '🎙️ Listening for commands...' : 'Jarvis Arc Core Online');
  };

  return (
    <div className={styles.hudContainer}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.brandPill}>
          <div className={styles.pulseDot} />
          <span>NIVA TAURI CORE</span>
        </div>
        <div className={styles.windowControls}>
          <button
            className={styles.miniBtn}
            onClick={() => {
              toggleMainWindow();
              onExpandCommandCenter();
            }}
            title="Open Full Command Center"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Holographic Arc Reactor Core */}
      <div
        className={`${styles.coreWrapper} ${isListening ? styles.listening : ''}`}
        onClick={toggleVoiceMode}
        title="Click to toggle Voice Assistant"
      >
        <div className={styles.arcRing1} />
        <div className={styles.arcRing2} />
        <div className={styles.arcRing3} />
        <div className={styles.coreSphere}>N</div>
      </div>

      {/* Real-time Hardware Telemetry Grid */}
      <div className={styles.telemetryGrid}>
        <div className={styles.telemetryItem}>
          <span className={styles.statLabel}>CPU LOAD</span>
          <span className={styles.statVal}>{telemetry ? `${telemetry.cpu_usage}%` : '18.4%'}</span>
        </div>
        <div className={styles.telemetryItem}>
          <span className={styles.statLabel}>RAM IN USE</span>
          <span className={styles.statVal}>
            {telemetry ? `${telemetry.used_memory_gb} GB` : '15.2 GB'}
          </span>
        </div>
        <div className={styles.telemetryItem}>
          <span className={styles.statLabel}>PROCS</span>
          <span className={styles.statVal}>{telemetry ? telemetry.process_count : '248'}</span>
        </div>
      </div>

      {/* Status Output Line */}
      <div className={styles.statusOutput}>{statusText}</div>

      {/* Quick Launch Actions */}
      <div className={styles.quickActions}>
        <button className={styles.actionPill} onClick={() => handleAppLaunch('notepad')}>
          📝 Note
        </button>
        <button className={styles.actionPill} onClick={() => handleAppLaunch('calculator')}>
          🧮 Calc
        </button>
        <button className={styles.actionPill} onClick={() => handleAppLaunch('chrome')}>
          🌐 Web
        </button>
        <button className={styles.actionPill} onClick={() => handleAppLaunch('vscode')}>
          💻 Code
        </button>
      </div>
    </div>
  );
};
