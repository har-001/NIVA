// ============================================
// NIVA — Mobile Application Root Entry Point
// Cross-Platform Expo + React Native + TypeScript
// ============================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { RemoteScreen } from './src/screens/RemoteScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type Tab = 'home' | 'chat' | 'remote' | 'settings';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToChat={() => setActiveTab('chat')}
            onNavigateToRemote={() => setActiveTab('remote')}
          />
        );
      case 'chat':
        return <ChatScreen />;
      case 'remote':
        return <RemoteScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return (
          <HomeScreen
            onNavigateToChat={() => setActiveTab('chat')}
            onNavigateToRemote={() => setActiveTab('remote')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* Screen Body */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Cyberpunk Glassmorphic Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={styles.tabIcon}>⚛️</Text>
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
            CORE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'chat' && styles.tabItemActive]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={[styles.tabLabel, activeTab === 'chat' && styles.tabLabelActive]}>
            STREAM
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'remote' && styles.tabItemActive]}
          onPress={() => setActiveTab('remote')}
        >
          <Text style={styles.tabIcon}>🖥️</Text>
          <Text style={[styles.tabLabel, activeTab === 'remote' && styles.tabLabelActive]}>
            REMOTE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={styles.tabIcon}>⚙️</Text>
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
            SETTINGS
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#030712',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#070d1e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  tabLabelActive: {
    color: '#38bdf8',
  },
});
