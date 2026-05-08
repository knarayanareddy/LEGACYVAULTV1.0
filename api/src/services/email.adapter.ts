// api/src/services/email.adapter.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'LegacyVault <noreply@legacyvault.io>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  } catch (error: any) {
    throw new Error(`Email send failed: ${error.message}`);
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function checkInReminderEmail(params: {
  vaultAddress: string;
  daysSinceCheckIn: number;
  daysUntilInactive: number;
}): EmailPayload {
  return {
    to: '', // filled by caller
    subject: '⏰ LegacyVault Check-in Reminder',
    html: `
      <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #fff;">
        <h2 style="color: #8b5cf6; margin-top: 0;">Check-in Reminder</h2>
        <p>It's been <strong>${params.daysSinceCheckIn} days</strong> since your last check-in.</p>
        <p>Your vault will become eligible for unlock in <strong>${params.daysUntilInactive} days</strong> if you don't check in.</p>
        <div style="margin-top: 24px;">
          <a href="${process.env.APP_URL}/liveness" 
             style="display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Check In Now
          </a>
        </div>
        <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
          Vault: <code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">${params.vaultAddress.slice(0, 8)}…${params.vaultAddress.slice(-8)}</code>
        </p>
      </div>
    `,
  };
}

export function unlockInitiatedEmail(params: {
  vaultAddress: string;
  initiatorRole: string;
}): EmailPayload {
  return {
    to: '',
    subject: '🚨 Unlock Initiated on Your Vault',
    html: `
      <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; padding: 24px; background: #fff;">
        <h2 style="color: #ef4444; margin-top: 0;">Unlock Initiated</h2>
        <p>A <strong>${params.initiatorRole} guardian</strong> has initiated unlock on your vault.</p>
        <p>If this was not expected, you can <strong>freeze your vault</strong> immediately from your dashboard.</p>
        <div style="margin-top: 24px;">
          <a href="${process.env.APP_URL}/distribution" 
             style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            View Unlock Status
          </a>
        </div>
        <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
          Vault: <code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">${params.vaultAddress.slice(0, 8)}…${params.vaultAddress.slice(-8)}</code>
        </p>
      </div>
    `,
  };
}
