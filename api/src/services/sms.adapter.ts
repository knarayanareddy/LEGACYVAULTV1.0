// api/src/services/sms.adapter.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export interface SMSPayload {
  to: string;
  body: string;
}

export async function sendSMS(payload: SMSPayload): Promise<void> {
  try {
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: payload.to,
      body: payload.body,
    });
  } catch (error: any) {
    throw new Error(`SMS send failed: ${error.message}`);
  }
}

// ─── SMS templates ────────────────────────────────────────────────────────────

export function checkInReminderSMS(params: {
  vaultAddress: string;
  daysUntilInactive: number;
}): SMSPayload {
  return {
    to: '',
    body: `LegacyVault: Check-in needed. Your vault will be eligible for unlock in ${params.daysUntilInactive} days. ${process.env.APP_URL}/liveness`,
  };
}

export function unlockInitiatedSMS(params: { vaultAddress: string }): SMSPayload {
  return {
    to: '',
    body: `LegacyVault ALERT: Unlock initiated on vault ${params.vaultAddress.slice(0, 8)}. Review immediately: ${process.env.APP_URL}/distribution`,
  };
}
