import * as fs from 'fs';
import * as path from 'path';

const idlPath = path.join(process.cwd(), 'legacyvault/target/idl/legacyvault.json');

const expectedInstructions = [
  'initializeGlobalConfig',
  'updateGlobalConfig',
  'pauseProgram',
  'unpauseProgram',
  'createVault',
  'updateVaultSettings',
  'freezeVault',
  'unfreezeVault',
  'addGuardian',
  'removeGuardian',
  'acceptGuardian',
  'checkIn',
  'addLivenessDelegate',
  'removeLivenessDelegate',
  'setDocumentCommitment',
  'revokeDocumentCommitment',
  'initiateUnlock',
  'approveUnlock',
  'cancelUnlock',
  'openDispute',
  'resolveDispute',
  'initSolDistribution',
  'executeSolBatch',
  'initSplDistribution',
  'executeSplBatch',
  'finalizeUnlock',
  'setSubscription',
  'updateProGuardianProfile'
];

async function main() {
  if (!fs.existsSync(idlPath)) {
    console.error(`IDL not found at ${idlPath}`);
    process.exit(1);
  }

  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
  const instructions = idl.instructions.map((ix: any) => ix.name);

  console.log(`Checking IDL surface... (${instructions.length} instructions found)`);

  const missing = expectedInstructions.filter(name => !instructions.includes(name));

  if (missing.length > 0) {
    console.error('CRITICAL: Missing instructions in IDL:');
    missing.forEach(m => console.error(` - ${m}`));
    process.exit(1);
  }

  console.log('SUCCESS: All instructions present in IDL.');
}

main();
