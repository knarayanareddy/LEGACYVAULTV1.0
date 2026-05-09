import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'node:crypto';

const IDL_PATH = path.join(process.cwd(), 'legacyvault/target/idl/legacyvault.json');

function getDiscriminator(name: string): Buffer {
  const hash = crypto.createHash('sha256').update(`global:${name}`).digest();
  return hash.subarray(0, 8);
}

const ALL_INSTRUCTIONS = [
  // MODULE A
  {
    name: 'initializeGlobalConfig',
    accounts: [
      { name: 'admin', isMut: true, isSigner: true },
      { name: 'globalConfig', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [
      { name: 'feeReceiver', type: 'pubkey' },
      { name: 'creationFeeLamports', type: 'u64' },
      { name: 'subscriptionFeeProLamports', type: 'u64' },
      { name: 'subscriptionFeeEnterpriseLamports', type: 'u64' }
    ]
  },
  {
    name: 'updateGlobalConfig',
    accounts: [
      { name: 'admin', isMut: false, isSigner: true },
      { name: 'globalConfig', isMut: true, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'updateGlobalConfigArgs' } }]
  },
  {
    name: 'pauseProgram',
    accounts: [
      { name: 'admin', isMut: false, isSigner: true },
      { name: 'globalConfig', isMut: true, isSigner: false }
    ],
    args: []
  },
  {
    name: 'unpauseProgram',
    accounts: [
      { name: 'admin', isMut: false, isSigner: true },
      { name: 'globalConfig', isMut: true, isSigner: false }
    ],
    args: []
  },
  // MODULE B
  {
    name: 'createVault',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'globalConfig', isMut: false, isSigner: false },
      { name: 'feeReceiver', isMut: true, isSigner: false },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'vaultAuthority', isMut: false, isSigner: false },
      { name: 'subscriptionState', isMut: true, isSigner: false },
      { name: 'ownerState', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'createVaultArgs' } }]
  },
  {
    name: 'updateVaultSettings',
    accounts: [
      { name: 'owner', isMut: false, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'updateVaultSettingsArgs' } }]
  },
  {
    name: 'freezeVault',
    accounts: [
      { name: 'owner', isMut: false, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false }
    ],
    args: []
  },
  {
    name: 'unfreezeVault',
    accounts: [
      { name: 'owner', isMut: false, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: false, isSigner: false }
    ],
    args: []
  },
  // MODULE C
  {
    name: 'addGuardian',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'guardianEntry', isMut: true, isSigner: false },
      { name: 'globalConfig', isMut: false, isSigner: false },
      { name: 'proGuardianProfile', isMut: false, isSigner: false, isOptional: true },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'addGuardianArgs' } }]
  },
  {
    name: 'acceptGuardianInvitation',
    accounts: [
      { name: 'guardian', isMut: true, isSigner: true },
      { name: 'guardianEntry', isMut: true, isSigner: false },
      { name: 'vault', isMut: false, isSigner: false }
    ],
    args: []
  },
  {
    name: 'removeGuardian',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'guardianEntry', isMut: true, isSigner: false }
    ],
    args: []
  },
  {
    name: 'setGuardianThreshold',
    accounts: [
      { name: 'owner', isMut: false, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false }
    ],
    args: [{ name: 'threshold', type: 'u8' }]
  },
  // MODULE D
  {
    name: 'addBeneficiary',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'beneficiaryEntry', isMut: true, isSigner: false },
      { name: 'globalConfig', isMut: false, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'addBeneficiaryArgs' } }]
  },
  {
    name: 'updateBeneficiary',
    accounts: [
      { name: 'owner', isMut: false, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'beneficiaryEntry', isMut: true, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'updateBeneficiaryArgs' } }]
  },
  {
    name: 'removeBeneficiary',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'beneficiaryEntry', isMut: true, isSigner: false }
    ],
    args: []
  },
  {
    name: 'setAssetRule',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: false, isSigner: false },
      { name: 'beneficiaryEntry', isMut: false, isSigner: false },
      { name: 'assetRule', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'setAssetRuleArgs' } }]
  },
  {
    name: 'clearAssetRule',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: false, isSigner: false },
      { name: 'assetRule', isMut: true, isSigner: false }
    ],
    args: []
  },
  // MODULE E
  {
    name: 'depositSol',
    accounts: [
      { name: 'depositor', isMut: true, isSigner: true },
      { name: 'vault', isMut: false, isSigner: false },
      { name: 'vaultAuthority', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: []
  },
  {
    name: 'depositSpl',
    accounts: [
      { name: 'depositor', isMut: true, isSigner: true },
      { name: 'vault', isMut: false, isSigner: false },
      { name: 'vaultAuthority', isMut: false, isSigner: false },
      { name: 'mint', isMut: false, isSigner: false },
      { name: 'depositorTokenAccount', isMut: true, isSigner: false },
      { name: 'vaultTokenAccount', isMut: true, isSigner: false },
      { name: 'tokenProgram', isMut: false, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: []
  },
  {
    name: 'withdrawSol',
    accounts: [
      { name: 'owner', isMut: false, isSigner: true },
      { name: 'vault', isMut: false, isSigner: false },
      { name: 'vaultAuthority', isMut: true, isSigner: false },
      { name: 'ownerWallet', isMut: true, isSigner: false },
      { name: 'globalConfig', isMut: false, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: []
  },
  {
    name: 'withdrawSpl',
    accounts: [
      { name: 'owner', isMut: false, isSigner: true },
      { name: 'vault', isMut: false, isSigner: false },
      { name: 'vaultAuthority', isMut: false, isSigner: false },
      { name: 'mint', isMut: false, isSigner: false },
      { name: 'vaultTokenAccount', isMut: true, isSigner: false },
      { name: 'ownerTokenAccount', isMut: true, isSigner: false },
      { name: 'tokenProgram', isMut: false, isSigner: false }
    ],
    args: []
  },
  // MODULE F
  {
    name: 'checkIn',
    accounts: [
      { name: 'signer', isMut: false, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'livenessDelegate', isMut: false, isSigner: false, isOptional: true }
    ],
    args: []
  },
  {
    name: 'addLivenessDelegate',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: false, isSigner: false },
      { name: 'livenessDelegate', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'addLivenessDelegateArgs' } }]
  },
  {
    name: 'removeLivenessDelegate',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: false, isSigner: false },
      { name: 'livenessDelegate', isMut: true, isSigner: false }
    ],
    args: []
  },
  // MODULE G
  {
    name: 'setDocumentCommitment',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'setDocumentCommitmentArgs' } }]
  },
  {
    name: 'revokeDocumentCommitment',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false }
    ],
    args: []
  },
  // MODULE H
  {
    name: 'initiateUnlock',
    accounts: [
      { name: 'guardian', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: []
  },
  {
    name: 'approveUnlock',
    accounts: [
      { name: 'guardian', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: true, isSigner: false },
      { name: 'guardianApproval', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: []
  },
  {
    name: 'cancelUnlock',
    accounts: [
      { name: 'owner', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: true, isSigner: false }
    ],
    args: []
  },
  {
    name: 'finalizeUnlock',
    accounts: [
      { name: 'caller', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: true, isSigner: false }
    ],
    args: []
  },
  {
    name: 'openDispute',
    accounts: [
      { name: 'caller', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: true, isSigner: false },
      { name: 'disputeCase', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: []
  },
  {
    name: 'resolveDispute',
    accounts: [
      { name: 'admin', isMut: true, isSigner: true },
      { name: 'globalConfig', isMut: false, isSigner: false },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: true, isSigner: false },
      { name: 'disputeCase', isMut: true, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'resolveDisputeArgs' } }]
  },
  // MODULE I
  {
    name: 'initSolDistribution',
    accounts: [
      { name: 'caller', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: true, isSigner: false },
      { name: 'solDistSession', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: []
  },
  {
    name: 'executeSolBatch',
    accounts: [
      { name: 'caller', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'vaultAuthority', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: false, isSigner: false },
      { name: 'solDistSession', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'executeBatchArgs' } }]
  },
  {
    name: 'initSplDistribution',
    accounts: [
      { name: 'caller', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'unlockSession', isMut: true, isSigner: false },
      { name: 'mint', isMut: false, isSigner: false },
      { name: 'splDistSession', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'initSplDistributionArgs' } }]
  },
  {
    name: 'executeSplBatch',
    accounts: [
      { name: 'caller', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'vaultAuthority', isMut: false, isSigner: false },
      { name: 'unlockSession', isMut: false, isSigner: false },
      { name: 'mint', isMut: false, isSigner: false },
      { name: 'vaultTokenAccount', isMut: true, isSigner: false },
      { name: 'splDistSession', isMut: true, isSigner: false },
      { name: 'tokenProgram', isMut: false, isSigner: false },
      { name: 'associatedTokenProgram', isMut: false, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'executeSplBatchArgs' } }]
  },
  // MODULE J
  {
    name: 'setSubscription',
    accounts: [
      { name: 'caller', isMut: true, isSigner: true },
      { name: 'vault', isMut: true, isSigner: false },
      { name: 'subscriptionState', isMut: true, isSigner: false },
      { name: 'globalConfig', isMut: false, isSigner: false },
      { name: 'feeReceiver', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'setSubscriptionArgs' } }]
  },
  {
    name: 'registerProfessionalGuardian',
    accounts: [
      { name: 'guardian', isMut: true, isSigner: true },
      { name: 'proGuardianProfile', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'registerProGuardianArgs' } }]
  },
  {
    name: 'updateProGuardianProfile',
    accounts: [
      { name: 'guardian', isMut: true, isSigner: true },
      { name: 'proGuardianProfile', isMut: true, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'registerProGuardianArgs' } }]
  },
  {
    name: 'setKycStatus',
    accounts: [
      { name: 'admin', isMut: true, isSigner: true },
      { name: 'globalConfig', isMut: false, isSigner: false },
      { name: 'proGuardianProfile', isMut: true, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'setKycStatusArgs' } }]
  },
  {
    name: 'bondForVault',
    accounts: [
      { name: 'guardian', isMut: true, isSigner: true },
      { name: 'vault', isMut: false, isSigner: false },
      { name: 'proGuardianProfile', isMut: true, isSigner: false },
      { name: 'proGuardianBond', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'bondForVaultArgs' } }]
  },
  {
    name: 'slashBond',
    accounts: [
      { name: 'admin', isMut: true, isSigner: true },
      { name: 'globalConfig', isMut: false, isSigner: false },
      { name: 'proGuardianBond', isMut: true, isSigner: false },
      { name: 'feeReceiver', isMut: true, isSigner: false },
      { name: 'systemProgram', isMut: false, isSigner: false }
    ],
    args: [{ name: 'args', type: { defined: 'slashBondArgs' } }]
  }
];

const TYPES_TO_ENSURE = [
  {
    name: 'updateGlobalConfigArgs',
    type: {
      kind: 'struct',
      fields: [
        { name: 'paused', type: { option: 'bool' } },
        { name: 'feeReceiver', type: { option: 'pubkey' } },
        { name: 'creationFeeLamports', type: { option: 'u64' } },
        { name: 'subscriptionFeeProLamports', type: { option: 'u64' } },
        { name: 'subscriptionFeeEnterpriseLamports', type: { option: 'u64' } },
        { name: 'maxGuardiansFree', type: { option: 'u8' } },
        { name: 'maxGuardiansPro', type: { option: 'u8' } },
        { name: 'maxGuardiansEnterprise', type: { option: 'u8' } },
        { name: 'maxBeneficiariesFree', type: { option: 'u8' } },
        { name: 'maxBeneficiariesPro', type: { option: 'u8' } },
        { name: 'maxBeneficiariesEnterprise', type: { option: 'u8' } }
      ]
    }
  },
  {
    name: 'createVaultArgs',
    type: {
      kind: 'struct',
      fields: [
        { name: 'vaultNonce', type: 'u8' },
        { name: 'inactivityThreshold', type: 'i64' },
        { name: 'timelockDuration', type: 'i64' },
        { name: 'guardianThreshold', type: 'u8' }
      ]
    }
  },
  {
    name: 'updateVaultSettingsArgs',
    type: {
      kind: 'struct',
      fields: [
        { name: 'inactivityThreshold', type: { option: 'i64' } },
        { name: 'timelockDuration', type: { option: 'i64' } },
        { name: 'guardianThreshold', type: { option: 'u8' } },
        { name: 'arbiter', type: { option: 'pubkey' } }
      ]
    }
  },
  {
    name: 'addGuardianArgs',
    type: {
      kind: 'struct',
      fields: [{ name: 'guardianWallet', type: 'pubkey' }, { name: 'role', type: { defined: 'guardianRole' } }]
    }
  },
  {
    name: 'addBeneficiaryArgs',
    type: {
      kind: 'struct',
      fields: [{ name: 'beneficiaryWallet', type: 'pubkey' }, { name: 'shareBps', type: 'u16' }, { name: 'active', type: 'bool' }]
    }
  },
  {
    name: 'updateBeneficiaryArgs',
    type: {
      kind: 'struct',
      fields: [{ name: 'shareBps', type: { option: 'u16' } }, { name: 'active', type: { option: 'bool' } }]
    }
  },
  {
    name: 'setAssetRuleArgs',
    type: {
      kind: 'struct',
      fields: [{ name: 'mint', type: 'pubkey' }, { name: 'mode', type: { defined: 'assetRuleMode' } }, { name: 'fixedBps', type: { option: 'u16' } }]
    }
  },
  {
    name: 'addLivenessDelegateArgs',
    type: { kind: 'struct', fields: [{ name: 'delegateWallet', type: 'pubkey' }] }
  },
  {
    name: 'setDocumentCommitmentArgs',
    type: { kind: 'struct', fields: [{ name: 'docHash', type: { array: ['u8', 64] } }, { name: 'docUri', type: { array: ['u8', 256] } }] }
  },
  {
    name: 'setSubscriptionArgs',
    type: { kind: 'struct', fields: [{ name: 'tier', type: { defined: 'subscriptionTier' } }, { name: 'durationSeconds', type: 'i64' }] }
  },
  {
    name: 'registerProGuardianArgs',
    type: { kind: 'struct', fields: [{ name: 'nameHash', type: { array: ['u8', 64] } }, { name: 'profileUri', type: { array: ['u8', 256] } }] }
  },
  {
    name: 'setKycStatusArgs',
    type: { kind: 'struct', fields: [{ name: 'status', type: { defined: 'kycStatus' } }] }
  },
  {
    name: 'bondForVaultArgs',
    type: { kind: 'struct', fields: [{ name: 'bondLamports', type: 'u64' }] }
  },
  {
    name: 'slashBondArgs',
    type: { kind: 'struct', fields: [{ name: 'slashReasonHash', type: { array: ['u8', 64] } }] }
  },
  {
    name: 'resolveDisputeArgs',
    type: { kind: 'struct', fields: [{ name: 'resolution', type: { defined: 'disputeStatus' } }, { name: 'resolutionNoteHash', type: { option: { array: ['u8', 64] } } }] }
  },
  {
    name: 'executeBatchArgs',
    type: { kind: 'struct', fields: [{ name: 'startIndex', type: 'u8' }, { name: 'batchSize', type: 'u8' }, { name: 'rulesMask', type: 'u16' }] }
  },
  {
    name: 'executeSplBatchArgs',
    type: { kind: 'struct', fields: [{ name: 'startIndex', type: 'u8' }, { name: 'batchSize', type: 'u8' }, { name: 'rulesMask', type: 'u16' }] }
  },
  {
    name: 'initSplDistributionArgs',
    type: { kind: 'struct', fields: [{ name: 'createMissingAtas', type: 'bool' }] }
  },
  {
    name: 'guardianRole',
    type: { kind: 'enum', variants: [{ name: 'personal' }, { name: 'professional' }, { name: 'delegate' }] }
  },
  {
    name: 'assetRuleMode',
    type: { kind: 'enum', variants: [{ name: 'proRata' }, { name: 'fixedBps' }, { name: 'entireToBeneficiary' }] }
  },
  {
    name: 'subscriptionTier',
    type: { kind: 'enum', variants: [{ name: 'free' }, { name: 'pro' }, { name: 'enterprise' }] }
  },
  {
    name: 'disputeStatus',
    type: { kind: 'enum', variants: [{ name: 'open' }, { name: 'resolvedCancel' }, { name: 'resolvedProceed' }] }
  },
  {
    name: 'kycStatus',
    type: { kind: 'enum', variants: [{ name: 'unverified' }, { name: 'pending' }, { name: 'verified' }, { name: 'revoked' }] }
  }
];

function patch() {
  if (!fs.existsSync(IDL_PATH)) {
    console.error(`IDL not found at ${IDL_PATH}`);
    process.exit(1);
  }

  const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf8'));
  
  // We completely replace the instructions with our authoritative list
  // to ensure correct schemas and order.
  idl.instructions = ALL_INSTRUCTIONS.map(inst => ({
    ...inst,
    discriminator: Array.from(getDiscriminator(inst.name))
  }));

  // Update types
  for (const t of TYPES_TO_ENSURE) {
    const existingIdx = idl.types.findIndex((type: any) => type.name === t.name);
    if (existingIdx !== -1) {
      idl.types[existingIdx] = t;
    } else {
      idl.types.push(t);
    }
  }

  fs.writeFileSync(IDL_PATH, JSON.stringify(idl, null, 2));
  console.log('IDL fully restored and schema-aligned successfully.');
}

patch();
