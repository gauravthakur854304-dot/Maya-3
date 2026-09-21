import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Accessibility,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { VoiceAuthState, DriveSyncState, AccessibilityState } from '../types';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  voiceAuthState: VoiceAuthState;
  driveSync: DriveSyncState;
  accessibilityState: AccessibilityState;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  activeTurnToken: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  voiceAuthState,
  driveSync,
  accessibilityState,
  onGoogleSignIn,
  onGoogleSignOut,
  activeTurnToken,
}) => {
  const getVoiceBadge = () => {
    switch (voiceAuthState) {
      case 'VERIFIED_ADMIN':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Verified</span>
          </div>
        );
      case 'NOT_VERIFIED':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldX className="w-3.5 h-3.5" />
            <span>Unverified Voice</span>
          </div>
        );
      case 'INSUFFICIENT_EVIDENCE':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Insufficient Audio</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 opacity-60" />
            <span>Voice Standby</span>
          </div>
        );
    }
  };

  const tabs = [
    { id: 'assistant', label: 'Gemini Live' },
    { id: 'voice-auth', label: 'Voice Authentication' },
    { id: 'memory', label: 'Memory & Context' },
    { id: 'tools-security', label: 'Protected Tools' },
    { id: 'drive-vault', label: 'Google Drive Vault' },
    { id: 'diagnostics', label: 'System Diagnostics' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Version */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">MYRA</span>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  v2.2.3
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Voice-Authenticated Multimodal AI System
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="hidden md:flex items-center gap-2.5">
            {getVoiceBadge()}

            {/* Accessibility status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                accessibilityState.isServiceEnabled
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="Android Accessibility Service Detection & Race Guard"
            >
              <Accessibility className="w-3.5 h-3.5" />
              <span>
                {accessibilityState.isServiceEnabled ? 'A11y Active' : 'A11y Off'}
              </span>
            </div>

            {/* Drive status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                driveSync.isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="Google Drive Cloud Sync"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{driveSync.isConnected ? 'Drive Synced' : 'Drive Offline'}</span>
            </div>

            {/* Wi-Fi Indicator */}
            <div className="flex items-center gap-1 text-slate-500 text-xs px-2 py-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Connected</span>
            </div>
          </div>

          {/* Google Account / Drive auth button */}
          <div className="flex items-center gap-3">
            {driveSync.isConnected ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {driveSync.photoUrl ? (
                  <img
                    src={driveSync.photoUrl}
                    alt={driveSync.displayName || 'Google User'}
                    className="w-8 h-8 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {driveSync.userEmail?.substring(0, 2).toUpperCase() || 'GT'}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {driveSync.displayName || 'Gaurav Thakur'}
                  </p>
                  <p className="text-[10px] text-slate-500 max-w-[130px] truncate leading-tight">
                    {driveSync.userEmail || 'gauravthakur854304@gmail.com'}
                  </p>
                </div>
                <button
                  id="header-signout-btn"
                  onClick={onGoogleSignOut}
                  title="Disconnect Google Drive"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-google-signin-btn"
                onClick={onGoogleSignIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>Connect Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                currentTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
