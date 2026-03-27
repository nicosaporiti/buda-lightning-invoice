# Buda Lightning Invoice API Documentation

## Overview

RESTful API service for creating and verifying Bitcoin Lightning Network invoices using the Buda.com exchange platform. This service acts as a secure server-side wrapper to keep API credentials private while exposing simple HTTP endpoints for frontend integration and Lightning Address (LNURL-pay) protocol compliance.

**Base URL:** `https://budaln.fly.dev`

**Technology Stack:** Node.js + Express

**Authentication:** None required for API consumers (Buda.com credentials handled server-side)

---

## Endpoints

### 1. Create Lightning Invoice

Creates a new Bitcoin Lightning Network invoice (BOLT11 payment request).

**Endpoint:** `POST /newinvoice`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": number,  // Amount in satoshis (integer >= 1)
  "msg": string      // Invoice description/memo (min length: 1)
}
```

**Success Response (200 OK):**
```json
{
  "invoice": "lnbc...",  // BOLT11 payment request string
  "amount": 1000,        // Amount in satoshis (echoed from request)
  "msg": "Payment for services"  // Description (echoed from request)
}
```

**Error Response (400 Bad Request):**
```json
{
  "ok": false,
  "error": "Error message description"
}
```

**Validation Errors (400 Bad Request):**
```json
{
  "ok": false,
  "errors": {
    "amount": {
      "msg": "Ingrese un número entero mayor a 1"
    },
    "msg": {
      "msg": "Debe ingresar un mensaje"
    }
  }
}
```

**Example Request:**
```bash
curl -X POST https://budaln.fly.dev/newinvoice \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "msg": "Payment for coffee"
  }'
```

**Example Response:**
```json
{
  "invoice": "lnbc10u1p3q9h7zpp5...",
  "amount": 1000,
  "msg": "Payment for coffee"
}
```

---

### 2. Check Invoice Status

Verifies if a Lightning invoice has been paid and confirmed.

**Endpoint:** `POST /status`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "invoice": string  // BOLT11 payment request (required)
}
```

**Success Response (200 OK):**
```json
{
  "invoice": "lnbc...",  // Invoice from request
  "status": true         // true if paid and confirmed, false otherwise
}
```

**Error Response (400 Bad Request):**
```json
{
  "ok": false,
  "error": "Error message description"
}
```

**Validation Errors (400 Bad Request):**
```json
{
  "ok": false,
  "errors": {
    "invoice": {
      "msg": "Ingrese invoice"
    }
  }
}
```

**Example Request:**
```bash
curl -X POST https://budaln.fly.dev/status \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": "lnbc10u1p3q9h7zpp5..."
  }'
```

**Example Response (Paid):**
```json
{
  "invoice": "lnbc10u1p3q9h7zpp5...",
  "status": true
}
```

**Example Response (Unpaid):**
```json
{
  "invoice": "lnbc10u1p3q9h7zpp5...",
  "status": false
}
```

**Status Logic:**
- Returns `true` only if the invoice is found in Buda deposits with state `"confirmed"`
- Returns `false` for unpaid, pending, or non-existent invoices

---

### 3. Lightning Address Callback (LNURL-pay)

Lightning Address protocol callback endpoint for receiving payments via Lightning Address.

**Endpoint:** `GET /callback`

**Query Parameters:**
```
amount: number    // Amount in millisatoshis (integer >= 1000)
comment: string   // Optional user message/comment
```

**Success Response (200 OK):**
```json
{
  "pr": "lnbc...",           // BOLT11 payment request
  "successAction": {
    "tag": "message",
    "message": "Gracias por tu pago"
  },
  "routes": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "ok": false,
  "error": "Error message description"
}
```

**Validation Errors (400 Bad Request):**
```json
{
  "ok": false,
  "errors": {
    "amount": {
      "msg": "Ingrese un número entero mayor a 1000 msats"
    }
  }
}
```

**Example Request:**
```bash
curl "https://budaln.fly.dev/callback?amount=10000&comment=Thanks%20for%20the%20content"
```

**Example Response:**
```json
{
  "pr": "lnbc100n1p3q9h8app5...",
  "successAction": {
    "tag": "message",
    "message": "Gracias por tu pago"
  },
  "routes": []
}
```

**Notes:**
- Amount is provided in **millisatoshis** (1 satoshi = 1000 millisatoshis)
- The API automatically converts millisatoshis to satoshis when creating the invoice
- If `comment` is not provided, defaults to `"Pago desde Lightning Address"`
- Complies with [LUD-06](https://github.com/lnurl/luds/blob/luds/06.md) and [LUD-09](https://github.com/lnurl/luds/blob/luds/09.md) Lightning Address specifications

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Request processed successfully |
| 400 | Bad Request - Validation error or API error |
| 500 | Internal Server Error - Unexpected server error |

### Error Response Formats

**Validation Errors:**
```json
{
  "ok": false,
  "errors": {
    "fieldName": {
      "msg": "Error message in Spanish"
    }
  }
}
```

**Application Errors:**
```json
{
  "ok": false,
  "error": "Detailed error message"
}
```

### Common Error Messages

- `"Ingrese un número entero mayor a 1"` - Amount must be an integer >= 1 satoshi
- `"Ingrese un número entero mayor a 1000 msats"` - Amount must be an integer >= 1000 millisatoshis
- `"Debe ingresar un mensaje"` - Message field cannot be empty
- `"Ingrese invoice"` - Invoice field is required
- `"Buda error {statusCode}: {message}"` - Error from Buda.com API

---

## Integration Examples

### JavaScript (fetch)

```javascript
// Create invoice
async function createInvoice(amount, description) {
  const response = await fetch('https://budaln.fly.dev/newinvoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount,
      msg: description
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create invoice');
  }

  return data.invoice;
}

// Check payment status
async function checkPaymentStatus(invoice) {
  const response = await fetch('https://budaln.fly.dev/status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoice: invoice
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to check status');
  }

  return data.status;
}

// Usage example
(async () => {
  try {
    // Create a 5000 satoshi invoice
    const invoice = await createInvoice(5000, 'Coffee payment');
    console.log('Payment request:', invoice);

    // Poll for payment confirmation
    let isPaid = false;
    while (!isPaid) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      isPaid = await checkPaymentStatus(invoice);
      console.log('Payment status:', isPaid ? 'PAID' : 'Pending...');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

### Python

```python
import requests
import time

API_BASE = 'https://budaln.fly.dev'

def create_invoice(amount, message):
    """Create a Lightning invoice"""
    response = requests.post(
        f'{API_BASE}/newinvoice',
        json={
            'amount': amount,
            'msg': message
        }
    )

    if response.status_code != 200:
        raise Exception(f"Error: {response.json().get('error', 'Unknown error')}")

    return response.json()['invoice']

def check_payment_status(invoice):
    """Check if invoice has been paid"""
    response = requests.post(
        f'{API_BASE}/status',
        json={'invoice': invoice}
    )

    if response.status_code != 200:
        raise Exception(f"Error: {response.json().get('error', 'Unknown error')}")

    return response.json()['status']

# Usage example
if __name__ == '__main__':
    # Create invoice
    invoice = create_invoice(10000, 'Donation')
    print(f'Payment request: {invoice}')

    # Wait for payment
    while not check_payment_status(invoice):
        print('Waiting for payment...')
        time.sleep(5)

    print('Payment confirmed!')
```

### cURL Examples

```bash
# Create invoice
curl -X POST https://budaln.fly.dev/newinvoice \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "msg": "Service payment"}'

# Check status
curl -X POST https://budaln.fly.dev/status \
  -H "Content-Type: application/json" \
  -d '{"invoice": "lnbc50u1p3q9h7z..."}'

# Lightning Address callback
curl "https://budaln.fly.dev/callback?amount=50000&comment=Great%20work"
```

---

## Technical Details

### Request Flow

```
HTTP Request
    ↓
Express Router + Validation
    ↓
Controller (Business Logic)
    ↓
Helper (API Wrapper)
    ↓
Buda.com API (HMAC-SHA384 Authenticated)
    ↓
Response
```

### Buda.com API Integration

The service uses authenticated calls to Buda.com's REST API:

**For Invoice Creation:**
- Endpoint: `POST /api/v2/lightning_network_invoices`
- Authentication: HMAC-SHA384 signature
- Returns: BOLT11 payment request

**For Payment Verification:**
- Endpoint: `GET /api/v2/currencies/btc/deposits`
- Authentication: HMAC-SHA384 signature
- Searches: Confirmed deposits matching invoice

### Authentication Method

Server-side HMAC-SHA384 authentication with Buda.com:

```
Signature = HMAC-SHA384(
  API_SECRET,
  METHOD + PATH + [BASE64_BODY] + NONCE
)

Headers:
- X-SBTC-APIKEY: <api_key>
- X-SBTC-NONCE: <unique_nonce>
- X-SBTC-SIGNATURE: <computed_signature>
```

### CORS Configuration

The API has CORS enabled, allowing requests from any origin:

```javascript
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Allow-Headers": "Content-Type"
}
```

---

## Lightning Address Protocol

This API can be used to implement Lightning Address functionality:

### What is Lightning Address?

Lightning Address is an internet identifier (like email) for receiving Lightning payments. Format: `username@domain.com`

### Implementation Guide

To use this API for Lightning Address:

1. **Well-known endpoint:** Serve `/.well-known/lnurlp/{username}` with:
```json
{
  "callback": "https://budaln.fly.dev/callback",
  "maxSendable": 100000000000,
  "minSendable": 1000,
  "metadata": "[[\"text/plain\", \"Payment to username\"]]",
  "tag": "payRequest"
}
```

2. **Callback handling:** The `/callback` endpoint handles amount requests

3. **Payment flow:**
   - Wallet queries `/.well-known/lnurlp/{username}`
   - Wallet calls `/callback?amount={msats}`
   - API returns BOLT11 invoice
   - Wallet pays invoice
   - User receives payment to Buda.com account

---

## Rate Limits

No explicit rate limiting is implemented at the API level. Requests are subject to:
- Buda.com API rate limits
- Fly.io infrastructure limits
- Network timeout: 5000ms per request

---

## Support & Resources

- **API Repository:** [GitHub](https://github.com/nicosaporiti/buda-lightning-invoice)
- **Buda.com API Docs:** [https://api.buda.com](https://api.buda.com)
- **Lightning Network:** [https://lightning.network](https://lightning.network)
- **LNURL Specifications:** [https://github.com/lnurl/luds](https://github.com/lnurl/luds)

---

## Version Information

- **API Version:** 1.0.0
- **Node.js:** 20.18.0
- **Region:** South America (gru - Guarulhos, Brazil)
- **Runtime:** Fly.io

---

## Notes for LLM Integration

When integrating this API into LLM applications:

1. **Invoice Creation:** Use `/newinvoice` to generate payment requests programmatically
2. **Amount Validation:** Always validate amounts are positive integers (>= 1 satoshi for `/newinvoice`, >= 1000 millisatoshis for `/callback`)
3. **Status Polling:** Implement polling with reasonable intervals (5-10 seconds) to check payment confirmation
4. **Error Handling:** Check for both validation errors (nested in `errors` object) and application errors (`error` string)
5. **Currency Units:**
   - `/newinvoice` and `/status` use **satoshis**
   - `/callback` uses **millisatoshis** (1 sat = 1000 msats)
6. **Message Field:** Required for `/newinvoice`, optional for `/callback` (defaults to Spanish message)
7. **Status Response:** The `status` field is a boolean, not a string enum
8. **BOLT11 Format:** The invoice field expects/returns standard Lightning BOLT11 payment requests (starts with "lnbc")

### Common LLM Use Cases

- **Micropayments:** Generate invoices for small amounts (e.g., per-API-call pricing)
- **Donation Systems:** Create invoices for user contributions
- **Paywall Content:** Verify payment before delivering content
- **Lightning Address:** Backend for email-style Lightning addresses
- **Automated Payments:** Programmatic invoice generation and verification

---

*Last Updated: 2026-01-05*
