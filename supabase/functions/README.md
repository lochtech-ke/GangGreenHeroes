# Supabase Edge Functions

This directory contains Supabase Edge Functions for the #GangGreen platform.

## Functions

### Badge Management Functions

#### 1. create-badge

Creates a new badge using geometric generator by default.

**Endpoint:** `POST /functions/v1/create-badge`

**Request Body:**
```json
{
  "userId": "user-uuid",
  "tier": "gold",
  "forest": "kakamega",
  "achievement": "tree_planter",
  "badgeType": "geometric",
  "saveToDatabase": true
}
```

**Response:**
```json
{
  "success": true,
  "badgeId": "badge-uuid",
  "svg": "<svg>...</svg>",
  "metadata": {}
}
```

See [Badge Endpoints Documentation](./badge-endpoints/README.md) for full details.

#### 2. get-badge

Retrieves a badge by ID with caching support.

**Endpoint:** `GET /functions/v1/get-badge/{badgeId}?format=svg&cache=true`

**Response:** Returns badge SVG or JSON with badge data.

See [Badge Endpoints Documentation](./badge-endpoints/README.md) for full details.

#### 3. migrate-badges

Triggers badge migration to geometric designs (admin only).

**Endpoint:** `POST /functions/v1/migrate-badges`

**Request Body:**
```json
{
  "userId": "user-uuid",
  "batchSize": 100,
  "dryRun": false,
  "createBackup": true
}
```

See [Badge Endpoints Documentation](./badge-endpoints/README.md) for full details.

#### 4. migration-status

Returns current migration status and progress.

**Endpoint:** `GET /functions/v1/migration-status?history=true`

**Response:**
```json
{
  "success": true,
  "status": {
    "inProgress": true,
    "progress": 45,
    "totalBadges": 500,
    "migratedBadges": 225,
    "failedBadges": 3
  }
}
```

See [Badge Endpoints Documentation](./badge-endpoints/README.md) for full details.

### Payment Functions

#### 5. verify-paystack-payment

Verifies Paystack payment transactions server-side using the Paystack API.

**Endpoint:** `POST /functions/v1/verify-paystack-payment`

**Request Body:**
```json
{
  "reference": "GG-1234567890-ABC123"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Verification successful",
  "data": {
    "id": 123456,
    "status": "success",
    "reference": "GG-1234567890-ABC123",
    "amount": 15000,
    "paid_at": "2025-11-18T10:30:00.000Z",
    ...
  }
}
```

#### 6. paystack-webhook

Handles webhook events from Paystack for real-time payment status updates.

**Endpoint:** `POST /functions/v1/paystack-webhook`

**Supported Events:**
- `charge.success` - Payment completed successfully
- `charge.failed` - Payment failed

**Security:** Verifies webhook signature using HMAC SHA-512.

## Deployment

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref wobpryllvdjaapzjbsxx
```

### Deploy Functions

Deploy all functions:
```bash
supabase functions deploy
```

Deploy badge functions:
```bash
supabase functions deploy create-badge
supabase functions deploy get-badge
supabase functions deploy migrate-badges
supabase functions deploy migration-status
```

Deploy payment functions:
```bash
supabase functions deploy verify-paystack-payment
supabase functions deploy paystack-webhook
```

### Set Environment Variables

Set the required environment variables for the functions:

```bash
# Paystack Secret Key
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_f3770759b7201fda31685899667d1788392114e9

# Supabase URL (usually auto-set)
supabase secrets set SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co

# Supabase Service Role Key (for webhook function)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

View current secrets:
```bash
supabase secrets list
```

### Test Functions Locally

Start local development:
```bash
supabase functions serve
```

Test verify-paystack-payment:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/verify-paystack-payment' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"reference":"GG-1234567890-ABC123"}'
```

Test paystack-webhook:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/paystack-webhook' \
  --header 'x-paystack-signature: test_signature' \
  --header 'Content-Type: application/json' \
  --data '{"event":"charge.success","data":{"reference":"GG-1234567890-ABC123"}}'
```

## Configure Paystack Webhook

1. Log into your Paystack Dashboard: https://dashboard.paystack.com
2. Navigate to Settings > Webhooks
3. Add webhook URL: `https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/paystack-webhook`
4. Select events to listen for:
   - `charge.success`
   - `charge.failed`
5. Save the webhook configuration

## Monitoring

View function logs:
```bash
supabase functions logs verify-paystack-payment
supabase functions logs paystack-webhook
```

View logs in real-time:
```bash
supabase functions logs verify-paystack-payment --follow
```

## Troubleshooting

### Function not responding

1. Check if function is deployed:
```bash
supabase functions list
```

2. Check function logs for errors:
```bash
supabase functions logs <function-name>
```

3. Verify environment variables are set:
```bash
supabase secrets list
```

### Webhook signature verification failing

1. Ensure `PAYSTACK_SECRET_KEY` is correctly set
2. Check that Paystack is sending the `x-paystack-signature` header
3. Verify the webhook URL in Paystack dashboard matches your function URL

### Payment verification failing

1. Ensure `PAYSTACK_SECRET_KEY` is correctly set
2. Check that the payment reference exists in Paystack
3. Verify network connectivity to Paystack API

## Security Notes

- Never commit secret keys to version control
- Use environment variables for all sensitive data
- Webhook signature verification is mandatory
- Service role key should only be used in Edge Functions, never in client code
- Always use HTTPS for webhook endpoints

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Paystack API Documentation](https://paystack.com/docs/api/)
- [Paystack Webhook Documentation](https://paystack.com/docs/payments/webhooks/)
