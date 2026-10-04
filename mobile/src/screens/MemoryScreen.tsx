// ============================================
// NIVA — Mobile Neural Memory Hub Screen
// Persistent Long-Term Memory & Knowledge Repository
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
import { MemoryItem } from '../types/mobile';

const CATEGORIES = ['all', 'preference', 'project', 'code', 'personal', 'general'];

export const MemoryScreen: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMemories();
  }, [selectedCategory]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const cat = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await mobileApiClient.getMemories(cat);
      setMemories(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMemory = async () => {
    if (!newContent.trim()) {
      Alert.alert('Empty Memory', 'Please enter some knowledge or fact to store.');
      return;
    }

    setSaving(true);
    try {
      const res = await mobileApiClient.createMemory(newContent, newCategory);
      if (res.success && res.data) {
        setNewContent('');
        setIsAdding(false);
        await loadMemories();
      } else {
        Alert.alert('Error', res.error || 'Failed to persist neural memory.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    Alert.alert('Erase Memory', 'Are you sure you want to purge this record from NIVA memory vault?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase',
        style: 'destructive',
        onPress: async () => {
          await mobileApiClient.deleteMemory(id);
          setMemories((prev) => prev.filter((m) => m.id !== id));
        },
      },
    ]);
  };

  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🧠 NEURAL MEMORY HUB</Text>
          <Text style={styles.headerSubtitle}>Cross-Device Persistent Vector Store</Text>
        </View>
        <TouchableOpacity
          style={styles.addToggleBtn}
          onPress={() => setIsAdding(!isAdding)}
        >
          <Text style={styles.addToggleBtnText}>{isAdding ? '✕ CLOSE' : '＋ ADD'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search & Filter Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search recalled memories..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Add Memory Card (Collapsible) */}
        {isAdding && (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>RECORD NEW KNOWLEDGE</Text>
            <TextInput
              style={styles.createInput}
              placeholder="e.g. User prefers Python and TypeScript for automation..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={newContent}
              onChangeText={setNewContent}
            />

            <View style={styles.createCatRow}>
              <Text style={styles.createCatLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.filter((c) => c !== 'all').map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.smallCatChip,
                      newCategory === c && styles.smallCatChipActive,
                    ]}
                    onPress={() => setNewCategory(c)}
                  >
                    <Text
                      style={[
                        styles.smallCatText,
                        newCategory === c && styles.smallCatTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveMemory}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#030712" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>STORE IN NEURAL REPOSITORY</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Memory Items Listing */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.loadingText}>Retrieving neural embeddings...</Text>
          </View>
        ) : filteredMemories.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🧬</Text>
            <Text style={styles.emptyText}>No matching memories found</Text>
            <Text style={styles.emptySubtext}>
              Add preferences, commands, or project notes to sync across Desktop and Mobile.
            </Text>
          </View>
        ) : (
          filteredMemories.map((item) => (
            <View key={item.id} style={styles.memoryCard}>
              <View style={styles.memoryHeader}>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{item.category.toUpperCase()}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteMemory(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.memoryContent}>{item.content}</Text>

              <View style={styles.memoryFooter}>
                <Text style={styles.memoryDate}>
                  {new Date(item.createdAt).toLocaleDateString()} · Vector Synced
                </Text>
                {item.pinned && <Text style={styles.pinnedBadge}>📌 PINNED</Text>}
              </View>
            </View>
          ))
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
  addToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  addToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1329',
    borderRadius: 12,
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
  clearSearch: {
    fontSize: 13,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  categoryChipTextActive: {
    color: '#38bdf8',
  },
  createCard: {
    backgroundColor: '#0b1329',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    padding: 14,
    marginBottom: 16,
  },
  createTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#c084fc',
    letterSpacing: 1,
    marginBottom: 8,
  },
  createInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    color: '#f8fafc',
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  createCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  createCatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginRight: 8,
    fontWeight: '600',
  },
  smallCatChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  smallCatChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: '#c084fc',
  },
  smallCatText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  smallCatTextActive: {
    color: '#c084fc',
  },
  saveBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#030712',
    letterSpacing: 0.8,
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748b',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  memoryCard: {
    backgroundColor: '#0b1329',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    padding: 14,
    marginBottom: 10,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  deleteIcon: {
    fontSize: 13,
  },
  memoryContent: {
    fontSize: 13,
    color: '#f8fafc',
    lineHeight: 18,
    marginBottom: 8,
  },
  memoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoryDate: {
    fontSize: 10,
    color: '#64748b',
  },
  pinnedBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#f59e0b',
  },
});
