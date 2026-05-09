import * as fs from 'fs';
import * as path from 'path';

const IDL_PATH = path.join(process.cwd(), 'legacyvault/target/idl/legacyvault.json');

const expectedInstructions = [
  // Module A
  'initializeGlobalConfig', 'updateGlobalConfig', 'pauseProgram', 'unpauseProgram',
  // Module B
  'createVault', 'updateVaultSettings', 'freezeVault', 'unfreezeVault',
  // Module C
  'addGuardian', 'acceptGuardianInvitation', 'removeGuardian', 'setGuardianThreshold',
  // Module D
  'addBeneficiary', 'updateBeneficiary', 'removeBeneficiary', 'setAssetRule', 'clearAssetRule',
  // Module E
  'depositSol', 'depositSpl', 'withdrawSol', 'withdrawSpl',
  // Module F
  'checkIn', 'addLivenessDelegate', 'removeLivenessDelegate',
  // Module G
  'setDocumentCommitment', 'revokeDocumentCommitment',
  // Module H
  'initiateUnlock', 'approveUnlock', 'cancelUnlock', 'finalizeUnlock', 'openDispute', 'resolveDispute',
  // Module I
  'initSolDistribution', 'executeSolBatch', 'initSplDistribution', 'executeSplBatch',
  // Module J
  'setSubscription', 'registerProfessionalGuardian', 'updateProGuardianProfile', 'setKycStatus', 'bondForVault', 'slashBond'
];

function check() {
  if (!fs.existsSync(IDL_PATH)) {
    console.error(`IDL not found at ${IDL_PATH}`);
    process.exit(1);
  }

  const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf8'));
  const instructions = idl.instructions;
  const instructionNames = instructions.map((i: any) => i.name);

  console.log(`Checking IDL surface... (${instructionNames.length} instructions found)`);

  const missing = expectedInstructions.filter(name => !instructionNames.includes(name));

  if (missing.length > 0) {
    console.error(`FAILURE: Missing instructions in IDL: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (instructionNames.length !== expectedInstructions.length) {
    console.error(`FAILURE: IDL has ${instructionNames.length} instructions, but expected exactly ${expectedInstructions.length}.`);
    process.exit(1);
  }

  // Schema Validation for critical instructions
  const criticalChecks = [
    { name: 'setDocumentCommitment', expectedArgs: 1 },
    { name: 'addLivenessDelegate', expectedArgs: 1 },
    { name: 'setSubscription', expectedArgs: 1 },
    { name: 'addBeneficiary', expectedArgs: 1 },
    { name: 'initializeGlobalConfig', expectedArgs: 4 },
    { name: 'depositSol', expectedArgs: 1 },
    { name: 'depositSpl', expectedArgs: 1 },
    { name: 'withdrawSol', expectedArgs: 1 },
    { name: 'withdrawSpl', expectedArgs: 1 },
  ];

  for (const check of criticalChecks) {
    const inst = instructions.find((i: any) => i.name === check.name);
    if (!inst) {
       console.error(`FAILURE: Instruction ${check.name} missing`);
       process.exit(1);
    }
    if (inst.args.length !== check.expectedArgs) {
      console.error(`FAILURE: Instruction ${check.name} has wrong arg count. Expected ${check.expectedArgs}, got ${inst.args.length}`);
      process.exit(1);
    }
  }

  console.log('SUCCESS: All 42 instructions present and schema-verified.');
}

check();
