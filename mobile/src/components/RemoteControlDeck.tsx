// ============================================
// NIVA — Mobile Remote Desktop Control Deck
// Allows mobile phone to monitor & control paired laptop
// ============================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DesktopTelemetry, AllowedApp } from '../types/mobile';
import { mobileApiClient } from '../services/apiClient';

interface RemoteControlDeckProps {
  telemetry: DesktopTelemetry | null;
  onRefreshTelemetry: () => void;
  onActionFeedback?: (msg: string) => void;
}

export const RemoteControlDeck: React.FC<RemoteControlDeckProps> = ({
  telemetry,
  onRefreshTelemetry,
  onActionFeedback,
}: RemoteControlDeckProps) => {
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  const handleLaunchApp = async (app: AllowedApp) => {
    setLoadingApp(app);
    onActionFeedback?.(`Dispatched: Launch ${app} on laptop...`);
    const res = await mobileApiClient.dispatchRemoteCommand({
      action: 'launch_app',
      app,
      timestamp: Date.now(),
    });
    setLoadingApp(null);
    onActionFeedback?.(res.message);
  };

  const handleLockLaptop = async () => {
    setLoadingApp('lock');
    onActionFeedback?.('Securing laptop workstation...');
    const res = await mobileApiClient.dispatchRemoteCommand({
      action: 'lock_workstation',
      timestamp: Date.now(),
    });
    setLoadingApp(null);
    onActionFeedback?.(res.message);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>PAIRED PC TELEMETRY</Text>
          <Text style={styles.cardSubtitle}>
            {telemetry?.hostname || 'HARSHIT-PC'} • {telemetry?.os_name || 'Windows 11'}
          </Text>
        </View>
        <TouchableOpacity onPress={onRefreshTelemetry} style={styles.refreshPill}>
          <Text style={styles.refreshText}>🔄 SYNC</Text>
        </TouchableOpacity>
      </View>

      {/* Telemetry Gauge Grid */}
      <View style={styles.gaugeGrid}>
        <View style={styles.gaugeItem}>
          <Text style={styles.gaugeVal}>{telemetry ? `${telemetry.cpu_usage_percent}%` : '18%'}</Text>
          <Text style={styles.gaugeLabel}>CPU LOAD</Text>
        </View>

        <View style={styles.gaugeItem}>
          <Text style={styles.gaugeVal}>
            {telemetry ? `${telemetry.memory_used_gb} GB` : '7.85 GB'}
          </Text>
          <Text style={styles.gaugeLabel}>RAM IN USE</Text>
        </View>

        <View style={styles.gaugeItem}>
          <Text style={styles.gaugeVal}>{telemetry ? `${telemetry.process_count}` : '148'}</Text>
          <Text style={styles.gaugeLabel}>PROCS</Text>
        </View>
      </View>

      {/* Quick Allowed App Launchers */}
      <Text style={styles.sectionLabel}>REMOTE DESKTOP APPS</Text>
      <View style={styles.appGrid}>
        {(['notepad', 'chrome', 'vscode', 'calculator', 'terminal'] as AllowedApp[]).map((app) => (
          <TouchableOpacity
            key={app}
            style={[styles.appBtn, loadingApp === app && styles.appBtnActive]}
            onPress={() => handleLaunchApp(app)}
            disabled={loadingApp !== null}
          >
            {loadingApp === app ? (
              <ActivityIndicator size="small" color="#38bdf8" />
            ) : (
              <Text style={styles.appBtnText}>
                {app === 'notepad' ? '📝 Notepad' : app === 'chrome' ? '🌐 Chrome' : app === 'vscode' ? '💻 VS Code' : app === 'calculator' ? '🔢 Calc' : '⚡ Terminal'}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Security Gated Action */}
      <TouchableOpacity
        style={styles.lockBtn}
        onPress={handleLockLaptop}
        disabled={loadingApp !== null}
      >
        <Text style={styles.lockBtnText}>🔒 INSTANT LOCK LAPTOP WORKSTATION</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0b1329',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginVertical: 10,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  refreshPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  refreshText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
  gaugeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  gaugeItem: {
    alignItems: 'center',
  },
  gaugeVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  gaugeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  appBtn: {
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBtnActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  appBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  lockBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  lockBtnText: {
    color: '#f87171',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
