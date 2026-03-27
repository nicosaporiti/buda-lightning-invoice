# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Node.js/Express backend service for creating and verifying Bitcoin Lightning Network invoices using the Buda.com API. Acts as a secure server-side wrapper to keep API credentials private while exposing simple HTTP endpoints for frontend integration.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Development server with nodemon (hot reload)
npm start            # Production server
```

No test suite is configured.

## Environment Variables

Create a `.env` file in the project root:
```
PORT=3001
BUDA_API_KEY='your_buda_api_key'
BUDA_API_SECRET='your_buda_api_secret'
```

## Architecture

### Request Flow
```
HTTP Request → Express Route → Validation Middleware → Controller → Helper → Buda API Wrapper → Response
```

### Key Directories
- `routes/` - API route definitions with express-validator rules
- `controllers/` - Request handlers with business logic
- `helpers/` - Functions that interact with Buda API
- `middlewares/` - Express middleware (input validation)
- `buda-promise/` - Local library wrapping Buda.com REST API with HMAC-SHA384 authentication

### API Endpoints

**POST `/newinvoice`** - Create Lightning invoice
- Body: `{ amount: number (satoshis), msg: string }`
- Returns: `{ invoice: string (BOLT11), amount, msg }`

**POST `/status`** - Check invoice payment status
- Body: `{ invoice: string (BOLT11) }`
- Returns: `{ invoice, status: boolean }`

**GET `/callback`** - Lightning Address callback (LNURL-pay)
- Query: `amount` (millisatoshis), optional `comment`
- Returns: Lightning Address protocol response

### Buda API Authentication

The `buda-promise/buda.js` wrapper handles HMAC-SHA384 authentication:
- Signature computed from: `METHOD + PATH + BASE64_BODY + NONCE`
- Headers: `X-SBTC-APIKEY`, `X-SBTC-NONCE`, `X-SBTC-SIGNATURE`

## Deployment

Configured for Fly.io deployment:
- `Dockerfile` - Multi-stage build with Node.js 20.18.0
- `fly.toml` - App config (region: gru, internal_port: 8080, 1GB RAM)
