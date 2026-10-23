# Calinfco Water Purifiers - API & Webhook Specifications

## 1. n8n Automation Webhooks

### Order Created Webhook
- **URL**: `POST /webhook/order-created`
- **Trigger**: Called immediately when a customer completes checkout.
- **Request Body**:
```json
{
  "id": "ORD-9482",
  "customer": {
    "id": "USR-1049",
    "name": "Rajesh Sharma",
    "phone": "+91 98765 12345"
  },
  "items": [
    {
      "id": "calinfco-aquashield-pro",
      "name": "AquaShield Pro 10X",
      "category": "purifier",
      "quantity": 1,
      "price": 18999
    }
  ],
  "shippingAddress": "Flat 402, Green Glen Layout, Bellandur, Bangalore - 560103",
  "totalAmount": 18999
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "serviceTicketCreated": true,
  "ticketId": "SRV-2090"
}
```

### Technician Service Dispatch Webhook
- **URL**: `POST /webhook/service-dispatch`
- **Trigger**: Called when customer books a doorstep water test or filter replacement.
- **Request Body**:
```json
{
  "customerId": "USR-1049",
  "customerName": "Rajesh Sharma",
  "phone": "+91 98765 12345",
  "address": "Bellandur, Bangalore",
  "postalCode": "560103",
  "requestType": "water_test",
  "scheduledDate": "Tomorrow 10:00 AM - 01:00 PM"
}
```
- **Response**: `200 OK`
```json
{
  "status": "dispatched",
  "assignedTechnician": "Amit K."
}
```

## 2. Next.js App Router API Routes (apps/admin)

- `GET /api/health` - System health, Firestore connection state, and n8n webhook status.
- `GET /api/purifiers` - List purifier inventory with real-time stock levels.
- `POST /api/orders` - Webhook receiver / internal order dispatch.
- `POST /api/services` - Create technician dispatch ticket.
