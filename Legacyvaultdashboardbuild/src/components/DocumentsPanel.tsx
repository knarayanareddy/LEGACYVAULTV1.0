import { useState } from 'react';
import {
  FileText, Upload, Search, ExternalLink,
  Lock, Download, Trash2, Eye, FileSpreadsheet, File
} from 'lucide-react';
import type { VaultDocument } from '../types';

interface DocumentsPanelProps {
  documents: VaultDocument[];
}

const typeColors: Record<string, string> = {
  will: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  letter: 'bg-vault-500/10 text-vault-400 border-vault-500/20',
  legal: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  identity: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  financial: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  other: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  return 'Today';
}

export default function DocumentsPanel({ documents }: DocumentsPanelProps) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.type === filter;
    const matchesSearch = !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalSize = documents.reduce((sum, d) => {
    const num = parseFloat(d.size);
    return sum + num;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Documents</h2>
          <p className="text-sm text-slate-400 mt-1">Encrypted document storage with on-chain hash anchoring</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-vault-500/30 transition-all flex items-center gap-2 active:scale-95">
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-vault-500/10 text-vault-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Total Documents</p>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{documents.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Encrypted</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{documents.filter(d => d.encrypted).length}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Storage Used</p>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{totalSize.toFixed(1)} MB</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {['all', 'will', 'letter', 'legal', 'identity', 'financial', 'other'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === f
                  ? 'bg-vault-600/30 text-vault-300 border border-vault-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-vault-500/50 w-52"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {filteredDocs.map((doc, i) => (
          <div
            key={doc.id}
            className="glass-card rounded-xl p-4 flex items-center gap-4 animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-2xl flex-shrink-0">
              {doc.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white truncate">{doc.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${typeColors[doc.type]}`}>
                  {doc.type}
                </span>
                {doc.encrypted && (
                  <Lock className="w-3 h-3 text-emerald-400" />
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-slate-500">{doc.size}</span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-500">{timeAgo(doc.uploadedAt)}</span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-600 font-mono truncate max-w-[120px]">{doc.hash}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-vault-400 transition-colors" title="View">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-emerald-400 transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-rose-400 transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
              <ExternalLink className="w-4 h-4 text-slate-600 ml-1 cursor-pointer hover:text-vault-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <File className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No documents found</p>
          <p className="text-xs text-slate-600 mt-1">Try adjusting your filters or upload a new document</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="glass-card rounded-2xl p-5 border-vault-500/10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-vault-500/10 text-vault-400 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">End-to-End Encrypted</p>
            <p className="text-xs text-slate-400 mt-1">
              All documents are client-side encrypted before storage. Hashes are anchored on-chain for integrity verification.
              Stored off-chain via Arweave/Shadow Drive/S3 with on-chain hash commitment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
