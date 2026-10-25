/**
 * Calinfco Operations - SMS Notification Service (TextBee Integration)
 * Secure Server-Side SMS Gateway.
 * 
 * Strict Zero Leaks & Security Policy:
 * - Private TextBee API credentials (TEXTBEE_API_KEY & TEXTBEE_DEVICE_ID) exist exclusively on the server.
 * - Mobile client NEVER receives or stores SMS credentials.
 * - If credentials are missing, clearly reports { status: 'unconfigured' }.
 */

export interface SmsPayload {
  recipientPhone: string;
  messageText: string;
}

export interface SmsResult {
  success: boolean;
  status: 'sent' | 'unconfigured' | 'failed' | 'invalid_phone';
  provider: 'textbee' | 'none';
  messageId?: string;
  message: string;
  payloadAudit: {
    phoneMasked: string;
    messageLength: number;
    timestamp: string;
  };
}

/**
 * Check if TextBee SMS gateway is configured in environment
 */
export function isSmsConfigured(): boolean {
  const apiKey = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;

  return Boolean(
    apiKey &&
    deviceId &&
    !apiKey.includes('sample') &&
    !apiKey.includes('your-') &&
    !deviceId.includes('sample')
  );
}

/**
 * Send SMS notification via TextBee Gateway REST API
 */
export async function sendSmsNotification(payload: SmsPayload): Promise<SmsResult> {
  const cleanPhone = (payload.recipientPhone || '').replace(/[\s-]/g, '');

  const audit = {
    phoneMasked: cleanPhone ? `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-3)}` : 'missing',
    messageLength: (payload.messageText || '').length,
    timestamp: new Date().toISOString(),
  };

  if (!cleanPhone || cleanPhone.length < 10) {
    return {
      success: false,
      status: 'invalid_phone',
      provider: 'none',
      message: 'Invalid recipient phone number. Expected valid 10-digit or E.164 phone number.',
      payloadAudit: audit,
    };
  }

  // Ensure Indian mobile numbers have +91 prefix if not present
  const formattedPhone = cleanPhone.startsWith('+')
    ? cleanPhone
    : cleanPhone.length === 10
    ? `+91${cleanPhone}`
    : cleanPhone;

  if (!isSmsConfigured()) {
    console.log('[SmsService] TextBee SMS gateway not configured. Skipping live SMS dispatch.');
    return {
      success: false,
      status: 'unconfigured',
      provider: 'none',
      message:
        'TextBee SMS gateway unconfigured. To enable live SMS delivery, set TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID in server environment variables.',
      payloadAudit: audit,
    };
  }

  const apiKey = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;

  try {
    const url = `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [formattedPhone],
        message: payload.messageText,
      }),
    });

    const resJson = await response.json();

    if (response.ok && resJson.success !== false) {
      console.log(`[SmsService] SMS dispatched successfully to ${audit.phoneMasked}`);
      return {
        success: true,
        status: 'sent',
        provider: 'textbee',
        messageId: resJson.data?.id || `tb-${Date.now()}`,
        message: `SMS dispatched successfully to ${audit.phoneMasked}`,
        payloadAudit: audit,
      };
    } else {
      console.warn('[SmsService] TextBee gateway returned error:', resJson);
      return {
        success: false,
        status: 'failed',
        provider: 'textbee',
        message: `TextBee error: ${resJson.message || 'SMS delivery rejected by gateway'}`,
        payloadAudit: audit,
      };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[SmsService] Network exception calling TextBee gateway:', err.message);
    return {
      success: false,
      status: 'failed',
      provider: 'textbee',
      message: `Network failure connecting to TextBee: ${err.message}`,
      payloadAudit: audit,
    };
  }
}

/**
 * Send order confirmation SMS
 */
export async function sendOrderConfirmationSms(params: {
  phone: string;
  orderId: string;
  customerName: string;
  totalAmount: number;
}): Promise<SmsResult> {
  const msg = `Calinfco: Order #${params.orderId} of Rs.${params.totalAmount.toLocaleString('en-IN')} confirmed! Our certified technician will contact you for free installation. Help: 1800-PURE-WATER`;
  return sendSmsNotification({
    recipientPhone: params.phone,
    messageText: msg,
  });
}

/**
 * Send order status update SMS
 */
export async function sendOrderStatusSms(params: {
  phone: string;
  orderId: string;
  status: string;
}): Promise<SmsResult> {
  const msg = `Calinfco: Your water purifier order #${params.orderId} status is now ${params.status.toUpperCase()}. Track live in your Calinfco app.`;
  return sendSmsNotification({
    recipientPhone: params.phone,
    messageText: msg,
  });
}

/**
 * Send dealer approval SMS
 */
export async function sendDealerStatusSms(params: {
  phone: string;
  businessName: string;
  status: 'approved' | 'rejected';
}): Promise<SmsResult> {
  const msg =
    params.status === 'approved'
      ? `Calinfco: Congratulations! Your dealership for ${params.businessName} has been APPROVED. Wholesale pricing is now active in your account.`
      : `Calinfco: Update regarding your dealership application for ${params.businessName}. Please review notes in your account or contact care@calinfco.com.`;

  return sendSmsNotification({
    recipientPhone: params.phone,
    messageText: msg,
  });
}
