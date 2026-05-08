import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const nowSec = BigInt(Math.floor(Date.now() / 1000));
async function main() {
  await prisma.vault.upsert({
    where: { pubkey: "EX4uQT1coWmmEvJavuf6LmsWED86Jn5yiZM1YC1b9dFN" },
    update: {},
    create: {
      pubkey: "EX4uQT1coWmmEvJavuf6LmsWED86Jn5yiZM1YC1b9dFN",
      ownerPubkey: "JB28RdYtQuLaHXK3erytKyw8gV8E3Nuhz96PjS1rFi7j",
      status: "active",
      createdAt: nowSec,
      lastCheckIn: nowSec,
      inactivityThreshold: BigInt(2592000),
      timelockDuration: BigInt(604800),
      guardianThreshold: 1,
    },
  });
  console.log("Mock vault inserted!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
