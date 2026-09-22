// ============================================
// NIVA — Mobile Home Screen (Arc Reactor Command Core)
// ============================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { ArcReactorMobile, OrbState } from '../components/ArcReactorMobile';
import { useAuth } from '../context/AuthContext';
import { mobileApiClient } from '../services/apiClient';
import { DesktopTelemetry } from '../types/mobile';

interface HomeScreenProps {
  onNavigateToChat: () => void;
  onNavigateToRemote: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToChat,
  onNavigateToRemote,
}: HomeScreenProps) => {
  const { serverOnline, serverHost } = useAuth();
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [quickInput, setQuickInput] = useState('');
  const [lastReply, setLastReply] = useState<string>('Ready for voice or text commands, Sir.');
  const [telemetry, setTelemetry] = useState<DesktopTelemetry | null>(null);

  useEffect(() => {
    mobileApiClient.getDesktopTelemetry().then(setTelemetry);
  }, []);

  const handleOrbPress = () => {
    if (orbState === 'idle') {
      setOrbState('listening');
      setTimeout(() => {
        setOrbState('thinking');
        setTimeout(() => {
          setOrbState('speaking');
          setLastReply('Listening mode active. Say "Lock laptop" or "Open notepad".');
          setTimeout(() => setOrbState('idle'), 3500);
        }, 1200);
      }, 2000);
    } else {
      setOrbState('idle');
    }
  };

  const handleSendQuick = async () => {
    if (!quickInput.trim()) return;
    const msg = quickInput.trim();
    setQuickInput('');
    setOrbState('thinking');

    const res = await mobileApiClient.sendMessage(msg);
    setLastReply(res.reply);
    setOrbState('speaking');
    setTimeout(() => setOrbState('idle'), 3000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>NIVA MOBILE</Text>
            <Text style={styles.headerSubtitle}>PORTABLE JARVIS COMPANION</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: serverOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)' }]}>
            <View style={[styles.statusDot, { backgroundColor: serverOnline ? '#22c55e' : '#eab308' }]} />
            <Text style={[styles.statusText, { color: serverOnline ? '#4ade80' : '#fde047' }]}>
              {serverOnline ? 'ONLINE' : 'FALLBACK'}
            </Text>
          </View>
        </View>

        {/* Central Arc Reactor Orb */}
        <View style={styles.orbSection}>
          <ArcReactorMobile state={orbState} onPress={handleOrbPress} size={190} />
          <Text style={styles.orbStateText}>
            {orbState === 'listening' ? '🎙️ LISTENING...' : orbState === 'thinking' ? '🧠 PROCESSING...' : orbState === 'speaking' ? '🔊 VOCALIZING...' : 'TAP CORE TO SPEAK'}
          </Text>
        </View>

        {/* Assistant Response Card */}
        <View style={styles.responseCard}>
          <Text style={styles.responseLabel}>NIVA RESPONSE</Text>
          <Text style={styles.responseText}>{lastReply}</Text>
        </View>

        {/* Quick Command Input Bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type command (e.g. 'lock laptop', 'open chrome')..."
            placeholderTextColor="#64748b"
            value={quickInput}
            onChangeText={setQuickInput}
            onSubmitEditing={handleSendQuick}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendQuick}>
            <Text style={styles.sendBtnText}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Action Shortcuts */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity style={styles.shortcutBtn} onPress={onNavigateToChat}>
            <Text style={styles.shortcutIcon}>💬</Text>
            <Text style={styles.shortcutText}>Full Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shortcutBtn} onPress={onNavigateToRemote}>
            <Text style={styles.shortcutIcon}>🖥️</Text>
            <Text style={styles.shortcutText}>PC Remote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => {
              mobileApiClient.dispatchRemoteCommand({ action: 'lock_workstation', timestamp: Date.now() });
              setLastReply('Laptop screen lock signal dispatched.');
            }}
          >
            <Text style={styles.shortcutIcon}>🔒</Text>
            <Text style={styles.shortcutText}>Lock PC</Text>
          </TouchableOpacity>
        </View>

        {/* Telemetry Mini Bar */}
        <View style={styles.telemetryStrip}>
          <Text style={styles.telemetryText}>
            🖥️ {telemetry?.hostname || 'HARSHIT-PC'} • CPU: {telemetry?.cpu_usage_percent || 18}% • RAM: {telemetry?.memory_used_gb || 7.85} GB • Host: {serverHost}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  container: {
    padding: 18,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orbSection: {
    alignItems: 'center',
    marginVertical: 18,
  },
  orbStateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.5,
    marginTop: 18,
  },
  responseCard: {
    width: '100%',
    backgroundColor: '#0b1329',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 16,
  },
  responseLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  responseText: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
    fontWeight: '500',
  },
  inputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1329',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 48,
    color: '#f8fafc',
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  shortcutsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shortcutIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  telemetryStrip: {
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
  },
  telemetryText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
