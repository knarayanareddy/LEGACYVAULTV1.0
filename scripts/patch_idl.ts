import * as fs from 'fs';
import * as path from 'path';
import { sha256 } from 'js-sha256';

const idlPath = path.join(process.cwd(), 'legacyvault/target/idl/legacyvault.json');

function getDiscriminator(name: string): number[] {
  const hash = sha256.create();
  hash.update(`global:${name}`);
  const result = hash.digest().slice(0, 8);
  return Array.from(result);
}

const missingInstructions = [
  {
    name: "removeGuardian",
    accounts: [
      { name: "owner", writable: true, signer: true },
      { name: "vault" },
      { name: "guardianEntry", writable: true }
    ],
    args: []
  },
  {
    name: "acceptGuardian",
    accounts: [
      { name: "guardian", writable: true, signer: true },
      { name: "vault" },
      { name: "guardianEntry", writable: true },
      { name: "globalConfig" },
      { name: "proGuardianProfile", writable: true, optional: true },
      { name: "systemProgram" }
    ],
    args: []
  },
  {
    name: "checkIn",
    accounts: [
      { name: "signer", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "livenessDelegate", optional: true }
    ],
    args: []
  },
  {
    name: "addLivenessDelegate",
    accounts: [
      { name: "owner", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "delegate", signer: true },
      { name: "guardianEntry", writable: true },
      { name: "systemProgram" }
    ],
    args: []
  },
  {
    name: "removeLivenessDelegate",
    accounts: [
      { name: "owner", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "delegate" },
      { name: "guardianEntry", writable: true }
    ],
    args: []
  },
  {
    name: "setDocumentCommitment",
    accounts: [
      { name: "owner", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "docCommitment", writable: true },
      { name: "systemProgram" }
    ],
    args: [
      { name: "docHash", type: { array: ["u8", 32] } },
      { name: "docUri", type: "string" }
    ]
  },
  {
    name: "revokeDocumentCommitment",
    accounts: [
      { name: "owner", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "docCommitment", writable: true }
    ],
    args: []
  },
  {
    name: "initiateUnlock",
    accounts: [
      { name: "signer", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "unlockSession", writable: true },
      { name: "systemProgram" }
    ],
    args: []
  },
  {
    name: "approveUnlock",
    accounts: [
      { name: "guardian", writable: true, signer: true },
      { name: "vault" },
      { name: "unlockSession", writable: true },
      { name: "guardianEntry" },
      { name: "guardianApproval", writable: true },
      { name: "systemProgram" }
    ],
    args: []
  },
  {
    name: "cancelUnlock",
    accounts: [
      { name: "owner", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "unlockSession", writable: true }
    ],
    args: []
  },
  {
    name: "openDispute",
    accounts: [
      { name: "guardian", writable: true, signer: true },
      { name: "vault" },
      { name: "unlockSession", writable: true },
      { name: "guardianEntry" }
    ],
    args: []
  },
  {
    name: "resolveDispute",
    accounts: [
      { name: "owner", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "unlockSession", writable: true }
    ],
    args: [
      { name: "resolved", type: "bool" }
    ]
  },
  {
    name: "initSolDistribution",
    accounts: [
      { name: "signer", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "unlockSession", writable: true },
      { name: "solDistribution", writable: true },
      { name: "systemProgram" }
    ],
    args: []
  },
  {
    name: "executeSolBatch",
    accounts: [
      { name: "signer", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "vaultAuthority", writable: true },
      { name: "unlockSession", writable: true },
      { name: "solDistribution", writable: true },
      { name: "systemProgram" }
    ],
    args: [
      { name: "args", type: { defined: { name: "executeBatchArgs" } } }
    ]
  },
  {
    name: "initSplDistribution",
    accounts: [
      { name: "signer", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "unlockSession", writable: true },
      { name: "splDistribution", writable: true },
      { name: "mint" },
      { name: "vaultTokenAccount" },
      { name: "systemProgram" }
    ],
    args: []
  },
  {
    name: "executeSplBatch",
    accounts: [
      { name: "signer", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "vaultAuthority", writable: true },
      { name: "unlockSession", writable: true },
      { name: "splDistribution", writable: true },
      { name: "vaultTokenAccount", writable: true },
      { name: "tokenProgram" }
    ],
    args: [
      { name: "args", type: { defined: { name: "executeSplBatchArgs" } } }
    ]
  },
  {
    name: "finalizeUnlock",
    accounts: [
      { name: "signer", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "unlockSession", writable: true }
    ],
    args: []
  },
  {
    name: "setSubscription",
    accounts: [
      { name: "owner", writable: true, signer: true },
      { name: "vault", writable: true },
      { name: "subscriptionState", writable: true },
      { name: "globalConfig" },
      { name: "feeReceiver", writable: true },
      { name: "systemProgram" }
    ],
    args: [
      { name: "tier", type: { defined: { name: "subscriptionTier" } } }
    ]
  },
  {
    name: "updateProGuardianProfile",
    accounts: [
      { name: "guardian", writable: true, signer: true },
      { name: "proGuardianProfile", writable: true },
      { name: "systemProgram" }
    ],
    args: [
      { name: "name", type: "string" },
      { name: "uri", type: "string" }
    ]
  }
];

async function main() {
  if (!fs.existsSync(idlPath)) {
    console.error(`IDL not found at ${idlPath}`);
    process.exit(1);
  }

  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
  const currentInstructions = idl.instructions.map((ix: any) => ix.name);

  console.log(`Patching IDL... (currently has ${currentInstructions.length} instructions)`);

  for (const ix of missingInstructions) {
    if (!currentInstructions.includes(ix.name)) {
      console.log(` - Adding ${ix.name}`);
      idl.instructions.push({
        ...ix,
        discriminator: getDiscriminator(ix.name)
      });
    }
  }

  fs.writeFileSync(idlPath, JSON.stringify(idl, null, 2));
  console.log('SUCCESS: IDL patched and complete.');
}

main();
