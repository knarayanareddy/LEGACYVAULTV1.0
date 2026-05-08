import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import {
  encryptFile,
  sha256Hex,
  generateDocumentKey,
  exportKey,
} from '../lib/crypto';
import { DocumentView, DocumentType } from '../types/api';

export function useDocuments() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [exportedDocKey, setExportedDocKey] = useState<string | null>(null);

  const query = useQuery<DocumentView[], Error>({
    queryKey: ['vault', 'documents', vaultPubkey],
    queryFn: () =>
      api.get<DocumentView[]>(`/vaults/${vaultPubkey}/documents`),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  const documents = query.data ?? [];

  const upload = useCallback(
    async (
      file: File,
      documentType: DocumentType,
      providedKey?: CryptoKey
    ) => {
      if (!vaultPubkey) throw new Error('No vault selected');

      setIsUploading(true);
      setUploadProgress(0);
      setExportedDocKey(null);

      try {
        const buffer = await file.arrayBuffer();
        const key = providedKey ?? (await generateDocumentKey());
        const { ciphertext } = await encryptFile(buffer, key);
        const hash = await sha256Hex(ciphertext);

        const { uploadUrl, docId } = await api.post<{
          uploadUrl: string;
          docId: string;
          expiresAt: number;
        }>(`/vaults/${vaultPubkey}/documents/upload-url`, {
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          documentType,
          hash,
        });

        setUploadProgress(20);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', 'application/octet-stream');

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 60) + 20;
              setUploadProgress(pct);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed: HTTP ${xhr.status}`));
          };

          xhr.onerror = () => reject(new Error('Upload network error'));
          xhr.send(ciphertext);
        });

        setUploadProgress(80);

        const sig = await tx.execute('set-document-commitment', {
          vault: vaultPubkey,
          docHash: hash,
          docUri: uploadUrl.split('?')[0],
        });

        await api.post(`/vaults/${vaultPubkey}/documents/${docId}/confirm`, {
          onChainTxSignature: sig,
        });

        setUploadProgress(100);
        const b64Key = await exportKey(key);
        setExportedDocKey(b64Key);

        qc.invalidateQueries({
          queryKey: ['vault', 'documents', vaultPubkey],
        });
      } finally {
        setIsUploading(false);
      }
    },
    [vaultPubkey, tx, qc]
  );

  const revoke = useCallback(
    async (docId: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('revoke-document-commitment', { vault: vaultPubkey });
      await api.delete(`/vaults/${vaultPubkey}/documents/${docId}`);
      qc.invalidateQueries({
        queryKey: ['vault', 'documents', vaultPubkey],
      });
    },
    [vaultPubkey, tx, qc]
  );

  return {
    documents,
    data: documents, // For PanelRenderer
    upload,
    revoke,
    isUploading,
    uploadProgress,
    exportedDocKey,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
