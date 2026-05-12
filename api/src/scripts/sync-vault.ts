import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { program } from '../config/anchor';

const prisma = new PrismaClient();

async function syncVault(vaultPubkeyStr: string) {
  const vaultPubkey = new PublicKey(vaultPubkeyStr);
  console.log(`Syncing vault: ${vaultPubkeyStr}`);

  try {
    const vaultAccount = await (program.account.vault as any).fetch(vaultPubkey);
    console.log('Fetched vault account:', vaultAccount);

    const vaultData = {
      pubkey: vaultPubkeyStr,
      ownerPubkey: vaultAccount.owner.toString(),
      status: Object.keys(vaultAccount.status)[0].toLowerCase(),
      createdAt: BigInt(vaultAccount.createdAt.toString()),
      lastCheckIn: BigInt(vaultAccount.lastCheckIn.toString()),
      inactivityThreshold: BigInt(vaultAccount.inactivityThreshold.toString()),
      timelockDuration: BigInt(vaultAccount.timelockDuration.toString()),
      guardianThreshold: vaultAccount.guardianThreshold,
      guardianCount: vaultAccount.guardianCount,
      beneficiaryCount: vaultAccount.beneficiaryCount,
      totalBps: vaultAccount.totalBps,
      subscriptionTier: Object.keys(vaultAccount.subscriptionTier)[0].toLowerCase(),
      activeBeneficiary_count: vaultAccount.activeBeneficiaryCount, // Wait, check prisma schema field name
    };

    // Check prisma schema field names
    // In schema.prisma: beneficiaryCount, activeBeneficiaryCount is NOT there.
    // Wait, let me re-check schema.prisma.
    
    await prisma.vault.upsert({
      where: { pubkey: vaultPubkeyStr },
      create: {
        pubkey: vaultPubkeyStr,
        ownerPubkey: vaultAccount.owner.toString(),
        status: Object.keys(vaultAccount.status)[0].toLowerCase(),
        createdAt: BigInt(vaultAccount.createdAt.toString()),
        lastCheckIn: BigInt(vaultAccount.lastCheckIn.toString()),
        inactivityThreshold: BigInt(vaultAccount.inactivityThreshold.toString()),
        timelockDuration: BigInt(vaultAccount.timelockDuration.toString()),
        guardianThreshold: vaultAccount.guardianThreshold,
        guardianCount: vaultAccount.guardianCount,
        beneficiaryCount: vaultAccount.beneficiaryCount,
        totalBps: vaultAccount.totalBps,
        subscriptionTier: Object.keys(vaultAccount.subscriptionTier)[0].toLowerCase(),
      },
      update: {
        status: Object.keys(vaultAccount.status)[0].toLowerCase(),
        lastCheckIn: BigInt(vaultAccount.lastCheckIn.toString()),
        guardianCount: vaultAccount.guardianCount,
        beneficiaryCount: vaultAccount.beneficiaryCount,
        totalBps: vaultAccount.totalBps,
      }
    });

    console.log(`Vault ${vaultPubkeyStr} synced successfully.`);
  } catch (error) {
    console.error('Error syncing vault:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const vaultAddr = process.argv[2] || 'CUo8NmdaMpxjhh3eWoX3p5Ns8ek1AMjz6RE41JLrHuoy';
syncVault(vaultAddr);
