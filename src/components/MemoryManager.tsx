import React, { useState } from 'react';
import {
  Brain,
  Pin,
  Trash2,
  Plus,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  CopyCheck,
  ShieldCheck,
} from 'lucide-react';
import { MemoryItem, ConversationTurn } from '../types';

interface MemoryManagerProps {
  longTermMemory: MemoryItem[];
  onAddMemory: (content: string, category: MemoryItem['category']) => void;
  onDeleteMemory: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDeduplicateMemories: () => void;
  conversationTurnsCount: number;
  onClearChatTurns: () => void;
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({
  longTermMemory,
  onAddMemory,
  onDeleteMemory,
  onTogglePin,
  onDeduplicateMemories,
  conversationTurnsCount,
  onClearChatTurns,
}) => {
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('Preference');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [dedupNotification, setDedupNotification] = useState<string | null>(null);

  const categories: MemoryItem['category'][] = [
    'Preference',
    'Personal',
    'Work',
    'Security',
    'Instruction',
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddMemory(newContent.trim(), newCategory);
    setNewContent('');
    setIsAdding(false);
  };

  const handleDedup = () => {
    const beforeCount = longTermMemory.length;
    onDeduplicateMemories();
    setDedupNotification('Scanned and pruned duplicate/stale memories.');
    setTimeout(() => setDedupNotification(null), 3000);
  };

  const filteredMemories =
    selectedFilter === 'ALL'
      ? longTermMemory
      : longTermMemory.filter((m) => m.category === selectedFilter);

  return (
    <div className="space-y-6">
      {/* Concept Architecture Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Memory Isolation Architecture
              </span>
              <span className="text-xs text-slate-500">v2.2.3 Update</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Separated Conversation vs Long-Term Memory
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Temporary conversation turns (chat buffer) are stored independently from permanent
              user facts, preferences, and security guidelines. Clearing the active chat does{' '}
              <strong className="text-slate-900 font-semibold">not</strong> wipe long-term memory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-deduplicate-memory"
              onClick={handleDedup}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CopyCheck className="w-4 h-4 text-indigo-600" />
              <span>Deduplicate Memory</span>
            </button>

            <button
              id="btn-add-memory-toggle"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {dedupNotification && (
          <div className="mt-4 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{dedupNotification}</span>
          </div>
        )}
      </div>

      {/* Add Memory Modal / Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-200 shadow-xs space-y-3"
        >
          <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
            Store New Long-Term Memory
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <input
                id="memory-content-input"
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. Always summarize tech terms in bullet points..."
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <select
                id="memory-category-select"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Save Memory
            </button>
          </div>
        </form>
      )}

      {/* Memory Cards & Buffer Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Permanent Memory Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({longTermMemory.length})
            </button>
            {categories.map((cat) => {
              const count = longTermMemory.filter((m) => m.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Memory List */}
          <div className="space-y-3">
            {filteredMemories.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                No long-term memories in this category yet.
              </div>
            ) : (
              filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  id={`memory-item-${mem.id}`}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-start justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {mem.category}
                      </span>
                      {mem.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                          <Pin className="w-3 h-3 fill-amber-500" />
                          Pinned
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(mem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-normal">
                      {mem.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onTogglePin(mem.id)}
                      title={mem.isPinned ? 'Unpin' : 'Pin memory'}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        mem.isPinned
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${mem.isPinned ? 'fill-amber-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => onDeleteMemory(mem.id)}
                      title="Delete memory item"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Buffer Separation & Safety Controls */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Active Chat Turn Buffer</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              These conversation turns are stored in session RAM to allow natural multi-turn context recall.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Active Turns:</span>
                <span className="font-bold font-mono text-slate-900">
                  {conversationTurnsCount} turns
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Separation Status:</span>
                <span className="text-emerald-700 font-semibold">Strictly Isolated</span>
              </div>
            </div>

            <button
              id="btn-safe-clear-chat"
              onClick={onClearChatTurns}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat Buffer Only</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Long-term memory will remain 100% intact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
