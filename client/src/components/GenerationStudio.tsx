'use client';

// ============================================
// NIVA — Multi-Modal AI Generation Studio
// High-Resolution Image, Code, Document & Audio Synthesis
// ============================================

import React, { useState } from 'react';
import { api } from '../lib/api';
import styles from './GenerationStudio.module.css';

interface GenerationStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (content: string) => void;
}

const IMAGE_STYLES = [
  { id: 'cyberpunk', label: '⚡ Cyberpunk' },
  { id: 'photorealistic', label: '📸 Photorealistic' },
  { id: 'anime', label: '🎨 Anime' },
  { id: '3d-render', label: '💎 3D Render' },
  { id: 'minimalist', label: '✨ Minimalist' },
  { id: 'vector', label: '📐 Vector' },
];

const CODE_LANGUAGES = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'html', label: 'HTML/CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'rust', label: 'Rust' },
  { id: 'bash', label: 'Bash' },
];

const DOC_FORMATS = [
  { id: 'markdown', label: '📝 Markdown (.md)' },
  { id: 'html', label: '🌐 Styled HTML' },
  { id: 'csv', label: '📊 CSV Spreadsheet' },
  { id: 'json', label: '📦 JSON Data' },
];

export const GenerationStudio: React.FC<GenerationStudioProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'code' | 'document' | 'audio'>('image');

  // Image State
  const [imgPrompt, setImgPrompt] = useState<string>('Cyberpunk futuristic NIVA AI robot assistant with neon violet neural lighting');
  const [imgStyle, setImgStyle] = useState<string>('cyberpunk');
  const [imgRatio, setImgRatio] = useState<string>('16:9');
  const [isGeneratingImg, setIsGeneratingImg] = useState<boolean>(false);
  const [generatedImg, setGeneratedImg] = useState<any | null>(null);

  // Code State
  const [codePrompt, setCodePrompt] = useState<string>('Python script to monitor CPU, memory, and battery with alerts');
  const [codeLang, setCodeLang] = useState<string>('python');
  const [includeTests, setIncludeTests] = useState<boolean>(true);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Document State
  const [docTopic, setDocTopic] = useState<string>('Comprehensive System Architecture for NIVA AI Virtual Assistant');
  const [docFormat, setDocFormat] = useState<string>('markdown');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(false);
  const [generatedDoc, setGeneratedDoc] = useState<any | null>(null);

  // Audio State
  const [audioText, setAudioText] = useState<string>('Welcome to NIVA AI. All neural sub-systems are operating at maximum capacity.');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [generatedAudio, setGeneratedAudio] = useState<any | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handlers
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgPrompt.trim() || isGeneratingImg) return;
    setIsGeneratingImg(true);
    setErrorMsg(null);
    try {
      const res = await api.generateImage({
        prompt: imgPrompt.trim(),
        style: imgStyle,
        aspectRatio: imgRatio,
      });
      if (res.success && res.data) {
        setGeneratedImg(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Image generation failed');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codePrompt.trim() || isGeneratingCode) return;
    setIsGeneratingCode(true);
    setErrorMsg(null);
    try {
      const res = await api.generateCode({
        prompt: codePrompt.trim(),
        language: codeLang,
        includeTests,
      });
      if (res.success && res.data) {
        setGeneratedCode(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Code generation failed');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleGenerateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTopic.trim() || isGeneratingDoc) return;
    setIsGeneratingDoc(true);
    setErrorMsg(null);
    try {
      const res = await api.generateDocument({
        topic: docTopic.trim(),
        format: docFormat,
      });
      if (res.success && res.data) {
        setGeneratedDoc(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Document generation failed');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleGenerateAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioText.trim() || isGeneratingAudio) return;
    setIsGeneratingAudio(true);
    setErrorMsg(null);
    try {
      const res = await api.generateAudio({
        text: audioText.trim(),
      });
      if (res.success && res.data) {
        setGeneratedAudio(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Audio synthesis failed');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode?.code) return;
    navigator.clipboard.writeText(generatedCode.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>🎨</div>
            <div>
              <div className={styles.title}>NIVA Generation Studio</div>
              <div className={styles.subtitle}>Multi-Modal Image, Code, Document &amp; Speech Synthesis</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close Studio">
            ✕
          </button>
        </div>

        {/* Studio Tabs */}
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'image' ? styles.tabBtnActive : ''}`}
            onClick={() => { setActiveTab('image'); setErrorMsg(null); }}
          >
            <span>🖼️</span>
            <span>Image Creator</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'code' ? styles.tabBtnActive : ''}`}
            onClick={() => { setActiveTab('code'); setErrorMsg(null); }}
          >
            <span>💻</span>
            <span>Code Lab</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'document' ? styles.tabBtnActive : ''}`}
            onClick={() => { setActiveTab('document'); setErrorMsg(null); }}
          >
            <span>📝</span>
            <span>Document</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'audio' ? styles.tabBtnActive : ''}`}
            onClick={() => { setActiveTab('audio'); setErrorMsg(null); }}
          >
            <span>🎵</span>
            <span>Audio Synth</span>
          </button>
        </div>

        {/* Studio Content */}
        <div className={styles.contentArea}>
          {errorMsg && (
            <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* TAB 1: IMAGE CREATOR */}
          {activeTab === 'image' && (
            <>
              <form className={styles.promptBox} onSubmit={handleGenerateImage}>
                <div className={styles.fieldLabel}>
                  <span>Prompt Description</span>
                  <span style={{ fontSize: '0.72rem', color: '#818cf8' }}>AI Neural Canvas</span>
                </div>
                <textarea
                  className={styles.textarea}
                  value={imgPrompt}
                  onChange={(e) => setImgPrompt(e.target.value)}
                  placeholder="Describe your visual concept in detail..."
                  required
                />

                <div className={styles.fieldLabel}>Rendering Style</div>
                <div className={styles.pillGroup}>
                  {IMAGE_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`${styles.pill} ${imgStyle === st.id ? styles.pillActive : ''}`}
                      onClick={() => setImgStyle(st.id)}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div className={styles.fieldLabel}>Aspect Ratio</div>
                <div className={styles.ratioGroup}>
                  {['1:1', '16:9', '9:16', '4:3'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      className={`${styles.ratioBtn} ${imgRatio === ratio ? styles.ratioBtnActive : ''}`}
                      onClick={() => setImgRatio(ratio)}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className={styles.generateBtn}
                  disabled={isGeneratingImg || !imgPrompt.trim()}
                >
                  {isGeneratingImg ? (
                    <>
                      <span className={styles.spinner} />
                      <span>Synthesizing Image...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Generate Artwork</span>
                    </>
                  )}
                </button>
              </form>

              {/* Image Result */}
              {generatedImg && (
                <div className={styles.outputCard}>
                  <div className={styles.outputHeader}>
                    <div className={styles.outputTitle}>
                      <span>🖼️ Generated Artwork</span>
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                        ({generatedImg.width}x{generatedImg.height} • {generatedImg.style})
                      </span>
                    </div>
                    <div className={styles.outputActions}>
                      <a
                        href={generatedImg.imageUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className={styles.actionBtn}
                      >
                        ⬇️ Download
                      </a>
                      {onSendToChat && (
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => {
                            onSendToChat(`![${generatedImg.prompt}](${generatedImg.imageUrl})`);
                            onClose();
                          }}
                        >
                          💬 Send to Chat
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={styles.imagePreviewWrapper}>
                    <img
                      src={generatedImg.imageUrl}
                      alt={generatedImg.prompt}
                      className={styles.imagePreview}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: CODE LAB */}
          {activeTab === 'code' && (
            <>
              <form className={styles.promptBox} onSubmit={handleGenerateCode}>
                <div className={styles.fieldLabel}>Task / Specification</div>
                <textarea
                  className={styles.textarea}
                  value={codePrompt}
                  onChange={(e) => setCodePrompt(e.target.value)}
                  placeholder="e.g. Write a script to monitor CPU, memory, and battery with alerts..."
                  required
                />

                <div className={styles.fieldLabel}>Target Language</div>
                <div className={styles.pillGroup}>
                  {CODE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      className={`${styles.pill} ${codeLang === lang.id ? styles.pillActive : ''}`}
                      onClick={() => setCodeLang(lang.id)}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeTests}
                    onChange={(e) => setIncludeTests(e.target.checked)}
                  />
                  <span>Include unit tests &amp; execution instructions</span>
                </label>

                <button
                  type="submit"
                  className={styles.generateBtn}
                  disabled={isGeneratingCode || !codePrompt.trim()}
                >
                  {isGeneratingCode ? (
                    <>
                      <span className={styles.spinner} />
                      <span>Writing Code...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡ Generate Code</span>
                    </>
                  )}
                </button>
              </form>

              {/* Code Result */}
              {generatedCode && (
                <div className={styles.outputCard}>
                  <div className={styles.outputHeader}>
                    <div className={styles.outputTitle}>
                      <span>💻 {generatedCode.fileName}</span>
                    </div>
                    <div className={styles.outputActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={handleCopyCode}
                      >
                        {copiedCode ? '✅ Copied!' : '📋 Copy Code'}
                      </button>
                    </div>
                  </div>
                  <pre className={styles.codeDisplay}>{generatedCode.code}</pre>
                  {generatedCode.explanation && (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      💡 {generatedCode.explanation}
                    </div>
                  )}
                  {generatedCode.suggestedRunCommand && (
                    <div style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '6px 12px', borderRadius: '6px', color: '#38bdf8' }}>
                      ▶️ <strong>Run:</strong> <code>{generatedCode.suggestedRunCommand}</code>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 3: DOCUMENT EXPORTER */}
          {activeTab === 'document' && (
            <>
              <form className={styles.promptBox} onSubmit={handleGenerateDocument}>
                <div className={styles.fieldLabel}>Report Topic / Purpose</div>
                <textarea
                  className={styles.textarea}
                  value={docTopic}
                  onChange={(e) => setDocTopic(e.target.value)}
                  placeholder="e.g. Project Architecture Overview for NIVA AI Virtual Assistant..."
                  required
                />

                <div className={styles.fieldLabel}>Export Format</div>
                <div className={styles.pillGroup}>
                  {DOC_FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      className={`${styles.pill} ${docFormat === fmt.id ? styles.pillActive : ''}`}
                      onClick={() => setDocFormat(fmt.id)}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className={styles.generateBtn}
                  disabled={isGeneratingDoc || !docTopic.trim()}
                >
                  {isGeneratingDoc ? (
                    <>
                      <span className={styles.spinner} />
                      <span>Synthesizing Document...</span>
                    </>
                  ) : (
                    <>
                      <span>📑 Generate Document</span>
                    </>
                  )}
                </button>
              </form>

              {/* Document Result */}
              {generatedDoc && (
                <div className={styles.outputCard}>
                  <div className={styles.outputHeader}>
                    <div className={styles.outputTitle}>
                      <span>📄 {generatedDoc.fileName}</span>
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                        ({generatedDoc.wordCount} words)
                      </span>
                    </div>
                    {generatedDoc.fileUrl && (
                      <a
                        href={generatedDoc.fileUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className={styles.actionBtn}
                      >
                        ⬇️ Download File
                      </a>
                    )}
                  </div>
                  <div className={styles.docDisplay}>{generatedDoc.content}</div>
                </div>
              )}
            </>
          )}

          {/* TAB 4: AUDIO SYNTH */}
          {activeTab === 'audio' && (
            <>
              <form className={styles.promptBox} onSubmit={handleGenerateAudio}>
                <div className={styles.fieldLabel}>Spoken Script Text</div>
                <textarea
                  className={styles.textarea}
                  value={audioText}
                  onChange={(e) => setAudioText(e.target.value)}
                  placeholder="Enter the text to synthesize into an audio file..."
                  required
                />

                <button
                  type="submit"
                  className={styles.generateBtn}
                  disabled={isGeneratingAudio || !audioText.trim()}
                >
                  {isGeneratingAudio ? (
                    <>
                      <span className={styles.spinner} />
                      <span>Generating Audio...</span>
                    </>
                  ) : (
                    <>
                      <span>🎙️ Generate Audio File</span>
                    </>
                  )}
                </button>
              </form>

              {/* Audio Result */}
              {generatedAudio && (
                <div className={styles.outputCard}>
                  <div className={styles.outputHeader}>
                    <div className={styles.outputTitle}>
                      <span>🎵 Synthesized Audio Clip</span>
                    </div>
                    <a
                      href={generatedAudio.audioUrl}
                      download
                      className={styles.actionBtn}
                    >
                      ⬇️ Download Audio
                    </a>
                  </div>
                  <div className={styles.audioBox}>
                    <audio
                      src={generatedAudio.audioUrl}
                      controls
                      autoPlay
                      className={styles.audioPlayer}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
