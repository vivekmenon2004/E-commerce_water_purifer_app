# n8n Automations - Calinfco Water Purifiers

This directory houses automated workflows powering backend notifications, technician dispatching, and scheduled filter maintenance reminders.

## Included Workflows

1. **`workflows/order-confirmation-notification.json`**:
   - **Trigger**: Webhook triggered upon order placement (`/webhook/order-created`).
   - **Actions**:
     - Formats order details & customer address.
     - Sends SMS / WhatsApp order confirmation with estimated delivery date.
     - Creates initial installation ticket in `serviceRequests` collection.

2. **`workflows/service-request-dispatch.json`**:
   - **Trigger**: Webhook triggered when a customer books a service or filter replacement (`/webhook/service-dispatch`).
   - **Actions**:
     - Evaluates customer postal code against technician service zones.
     - Dispatches alert to technician mobile device.
     - Sends customer appointment verification with technician contact and ETA.

3. **`workflows/filter-replacement-reminder.json`**:
   - **Trigger**: Cron / Scheduled trigger (runs daily at 09:00 AM).
   - **Actions**:
     - Scans `orders` and `amcSubscriptions` for purifiers installed 150-180 days ago.
     - Calculates filter lifespan based on average family water consumption.
     - Sends automated WhatsApp / Push Notification reminder to schedule sediment/carbon filter replacement.

## How to Import Workflows into n8n

1. Start n8n locally:
   ```bash
   npx n8n
   # or via Docker
   docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
   ```
2. Navigate to `http://localhost:5678`.
3. Go to **Workflows** > **Import from File**.
4. Select any `.json` workflow file from the `workflows/` folder.
5. Configure your environment credentials (Twilio, WhatsApp Business Cloud API, Firebase Admin SDK).
