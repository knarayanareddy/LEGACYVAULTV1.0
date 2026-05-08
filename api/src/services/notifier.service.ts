// api/src/services/notifier.service.ts
import { PrismaClient } from '@prisma/client';
import * as emailAdapter from './email.adapter';
import * as smsAdapter from './sms.adapter';
import * as pushAdapter from './push.adapter';

const prisma = new PrismaClient();

type NotificationType =
  | 'check_in_reminder'
  | 'check_in_overdue'
  | 'unlock_eligible'
  | 'unlock_initiated'
  | 'unlock_approved'
  | 'timelock_ending'
  | 'distribution_complete'
  | 'guardian_invite'
  | 'subscription_expiring'
  | 'distribution_failed';

interface NotificationContext {
  vaultAddress: string;
  type: NotificationType;
  data: any;
}

export async function sendNotification(ctx: NotificationContext): Promise<void> {
  const prefs = await prisma.notificationPreference.findUnique({
    where: { vault: ctx.vaultAddress },
  });

  if (!prefs) {
    console.warn(`No notification preferences for vault ${ctx.vaultAddress}`);
    return;
  }

  // Check if this notification type is enabled
  const enabled = getEnabledFlag(prefs, ctx.type);
  if (!enabled) return;

  const results: Array<Promise<void>> = [];

  // Email
  if (prefs.email) {
    results.push(sendEmailNotification(ctx, prefs.email));
  }

  // SMS
  if (prefs.phone) {
    results.push(sendSMSNotification(ctx, prefs.phone));
  }

  // Push
  if (prefs.pushToken) {
    results.push(sendPushNotification(ctx, prefs.pushToken));
  }

  await Promise.allSettled(results);
}

function getEnabledFlag(
  prefs: any,
  type: NotificationType,
): boolean {
  switch (type) {
    case 'check_in_reminder': 
    case 'check_in_overdue':
      return prefs.checkInReminders;
    case 'unlock_eligible':
    case 'unlock_initiated':
    case 'unlock_approved':
    case 'guardian_invite':
      return prefs.unlockAlerts;
    case 'timelock_ending':
      return prefs.timelockAlerts;
    case 'distribution_complete':
    case 'distribution_failed':
      return prefs.distributionAlerts;
    default: return false;
  }
}

async function sendEmailNotification(ctx: NotificationContext, email: string): Promise<void> {
  try {
    let payload: emailAdapter.EmailPayload | null = null;

    switch (ctx.type) {
      case 'check_in_reminder':
        payload = { ...emailAdapter.checkInReminderEmail(ctx.data), to: email };
        break;
      case 'unlock_initiated':
        payload = { ...emailAdapter.unlockInitiatedEmail(ctx.data), to: email };
        break;
      // ... Add more cases as needed ...
    }

    if (payload) {
      await emailAdapter.sendEmail(payload);
      await logNotification(ctx.vaultAddress, ctx.type, 'email', email, 'sent');
    }
  } catch (error: any) {
    await logNotification(ctx.vaultAddress, ctx.type, 'email', email, 'failed', error.message);
    throw error;
  }
}

async function sendSMSNotification(ctx: NotificationContext, phone: string): Promise<void> {
  try {
    let payload: smsAdapter.SMSPayload | null = null;

    switch (ctx.type) {
      case 'check_in_reminder':
        payload = { ...smsAdapter.checkInReminderSMS(ctx.data), to: phone };
        break;
      case 'unlock_initiated':
        payload = { ...smsAdapter.unlockInitiatedSMS(ctx.data), to: phone };
        break;
    }

    if (payload) {
      await smsAdapter.sendSMS(payload);
      await logNotification(ctx.vaultAddress, ctx.type, 'sms', phone, 'sent');
    }
  } catch (error: any) {
    await logNotification(ctx.vaultAddress, ctx.type, 'sms', phone, 'failed', error.message);
    throw error;
  }
}

async function sendPushNotification(ctx: NotificationContext, token: string): Promise<void> {
  try {
    let payload: pushAdapter.PushPayload | null = null;

    switch (ctx.type) {
      case 'check_in_reminder':
        payload = { ...pushAdapter.checkInReminderPush(ctx.data), token };
        break;
      case 'unlock_initiated':
        payload = { ...pushAdapter.unlockInitiatedPush(ctx.data), token };
        break;
    }

    if (payload) {
      await pushAdapter.sendPush(payload);
      await logNotification(ctx.vaultAddress, ctx.type, 'push', token, 'sent');
    }
  } catch (error: any) {
    await logNotification(ctx.vaultAddress, ctx.type, 'push', token, 'failed', error.message);
    throw error;
  }
}

async function logNotification(
  vault: string,
  type: NotificationType,
  channel: string,
  recipient: string,
  status: 'sent' | 'failed',
  error?: string,
): Promise<void> {
  await prisma.notificationLog.create({
    data: {
      vault,
      type,
      channel,
      recipient,
      status,
      error,
      sentAt: status === 'sent' ? new Date() : null,
    },
  });
}
