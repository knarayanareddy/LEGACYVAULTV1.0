import { useState, useRef } from 'react';
import {
  FileText, Upload, Search, ExternalLink,
  Lock, Download, Trash2, Eye, FileSpreadsheet, File, X
} from 'lucide-react';
import type { VaultDocument } from '../types';
import { encryptFile, decryptBlob } from '../utils/crypto';

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
  const [documentsList, setDocumentsList] = useState<VaultDocument[]>(documents);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('will');
  const [passphrase, setPassphrase] = useState('');
  const [encrypting, setEncrypting] = useState(false);

  // Decryption download states
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [activeDecryptDoc, setActiveDecryptDoc] = useState<VaultDocument | null>(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [decryptError, setDecryptError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = documentsList.filter(doc => {
    const matchesFilter = filter === 'all' || doc.type === filter;
    const matchesSearch = !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalSize = documentsList.reduce((sum, d) => {
    const num = parseFloat(d.size);
    return sum + num;
  }, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !passphrase) return;

    try {
      setEncrypting(true);
      
      // Perform AES-GCM Client-Side Symmetric Encryption
      const { ciphertextBlob, hash } = await encryptFile(selectedFile, passphrase);
      
      // Create local URL for downloading/viewing mock
      const encryptedBlobUrl = URL.createObjectURL(ciphertextBlob);

      const newDoc: VaultDocument = {
        id: Math.random().toString(36).substring(2, 9),
        type: docType as any,
        name: selectedFile.name,
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        hash: hash.substring(0, 16),
        uri: encryptedBlobUrl, // Anchor with encrypted blob URL
        uploadedAt: Date.now(),
        encrypted: true,
        icon: docType === 'will' ? '📜' : docType === 'letter' ? '✉️' : '📄',
      };

      setDocumentsList(prev => [newDoc, ...prev]);
      setShowUploadModal(false);
      setSelectedFile(null);
      setPassphrase('');
    } catch (err) {
      console.error('Symmetric Encryption Failed:', err);
    } finally {
      setEncrypting(false);
    }
  };

  const triggerDownload = async () => {
    if (!activeDecryptDoc || !decryptPassphrase) return;

    try {
      setDecryptError('');
      
      // Fetch encrypted blob from URI
      const response = await fetch(activeDecryptDoc.uri);
      const encryptedBlob = await response.blob();

      // Decrypt symmetrically using passphrase
      const decryptedBlob = await decryptBlob(encryptedBlob, decryptPassphrase, 'application/octet-stream');
      
      const downloadUrl = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = activeDecryptDoc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setShowDecryptModal(false);
      setDecryptPassphrase('');
      setActiveDecryptDoc(null);
    } catch (err) {
      setDecryptError('Invalid passphrase or corrupted ciphertext.');
    }
  };

  const handleDelete = (id: string) => {
    setDocumentsList(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Documents</h2>
          <p className="text-sm text-slate-400 mt-1">Encrypted document storage with on-chain hash anchoring</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-vault-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
        >
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
          <p className="text-2xl font-bold text-white font-mono">{documentsList.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Encrypted</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{documentsList.filter(d => d.encrypted).length}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Storage Used</p>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{totalSize.toFixed(2)} MB</p>
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
                <span className="text-[10px] text-slate-500">timeAgo: {timeAgo(doc.uploadedAt)}</span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-600 font-mono truncate max-w-[120px]" title={doc.hash}>Hash: {doc.hash}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  setActiveDecryptDoc(doc);
                  setShowDecryptModal(true);
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Decrypt and Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(doc.id)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete"
              >
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border-white/10 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Upload Encrypted Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Select File</label>
                <input
                  type="file"
                  required
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-300 bg-white/5 rounded-xl border border-white/10 p-2.5 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full text-xs text-slate-300 bg-slate-900 rounded-xl border border-white/10 p-2.5 focus:outline-none"
                  >
                    <option value="will">Will</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                    <option value="identity">Identity</option>
                    <option value="financial">Financial</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Passphrase</label>
                  <input
                    type="password"
                    required
                    placeholder="Symmetric Secret"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full text-xs text-slate-300 bg-white/5 rounded-xl border border-white/10 p-2.5 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={encrypting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-vault-500/30 transition-all cursor-pointer active:scale-95"
              >
                {encrypting ? 'Deriving Key & Encrypting...' : 'Encrypt & Upload'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Decrypt & Download Modal */}
      {showDecryptModal && activeDecryptDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border-white/10 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Decrypt Document</h3>
              <button onClick={() => setShowDecryptModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                To decrypt <strong className="text-white">{activeDecryptDoc.name}</strong>, please enter the symmetric passphrase that was used during upload.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Passphrase</label>
                <input
                  type="password"
                  placeholder="Enter Secret"
                  value={decryptPassphrase}
                  onChange={(e) => setDecryptPassphrase(e.target.value)}
                  className="w-full text-xs text-slate-300 bg-white/5 rounded-xl border border-white/10 p-2.5 focus:outline-none"
                />
              </div>
              {decryptError && (
                <p className="text-xs text-rose-400 font-semibold">{decryptError}</p>
              )}
              <button
                onClick={triggerDownload}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-vault-500/30 transition-all cursor-pointer active:scale-95"
              >
                Decrypt & Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
