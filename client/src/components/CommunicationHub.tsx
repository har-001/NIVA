'use client';

// ============================================
// NIVA — Communication Hub (Contacts, Messaging, Calls & Audit)
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import styles from './CommunicationHub.module.css';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  isFavorite: boolean;
}

interface CallSession {
  id: string;
  contactName: string;
  phoneNumber: string;
  direction: 'outgoing' | 'incoming';
  status: string;
  startedAt: string;
  durationSeconds: number;
  isRecording: boolean;
  transcript: Array<{ speaker: string; text: string; timestamp: string }>;
  summary?: string;
  actionItems?: string[];
}

interface CommunicationHubProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (content: string) => void;
}

export function CommunicationHub({ isOpen, onClose, onSendToChat }: CommunicationHubProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'compose' | 'call' | 'history'>('contacts');

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // New Contact form toggle
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');

  // Compose state
  const [channel, setChannel] = useState<'email' | 'whatsapp' | 'telegram' | 'sms'>('email');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // Call state
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callTimer, setCallTimer] = useState<number>(0);
  const [callSpeechInput, setCallSpeechInput] = useState('');
  const [dialName, setDialName] = useState('Harshit Sharma');
  const [dialPhone, setDialPhone] = useState('+91 98765 43210');

  // History state
  const [history, setHistory] = useState<any[]>([]);

  // Load contacts & history
  useEffect(() => {
    if (isOpen) {
      loadContacts();
      loadHistory();
    }
  }, [isOpen]);

  // Call timer interval
  useEffect(() => {
    let interval: any;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await api.getContacts(searchQuery);
      if (res && res.contacts) {
        setContacts(res.contacts);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getCommunicationHistory();
      if (res && res.history) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    try {
      const res = await api.saveContact({
        name: newContactName,
        email: newContactEmail,
        phone: newContactPhone,
        company: newContactCompany,
        isFavorite: false,
      });
      if (res && res.contact) {
        setContacts(prev => [res.contact, ...prev]);
        setShowAddContact(false);
        setNewContactName('');
        setNewContactEmail('');
        setNewContactPhone('');
        setNewContactCompany('');
      }
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await api.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !messageContent.trim()) return;

    try {
      setSendingMessage(true);
      const res = await api.sendCommunication({
        channel,
        recipient,
        subject: channel === 'email' ? subject : undefined,
        content: messageContent,
      });
      if (res && res.result) {
        setSendResult(res.result);
        loadHistory();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartCall = async (targetName: string, targetPhone: string) => {
    try {
      setActiveTab('call');
      setCallTimer(0);
      const res = await api.startCall({
        contactName: targetName,
        phoneNumber: targetPhone,
        direction: 'outgoing',
      });
      if (res && res.session) {
        setActiveCall(res.session);
      }
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  const handleSendCallSpeech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCall || !callSpeechInput.trim()) return;

    try {
      const speech = callSpeechInput.trim();
      setCallSpeechInput('');

      // Add user transcript
      let res = await api.addCallTranscript(activeCall.id, 'user', speech);
      if (res && res.session) {
        setActiveCall(res.session);
      }

      // Simulate contact response
      setTimeout(async () => {
        if (!activeCall) return;
        const reply = `Got it, Harshit. Thanks for updating me on "${speech.slice(0, 30)}...". I'll review and get back to you shortly.`;
        const replyRes = await api.addCallTranscript(activeCall.id, 'contact', reply);
        if (replyRes && replyRes.session) {
          setActiveCall(replyRes.session);
        }
      }, 1200);
    } catch (err) {
      console.error('Failed to add speech:', err);
    }
  };

  const handleToggleRecord = async () => {
    if (!activeCall) return;
    try {
      const res = await api.toggleCallRecord(activeCall.id);
      if (res && res.session) {
        setActiveCall(res.session);
      }
    } catch (err) {
      console.error('Failed to toggle recording:', err);
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    try {
      const res = await api.endCall(activeCall.id, callTimer);
      if (res && res.session) {
        setActiveCall(res.session);
        loadHistory();
      }
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.iconOrb}>📞</div>
            <div className={styles.titleText}>
              <h2>Communication Hub & AI Agent</h2>
              <p>Contacts, messaging, email dispatch & AI-assisted call simulation</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close Communication Hub">
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'contacts' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            👥 Contacts ({contacts.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'compose' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('compose')}
          >
            ✉️ Compose & Dispatch
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'call' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('call')}
          >
            📞 AI Call Console {activeCall && activeCall.status === 'connected' && '• LIVE'}
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
          >
            📜 Audit History
          </button>
        </div>

        {/* Content Body */}
        <div className={styles.contentBody}>
          {/* TAB 1: CONTACTS */}
          {activeTab === 'contacts' && (
            <>
              <div className={styles.contactsHeader}>
                <div className={styles.searchBox}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name, company, email, or phone..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      api.getContacts(e.target.value).then(r => r?.contacts && setContacts(r.contacts));
                    }}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddContact(!showAddContact)}
                >
                  {showAddContact ? 'Cancel' : '+ Add Contact'}
                </button>
              </div>

              {/* Add Contact inline form */}
              {showAddContact && (
                <form className={styles.composeForm} onSubmit={handleCreateContact}>
                  <h4>Add New Contact to Directory</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div className={styles.formGroup}>
                      <label>Full Name *</label>
                      <input
                        className={styles.formInput}
                        required
                        value={newContactName}
                        onChange={e => setNewContactName(e.target.value)}
                        placeholder="e.g. Elena Rostova"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email Address</label>
                      <input
                        className={styles.formInput}
                        type="email"
                        value={newContactEmail}
                        onChange={e => setNewContactEmail(e.target.value)}
                        placeholder="elena@example.com"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone Number</label>
                      <input
                        className={styles.formInput}
                        value={newContactPhone}
                        onChange={e => setNewContactPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Company / Organization</label>
                      <input
                        className={styles.formInput}
                        value={newContactCompany}
                        onChange={e => setNewContactCompany(e.target.value)}
                        placeholder="Quantum Robotics"
                      />
                    </div>
                  </div>
                  <button type="submit" className={styles.sendBtn} style={{ marginTop: '0.5rem' }}>
                    Save Contact
                  </button>
                </form>
              )}

              {/* Contacts Grid */}
              <div className={styles.contactsGrid}>
                {contacts.map(c => (
                  <div key={c.id} className={styles.contactCard}>
                    <div className={styles.contactTop}>
                      <div className={styles.contactAvatar}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.contactMeta}>
                        <h4>
                          {c.name} {c.isFavorite && <span style={{ color: '#f59e0b' }}>⭐</span>}
                        </h4>
                        <p>{c.role ? `${c.role} • ${c.company}` : c.company || 'Personal'}</p>
                      </div>
                    </div>

                    <div className={styles.contactDetails}>
                      {c.phone && <div>📞 {c.phone}</div>}
                      {c.email && <div>✉️ {c.email}</div>}
                    </div>

                    <div className={styles.contactActions}>
                      <button
                        className={styles.actionBtnSmall}
                        onClick={() => handleStartCall(c.name, c.phone || '+91 98765 43210')}
                        title="Call with AI assistance"
                      >
                        📞 Call
                      </button>
                      <button
                        className={styles.actionBtnSmall}
                        onClick={() => {
                          setChannel('email');
                          setRecipient(c.email || c.name);
                          setSubject(`Follow up with ${c.name}`);
                          setActiveTab('compose');
                        }}
                        title="Send Email"
                      >
                        ✉️ Email
                      </button>
                      <button
                        className={styles.actionBtnSmall}
                        onClick={() => {
                          setChannel('whatsapp');
                          setRecipient(c.phone || '+91 98765 43210');
                          setMessageContent(`Hi ${c.name}, connecting via NIVA AI.`);
                          setActiveTab('compose');
                        }}
                        title="WhatsApp Web"
                      >
                        💬 Chat
                      </button>
                      <button
                        className={`${styles.actionBtnSmall} ${styles.actionBtnDanger}`}
                        onClick={() => handleDeleteContact(c.id)}
                        title="Delete contact"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TAB 2: COMPOSE & DISPATCH */}
          {activeTab === 'compose' && (
            <form className={styles.composeForm} onSubmit={handleSendMessage}>
              <div className={styles.channelPills}>
                <button
                  type="button"
                  className={`${styles.channelPill} ${channel === 'email' ? styles.channelPillActive : ''}`}
                  onClick={() => setChannel('email')}
                >
                  ✉️ Email
                </button>
                <button
                  type="button"
                  className={`${styles.channelPill} ${channel === 'whatsapp' ? styles.channelPillActive : ''}`}
                  onClick={() => setChannel('whatsapp')}
                >
                  💬 WhatsApp
                </button>
                <button
                  type="button"
                  className={`${styles.channelPill} ${channel === 'telegram' ? styles.channelPillActive : ''}`}
                  onClick={() => setChannel('telegram')}
                >
                  ✈️ Telegram
                </button>
                <button
                  type="button"
                  className={`${styles.channelPill} ${channel === 'sms' ? styles.channelPillActive : ''}`}
                  onClick={() => setChannel('sms')}
                >
                  📱 SMS
                </button>
              </div>

              <div className={styles.formGroup}>
                <label>
                  Recipient ({channel === 'email' ? 'Email address' : channel === 'telegram' ? 'Telegram @handle' : 'Phone number'})
                </label>
                <input
                  className={styles.formInput}
                  required
                  placeholder={
                    channel === 'email'
                      ? 'harshit@niva.ai'
                      : channel === 'telegram'
                      ? '@harshit_sharma'
                      : '+91 98765 43210'
                  }
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                />
              </div>

              {channel === 'email' && (
                <div className={styles.formGroup}>
                  <label>Subject</label>
                  <input
                    className={styles.formInput}
                    placeholder="Meeting Agenda & AI Progress Update"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Message Content</label>
                <textarea
                  className={styles.formTextarea}
                  required
                  rows={5}
                  placeholder="Type your message or draft..."
                  value={messageContent}
                  onChange={e => setMessageContent(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.sendBtn} disabled={sendingMessage}>
                {sendingMessage ? 'Dispatching...' : `Dispatch via ${channel.toUpperCase()} 🚀`}
              </button>

              {sendResult && (
                <div className={styles.sendResultCard}>
                  <h4>✅ {sendResult.channel.toUpperCase()} Dispatch Prepared</h4>
                  <p><strong>To:</strong> {sendResult.recipient}</p>
                  <p><strong>Status:</strong> {sendResult.status.toUpperCase()} — {sendResult.details}</p>
                  {sendResult.actionUrl && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.45rem' }}>
                      <a
                        href={sendResult.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        Launch Direct Client ↗
                      </a>
                      {onSendToChat && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSendToChat(`I dispatched a ${sendResult.channel} message to ${sendResult.recipient}: "${sendResult.content}"`)}
                        >
                          💬 Send to Chat
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
          )}

          {/* TAB 3: AI CALL CONSOLE */}
          {activeTab === 'call' && (
            <div className={styles.callConsole}>
              {/* Call In-Progress Header */}
              {activeCall && activeCall.status === 'connected' ? (
                <>
                  {activeCall.isRecording && (
                    <div className={styles.recordingBadge}>
                      <span>●</span> REC
                    </div>
                  )}

                  <div className={styles.callerAvatarArea}>
                    <div className={styles.callerWaves}></div>
                    <div className={styles.callerAvatar}>
                      {activeCall.contactName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className={styles.callDetails}>
                    <h3>{activeCall.contactName}</h3>
                    <p>{activeCall.phoneNumber} • NIVA AI Voice Link</p>
                    <div className={styles.callTimer}>
                      ⏱️ {formatSeconds(callTimer)}
                    </div>
                  </div>

                  {/* Holographic Waveform */}
                  <div className={styles.waveformContainer}>
                    <div className={styles.waveBar}></div>
                    <div className={styles.waveBar}></div>
                    <div className={styles.waveBar}></div>
                    <div className={styles.waveBar}></div>
                    <div className={styles.waveBar}></div>
                    <div className={styles.waveBar}></div>
                    <div className={styles.waveBar}></div>
                  </div>

                  {/* Call Controls */}
                  <div className={styles.callActionsBar}>
                    <button
                      className={styles.callControlBtn}
                      onClick={handleToggleRecord}
                      title={activeCall.isRecording ? 'Stop Recording' : 'Start Recording'}
                      style={{ color: activeCall.isRecording ? '#ef4444' : '#94a3b8' }}
                    >
                      ⏺️
                    </button>
                    <button
                      className={`${styles.callControlBtn} ${styles.callEndBtn}`}
                      onClick={handleEndCall}
                      title="End Call"
                    >
                      📞
                    </button>
                  </div>

                  {/* Live Two-Way Transcript Feed */}
                  <div className={styles.transcriptStream}>
                    {activeCall.transcript.map((t, idx) => (
                      <div key={idx} className={styles.transcriptItem}>
                        <span
                          className={
                            t.speaker === 'user'
                              ? styles.speakerUser
                              : t.speaker === 'assistant'
                              ? styles.speakerAssistant
                              : styles.speakerContact
                          }
                        >
                          {t.speaker.toUpperCase()}:
                        </span>{' '}
                        {t.text}
                      </div>
                    ))}
                  </div>

                  {/* User In-Call Speech Form */}
                  <form
                    onSubmit={handleSendCallSpeech}
                    style={{ width: '100%', marginTop: '1rem', display: 'flex', gap: '0.5rem' }}
                  >
                    <input
                      className={styles.formInput}
                      style={{ flex: 1 }}
                      placeholder="Say something into the call..."
                      value={callSpeechInput}
                      onChange={e => setCallSpeechInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      Speak 🎙️
                    </button>
                  </form>
                </>
              ) : (
                /* Idle Call Screen or Post-Call Summary */
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {activeCall && activeCall.status === 'ended' && (
                    <div className={styles.callSummaryCard}>
                      <h4>📋 Post-Call Executive Briefing</h4>
                      <p><strong>Call with:</strong> {activeCall.contactName} ({activeCall.phoneNumber})</p>
                      <p><strong>Duration:</strong> {activeCall.durationSeconds}s | <strong>Recording:</strong> {activeCall.isRecording ? 'Saved to Vault' : 'Off'}</p>
                      <p>{activeCall.summary}</p>
                      {activeCall.actionItems && activeCall.actionItems.length > 0 && (
                        <div>
                          <strong>Key Action Items:</strong>
                          <ul className={styles.actionItemList}>
                            {activeCall.actionItems.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {onSendToChat && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                          onClick={() => {
                            onSendToChat(`📞 **Call Summary with ${activeCall.contactName}** (${activeCall.durationSeconds}s):\n${activeCall.summary}\n\n*Action Items:*\n${activeCall.actionItems?.map(a => `- ${a}`).join('\n')}`);
                            onClose();
                          }}
                        >
                          💬 Send Call Briefing to Chat
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '420px', textAlign: 'left' }}>
                    <h3 style={{ color: '#f8fafc', marginBottom: '1rem', textAlign: 'center' }}>
                      Start an AI-Assisted Call
                    </h3>
                    <div className={styles.formGroup}>
                      <label>Contact / Caller Name</label>
                      <input
                        className={styles.formInput}
                        value={dialName}
                        onChange={e => setDialName(e.target.value)}
                        placeholder="Harshit Sharma"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: '0.75rem' }}>
                      <label>Phone Number</label>
                      <input
                        className={styles.formInput}
                        value={dialPhone}
                        onChange={e => setDialPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <button
                      className={styles.sendBtn}
                      style={{ width: '100%', marginTop: '1.25rem' }}
                      onClick={() => handleStartCall(dialName, dialPhone)}
                    >
                      Connect Call Now 📞
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT HISTORY */}
          {activeTab === 'history' && (
            <div className={styles.historyList}>
              {history.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                  No communication dispatches recorded yet.
                </p>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className={styles.historyItem}>
                    <div className={styles.historyLeft}>
                      <span
                        className={`${styles.channelBadge} ${
                          item.channel === 'email'
                            ? styles.badgeEmail
                            : item.channel === 'whatsapp'
                            ? styles.badgeWhatsapp
                            : item.channel === 'telegram'
                            ? styles.badgeTelegram
                            : styles.badgeCall
                        }`}
                      >
                        {item.channel}
                      </span>
                      <div className={styles.historyDetails}>
                        <h4>To: {item.recipient} {item.subject ? `• "${item.subject}"` : ''}</h4>
                        <p>{item.content || item.details}</p>
                      </div>
                    </div>
                    <div className={styles.historyTime}>
                      {new Date(item.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
