'use client';

// ============================================
// NIVA — Auth Page (Login / Register)
// ============================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, username, password, displayName || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Animated background elements */}
      <div className={styles.bgOrb1}></div>
      <div className={styles.bgOrb2}></div>
      <div className={styles.bgOrb3}></div>
      <div className={styles.bgGrid}></div>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoGlow}></div>
            <svg viewBox="0 0 80 80" width="80" height="80" className={styles.logo}>
              <defs>
                <linearGradient id="authLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <circle cx="40" cy="40" r="36" fill="none" stroke="url(#authLogoGrad)" strokeWidth="2.5" />
              <circle cx="40" cy="40" r="28" fill="none" stroke="url(#authLogoGrad)" strokeWidth="1" opacity="0.3" />
              <text x="40" y="48" textAnchor="middle" fill="url(#authLogoGrad)" fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">N</text>
            </svg>
          </div>
          <h1 className={styles.title}>NIVA</h1>
          <p className={styles.subtitle}>Neural Intelligent Virtual Assistant</p>
        </div>

        {/* Mode Toggle */}
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${mode === 'login' ? styles.modeBtnActive : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'register' ? styles.modeBtnActive : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMsg}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="auth-email">
              {mode === 'login' ? 'Email or Username' : 'Email'}
            </label>
            <input
              id="auth-email"
              className="input"
              type={mode === 'login' ? 'text' : 'email'}
              placeholder={mode === 'login' ? 'Enter email or username' : 'you@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="input-group">
                <label className="input-label" htmlFor="auth-username">Username</label>
                <input
                  id="auth-username"
                  className="input"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="auth-displayname">Display Name (optional)</label>
                <input
                  id="auth-displayname"
                  className="input"
                  type="text"
                  placeholder="How should NIVA call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              placeholder={mode === 'login' ? 'Enter password' : 'Min 8 chars, 1 upper, 1 lower, 1 number'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 8 : 1}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="thinking-dots">
                <span></span><span></span><span></span>
              </span>
            ) : mode === 'login' ? (
              'Sign In to NIVA'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Secured with end-to-end encryption • Your data stays yours
        </p>
      </div>
    </div>
  );
}
