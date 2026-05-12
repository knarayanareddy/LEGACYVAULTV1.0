import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';

const prisma = new PrismaClient();

async function seedDemo(walletPubkey: string) {
  console.log(`Seeding demo data for wallet: ${walletPubkey}`);
  
  // Use the existing vault or a fixed PDA
  const vaultPubkey = 'CUo8NmdaMpxjhh3eWoX3p5Ns8ek1AMjz6RE41JLrHuoy';
  const now = Math.floor(Date.now() / 1000);
  const oneDay = 86400;

  // 1. Ensure Vault exists
  await prisma.vault.upsert({
    where: { pubkey: vaultPubkey },
    create: {
      pubkey: vaultPubkey,
      ownerPubkey: walletPubkey,
      status: 'active',
      createdAt: BigInt(now - 30 * oneDay),
      lastCheckIn: BigInt(now - 2 * oneDay),
      inactivityThreshold: BigInt(30 * oneDay),
      timelockDuration: BigInt(7 * oneDay),
      guardianThreshold: 2,
      guardianCount: 3,
      beneficiaryCount: 2,
      totalBps: 10000,
      subscriptionTier: 'pro',
    },
    update: {
      subscriptionTier: 'pro',
      guardianCount: 3,
      beneficiaryCount: 2,
    }
  });

  // 2. Add Guardians
  const guardians = [
    { wallet: 'G111111111111111111111111111111111111111111', role: 'personal', name: 'Sarah Connor' },
    { wallet: 'G222222222222222222222222222222222222222222', role: 'personal', name: 'John Doe' },
    { wallet: 'ProGuard11111111111111111111111111111111111', role: 'professional', name: 'LegacyTrust Pro' },
  ];

  for (const g of guardians) {
    await prisma.userProfile.upsert({
      where: { wallet: g.wallet },
      create: { wallet: g.wallet, name: g.name, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.name}` },
      update: { name: g.name }
    });

    await prisma.guardian.upsert({
      where: { vaultPubkey_guardianWallet: { vaultPubkey, guardianWallet: g.wallet } },
      create: {
        vaultPubkey,
        guardianWallet: g.wallet,
        role: g.role,
        status: 'active',
        addedAt: BigInt(now - 25 * oneDay),
      },
      update: { status: 'active' }
    });
  }

  // Add Professional Profile
  await prisma.proGuardianProfile.upsert({
    where: { wallet: 'ProGuard11111111111111111111111111111111111' },
    create: {
      wallet: 'ProGuard11111111111111111111111111111111111',
      name: 'LegacyTrust Pro',
      reputationScore: 9850,
      registeredAt: BigInt(now - 365 * oneDay),
      kycStatus: 'verified',
    },
    update: { reputationScore: 9850 }
  });

  // 3. Add Beneficiaries
  const beneficiaries = [
    { wallet: 'B111111111111111111111111111111111111111111', share: 6000, name: 'Alice Smith' },
    { wallet: 'B222222222222222222222222222222222222222222', share: 4000, name: 'Bob Smith' },
  ];

  for (const b of beneficiaries) {
    await prisma.userProfile.upsert({
      where: { wallet: b.wallet },
      create: { wallet: b.wallet, name: b.name, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.name}` },
      update: { name: b.name }
    });

    await prisma.beneficiary.upsert({
      where: { vaultPubkey_beneficiaryWallet: { vaultPubkey, beneficiaryWallet: b.wallet } },
      create: {
        vaultPubkey,
        beneficiaryWallet: b.wallet,
        shareBps: b.share,
        active: true,
        addedAt: BigInt(now - 20 * oneDay),
        updatedAt: BigInt(now - 20 * oneDay),
      },
      update: { shareBps: b.share }
    });
  }

  // 4. Add Portfolio History
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (30 - i));
    const baseValue = 125000;
    const randomShift = (Math.random() - 0.5) * 5000;
    
    await prisma.portfolioSnapshot.create({
      data: {
        vaultPubkey,
        totalUsdValue: baseValue + (i * 1000) + randomShift,
        breakdown: { sol: 80, spl: 15, nft: 5, position: 0 },
        capturedAt: date,
      }
    });
  }

  // 5. Add Activity Logs
  const activities = [
    { type: 'check_in', desc: 'Routine liveness check-in performed by owner.', actor: walletPubkey, offset: 2 },
    { type: 'vault_update', desc: 'Inactivity threshold updated from 14 to 30 days.', actor: walletPubkey, offset: 5 },
    { type: 'guardian_added', desc: 'New professional guardian LegacyTrust Pro added.', actor: walletPubkey, offset: 10 },
    { type: 'deposit', desc: 'Deposit of 50.00 SOL confirmed.', actor: walletPubkey, offset: 15 },
  ];

  for (const a of activities) {
    await prisma.activityLog.create({
      data: {
        vaultPubkey,
        activityType: a.type,
        description: a.desc,
        actorWallet: a.actor,
        timestamp: BigInt(now - a.offset * oneDay),
      }
    });
  }

  // 6. Add a Document
  await prisma.document.create({
    data: {
      vaultPubkey,
      documentType: 'will',
      name: 'Last Will and Testament.pdf',
      sizeBytes: BigInt(1024 * 450),
      hash: 'sha256:7f83b1657ff1053b8b659c0f9160d7b278912e7536412f87a8f1013a7e9d8f10',
      storageUri: 'https://arweave.net/yR_1234567890abcdef',
      storageBackend: 'arweave',
      encrypted: true,
    }
  });

  console.log('Demo data seeded successfully.');
}

const wallet = 'JB28RdYtQuLaHXK3erytKyw8gV8E3Nuhz96PjS1rFi7j';
seedDemo(wallet).catch(console.error).finally(() => prisma.$disconnect());
