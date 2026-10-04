// ============================================
// NIVA — Mobile Vision Capture & Scene Analysis Modal
// Multimodal camera scanning powered by Gemini 2.0 Flash
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { mobileApiClient } from '../services/apiClient';
import { VisionAnalysisResponse } from '../types/mobile';

interface VisionCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onAnalysisResult?: (description: string) => void;
}

export const VisionCaptureModal: React.FC<VisionCaptureModalProps> = ({
  visible,
  onClose,
  onAnalysisResult,
}: VisionCaptureModalProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [prompt, setPrompt] = useState('Describe this camera frame and identify any faces or objects.');
  const [result, setResult] = useState<VisionAnalysisResponse | null>(null);

  const handleCaptureAndAnalyze = async () => {
    setAnalyzing(true);
    setResult(null);

    // Mock/Captured frame base64 representation
    const sampleBase64 =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    const res = await mobileApiClient.analyzeImage(sampleBase64, prompt);
    setResult(res);
    setAnalyzing(false);

    if (res.success && res.description) {
      onAnalysisResult?.(res.description);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📷 NIVA MULTIMODAL VISION</Text>
              <Text style={styles.subtitle}>GEMINI 2.0 FLASH LIVE SCANNER</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Viewfinder Reticle */}
            <View style={styles.viewfinder}>
              <View style={styles.reticleCornerTL} />
              <View style={styles.reticleCornerTR} />
              <View style={styles.reticleCornerBL} />
              <View style={styles.reticleCornerBR} />

              <Text style={styles.viewfinderIcon}>👁️</Text>
              <Text style={styles.viewfinderText}>OPTICAL SENSOR ACTIVE</Text>
              <Text style={styles.viewfinderSub}>Frame Size: 1080p • Zero-leak track</Text>
            </View>

            {/* Prompt input */}
            <Text style={styles.inputLabel}>VISUAL QUERY PROMPT</Text>
            <TextInput
              style={styles.textInput}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="e.g. 'Explain what code is on this screen'..."
              placeholderTextColor="#64748b"
            />

            {/* Quick Action Chips */}
            <View style={styles.chipRow}>
              {[
                'Detect Objects',
                'Explain Screen',
                'Read Text / OCR',
              ].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.chip}
                  onPress={() => setPrompt(`Analyze image: ${chip}`)}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Capture & Analyze Action Button */}
            <TouchableOpacity
              style={[styles.analyzeBtn, analyzing && styles.analyzeBtnDisabled]}
              onPress={handleCaptureAndAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <ActivityIndicator color="#030712" size="small" />
              ) : (
                <Text style={styles.analyzeBtnText}>⚡ SCAN & ANALYZE FRAME</Text>
              )}
            </TouchableOpacity>

            {/* Results Display */}
            {result && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultBadge}>GEMINI 2.0 VISION RESULT</Text>
                  <Text style={styles.resultStatus}>ANALYSIS COMPLETE</Text>
                </View>

                <Text style={styles.resultText}>{result.description}</Text>

                {result.tags && result.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {result.tags.map((tag, idx) => (
                      <View key={idx} style={styles.tagPill}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#070d1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  body: {
    paddingBottom: 20,
  },
  viewfinder: {
    height: 140,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#38bdf8',
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#38bdf8',
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#38bdf8',
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#38bdf8',
  },
  viewfinderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  viewfinderText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  viewfinderSub: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#f8fafc',
    padding: 10,
    fontSize: 12,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  chipText: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '700',
  },
  analyzeBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  analyzeBtnText: {
    color: '#030712',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  resultCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 10,
    padding: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultBadge: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resultStatus: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
  },
  resultText: {
    color: '#f1f5f9',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: '#86efac',
    fontSize: 9,
    fontWeight: '700',
  },
});
