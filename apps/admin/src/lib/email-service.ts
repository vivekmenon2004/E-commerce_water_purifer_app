/**
 * Calinfco Operations - Email Notification Service (EmailJS Integration)
 * Sends transactional email notifications for orders, status updates, and dealer approvals.
 * 
 * Strict Zero-Deception Policy:
 * - If EMAILJS_SERVICE_ID or EMAILJS_TEMPLATE_ID is missing, clearly returns { status: 'unconfigured' }.
 * - Does not claim email was sent if credentials are not configured.
 */

export interface EmailNotificationPayload {
  toEmail: string;
  toName: string;
  subject: string;
  templateParams: Record<string, string | number>;
  templateId?: string;
}

export interface EmailNotificationResult {
  success: boolean;
  status: 'sent' | 'unconfigured' | 'failed' | 'invalid_recipient';
  provider: 'emailjs' | 'none';
  message: string;
  payloadAudit: {
    toEmail: string;
    subject: string;
    timestamp: string;
  };
}

/**
 * Check if EmailJS is configured in environment
 */
export function isEmailConfigured(): boolean {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  return Boolean(
    serviceId &&
    templateId &&
    publicKey &&
    !serviceId.includes('sample') &&
    !serviceId.includes('your-') &&
    !templateId.includes('your-')
  );
}

/**
 * Dispatch transactional email via EmailJS REST API
 */
export async function sendEmailNotification(
  payload: EmailNotificationPayload
): Promise<EmailNotificationResult> {
  const audit = {
    toEmail: payload.toEmail ? `${payload.toEmail.slice(0, 3)}***@${payload.toEmail.split('@')[1] || ''}` : 'missing',
    subject: payload.subject,
    timestamp: new Date().toISOString(),
  };

  if (!payload.toEmail || !payload.toEmail.includes('@')) {
    return {
      success: false,
      status: 'invalid_recipient',
      provider: 'none',
      message: 'Invalid or missing recipient email address.',
      payloadAudit: audit,
    };
  }

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = payload.templateId || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY; // Optional EmailJS AccessToken

  if (!isEmailConfigured()) {
    console.log('[EmailService] EmailJS not configured in env. Skipping live email dispatch.');
    return {
      success: false,
      status: 'unconfigured',
      provider: 'none',
      message:
        'EmailJS service unconfigured. To enable live delivery, set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY in environment variables.',
      payloadAudit: audit,
    };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey || undefined,
        template_params: {
          to_email: payload.toEmail,
          to_name: payload.toName,
          subject: payload.subject,
          ...payload.templateParams,
        },
      }),
    });

    if (response.ok) {
      console.log(`[EmailService] Email dispatched successfully to ${payload.toEmail} (${payload.subject})`);
      return {
        success: true,
        status: 'sent',
        provider: 'emailjs',
        message: `Email notification sent successfully to ${payload.toEmail}`,
        payloadAudit: audit,
      };
    } else {
      const errText = await response.text();
      console.warn('[EmailService] EmailJS returned error response:', errText);
      return {
        success: false,
        status: 'failed',
        provider: 'emailjs',
        message: `EmailJS API error: ${errText || response.statusText}`,
        payloadAudit: audit,
      };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[EmailService] Network exception during email dispatch:', err.message);
    return {
      success: false,
      status: 'failed',
      provider: 'emailjs',
      message: `Network failure connecting to EmailJS: ${err.message}`,
      payloadAudit: audit,
    };
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order: {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  itemsSummary: string;
  installationDate?: string;
}): Promise<EmailNotificationResult> {
  return sendEmailNotification({
    toEmail: order.customerEmail,
    toName: order.customerName,
    subject: `💧 Calinfco Order Confirmation: #${order.id}`,
    templateParams: {
      order_id: order.id,
      customer_name: order.customerName,
      items_summary: order.itemsSummary,
      total_amount: `₹${order.totalAmount.toLocaleString('en-IN')}`,
      installation_date: order.installationDate || 'Within 48 hours',
      support_contact: 'care@calinfco.com / 1800-PURE-WATER',
    },
  });
}

/**
 * Send order status update email
 */
export async function sendOrderStatusEmail(params: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  newStatus: string;
  trackingNotes?: string;
}): Promise<EmailNotificationResult> {
  return sendEmailNotification({
    toEmail: params.customerEmail,
    toName: params.customerName,
    subject: `📦 Calinfco Order Update: #${params.orderId} is now ${params.newStatus.toUpperCase()}`,
    templateParams: {
      order_id: params.orderId,
      customer_name: params.customerName,
      order_status: params.newStatus.toUpperCase(),
      status_message: `Your order #${params.orderId} has been updated to "${params.newStatus.toUpperCase()}".`,
      tracking_notes: params.trackingNotes || 'Our technician will arrive at the scheduled installation window.',
    },
  });
}

/**
 * Send dealer application status email
 */
export async function sendDealerStatusEmail(dealer: {
  businessName: string;
  contactPerson: string;
  email: string;
  status: 'approved' | 'rejected';
  notes?: string;
}): Promise<EmailNotificationResult> {
  const isApproved = dealer.status === 'approved';
  return sendEmailNotification({
    toEmail: dealer.email,
    toName: dealer.contactPerson,
    subject: isApproved
      ? `🌟 Dealership Approved — Welcome to Calinfco Wholesale Network`
      : `📋 Update Regarding Your Calinfco Dealership Application`,
    templateParams: {
      business_name: dealer.businessName,
      contact_person: dealer.contactPerson,
      dealer_status: dealer.status.toUpperCase(),
      message: isApproved
        ? `Congratulations! Your dealership for ${dealer.businessName} has been approved. You can now access wholesale tier pricing on all water purifiers, spares, and pumps directly in your account.`
        : `Thank you for your interest in partnering with Calinfco. Your application is currently under review or requires additional documentation: ${dealer.notes || 'Please contact our operations desk for details.'}`,
    },
  });
}
