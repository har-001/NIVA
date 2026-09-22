// ============================================
// NIVA — Mobile Remote Desktop Deck Screen
// ============================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { RemoteControlDeck } from '../components/RemoteControlDeck';
import { mobileApiClient } from '../services/apiClient';
import { DesktopTelemetry } from '../types/mobile';
import { useAuth } from '../context/AuthContext';

export const RemoteScreen: React.FC = () => {
  const { serverHost, serverOnline } = useAuth();
  const [telemetry, setTelemetry] = useState<DesktopTelemetry | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    const data = await mobileApiClient.getDesktopTelemetry();
    setTelemetry(data);
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>DESKTOP REMOTE BRIDGE</Text>
            <Text style={styles.headerSubtitle}>
              TARGET: {serverHost}:3001 • {serverOnline ? 'LINKED' : 'STANDBY'}
            </Text>
          </View>
        </View>

        {/* Feedback Alert Pill */}
        {feedback && (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        {/* Remote Control Deck Component */}
        <RemoteControlDeck
          telemetry={telemetry}
          onRefreshTelemetry={fetchTelemetry}
          onActionFeedback={handleFeedback}
        />

        {/* Security Policy Card */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>🛡️ ZERO UNRESTRICTED ACCESS POLICY</Text>
          <Text style={styles.policyDesc}>
            Mobile commands execute only strictly allowlisted Windows applications (Notepad, Chrome, VS Code, Calc, Terminal) and human-gated security locks. Arbitrary remote shell scripts are blocked.
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
  },
  header: {
    marginBottom: 16,
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
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  feedbackBanner: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: 14,
  },
  feedbackText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  policyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 8,
  },
  policyTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  policyDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
});
