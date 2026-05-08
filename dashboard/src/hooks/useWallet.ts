import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export function useWallet() {
  const {
    publicKey,
    connected,
    connecting,
    disconnecting,
    wallet,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    signMessage,
  } = useSolanaWallet();

  const { setVisible: setModalVisible } = useWalletModal();

  const walletAddress = publicKey?.toBase58() ?? null;

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
    : null;

  const handleConnect = () => {
    if (!connected && !connecting) {
      setModalVisible(true);
    }
  };

  const handleDisconnect = async () => {
    if (connected) await disconnect();
  };

  return {
    publicKey,
    walletAddress,
    truncatedAddress,
    connected,
    connecting,
    disconnecting,
    wallet,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signTransaction,
    signAllTransactions,
    signMessage,
    openWalletModal: () => setModalVisible(true),
  };
}
