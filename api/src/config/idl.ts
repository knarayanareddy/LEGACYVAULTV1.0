import { Idl } from '@coral-xyz/anchor';

export const IDL: any = {
  "address": "7vdXAgisK4CqAo7xgAQ2K5G8Tg6EiVhWrjToJWAWDoyH",
  "metadata": {
    "name": "legacyvault",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "initializeGlobalConfig",
      "discriminator": [
        113,
        216,
        122,
        131,
        225,
        209,
        22,
        55
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalConfig",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "feeReceiver",
          "type": "pubkey"
        },
        {
          "name": "creationFeeLamports",
          "type": "u64"
        },
        {
          "name": "subscriptionFeeProLamports",
          "type": "u64"
        },
        {
          "name": "subscriptionFeeEnterpriseLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateGlobalConfig",
      "discriminator": [
        19,
        131,
        168,
        121,
        252,
        230,
        208,
        149
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "globalConfig",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateGlobalConfigArgs"
            }
          }
        }
      ]
    },
    {
      "name": "pauseProgram",
      "discriminator": [
        91,
        86,
        253,
        175,
        66,
        236,
        172,
        124
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "globalConfig",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "unpauseProgram",
      "discriminator": [
        43,
        162,
        233,
        92,
        254,
        62,
        69,
        58
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "globalConfig",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "createVault",
      "discriminator": [
        29,
        237,
        247,
        208,
        193,
        82,
        54,
        135
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalConfig"
        },
        {
          "name": "feeReceiver",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "vaultAuthority",
          "writable": true
        },
        {
          "name": "subscriptionState",
          "writable": true
        },
        {
          "name": "ownerState",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createVaultArgs"
            }
          }
        }
      ]
    },
    {
      "name": "updateVaultSettings",
      "discriminator": [
        41,
        147,
        187,
        85,
        233,
        240,
        48,
        14
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateVaultSettingsArgs"
            }
          }
        }
      ]
    },
    {
      "name": "freezeVault",
      "discriminator": [
        144,
        211,
        63,
        236,
        97,
        31,
        170,
        175
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "unfreezeVault",
      "discriminator": [
        145,
        244,
        206,
        234,
        251,
        250,
        116,
        183
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "unlockSession",
          "optional": true
        }
      ],
      "args": []
    },
    {
      "name": "addGuardian",
      "discriminator": [
        167,
        189,
        170,
        27,
        74,
        240,
        201,
        241
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "guardianEntry",
          "writable": true
        },
        {
          "name": "globalConfig"
        },
        {
          "name": "proGuardianProfile",
          "optional": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "addGuardianArgs"
            }
          }
        }
      ]
    },
    {
      "name": "acceptGuardianInvitation",
      "discriminator": [
        105,
        104,
        20,
        9,
        215,
        91,
        133,
        25
      ],
      "accounts": [
        {
          "name": "guardian",
          "signer": true
        },
        {
          "name": "guardianEntry",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "addBeneficiary",
      "discriminator": [
        105,
        214,
        106,
        141,
        180,
        166,
        123,
        238
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "beneficiaryEntry",
          "writable": true
        },
        {
          "name": "globalConfig"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "addBeneficiaryArgs"
            }
          }
        }
      ]
    },
    {
      "name": "depositSol",
      "discriminator": [
        108,
        81,
        78,
        117,
        125,
        155,
        56,
        200
      ],
      "accounts": [
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault"
        },
        {
          "name": "vaultAuthority",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawSol",
      "discriminator": [
        145,
        131,
        74,
        136,
        65,
        137,
        42,
        38
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "vault"
        },
        {
          "name": "vaultAuthority",
          "writable": true
        },
        {
          "name": "ownerWallet",
          "writable": true
        },
        {
          "name": "globalConfig"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "checkIn",
      "discriminator": [
        209,
        253,
        4,
        217,
        250,
        241,
        207,
        50
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "livenessDelegate",
          "optional": true
        }
      ],
      "args": []
    },
    {
      "name": "removeGuardian",
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault"
        },
        {
          "name": "guardianEntry",
          "writable": true
        }
      ],
      "args": [],
      "discriminator": [
        165,
        150,
        148,
        237,
        143,
        242,
        211,
        56
      ]
    },
    {
      "name": "acceptGuardian",
      "accounts": [
        {
          "name": "guardian",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault"
        },
        {
          "name": "guardianEntry",
          "writable": true
        },
        {
          "name": "globalConfig"
        },
        {
          "name": "proGuardianProfile",
          "writable": true,
          "optional": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        109,
        71,
        139,
        71,
        94,
        133,
        129,
        19
      ]
    },
    {
      "name": "addLivenessDelegate",
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "delegate",
          "signer": true
        },
        {
          "name": "guardianEntry",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        153,
        29,
        162,
        149,
        26,
        217,
        13,
        207
      ]
    },
    {
      "name": "removeLivenessDelegate",
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "delegate"
        },
        {
          "name": "guardianEntry",
          "writable": true
        }
      ],
      "args": [],
      "discriminator": [
        114,
        201,
        171,
        176,
        148,
        0,
        255,
        73
      ]
    },
    {
      "name": "setDocumentCommitment",
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "docCommitment",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "docHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "docUri",
          "type": "string"
        }
      ],
      "discriminator": [
        222,
        223,
        88,
        2,
        40,
        8,
        44,
        28
      ]
    },
    {
      "name": "revokeDocumentCommitment",
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "docCommitment",
          "writable": true
        }
      ],
      "args": [],
      "discriminator": [
        140,
        245,
        216,
        207,
        59,
        224,
        123,
        5
      ]
    },
    {
      "name": "initiateUnlock",
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "unlockSession",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        86,
        20,
        34,
        163,
        72,
        14,
        200,
        246
      ]
    },
    {
      "name": "approveUnlock",
      "accounts": [
        {
          "name": "guardian",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault"
        },
        {
          "name": "unlockSession",
          "writable": true
        },
        {
          "name": "guardianEntry"
        },
        {
          "name": "guardianApproval",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        238,
        192,
        62,
        179,
        126,
        13,
        200,
        109
      ]
    },
    {
      "name": "cancelUnlock",
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "unlockSession",
          "writable": true
        }
      ],
      "args": [],
      "discriminator": [
        118,
        181,
        106,
        1,
        174,
        55,
        4,
        217
      ]
    },
    {
      "name": "openDispute",
      "accounts": [
        {
          "name": "guardian",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault"
        },
        {
          "name": "unlockSession",
          "writable": true
        },
        {
          "name": "guardianEntry"
        }
      ],
      "args": [],
      "discriminator": [
        251,
        142,
        87,
        222,
        159,
        110,
        126,
        54
      ]
    },
    {
      "name": "resolveDispute",
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "unlockSession",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "resolved",
          "type": "bool"
        }
      ],
      "discriminator": [
        221,
        227,
        222,
        124,
        120,
        39,
        230,
        68
      ]
    },
    {
      "name": "initSolDistribution",
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "unlockSession",
          "writable": true
        },
        {
          "name": "solDistribution",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        20,
        204,
        199,
        15,
        92,
        249,
        195,
        49
      ]
    },
    {
      "name": "executeSolBatch",
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "vaultAuthority",
          "writable": true
        },
        {
          "name": "unlockSession",
          "writable": true
        },
        {
          "name": "solDistribution",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "executeBatchArgs"
            }
          }
        }
      ],
      "discriminator": [
        242,
        201,
        157,
        140,
        84,
        24,
        18,
        217
      ]
    },
    {
      "name": "initSplDistribution",
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "unlockSession",
          "writable": true
        },
        {
          "name": "splDistribution",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "vaultTokenAccount"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        86,
        244,
        42,
        23,
        186,
        106,
        55,
        235
      ]
    },
    {
      "name": "executeSplBatch",
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "vaultAuthority",
          "writable": true
        },
        {
          "name": "unlockSession",
          "writable": true
        },
        {
          "name": "splDistribution",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "executeSplBatchArgs"
            }
          }
        }
      ],
      "discriminator": [
        86,
        89,
        97,
        109,
        216,
        73,
        113,
        11
      ]
    },
    {
      "name": "finalizeUnlock",
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "unlockSession",
          "writable": true
        }
      ],
      "args": [],
      "discriminator": [
        89,
        186,
        94,
        28,
        40,
        235,
        129,
        241
      ]
    },
    {
      "name": "setSubscription",
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "subscriptionState",
          "writable": true
        },
        {
          "name": "globalConfig"
        },
        {
          "name": "feeReceiver",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "tier",
          "type": {
            "defined": {
              "name": "subscriptionTier"
            }
          }
        }
      ],
      "discriminator": [
        95,
        168,
        92,
        169,
        224,
        183,
        135,
        193
      ]
    },
    {
      "name": "updateProGuardianProfile",
      "accounts": [
        {
          "name": "guardian",
          "writable": true,
          "signer": true
        },
        {
          "name": "proGuardianProfile",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ],
      "discriminator": [
        249,
        215,
        114,
        178,
        128,
        185,
        28,
        195
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalConfig",
      "discriminator": [
        149,
        8,
        156,
        202,
        160,
        252,
        176,
        217
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    },
    {
      "name": "guardianEntry",
      "discriminator": [
        36,
        126,
        198,
        172,
        11,
        240,
        104,
        147
      ]
    },
    {
      "name": "beneficiaryEntry",
      "discriminator": [
        199,
        24,
        138,
        161,
        254,
        155,
        222,
        122
      ]
    },
    {
      "name": "ownerState",
      "discriminator": [
        234,
        56,
        107,
        216,
        144,
        52,
        54,
        244
      ]
    },
    {
      "name": "subscriptionState",
      "discriminator": [
        35,
        41,
        45,
        165,
        253,
        34,
        95,
        225
      ]
    }
  ],
  "errors": [
    {
      "code": 6006,
      "name": "VaultNotActive",
      "msg": "This action requires the vault to be in Active status."
    },
    {
      "code": 6009,
      "name": "VaultFrozen",
      "msg": "This action is blocked while the vault is frozen."
    }
  ],
  "types": [
    {
      "name": "globalConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "feeReceiver",
            "type": "pubkey"
          },
          {
            "name": "creationFeeLamports",
            "type": "u64"
          },
          {
            "name": "subscriptionFeeProLamports",
            "type": "u64"
          },
          {
            "name": "subscriptionFeeEnterpriseLamports",
            "type": "u64"
          },
          {
            "name": "maxGuardiansFree",
            "type": "u8"
          },
          {
            "name": "maxGuardiansPro",
            "type": "u8"
          },
          {
            "name": "maxGuardiansEnterprise",
            "type": "u8"
          },
          {
            "name": "maxBeneficiariesFree",
            "type": "u8"
          },
          {
            "name": "maxBeneficiariesPro",
            "type": "u8"
          },
          {
            "name": "maxBeneficiariesEnterprise",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "vaultNonce",
            "type": "u8"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "vaultStatus"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authorityBump",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "lastCheckIn",
            "type": "i64"
          },
          {
            "name": "inactivityThreshold",
            "type": "i64"
          },
          {
            "name": "timelockDuration",
            "type": "i64"
          },
          {
            "name": "guardianThreshold",
            "type": "u8"
          },
          {
            "name": "guardianCount",
            "type": "u8"
          },
          {
            "name": "beneficiaryCount",
            "type": "u8"
          },
          {
            "name": "totalBps",
            "type": "u16"
          },
          {
            "name": "panicFreeze",
            "type": "bool"
          },
          {
            "name": "frozenBy",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "frozenAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "docHash",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "docUri",
            "type": {
              "array": [
                "u8",
                256
              ]
            }
          },
          {
            "name": "docUpdatedAt",
            "type": "i64"
          },
          {
            "name": "arbiter",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "unlockSessionCount",
            "type": "u32"
          },
          {
            "name": "distributionNonce",
            "type": "u32"
          },
          {
            "name": "subscriptionTier",
            "type": {
              "defined": {
                "name": "subscriptionTier"
              }
            }
          },
          {
            "name": "activeBeneficiaryCount",
            "type": "u16"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                62
              ]
            }
          }
        ]
      }
    },
    {
      "name": "guardianEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "guardianWallet",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "guardianRole"
              }
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "guardianStatus"
              }
            }
          },
          {
            "name": "addedAt",
            "type": "i64"
          },
          {
            "name": "acceptedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "removedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "beneficiaryEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "beneficiaryWallet",
            "type": "pubkey"
          },
          {
            "name": "shareBps",
            "type": "u16"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "addedAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "ownerState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "vaultCount",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "subscriptionState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tier",
            "type": {
              "defined": {
                "name": "subscriptionTier"
              }
            }
          },
          {
            "name": "startedAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "autoRenew",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "unlockSession",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "initiatedBy",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "unlockSessionStatus"
              }
            }
          },
          {
            "name": "initiatedAt",
            "type": "i64"
          },
          {
            "name": "approvedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "timelockStartedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "timelockEndsAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "executedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "cancelledAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "approvalCount",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "vaultStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "unlocking"
          },
          {
            "name": "executing"
          },
          {
            "name": "distributed"
          },
          {
            "name": "frozen"
          }
        ]
      }
    },
    {
      "name": "unlockSessionStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "proposed"
          },
          {
            "name": "approved"
          },
          {
            "name": "executing"
          },
          {
            "name": "executed"
          },
          {
            "name": "cancelled"
          },
          {
            "name": "disputed"
          }
        ]
      }
    },
    {
      "name": "subscriptionTier",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "free"
          },
          {
            "name": "pro"
          },
          {
            "name": "enterprise"
          }
        ]
      }
    },
    {
      "name": "guardianRole",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "personal"
          },
          {
            "name": "professional"
          },
          {
            "name": "delegate"
          }
        ]
      }
    },
    {
      "name": "guardianStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "inactive"
          },
          {
            "name": "removed"
          }
        ]
      }
    },
    {
      "name": "createVaultArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultNonce",
            "type": "u8"
          },
          {
            "name": "inactivityThreshold",
            "type": "i64"
          },
          {
            "name": "timelockDuration",
            "type": "i64"
          },
          {
            "name": "guardianThreshold",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "updateGlobalConfigArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "paused",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "feeReceiver",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "creationFeeLamports",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "subscriptionFeeProLamports",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "subscriptionFeeEnterpriseLamports",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxGuardiansFree",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "maxGuardiansPro",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "maxGuardiansEnterprise",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "maxBeneficiariesFree",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "maxBeneficiariesPro",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "maxBeneficiariesEnterprise",
            "type": {
              "option": "u8"
            }
          }
        ]
      }
    },
    {
      "name": "updateVaultSettingsArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "inactivityThreshold",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "timelockDuration",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "guardianThreshold",
            "type": {
              "option": "u8"
            }
          }
        ]
      }
    },
    {
      "name": "addGuardianArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "guardianWallet",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "guardianRole"
              }
            }
          }
        ]
      }
    },
    {
      "name": "addBeneficiaryArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "beneficiaryWallet",
            "type": "pubkey"
          },
          {
            "name": "shareBps",
            "type": "u16"
          },
          {
            "name": "active",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
