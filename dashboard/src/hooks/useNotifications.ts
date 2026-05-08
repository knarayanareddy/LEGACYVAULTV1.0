import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { NotificationView } from '../types/api';

const NOTIF_QUERY_KEY = (vault: string, unread: boolean) =>
  ['vault', 'notifications', vault, unread] as const;

export function useNotifications(options: { unreadOnly?: boolean; enabled?: boolean } = {}) {
  const { unreadOnly = false, enabled = true } = options;
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();

  const query = useQuery<NotificationView[], Error>({
    queryKey: NOTIF_QUERY_KEY(vaultPubkey ?? '', unreadOnly),
    queryFn: () =>
      api.get<NotificationView[]>(
        `/vaults/${vaultPubkey}/notifications?limit=50${
          unreadOnly ? '&unread=true' : ''
        }`
      ),
    enabled: enabled && !!vaultPubkey,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: (notifId: string) =>
      api.patch(`/vaults/${vaultPubkey}/notifications/${notifId}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault', 'notifications', vaultPubkey ?? ''] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      api.patch(`/vaults/${vaultPubkey}/notifications/read-all`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault', 'notifications', vaultPubkey ?? ''] });
    },
  });

  const markRead = useCallback(
    (notifId: string) => markReadMutation.mutateAsync(notifId),
    [markReadMutation]
  );

  const markAllRead = useCallback(
    () => markAllReadMutation.mutateAsync(),
    [markAllReadMutation]
  );

  return {
    notifications,
    data: notifications, // For PanelRenderer
    unreadCount,
    markRead,
    markAllRead,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isMarkingRead:
      markReadMutation.isPending || markAllReadMutation.isPending,
    refetch: query.refetch,
  };
}
