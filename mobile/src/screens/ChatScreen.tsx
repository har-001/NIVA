// ============================================
// NIVA — Mobile Chat & Command Stream Screen
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ChatMessage } from '../types/mobile';
import { mobileApiClient } from '../services/apiClient';
import { mobileSocketService } from '../services/socketService';
import { mobileVoiceService } from '../services/voiceService';
import { VisionCaptureModal } from '../components/VisionCaptureModal';

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hello Sir! NIVA Mobile Stream is online. Real-time streaming and voice synthesis active.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [visionModalOpen, setVisionModalOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const conversationId = useRef(`conv-mob-${Date.now()}`);

  const toggleMic = () => {
    if (isListening) {
      mobileVoiceService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      mobileVoiceService.startListening(
        (transcript, isFinal) => {
          setInputText(transcript);
          if (isFinal && transcript.trim()) {
            handleSend(transcript.trim());
            setIsListening(false);
          }
        },
        (err) => {
          console.warn('Mic error:', err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  useEffect(() => {
    // Initialize Socket.IO connection
    mobileSocketService.connect();

    // Listen for live token stream chunks
    const unsubChunk = mobileSocketService.onStreamChunk((data) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.id.startsWith('stream-')) {
          return [
            ...prev.slice(0, -1),
            { ...last, content: last.content + data.chunk },
          ];
        }
        return [
          ...prev,
          {
            id: `stream-${Date.now()}`,
            role: 'assistant',
            content: data.chunk,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    });

    // Listen for stream end
    const unsubEnd = mobileSocketService.onStreamEnd((data) => {
      setIsSending(false);
      if (voiceEnabled && data.fullContent) {
        mobileVoiceService.speak(data.fullContent);
      }
    });

    return () => {
      unsubChunk();
      unsubEnd();
    };
  }, [voiceEnabled]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev: ChatMessage[]) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    // Try Socket.IO streaming first
    const socketDispatched = mobileSocketService.sendStreamMessage(conversationId.current, text);

    if (!socketDispatched) {
      // Direct REST fallback
      const res = await mobileApiClient.sendMessage(text);
      const asstMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev: ChatMessage[]) => [...prev, asstMsg]);
      setIsSending(false);
      if (voiceEnabled) {
        mobileVoiceService.speak(res.reply);
      }
    }

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.asstBubble]}>
        <View style={styles.bubbleHeaderRow}>
          <Text style={styles.bubbleRole}>{isUser ? 'YOU' : 'NIVA AI'}</Text>
          {!isUser && (
            <TouchableOpacity
              onPress={() => mobileVoiceService.speak(item.content)}
              style={styles.speakBtn}
            >
              <Text style={styles.speakBtnText}>🔊</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.bubbleText}>{item.content}</Text>
        <Text style={styles.bubbleTime}>{item.timestamp}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>NEURAL STREAM</Text>
            <Text style={styles.headerSubtitle}>
              {mobileSocketService.isConnected() ? '⚡ SOCKET.IO STREAMING' : '🌐 REST BRIDGE ACTIVE'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.voiceToggle, voiceEnabled && styles.voiceToggleActive]}
              onPress={() => setVoiceEnabled(!voiceEnabled)}
            >
              <Text style={styles.voiceToggleText}>{voiceEnabled ? '🔊 VOICE ON' : '🔇 MUTE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMessages([messages[0]])}>
              <Text style={styles.clearBtn}>CLEAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Suggestion Chips */}
        <View style={styles.chipRow}>
          {['Lock PC', 'System Status', 'Open VS Code', 'Memory Search'].map((chip) => (
            <TouchableOpacity key={chip} style={styles.chip} onPress={() => handleSend(chip)}>
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.camBtn}
            onPress={() => setVisionModalOpen(true)}
          >
            <Text style={styles.camBtnText}>📷</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.camBtn, isListening && { backgroundColor: '#ef4444' }]}
            onPress={toggleMic}
            accessibilityLabel="Voice Input"
          >
            <Text style={styles.camBtnText}>{isListening ? '🛑' : '🎙️'}</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={isListening ? "Listening to your voice..." : "Type your instruction to NIVA..."}
            placeholderTextColor={isListening ? "#38bdf8" : "#64748b"}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />

          <TouchableOpacity
            style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>➔</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Vision Scanner Modal */}
        <VisionCaptureModal
          visible={visionModalOpen}
          onClose={() => setVisionModalOpen(false)}
          onAnalysisResult={(desc) => {
            handleSend(`Analyze this photo: ${desc}`);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 8.5,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voiceToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  voiceToggleActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  voiceToggleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93c5fd',
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  speakBtn: {
    padding: 2,
  },
  speakBtnText: {
    fontSize: 11,
  },
  camBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  camBtnText: {
    fontSize: 16,
  },
  clearBtn: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  chipText: {
    fontSize: 11,
    color: '#7dd3fc',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0284c7',
    borderBottomRightRadius: 2,
  },
  asstBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#0b1329',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 2,
  },
  bubbleRole: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 13,
    color: '#f8fafc',
    lineHeight: 18,
  },
  bubbleTime: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0b1329',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  input: {
    flex: 1,
    height: 44,
    color: '#f8fafc',
    fontSize: 13,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
