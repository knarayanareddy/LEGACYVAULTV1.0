import { Idl } from '@coral-xyz/anchor';

export const IDL: any = {
  "version": "0.1.0",
  "name": "legacyvault",
  "instructions": [
    {
      "name": "createVault",
      "accounts": [
        { "name": "owner", "isMut": true, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false },
        { "name": "vaultAuthority", "isMut": false, "isSigner": false },
        { "name": "subscriptionState", "isMut": true, "isSigner": false },
        { "name": "globalConfig", "isMut": false, "isSigner": false },
        { "name": "feeReceiver", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "CreateVaultArgs"
          }
        }
      ]
    },
    {
      "name": "updateVaultSettings",
      "accounts": [
        { "name": "owner", "isMut": false, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UpdateVaultSettingsArgs"
          }
        }
      ]
    },
    {
      "name": "freezeVault",
      "accounts": [
        { "name": "owner", "isMut": false, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "unfreezeVault",
      "accounts": [
        { "name": "owner", "isMut": false, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false },
        { "name": "unlockSession", "isMut": false, "isSigner": false, "isOptional": true }
      ],
      "args": []
    },
    {
      "name": "addGuardian",
      "accounts": [
        { "name": "owner", "isMut": true, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false },
        { "name": "guardianEntry", "isMut": true, "isSigner": false },
        { "name": "globalConfig", "isMut": false, "isSigner": false },
        { "name": "proGuardianProfile", "isMut": false, "isSigner": false, "isOptional": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "AddGuardianArgs"
          }
        }
      ]
    },
    {
      "name": "acceptGuardianInvitation",
      "accounts": [
        { "name": "guardian", "isMut": false, "isSigner": true },
        { "name": "guardianEntry", "isMut": true, "isSigner": false },
        { "name": "vault", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "removeGuardian",
      "accounts": [
        { "name": "owner", "isMut": false, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false },
        { "name": "guardianEntry", "isMut": true, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "addBeneficiary",
      "accounts": [
        { "name": "owner", "isMut": true, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false },
        { "name": "beneficiaryEntry", "isMut": true, "isSigner": false },
        { "name": "globalConfig", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "AddBeneficiaryArgs"
          }
        }
      ]
    },
    {
      "name": "depositSol",
      "accounts": [
        { "name": "depositor", "isMut": true, "isSigner": true },
        { "name": "vault", "isMut": false, "isSigner": false },
        { "name": "vaultAuthority", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "lamports", "type": "u64" }
      ]
    },
    {
      "name": "withdrawSol",
      "accounts": [
        { "name": "owner", "isMut": false, "isSigner": true },
        { "name": "vault", "isMut": false, "isSigner": false },
        { "name": "vaultAuthority", "isMut": true, "isSigner": false },
        { "name": "ownerWallet", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "lamports", "type": "u64" }
      ]
    },
    {
      "name": "checkIn",
      "accounts": [
        { "name": "signer", "isMut": false, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false },
        { "name": "livenessDelegate", "isMut": false, "isSigner": false, "isOptional": true }
      ],
      "args": []
    },
    {
      "name": "initiateUnlock",
      "accounts": [
        { "name": "guardian", "isMut": true, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false },
        { "name": "guardianEntry", "isMut": false, "isSigner": false },
        { "name": "unlockSession", "isMut": true, "isSigner": false },
        { "name": "globalConfig", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "approveUnlock",
      "accounts": [
        { "name": "guardian", "isMut": true, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false },
        { "name": "guardianEntry", "isMut": false, "isSigner": false },
        { "name": "unlockSession", "isMut": true, "isSigner": false },
        { "name": "guardianApproval", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "initSolDistribution",
      "accounts": [
        { "name": "owner", "isMut": true, "isSigner": true },
        { "name": "vault", "isMut": true, "isSigner": false },
        { "name": "vaultAuthority", "isMut": false, "isSigner": false },
        { "name": "unlockSession", "isMut": true, "isSigner": false },
        { "name": "solDistributionSession", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "executeSolBatch",
      "accounts": [
        { "name": "owner", "isMut": false, "isSigner": true },
        { "name": "vault", "isMut": false, "isSigner": false },
        { "name": "vaultAuthority", "isMut": true, "isSigner": false },
        { "name": "unlockSession", "isMut": false, "isSigner": false },
        { "name": "solDistributionSession", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "args", "type": { "defined": "ExecuteBatchArgs" } }
      ]
    },
    {
      "name": "initializeGlobalConfig",
      "accounts": [
        { "name": "admin", "isMut": true, "isSigner": true },
        { "name": "globalConfig", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "feeReceiver", "type": "publicKey" },
        { "name": "creationFeeLamports", "type": "u64" },
        { "name": "subscriptionFeeProLamports", "type": "u64" },
        { "name": "subscriptionFeeEnterpriseLamports", "type": "u64" }
      ]
    }
  ],
  "accounts": [],
  "errors": [],
  "types": [
    {
      "name": "CreateVaultArgs",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "vaultNonce", "type": "u8" },
          { "name": "inactivityThreshold", "type": "i64" },
          { "name": "timelockDuration", "type": "i64" },
          { "name": "guardianThreshold", "type": "u8" }
        ]
      }
    },
    {
      "name": "UpdateVaultSettingsArgs",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "inactivityThreshold", "type": { "option": "i64" } },
          { "name": "timelockDuration", "type": { "option": "i64" } },
          { "name": "guardianThreshold", "type": { "option": "u8" } },
          { "name": "arbiter", "type": { "option": "publicKey" } }
        ]
      }
    },
    {
      "name": "AddGuardianArgs",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "guardianWallet", "type": "publicKey" },
          { "name": "role", "type": { "defined": "GuardianRole" } }
        ]
      }
    },
    {
      "name": "AddBeneficiaryArgs",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "beneficiaryWallet", "type": "publicKey" },
          { "name": "shareBps", "type": "u16" },
          { "name": "active", "type": "bool" }
        ]
      }
    },
    {
      "name": "ExecuteBatchArgs",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "startIndex", "type": "u8" },
          { "name": "batchSize", "type": "u8" }
        ]
      }
    },
    {
      "name": "GuardianRole",
      "type": {
        "kind": "enum",
        "variants": [
          { "name": "Personal" },
          { "name": "Professional" },
          { "name": "Delegate" }
        ]
      }
    }
  ]
};
