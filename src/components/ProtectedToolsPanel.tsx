import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Lock,
  Unlock,
  KeyRound,
  Play,
  RotateCcw,
  AlertTriangle,
  History,
  Terminal,
  Settings,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { ProtectedTool, SecurityAuditLog, VoiceAuthState } from '../types';

interface ProtectedToolsPanelProps {
  tools: ProtectedTool[];
  onExecuteTool: (tool: ProtectedTool, pinProvided?: string) => Promise<boolean>;
  auditLogs: SecurityAuditLog[];
  voiceAuthState: VoiceAuthState;
  activeTurnToken: string;
  isPinConfigured: boolean;
  onClearAuditLogs: () => void;
}

export const ProtectedToolsPanel: React.FC<ProtectedToolsPanelProps> = ({
  tools,
  onExecuteTool,
  auditLogs,
  voiceAuthState,
  activeTurnToken,
  isPinConfigured,
  onClearAuditLogs,
}) => {
  const [selectedToolForPin, setSelectedToolForPin] = useState<ProtectedTool | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [executionMessage, setExecutionMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'warn';
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleToolClick = async (tool: ProtectedTool) => {
    // If tool requires voice admin and voice is NOT verified, open PIN fallback modal if PIN configured
    if (tool.requiresVoiceAdmin && voiceAuthState !== 'VERIFIED_ADMIN') {
      if (isPinConfigured) {
        setSelectedToolForPin(tool);
        setPinInput('');
        return;
      } else {
        // Fail-closed directly
        setExecutionMessage({
          text: `[FAIL-CLOSED] Action "${tool.name}" blocked. Voice verification not verified and no PIN fallback configured.`,
          type: 'error',
        });
        setTimeout(() => setExecutionMessage(null), 5000);
        return;
      }
    }

    // Direct execute (either low risk or voice is verified)
    setIsExecuting(true);
    const success = await onExecuteTool(tool);
    setIsExecuting(false);

    if (success) {
      setExecutionMessage({
        text: `Authorized & Executed: "${tool.name}" safely under turn token ${activeTurnToken}.`,
        type: 'success',
      });
    } else {
      setExecutionMessage({
        text: `Execution of "${tool.name}" failed or was rejected by centralized security.`,
        type: 'error',
      });
    }
    setTimeout(() => setExecutionMessage(null), 4000);
  };

  const handleConfirmPinFallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolForPin || !pinInput) return;

    setIsExecuting(true);
    const success = await onExecuteTool(selectedToolForPin, pinInput);
    setIsExecuting(false);

    if (success) {
      setExecutionMessage({
        text: `PIN Fallback Accepted: "${selectedToolForPin.name}" executed successfully.`,
        type: 'success',
      });
      setSelectedToolForPin(null);
      setPinInput('');
    } else {
      setExecutionMessage({
        text: `Invalid PIN provided. Tool execution closed.`,
        type: 'error',
      });
    }
    setTimeout(() => setExecutionMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Security Status Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Centralized Tool Authorization
              </span>
              <span className="text-xs text-slate-500">v2.2.3 Fail-Closed Protocol</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Protected AI Tools & Actions
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              High-risk system actions enforce fail-closed security. Only current-turn verified
              administrator voice or an authorized PIN fallback can clear execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Current Auth State</span>
              <span
                className={`font-bold font-mono ${
                  voiceAuthState === 'VERIFIED_ADMIN'
                    ? 'text-emerald-600'
                    : voiceAuthState === 'NOT_VERIFIED'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {voiceAuthState}
              </span>
            </div>
          </div>
        </div>

        {executionMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
              executionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {executionMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{executionMessage.text}</span>
          </div>
        )}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const isHigh = tool.riskLevel === 'HIGH';
          const isMedium = tool.riskLevel === 'MEDIUM';
          return (
            <div
              key={tool.id}
              id={`tool-card-${tool.id}`}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    {tool.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isHigh
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isMedium
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tool.riskLevel} RISK
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                  {tool.requiresVoiceAdmin && (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span>{tool.name}</span>
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {tool.description}
                </p>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 mb-3 flex items-center justify-between">
                  <span>Policy:</span>
                  <span>{tool.requiresVoiceAdmin ? 'Voice Admin Required' : 'Public Access'}</span>
                </div>

                <button
                  id={`btn-execute-tool-${tool.id}`}
                  disabled={isExecuting}
                  onClick={() => handleToolClick(tool)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    tool.requiresVoiceAdmin && voiceAuthState !== 'VERIFIED_ADMIN'
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {tool.requiresVoiceAdmin && voiceAuthState !== 'VERIFIED_ADMIN' ? (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Unlock with PIN Fallback</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Execute Action</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Audit Log Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Live Security & Tool Authorization Audit Log
            </h3>
          </div>
          <button
            id="btn-clear-audit-logs"
            onClick={onClearAuditLogs}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Clear Audit
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Name</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Auth State</th>
                <th className="py-2.5 px-3">Turn Token</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                    No authorization events recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 font-mono">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {log.toolName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.riskLevel === 'HIGH'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.riskLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'AUTHORIZED' || log.status === 'PIN_UNLOCKED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {log.authState}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[100px]">
                      {log.turnToken}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PIN Fallback Modal */}
      {selectedToolForPin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Voice Verification Fallback
                </h3>
                <p className="text-xs text-slate-500">
                  Tool: <span className="font-semibold text-slate-800">{selectedToolForPin.name}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your voice verification is currently{' '}
              <strong className="text-rose-600">{voiceAuthState}</strong>. Enter your 4-digit App
              Lock PIN to override and authorize this action.
            </p>

            <form onSubmit={handleConfirmPinFallback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Admin PIN
                </label>
                <input
                  id="pin-fallback-input"
                  type="password"
                  autoFocus
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center text-lg font-mono tracking-widest px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedToolForPin(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel (Fail-Closed)
                </button>
                <button
                  type="submit"
                  disabled={!pinInput || isExecuting}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  Verify PIN & Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
