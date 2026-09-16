import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import styles from './PluginHub.module.css';

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  icon?: string;
  category: string;
  permissions: string[];
  tools?: Array<{
    name: string;
    description: string;
    parameters?: any;
  }>;
}

interface PluginInstance {
  manifest: PluginManifest;
  status: 'active' | 'disabled' | 'error';
  config: Record<string, any>;
  installedAt: string;
  updatedAt: string;
  error?: string;
}

interface PluginHubProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const PluginHub: React.FC<PluginHubProps> = ({ isOpen, onClose, onSendToChat }) => {
  const [activeTab, setActiveTab] = useState<'installed' | 'create'>('installed');
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Tool Tester State
  const [testingTool, setTestingTool] = useState<{ pluginName: string; toolName: string } | null>(null);
  const [toolArgsInput, setToolArgsInput] = useState<string>('{}');
  const [toolExecuting, setToolExecuting] = useState(false);
  const [toolOutput, setToolOutput] = useState<string | null>(null);

  // Custom Plugin Creator Form
  const [manifestJson, setManifestJson] = useState<string>(
    JSON.stringify(
      {
        id: 'custom-weather-plugin',
        name: 'Live OpenWeather Pro',
        version: '1.0.0',
        description: 'Fetches real-time temperature, humidity, and forecast metrics.',
        author: 'Community Developer',
        icon: '🌦️',
        category: 'utilities',
        permissions: ['network:fetch', 'tools:register', 'tools:execute'],
        tools: [
          {
            name: 'get_live_weather',
            description: 'Fetches current weather for a city',
            permission: 'safe',
            parameters: {
              type: 'object',
              properties: { city: { type: 'string', description: 'City name' } },
              required: ['city'],
            },
          },
        ],
      },
      null,
      2
    )
  );

  const loadPlugins = async () => {
    try {
      setLoading(true);
      const res = await api.getPlugins();
      if (res?.data) {
        setPlugins(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load plugins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPlugins();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async (id: string, currentStatus: string) => {
    const shouldEnable = currentStatus !== 'active';
    try {
      await api.togglePlugin(id, shouldEnable);
      setPlugins((prev) =>
        prev.map((p) =>
          p.manifest.id === id ? { ...p, status: shouldEnable ? 'active' : 'disabled' } : p
        )
      );
      setFeedback({
        type: 'success',
        text: `Plugin ${shouldEnable ? 'activated' : 'disabled'} successfully.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to toggle plugin' });
    }
  };

  const handleOpenToolTester = (pluginName: string, toolName: string) => {
    setTestingTool({ pluginName, toolName });
    setToolOutput(null);

    // Pre-populate sensible defaults
    if (toolName === 'currency_convert') {
      setToolArgsInput(JSON.stringify({ amount: 100, from: 'USD', to: 'INR' }, null, 2));
    } else if (toolName === 'github_trending') {
      setToolArgsInput(JSON.stringify({ language: 'typescript', limit: 3 }, null, 2));
    } else if (toolName === 'github_repo_info') {
      setToolArgsInput(JSON.stringify({ owner: 'facebook', repo: 'react' }, null, 2));
    } else if (toolName === 'crypto_price_tracker') {
      setToolArgsInput(JSON.stringify({ coins: 'bitcoin,ethereum,solana', vs_currency: 'usd' }, null, 2));
    } else if (toolName === 'code_beautify_format') {
      setToolArgsInput(JSON.stringify({ code: '{"app":"NIVA","ready":true}', language: 'json' }, null, 2));
    } else if (toolName === 'media_player_control') {
      setToolArgsInput(JSON.stringify({ action: 'play_pause' }, null, 2));
    } else {
      setToolArgsInput('{}');
    }
  };

  const handleRunToolTest = async () => {
    if (!testingTool) return;
    try {
      setToolExecuting(true);
      setToolOutput(null);

      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolArgsInput);
      } catch (e) {
        setToolOutput('Invalid JSON parameters syntax.');
        return;
      }

      // Send instruction prompt to chat or agent
      if (onSendToChat) {
        onSendToChat(`Execute plugin tool ${testingTool.toolName} with ${toolArgsInput}`);
        onClose();
        return;
      }

      setToolOutput(`⚡ Executing ${testingTool.toolName}... (Result sent to NIVA Brain)`);
    } catch (err: any) {
      setToolOutput(`Error: ${err.message}`);
    } finally {
      setToolExecuting(false);
    }
  };

  const handleInstallCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const manifest = JSON.parse(manifestJson);
      const res = await api.installPlugin(manifest);
      if (res?.data) {
        setPlugins((prev) => [...prev, res.data]);
        setFeedback({ type: 'success', text: `Custom plugin "${manifest.name}" installed!` });
        setActiveTab('installed');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Plugin installation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.titleIcon}>🧩</div>
            <div>
              <div className={styles.title}>
                Plugin Ecosystem &amp; Marketplace
                <span className={styles.badge}>Extensible SDK</span>
              </div>
              <div className={styles.subtitle}>
                Sandboxed third-party capabilities, custom tools, and ecosystem extensions
              </div>
            </div>
          </div>

          <button className={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'installed' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('installed')}
          >
            🧩 Installed Plugins
            <span className={styles.tabCount}>{plugins.length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'create' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('create')}
          >
            🛠️ Custom Plugin Sandbox
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: '0.65rem 1.75rem',
              fontSize: '0.84rem',
              background:
                feedback.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              borderBottom: `1px solid ${
                feedback.type === 'success'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
              color: feedback.type === 'success' ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className={styles.body}>
          {/* Quick Tool Tester Box */}
          {testingTool && (
            <div className={styles.testerBox}>
              <div className={styles.testerHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚡</span>
                  <strong style={{ color: '#c084fc' }}>
                    Quick Test: {testingTool.toolName} ({testingTool.pluginName})
                  </strong>
                </div>
                <button
                  onClick={() => setTestingTool(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Arguments (JSON format):
                </label>
                <textarea
                  value={toolArgsInput}
                  onChange={(e) => setToolArgsInput(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    color: '#f1f5f9',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.78rem',
                    height: '80px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  className={styles.testToolBtn}
                  onClick={handleRunToolTest}
                  disabled={toolExecuting}
                >
                  {toolExecuting ? 'Running...' : '💬 Send to NIVA Chat'}
                </button>
              </div>

              {toolOutput && <div className={styles.testerOutput}>{toolOutput}</div>}
            </div>
          )}

          {/* TAB 1: INSTALLED PLUGINS */}
          {activeTab === 'installed' && (
            <div className={styles.pluginsGrid}>
              {plugins.map((plugin) => {
                const m = plugin.manifest;
                const isActive = plugin.status === 'active';

                return (
                  <div key={m.id} className={styles.pluginCard}>
                    <div className={styles.cardTop}>
                      <div className={styles.pluginHeaderInfo}>
                        <div className={styles.pluginIcon}>{m.icon || '🧩'}</div>
                        <div>
                          <div className={styles.pluginName}>{m.name}</div>
                          <div className={styles.pluginVersion}>
                            v{m.version} • by {m.author}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`${styles.toggleSwitch} ${isActive ? styles.active : ''}`}
                        onClick={() => handleToggle(m.id, plugin.status)}
                        title={isActive ? 'Active — Click to disable' : 'Disabled — Click to enable'}
                      >
                        <div className={styles.toggleSlider} />
                      </div>
                    </div>

                    <div className={styles.pluginDesc}>{m.description}</div>

                    <div className={styles.metaRow}>
                      <span className={styles.categoryTag}>{m.category}</span>
                      {m.permissions.map((perm) => (
                        <span key={perm} className={styles.permissionPill}>
                          🔒 {perm}
                        </span>
                      ))}
                    </div>

                    {/* Provided Tools */}
                    {m.tools && m.tools.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Exported Tools ({m.tools.length}):
                        </span>
                        <div className={styles.toolList}>
                          {m.tools.map((t) => (
                            <span
                              key={t.name}
                              className={styles.toolTag}
                              onClick={() => handleOpenToolTester(m.name, t.name)}
                              style={{ cursor: 'pointer' }}
                              title="Click to test tool"
                            >
                              ⚙️ {t.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      <span className={styles.author}>
                        Status: <strong style={{ color: isActive ? '#10b981' : '#64748b' }}>{plugin.status.toUpperCase()}</strong>
                      </span>
                      {m.tools && m.tools.length > 0 && (
                        <button
                          className={styles.testToolBtn}
                          onClick={() => handleOpenToolTester(m.name, m.tools![0].name)}
                        >
                          ▶ Test Tool
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: CUSTOM PLUGIN CREATOR */}
          {activeTab === 'create' && (
            <form className={styles.formContainer} onSubmit={handleInstallCustom}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Plugin Manifest (JSON Schema)
                </label>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Define plugin ID, name, permissions, category, and exported tool signatures:
                </span>
                <textarea
                  className={styles.textarea}
                  value={manifestJson}
                  onChange={(e) => setManifestJson(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className={styles.primaryBtn} disabled={loading}>
                {loading ? 'Installing...' : '🧩 Install & Activate Custom Plugin'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
