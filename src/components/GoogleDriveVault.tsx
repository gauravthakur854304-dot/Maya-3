import React, { useState } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  FileJson,
  RefreshCw,
  ShieldCheck,
  FolderOpen,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react';
import { DriveSyncState } from '../types';

interface GoogleDriveVaultProps {
  driveSync: DriveSyncState;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onBackupNow: () => Promise<void>;
  onRestoreNow: () => Promise<void>;
  previewData?: any;
}

export const GoogleDriveVault: React.FC<GoogleDriveVaultProps> = ({
  driveSync,
  onGoogleSignIn,
  onGoogleSignOut,
  onBackupNow,
  onRestoreNow,
  previewData,
}) => {
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleBackup = async () => {
    try {
      await onBackupNow();
      setActionMessage('Successfully created backup in Google Drive (MYRA_v2.2.3_Backup.json)');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Backup failed: ${err.message}`);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleRestore = async () => {
    try {
      await onRestoreNow();
      setActionMessage('Successfully restored profiles and memory from Google Drive!');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Restore failed: ${err.message}`);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Google Workspace Integration
                </span>
                <span className="text-xs text-slate-500">Official Drive REST v3</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Google Drive Cloud Backup & Sync
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Securely synchronize your enrolled speaker voice embeddings, permanent long-term
                memories, security audit logs, and system preferences with permission to your personal
                Google Drive account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {driveSync.isConnected ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Connected ({driveSync.userEmail || 'gauravthakur854304@gmail.com'})
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <AlertCircle className="w-4 h-4" />
                Drive Disconnected
              </span>
            )}
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-medium border border-blue-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Actions & Drive Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connection Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Google Drive Account & Authorization
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Requires permission to store and manage MYRA application files (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">drive.file</code> scope).
            </p>

            {!driveSync.isConnected ? (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                <p className="text-xs text-slate-600">
                  Connect your Google Drive to enable cloud backup for your voice profiles and memory.
                </p>
                <button
                  id="btn-google-drive-connect"
                  onClick={onGoogleSignIn}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all"
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
                  <span>Sign in with Google (Connect Drive)</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {driveSync.userEmail?.substring(0, 2).toUpperCase() || 'GT'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {driveSync.displayName || 'Gaurav Thakur'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      {driveSync.userEmail || 'gauravthakur854304@gmail.com'}
                    </p>
                  </div>
                </div>

                <button
                  id="btn-google-drive-disconnect"
                  onClick={onGoogleSignOut}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}

            {/* Cloud Sync Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CloudUpload className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Create / Push Cloud Backup</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generates an encrypted backup payload containing your 3-slot speaker embeddings and long-term memories.
                </p>
                <button
                  id="btn-backup-to-drive"
                  disabled={!driveSync.isConnected || driveSync.isSyncing}
                  onClick={handleBackup}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    driveSync.isConnected
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  {driveSync.isSyncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing to Drive...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>Backup Now to Google Drive</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <CloudDownload className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Restore from Drive</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Downloads <code className="text-slate-700">MYRA_v2.2.3_Backup.json</code> from your Google Drive and updates the local state.
                </p>
                <button
                  id="btn-restore-from-drive"
                  disabled={!driveSync.isConnected || driveSync.isSyncing}
                  onClick={handleRestore}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    driveSync.isConnected
                      ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>Restore from Drive</span>
                </button>
              </div>
            </div>
          </div>

          {/* Backup Payload Inspector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Backup File Metadata</h3>
              </div>
              <button
                id="btn-toggle-json-preview"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                {showJsonPreview ? 'Hide Raw JSON' : 'View Raw Payload'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target File</span>
                <span className="font-mono text-slate-800 font-medium">MYRA_v2.2.3_Backup.json</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Drive File ID</span>
                <span className="font-mono text-slate-800 font-medium truncate block">
                  {driveSync.backupFileId || 'drive_file_synced'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Synchronized</span>
                <span className="text-slate-800 font-medium">
                  {driveSync.lastSyncTime ? new Date(driveSync.lastSyncTime).toLocaleString() : 'Just now'}
                </span>
              </div>
            </div>

            {showJsonPreview && previewData && (
              <pre className="mt-3 p-3 bg-slate-900 text-indigo-200 text-[11px] font-mono rounded-xl overflow-x-auto max-h-60 border border-slate-800">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Right Column: Google Drive Info & Best Practices */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Drive Cloud Architecture</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Google Drive OAuth token caching is maintained in browser RAM to conform to zero-storage security requirements. Tokens are cleared automatically when the user signs out.
            </p>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scope: https://www.googleapis.com/auth/drive.file</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Multi-sample voice embeddings included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Long-term memory definitions synced</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Security audit logs archived</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
