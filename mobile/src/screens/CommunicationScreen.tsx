// ============================================
// NIVA — Mobile Communication Hub Screen
// Cross-Channel Messaging (Email/WhatsApp/Telegram) & AI Call Assistant HUD
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { mobileApiClient } from '../services/apiClient';
import { ContactItem, OutboundMessageRequest, CallSession } from '../types/mobile';

type HubTab = 'contacts' | 'dispatch' | 'call_hud';

export const CommunicationScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HubTab>('contacts');
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dispatch state
  const [channel, setChannel] = useState<'email' | 'whatsapp' | 'telegram'>('whatsapp');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // Call HUD state
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [callInput, setCallInput] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await mobileApiClient.getContacts();
      setContacts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = async (name: string, phone: string, direction: 'incoming' | 'outgoing' = 'outgoing') => {
    setActiveTab('call_hud');
    const res = await mobileApiClient.startCallSession(name, phone, direction);
    if (res.success) {
      setCallSession(res.session);
    }
  };

  const handleEndCall = async () => {
    if (callSession) {
      await mobileApiClient.endCallSession(callSession.id);
      setCallSession(null);
    }
  };

  const handleToggleRecord = async () => {
    if (!callSession) return;
    const isRec = await mobileApiClient.toggleCallRecording(callSession.id);
    setCallSession((prev) => (prev ? { ...prev, isRecording: isRec } : null));
    Alert.alert(
      isRec ? 'Recording Active' : 'Recording Stopped',
      isRec
        ? 'Opt-in recording started. In compliance with privacy standards, participants are notified that this call is recorded.'
        : 'Recording stopped.'
    );
  };

  const handleSendTranscriptLine = async () => {
    if (!callSession || !callInput.trim()) return;
    const text = callInput.trim();
    setCallInput('');
    const updated = await mobileApiClient.addCallTranscript(callSession.id, 'user', text);
    if (updated) setCallSession({ ...updated });

    // Simulated AI response in call
    setTimeout(async () => {
      const aiReply = `Understood. I will sync "${text}" directly to your workstation logs.`;
      const afterAi = await mobileApiClient.addCallTranscript(callSession.id, 'ai', aiReply);
      if (afterAi) setCallSession({ ...afterAi });
    }, 1200);
  };

  const handleSendMessage = async () => {
    if (!recipient.trim() || !messageContent.trim()) {
      Alert.alert('Missing Fields', 'Please specify a recipient and message text.');
      return;
    }

    setDispatching(true);
    setDispatchSuccess(null);
    try {
      const req: OutboundMessageRequest = {
        channel,
        recipient: recipient.trim(),
        subject: channel === 'email' ? subject.trim() || 'NIVA Automated Notification' : undefined,
        content: messageContent.trim(),
      };

      const res = await mobileApiClient.sendCommunication(req);
      if (res.success) {
        setDispatchSuccess(`Successfully dispatched via ${channel.toUpperCase()}!`);
        setMessageContent('');
        if (channel !== 'email') setSubject('');
      } else {
        Alert.alert('Dispatch Error', res.error || 'Failed to send message.');
      }
    } finally {
      setDispatching(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.relationship?.toLowerCase().includes(q)
    );
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📡 COMMUNICATION HUB</Text>
          <Text style={styles.headerSubtitle}>Cross-Channel Messaging & AI Calling</Text>
        </View>
        {callSession && (
          <TouchableOpacity style={styles.callBadge} onPress={() => setActiveTab('call_hud')}>
            <Text style={styles.callBadgeText}>🟢 LIVE CALL</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segment Switcher */}
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'contacts' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={[styles.segmentText, activeTab === 'contacts' && styles.segmentTextActive]}>
            👥 CONTACTS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'dispatch' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('dispatch')}
        >
          <Text style={[styles.segmentText, activeTab === 'dispatch' && styles.segmentTextActive]}>
            ✉️ DISPATCH
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'call_hud' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('call_hud')}
        >
          <Text style={[styles.segmentText, activeTab === 'call_hud' && styles.segmentTextActive]}>
            📞 AI CALL HUD
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TAB 1: CONTACTS DIRECTORY */}
        {activeTab === 'contacts' && (
          <View>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search verified contacts..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#38bdf8" style={{ marginVertical: 30 }} />
            ) : filteredContacts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No contacts found</Text>
              </View>
            ) : (
              filteredContacts.map((c) => (
                <View key={c.id} style={styles.contactCard}>
                  <View style={styles.contactTopRow}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <View style={styles.relBadge}>
                      <Text style={styles.relBadgeText}>{c.relationship || 'General'}</Text>
                    </View>
                  </View>

                  {c.phone && <Text style={styles.contactDetail}>📱 {c.phone}</Text>}
                  {c.email && <Text style={styles.contactDetail}>✉️ {c.email}</Text>}
                  {c.telegram && <Text style={styles.contactDetail}>✈️ {c.telegram}</Text>}

                  <View style={styles.contactActions}>
                    {c.phone && (
                      <TouchableOpacity
                        style={styles.actionBtnCall}
                        onPress={() => handleStartCall(c.name, c.phone!, 'outgoing')}
                      >
                        <Text style={styles.actionBtnCallText}>📞 AI Call</Text>
                      </TouchableOpacity>
                    )}
                    {c.phone && (
                      <TouchableOpacity
                        style={styles.actionBtnChat}
                        onPress={() => {
                          setChannel('whatsapp');
                          setRecipient(c.phone!);
                          setActiveTab('dispatch');
                        }}
                      >
                        <Text style={styles.actionBtnChatText}>💬 WhatsApp</Text>
                      </TouchableOpacity>
                    )}
                    {c.email && (
                      <TouchableOpacity
                        style={styles.actionBtnEmail}
                        onPress={() => {
                          setChannel('email');
                          setRecipient(c.email!);
                          setActiveTab('dispatch');
                        }}
                      >
                        <Text style={styles.actionBtnEmailText}>✉️ Email</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: OUTBOUND MESSAGE DISPATCH */}
        {activeTab === 'dispatch' && (
          <View style={styles.dispatchCard}>
            <Text style={styles.cardHeader}>MULTI-CHANNEL DISPATCHER</Text>

            <View style={styles.channelRow}>
              {(['whatsapp', 'email', 'telegram'] as const).map((ch) => (
                <TouchableOpacity
                  key={ch}
                  style={[styles.channelChip, channel === ch && styles.channelChipActive]}
                  onPress={() => setChannel(ch)}
                >
                  <Text style={[styles.channelChipText, channel === ch && styles.channelChipTextActive]}>
                    {ch === 'whatsapp' ? '💬 WhatsApp' : ch === 'email' ? '✉️ Email' : '✈️ Telegram'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Recipient:</Text>
            <TextInput
              style={styles.input}
              placeholder={channel === 'email' ? 'e.g. guide.cse@college.edu' : 'e.g. +91 98765 43210'}
              placeholderTextColor="#64748b"
              value={recipient}
              onChangeText={setRecipient}
            />

            {channel === 'email' && (
              <>
                <Text style={styles.fieldLabel}>Subject:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Project NIVA Status Update"
                  placeholderTextColor="#64748b"
                  value={subject}
                  onChangeText={setSubject}
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Message Content:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter communication payload to transmit..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={messageContent}
              onChangeText={setMessageContent}
            />

            {dispatchSuccess && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>✅ {dispatchSuccess}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendMessage}
              disabled={dispatching}
            >
              {dispatching ? (
                <ActivityIndicator color="#030712" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>DISPATCH VIA {channel.toUpperCase()}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 3: AI CALL HUD & LIVE TRANSCRIPT */}
        {activeTab === 'call_hud' && (
          <View>
            {callSession ? (
              <View style={styles.liveCallCard}>
                <View style={styles.callTopRow}>
                  <View>
                    <Text style={styles.callContactName}>{callSession.contactName}</Text>
                    <Text style={styles.callPhone}>{callSession.phoneNumber}</Text>
                  </View>
                  <View style={styles.callDirBadge}>
                    <Text style={styles.callDirText}>{callSession.direction.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Consent & Opt-In Compliance Notice */}
                <View style={styles.consentNotice}>
                  <Text style={styles.consentNoticeText}>
                    🛡️ Compliance: AI Call Assistant active. Opt-in recording requires consent.
                  </Text>
                </View>

                {/* Record Toggle */}
                <View style={styles.recordRow}>
                  <TouchableOpacity
                    style={[styles.recordBtn, callSession.isRecording && styles.recordBtnActive]}
                    onPress={handleToggleRecord}
                  >
                    <Text style={styles.recordBtnText}>
                      {callSession.isRecording ? '🔴 RECORDING (ACTIVE)' : '⚪ RECORD CALL (OPT-IN)'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Live Transcript Stream */}
                <Text style={styles.transcriptHeader}>LIVE AI CALL TRANSCRIPT</Text>
                <View style={styles.transcriptBox}>
                  {callSession.transcripts.map((t) => (
                    <View
                      key={t.id}
                      style={[
                        styles.transcriptLine,
                        t.speaker === 'ai' ? styles.transcriptAi : styles.transcriptUser,
                      ]}
                    >
                      <Text style={styles.transcriptSpeaker}>
                        {t.speaker === 'ai' ? '🤖 NIVA AI' : '👤 CALLER'}
                      </Text>
                      <Text style={styles.transcriptText}>{t.text}</Text>
                    </View>
                  ))}
                </View>

                {/* In-Call User Speech Input */}
                <View style={styles.callInputRow}>
                  <TextInput
                    style={styles.callInput}
                    placeholder="Speak or type response into call..."
                    placeholderTextColor="#64748b"
                    value={callInput}
                    onChangeText={setCallInput}
                  />
                  <TouchableOpacity style={styles.callSendBtn} onPress={handleSendTranscriptLine}>
                    <Text style={styles.callSendBtnText}>TRANSMIT</Text>
                  </TouchableOpacity>
                </View>

                {/* Hang Up Action */}
                <TouchableOpacity style={styles.hangupBtn} onPress={handleEndCall}>
                  <Text style={styles.hangupBtnText}>🔴 HANG UP CALL</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.idleCallCard}>
                <Text style={styles.idleIcon}>📞</Text>
                <Text style={styles.idleTitle}>No Active AI Call Session</Text>
                <Text style={styles.idleSubtitle}>
                  Simulate an incoming or outgoing call assisted by NIVA voice intelligence.
                </Text>

                <TouchableOpacity
                  style={styles.simIncomingBtn}
                  onPress={() =>
                    handleStartCall('Dr. Project Guide (HOD)', '+91 98111 22334', 'incoming')
                  }
                >
                  <Text style={styles.simIncomingBtnText}>
                    📲 SIMULATE INCOMING CALL FROM GUIDE
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#070d1e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  callBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  callBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4ade80',
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#0b1329',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#38bdf8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 35,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1329',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    padding: 0,
  },
  contactCard: {
    backgroundColor: '#0b1329',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 14,
    marginBottom: 10,
  },
  contactTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  relBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  relBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
  },
  contactDetail: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 3,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtnCall: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    alignItems: 'center',
  },
  actionBtnCallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ade80',
  },
  actionBtnChat: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
  },
  actionBtnChatText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
  actionBtnEmail: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    alignItems: 'center',
  },
  actionBtnEmailText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c084fc',
  },
  dispatchCard: {
    backgroundColor: '#0b1329',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 16,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  channelChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  channelChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  channelChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  channelChipTextActive: {
    color: '#38bdf8',
  },
  fieldLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sendBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  sendBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#030712',
    letterSpacing: 0.8,
  },
  successBanner: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
    marginBottom: 12,
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ade80',
    textAlign: 'center',
  },
  liveCallCard: {
    backgroundColor: '#0b1329',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22c55e',
    padding: 16,
  },
  callTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  callContactName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  callPhone: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  callDirBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  callDirText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4ade80',
  },
  consentNotice: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 8,
    marginBottom: 12,
  },
  consentNoticeText: {
    fontSize: 10,
    color: '#38bdf8',
    lineHeight: 14,
  },
  recordRow: {
    marginBottom: 14,
  },
  recordBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  recordBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  recordBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  transcriptHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  transcriptBox: {
    maxHeight: 180,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  transcriptLine: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  transcriptAi: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  transcriptUser: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  transcriptSpeaker: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 2,
  },
  transcriptText: {
    fontSize: 12,
    color: '#f8fafc',
    lineHeight: 16,
  },
  callInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  callInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#f8fafc',
    fontSize: 12,
  },
  callSendBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  callSendBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#030712',
  },
  hangupBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 12,
    alignItems: 'center',
  },
  hangupBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f87171',
    letterSpacing: 1,
  },
  idleCallCard: {
    backgroundColor: '#0b1329',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 30,
    alignItems: 'center',
  },
  idleIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  idleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  idleSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  simIncomingBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  simIncomingBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: 0.8,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
  },
});
