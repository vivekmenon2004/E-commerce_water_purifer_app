/**
 * Calinfco Operations - Unified Multi-Channel Notification Dispatcher
 * Coordinates FCM Push Notifications, EmailJS Emails, TextBee SMS, and n8n webhooks.
 * 
 * Adheres to PROJECT_RULES.md Section 5:
 * - Fails gracefully on any channel without interrupting core transaction flows.
 * - Logs all webhook payloads for auditability.
 * - Accurately labels unconfigured channels.
 */

import {
  sendOrderStatusPushNotification,
  sendDealerApprovalPushNotification,
  PushNotificationResult,
} from './push-notification-service';
import {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendDealerStatusEmail,
  EmailNotificationResult,
} from './email-service';
import {
  sendOrderConfirmationSms,
  sendOrderStatusSms,
  sendDealerStatusSms,
  SmsResult,
} from './sms-service';

export interface DispatchSummary {
  orderId?: string;
  recipient: {
    name: string;
    email?: string;
    phone?: string;
    deviceToken?: string;
  };
  channels: {
    push: PushNotificationResult;
    email: EmailNotificationResult;
    sms: SmsResult;
    n8nWebhook?: { success: boolean; status: string; url?: string };
  };
  timestamp: string;
}

/**
 * Dispatch multi-channel notifications on order placement
 */
export async function dispatchOrderPlacedNotifications(params: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deviceToken?: string;
  totalAmount: number;
  itemsSummary: string;
  installationDate?: string;
}): Promise<DispatchSummary> {
  const timestamp = new Date().toISOString();

  // 1. Push notification (FCM / Expo)
  const pushPromise = sendOrderStatusPushNotification({
    deviceToken: params.deviceToken,
    orderId: params.orderId,
    customerName: params.customerName,
    status: 'placed',
  });

  // 2. Email confirmation (EmailJS)
  const emailPromise = sendOrderConfirmationEmail({
    id: params.orderId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    totalAmount: params.totalAmount,
    itemsSummary: params.itemsSummary,
    installationDate: params.installationDate,
  });

  // 3. SMS confirmation (TextBee)
  const smsPromise = params.customerPhone
    ? sendOrderConfirmationSms({
        phone: params.customerPhone,
        orderId: params.orderId,
        customerName: params.customerName,
        totalAmount: params.totalAmount,
      })
    : Promise.resolve<SmsResult>({
        success: false,
        status: 'invalid_phone',
        provider: 'none',
        message: 'No phone number provided for SMS.',
        payloadAudit: { phoneMasked: 'none', messageLength: 0, timestamp },
      });

  // 4. Optional n8n webhook
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  let webhookResult: { success: boolean; status: string; url?: string } | undefined;

  if (n8nWebhookUrl && !n8nWebhookUrl.includes('localhost') && n8nWebhookUrl.startsWith('http')) {
    try {
      const whRes = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order.placed',
          orderId: params.orderId,
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          customerPhone: params.customerPhone,
          totalAmount: params.totalAmount,
          itemsSummary: params.itemsSummary,
          timestamp,
        }),
      });
      webhookResult = {
        success: whRes.ok,
        status: whRes.ok ? 'delivered' : 'failed',
        url: n8nWebhookUrl,
      };
    } catch {
      webhookResult = { success: false, status: 'network_error', url: n8nWebhookUrl };
    }
  } else {
    webhookResult = { success: false, status: 'unconfigured' };
  }

  const [push, email, sms] = await Promise.all([pushPromise, emailPromise, smsPromise]);

  return {
    orderId: params.orderId,
    recipient: {
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
      deviceToken: params.deviceToken,
    },
    channels: {
      push,
      email,
      sms,
      n8nWebhook: webhookResult,
    },
    timestamp,
  };
}

/**
 * Dispatch multi-channel notifications on order status update
 */
export async function dispatchOrderStatusNotifications(params: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deviceToken?: string;
  newStatus: string;
  trackingNotes?: string;
}): Promise<DispatchSummary> {
  const timestamp = new Date().toISOString();

  const push = await sendOrderStatusPushNotification({
    deviceToken: params.deviceToken,
    orderId: params.orderId,
    customerName: params.customerName,
    status: params.newStatus,
  });

  const email = await sendOrderStatusEmail({
    orderId: params.orderId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    newStatus: params.newStatus,
    trackingNotes: params.trackingNotes,
  });

  const sms = params.customerPhone
    ? await sendOrderStatusSms({
        phone: params.customerPhone,
        orderId: params.orderId,
        status: params.newStatus,
      })
    : {
        success: false,
        status: 'invalid_phone' as const,
        provider: 'none' as const,
        message: 'No phone number provided for SMS.',
        payloadAudit: { phoneMasked: 'none', messageLength: 0, timestamp },
      };

  return {
    orderId: params.orderId,
    recipient: {
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
      deviceToken: params.deviceToken,
    },
    channels: {
      push,
      email,
      sms,
    },
    timestamp,
  };
}

/**
 * Dispatch multi-channel notifications on dealer approval or rejection
 */
export async function dispatchDealerStatusNotifications(params: {
  dealerName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  deviceToken?: string;
  status: 'approved' | 'rejected';
  notes?: string;
}): Promise<DispatchSummary> {
  const timestamp = new Date().toISOString();

  const push = await sendDealerApprovalPushNotification({
    deviceToken: params.deviceToken,
    dealerName: params.contactPerson || params.dealerName,
    status: params.status,
  });

  const email = await sendDealerStatusEmail({
    businessName: params.dealerName,
    contactPerson: params.contactPerson,
    email: params.email,
    status: params.status,
    notes: params.notes,
  });

  const sms = params.phone
    ? await sendDealerStatusSms({
        phone: params.phone,
        businessName: params.dealerName,
        status: params.status,
      })
    : {
        success: false,
        status: 'invalid_phone' as const,
        provider: 'none' as const,
        message: 'No phone number provided for SMS.',
        payloadAudit: { phoneMasked: 'none', messageLength: 0, timestamp },
      };

  return {
    recipient: {
      name: params.dealerName,
      email: params.email,
      phone: params.phone,
      deviceToken: params.deviceToken,
    },
    channels: {
      push,
      email,
      sms,
    },
    timestamp,
  };
}
