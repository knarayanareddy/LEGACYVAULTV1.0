// api/src/services/push.adapter.ts
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPush(payload: PushPayload): Promise<void> {
  try {
    if (!admin.apps.length) {
      console.warn('Firebase Admin not initialized, skipping push notification');
      return;
    }
    await admin.messaging().send({
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
    });
  } catch (error: any) {
    throw new Error(`Push notification failed: ${error.message}`);
  }
}

// ─── Push templates ───────────────────────────────────────────────────────────

export function checkInReminderPush(params: {
  vaultAddress: string;
  daysUntilInactive: number;
}): Omit<PushPayload, 'token'> {
  return {
    title: '⏰ Check-in Reminder',
    body: `Your vault will be eligible for unlock in ${params.daysUntilInactive} days`,
    data: { screen: 'liveness', vaultAddress: params.vaultAddress },
  };
}

export function unlockInitiatedPush(params: { vaultAddress: string }): Omit<PushPayload, 'token'> {
  return {
    title: '🚨 Unlock Initiated',
    body: 'A guardian has initiated unlock on your vault',
    data: { screen: 'distribution', vaultAddress: params.vaultAddress },
  };
}
