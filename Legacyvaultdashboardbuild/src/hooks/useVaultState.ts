import { useState, useCallback } from 'react';
import type { VaultState, Guardian, Beneficiary, VaultDocument, DistributionBatch } from '../types';
import {
  mockVault, mockGuardians, mockBeneficiaries, mockDocuments,
  mockDistributionBatches, mockNotifications, mockActivity
} from '../data/mockData';

export function useVaultState() {
  const [vault, setVault] = useState<VaultState>(mockVault);
  const [guardians, setGuardians] = useState<Guardian[]>(mockGuardians);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(mockBeneficiaries);
  const [documents] = useState<VaultDocument[]>(mockDocuments);
  const [distributionBatches, setDistributionBatches] = useState<DistributionBatch[]>(mockDistributionBatches);
  const [notifications] = useState(mockNotifications);
  const [activity] = useState(mockActivity);
  const [selectedMints, setSelectedMints] = useState<Record<string, boolean>>({});
  const [createMissingAtas, setCreateMissingAtas] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const toggleBeneficiaryActive = useCallback((id: string) => {
    setBeneficiaries(prev => prev.map(b =>
      b.id === id ? { ...b, active: !b.active } : b
    ));
  }, []);

  const updateBeneficiaryShare = useCallback((id: string, shareBps: number) => {
    setBeneficiaries(prev => prev.map(b =>
      b.id === id ? { ...b, shareBps } : b
    ));
  }, []);

  const toggleGuardianApproval = useCallback((id: string) => {
    setGuardians(prev => prev.map(g =>
      g.id === id ? { ...g, approved: !g.approved, approvalTime: !g.approved ? Date.now() : null } : g
    ));
  }, []);

  const initiateUnlock = useCallback(() => {
    setVault(prev => ({
      ...prev,
      state: 'unlocking' as const,
      timelockStart: Date.now(),
    }));
  }, []);

  const cancelUnlock = useCallback(() => {
    setVault(prev => ({
      ...prev,
      state: 'locked' as const,
      timelockStart: null,
    }));
  }, []);

  const freezeVault = useCallback(() => {
    setVault(prev => ({
      ...prev,
      state: prev.state === 'frozen' ? 'locked' : 'frozen' as const,
    }));
  }, []);

  const performCheckIn = useCallback(() => {
    setVault(prev => ({
      ...prev,
      lastCheckIn: Date.now(),
    }));
  }, []);

  const toggleMintSelection = useCallback((mint: string) => {
    setSelectedMints(prev => ({ ...prev, [mint]: !prev[mint] }));
  }, []);

  const processDistribution = useCallback((batchId: string) => {
    setDistributionBatches(prev => prev.map(b =>
      b.id === batchId ? { ...b, status: 'processing' as const } : b
    ));
    setTimeout(() => {
      setDistributionBatches(prev => prev.map(b =>
        b.id === batchId ? {
          ...b,
          status: 'completed' as const,
          txSignature: `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`
        } : b
      ));
    }, 2000);
  }, []);

  const processAllDistributions = useCallback(() => {
    setDistributionBatches(prev => prev.map(b => ({ ...b, status: 'processing' as const })));
    setTimeout(() => {
      setDistributionBatches(prev => prev.map(b => ({
        ...b,
        status: 'completed' as const,
        txSignature: `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`
      })));
    }, 3000);
  }, []);

  const daysSinceCheckIn = Math.floor((Date.now() - vault.lastCheckIn) / 86400000);
  const inactivityDays = Math.floor(vault.inactivityThreshold / 86400);
  const checkInHealth = daysSinceCheckIn < inactivityDays * 0.5 ? 'healthy' : daysSinceCheckIn < inactivityDays * 0.8 ? 'warning' : 'danger';
  const approvedGuardians = guardians.filter(g => g.approved).length;
  const unlockReady = approvedGuardians >= vault.guardianThreshold;
  const totalValue = 103701;

  return {
    vault, guardians, beneficiaries, documents, distributionBatches,
    notifications, activity, selectedMints, createMissingAtas, activeTab,
    setActiveTab, setCreateMissingAtas,
    toggleBeneficiaryActive, updateBeneficiaryShare,
    toggleGuardianApproval, initiateUnlock, cancelUnlock, freezeVault,
    performCheckIn, toggleMintSelection, processDistribution, processAllDistributions,
    daysSinceCheckIn, inactivityDays, checkInHealth, approvedGuardians,
    unlockReady, totalValue, setVault,
  };
}
