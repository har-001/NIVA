// ============================================
// NIVA — Mobile Chat & Command Stream Screen
// ============================================

import React, { useState, useRef } from 'react';
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

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hello Sir! NIVA Mobile Core is online. Aap voice ya text se koi bhi command de sakte hain.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

    const res = await mobileApiClient.sendMessage(text);

    const asstMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: res.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev: ChatMessage[]) => [...prev, asstMsg]);
    setIsSending(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.asstBubble]}>
        <Text style={styles.bubbleRole}>{isUser ? 'YOU' : 'NIVA AI'}</Text>
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
          <Text style={styles.headerTitle}>NEURAL STREAM</Text>
          <TouchableOpacity onPress={() => setMessages([messages[0]])}>
            <Text style={styles.clearBtn}>CLEAR</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Suggestion Chips */}
        <View style={styles.chipRow}>
          {['Lock PC', 'Open Notepad', 'Open Chrome', 'Kaise ho?'].map((chip) => (
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
          <TextInput
            style={styles.input}
            placeholder="Type your instruction to NIVA..."
            placeholderTextColor="#64748b"
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
