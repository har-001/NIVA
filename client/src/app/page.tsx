'use client';

// ============================================
// NIVA — Landing / Router Page
// ============================================

import { useAuth } from '../context/AuthContext';
import AuthPage from '../components/AuthPage';
import ChatPage from '../components/ChatPage';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="niva-logo-container">
          <div className="niva-logo-glow"></div>
          <svg className="niva-logo" viewBox="0 0 60 60" width="60" height="60">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <circle cx="30" cy="30" r="28" fill="none" stroke="url(#logoGrad)" strokeWidth="2" />
            <text x="30" y="36" textAnchor="middle" fill="url(#logoGrad)" fontSize="20" fontWeight="700" fontFamily="Inter, sans-serif">N</text>
          </svg>
        </div>
        <p className="loading-text">Initializing NIVA...</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 1.5rem;
          }
          .niva-logo-container {
            position: relative;
            animation: float 3s ease-in-out infinite;
          }
          .niva-logo-glow {
            position: absolute;
            inset: -20px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%);
            border-radius: 50%;
            animation: pulse-glow 2s ease-in-out infinite;
          }
          .niva-logo {
            position: relative;
            z-index: 1;
          }
          .loading-text {
            color: var(--color-text-secondary);
            font-size: var(--text-sm);
            animation: fadeIn 1s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <ChatPage />;
}
