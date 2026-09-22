// ============================================
// NIVA — Mobile Settings & Connection Screen
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mobileApiClient } from '../services/apiClient';

export const SettingsScreen: React.FC = () => {
  const { user, serverHost, serverOnline, updateServerHost, checkServerConnection, logout } =
    useAuth();
  const [hostInput, setHostInput] = useState(serverHost);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');

  const handleSaveHost = async () => {
    if (!hostInput.trim()) return;
    await updateServerHost(hostInput.trim());
    setTestResult(`Saved host: ${hostInput.trim()}`);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    mobileApiClient.setHost(hostInput.trim());
    const health = await mobileApiClient.checkHealth();
    setIsTesting(false);
    if (health.online) {
      setTestResult(`✓ Connected to NIVA Server (${health.latencyMs}ms latency)`);
    } else {
      setTestResult(`✗ Unreachable at ${hostInput}:3001. Ensure laptop is on same Wi-Fi.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SETTINGS & LINK</Text>
          <Text style={styles.headerSubtitle}>BACKEND & PREFERENCES CONFIG</Text>
        </View>

        {/* Backend Connection Config Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🌐 LAPTOP BACKEND CONNECTION</Text>
          <Text style={styles.cardHelp}>
            Enter laptop's IP address on your Wi-Fi (e.g. 192.168.1.15) or 'localhost' if testing locally.
          </Text>

          <View style={styles.hostRow}>
            <TextInput
              style={styles.hostInput}
              value={hostInput}
              onChangeText={setHostInput}
              placeholder="e.g. 192.168.1.100"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveHost}>
              <Text style={styles.saveBtnText}>SAVE</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.testBtn, isTesting && styles.btnDisabled]}
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color="#38bdf8" />
            ) : (
              <Text style={styles.testBtnText}>⚡ TEST PING CONNECTION</Text>
            )}
          </TouchableOpacity>

          {testResult && (
            <View style={styles.testResultBox}>
              <Text style={styles.testResultText}>{testResult}</Text>
            </View>
          )}

          <View style={styles.statusIndicatorRow}>
            <Text style={styles.statusLabel}>Current Status:</Text>
            <Text
              style={[
                styles.statusValue,
                { color: serverOnline ? '#4ade80' : '#f87171' },
              ]}
            >
              {serverOnline ? 'CONNECTED (Port 3001)' : 'STANDBY / OFFLINE'}
            </Text>
          </View>
        </View>

        {/* Voice Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🎙️ VOICE SYNTHESIS GENDER</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, voiceGender === 'male' && styles.genderBtnActive]}
              onPress={() => setVoiceGender('male')}
            >
              <Text
                style={[
                  styles.genderText,
                  voiceGender === 'male' && { color: '#38bdf8' },
                ]}
              >
                ♂ Male Baritone
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderBtn, voiceGender === 'female' && styles.genderBtnActive]}
              onPress={() => setVoiceGender('female')}
            >
              <Text
                style={[
                  styles.genderText,
                  voiceGender === 'female' && { color: '#f472b6' },
                ]}
              >
                ♀ Female Voice
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Session Info */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>👤 ACCOUNT & SECURITY</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User:</Text>
            <Text style={styles.infoValue}>{user?.name || 'Harshit'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email || 'admin@niva.ai'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>Jarvis Master Admin</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>RESET AUTH SESSION</Text>
          </TouchableOpacity>
        </View>

        {/* Build & Engine Footnote */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>NIVA Mobile Client v1.0.0 • Phase 05: Expo Foundation</Text>
          <Text style={styles.footerSub}>Compatible with NIVA Server v1.0.0 & Desktop Tauri</Text>
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
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: '#0b1329',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardHelp: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 16,
  },
  hostRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  hostInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#f8fafc',
    paddingHorizontal: 12,
    fontSize: 13,
  },
  saveBtn: {
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: '#0284c7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },
  testBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  testBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  testResultBox: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 10,
  },
  testResultText: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  statusValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  genderBtnActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  genderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 11,
    color: '#f8fafc',
    fontWeight: '600',
  },
  logoutBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#f87171',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 9,
    color: '#334155',
    marginTop: 2,
  },
});
