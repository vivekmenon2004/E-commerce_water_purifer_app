# Calinfco n8n Workflows Directory

This directory stores exported workflow templates in standard n8n JSON format.

## Included Workflows

1. **`order-confirmation-notification.json`**:
   - Webhook trigger on customer order placement (`POST /webhook/order-created`).
   - Dispatches order confirmation notifications and creates service booking records.

2. **`service-request-dispatch.json`**:
   - Webhook trigger on service request creation (`POST /webhook/service-dispatch`).
   - Validates service zone and alerts assigned technician.

3. **`filter-replacement-reminder.json`**:
   - Scheduled daily cron trigger inspecting purifier installation dates.
   - Calculates filter lifecycle and queues customer replacement reminders.

4. **Product Spotlight & Social Media Automation (Planned in `WORKFLOW_PLAN.md`)**:
   - Ingests `Products-template.csv`.
   - Runs daily at 10:00 AM IST.
   - Operates in strict dry-run mode until Meta Instagram credentials are provided.

## How to Import Workflows into n8n

1. Start your local n8n instance via Docker Compose (see instructions in `automation/n8n/README.md`).
2. Open your web browser to `http://localhost:5678`.
3. In the left navigation, click **Workflows**.
4. In the top-right corner, click the three dots (`...`) or **Add workflow** > **Import from File**.
5. Select any `.json` file from this `workflows/` directory.
6. Verify nodes and click **Save** / **Activate**.
