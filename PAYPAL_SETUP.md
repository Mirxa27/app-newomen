# PayPal Subscription Integration Setup Guide

## Overview

The NewMe AI Platform includes a complete PayPal subscription integration for managing tiered subscriptions. This guide explains how to configure PayPal credentials and test the payment flow.

## Features Implemented

✅ **PayPal Edge Function** (`paypal-subscription`)
- Create subscription with PayPal
- Verify subscription status
- Cancel subscription
- Automatic user profile updates

✅ **Subscription Page Enhancements**
- PayPal payment integration
- Billing history tab
- Trial and paid subscription options
- Automatic subscription verification after payment

✅ **Database Schema**
- Subscription tiers (free, discovery, growth, transformation)
- Subscription status tracking
- Subscription history logging
- Automatic audit trail

## Required PayPal Configuration

### 1. Create PayPal Developer Account

1. Go to https://developer.paypal.com/
2. Sign in or create a developer account
3. Navigate to "Dashboard" → "Apps & Credentials"

### 2. Create Subscription Plans

You need to create 3 subscription plans in PayPal:

1. **Discovery Plan** - $9.99/month
2. **Growth Plan** - $19.99/month
3. **Transformation Plan** - $39.99/month

Steps to create plans:
1. Go to PayPal Dashboard → Products → Subscriptions
2. Click "Create Plan"
3. Set up billing cycle, pricing, and features
4. Save and note the Plan ID for each plan

### 3. Get API Credentials

1. In PayPal Developer Dashboard, go to "Apps & Credentials"
2. Select "Sandbox" for testing or "Live" for production
3. Create a new app or use existing app
4. Copy the **Client ID** and **Secret**

### 4. Configure Environment Variables

Add the following secrets to your Supabase project using the Supabase CLI or Dashboard:

```bash
# PayPal Mode (sandbox or live)
PAYPAL_MODE=sandbox

# PayPal API Credentials
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_secret_here

# PayPal Plan IDs
PAYPAL_PLAN_ID_DISCOVERY=P-XXXXXXXXXXXXX
PAYPAL_PLAN_ID_GROWTH=P-XXXXXXXXXXXXX
PAYPAL_PLAN_ID_TRANSFORMATION=P-XXXXXXXXXXXXX
```

#### Using Supabase CLI:

```bash
supabase secrets set PAYPAL_MODE=sandbox
supabase secrets set PAYPAL_CLIENT_ID=your_client_id
supabase secrets set PAYPAL_CLIENT_SECRET=your_secret
supabase secrets set PAYPAL_PLAN_ID_DISCOVERY=P-XXXXX
supabase secrets set PAYPAL_PLAN_ID_GROWTH=P-XXXXX
supabase secrets set PAYPAL_PLAN_ID_TRANSFORMATION=P-XXXXX
```

## Payment Flow

### User Journey

1. **Browse Plans**
   - User visits `/subscription` page
   - Views available subscription tiers
   - Compares features

2. **Start Subscription**
   - User clicks "Subscribe Now" button
   - System calls `paypal-subscription` Edge Function
   - Edge Function creates PayPal subscription
   - User is redirected to PayPal for approval

3. **PayPal Approval**
   - User logs into PayPal
   - Reviews subscription details
   - Approves or cancels subscription

4. **Verification**
   - User is redirected back to app with subscription ID
   - System verifies subscription with PayPal
   - User profile is updated with new tier
   - Subscription history is logged

5. **Access Features**
   - User gains immediate access to tier features
   - Subscription auto-renews monthly

### Trial Flow

Users can also start a 7-day free trial:

1. Click "Start 7-Day Trial" button
2. Trial is activated immediately (no payment required)
3. After 7 days, user must subscribe to continue

## Edge Function API

### Endpoint

```
POST /functions/v1/paypal-subscription
```

### Actions

#### 1. Create Subscription

```json
{
  "action": "create",
  "userId": "user-uuid",
  "tier": "discovery" | "growth" | "transformation",
  "returnUrl": "https://yourapp.com/subscription?status=success&subscription_id={subscription_id}",
  "cancelUrl": "https://yourapp.com/subscription?status=canceled"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "I-XXXXXXXXXXXXX",
  "approvalUrl": "https://www.paypal.com/webapps/billing/subscriptions?ba_token=..."
}
```

#### 2. Verify Subscription

```json
{
  "action": "verify",
  "userId": "user-uuid",
  "subscriptionId": "I-XXXXXXXXXXXXX"
}
```

**Response:**
```json
{
  "success": true,
  "tier": "discovery",
  "status": "ACTIVE"
}
```

#### 3. Cancel Subscription

```json
{
  "action": "cancel",
  "subscriptionId": "I-XXXXXXXXXXXXX"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription canceled successfully"
}
```

## Testing

### Sandbox Testing

1. Set `PAYPAL_MODE=sandbox`
2. Use PayPal sandbox credentials
3. Create test buyer accounts in PayPal Developer Dashboard
4. Test the complete flow:
   - Create subscription
   - Approve with test account
   - Verify subscription
   - Cancel subscription

### Test Cards

PayPal sandbox provides test credit cards:
- Visa: 4032039668796416
- Mastercard: 5425233430109903
- Amex: 374245455400126

## Subscription Management

### User Actions

Users can manage their subscriptions from the `/subscription` page:

- **View Current Plan**: See active subscription tier
- **Upgrade/Downgrade**: Change to different tier
- **Cancel**: Cancel active subscription
- **View History**: See all subscription changes

### Admin Actions

Admins can manage subscriptions from the admin panel:

- View all user subscriptions
- Manually update subscription tiers
- View subscription history
- Handle support requests

## Database Schema

### Profiles Table

```sql
subscription_tier: subscription_tier (free, discovery, growth, transformation)
subscription_status: subscription_status (active, trial, canceled, expired)
subscription_start_date: timestamptz
subscription_end_date: timestamptz
trial_end_date: timestamptz
```

### Subscription History Table

```sql
id: uuid
user_id: uuid
previous_tier: subscription_tier
new_tier: subscription_tier
previous_status: subscription_status
new_status: subscription_status
change_reason: text
changed_by: uuid
created_at: timestamptz
```

## Troubleshooting

### Common Issues

1. **"PayPal credentials not configured"**
   - Ensure all environment variables are set
   - Verify secrets are deployed to Edge Function
   - Check spelling of variable names

2. **"Failed to get PayPal access token"**
   - Verify Client ID and Secret are correct
   - Check PAYPAL_MODE matches credentials (sandbox vs live)
   - Ensure credentials have proper permissions

3. **"No PayPal plan ID configured for tier"**
   - Verify all three plan IDs are set
   - Check plan IDs match PayPal dashboard
   - Ensure plan IDs start with "P-"

4. **"Subscription is not active"**
   - User may have canceled during PayPal flow
   - Subscription may be pending approval
   - Check PayPal dashboard for subscription status

### Debug Mode

To enable detailed logging:

1. Check Edge Function logs in Supabase Dashboard
2. Monitor browser console for errors
3. Verify network requests in DevTools

## Security Considerations

1. **Never expose PayPal credentials** in client-side code
2. **Always verify subscriptions** server-side before granting access
3. **Use HTTPS** for all payment flows
4. **Validate user authentication** before processing payments
5. **Log all subscription changes** for audit trail

## Production Checklist

Before going live:

- [ ] Switch to live PayPal credentials
- [ ] Set `PAYPAL_MODE=live`
- [ ] Create live subscription plans
- [ ] Test complete payment flow
- [ ] Verify webhook handling (if implemented)
- [ ] Set up monitoring and alerts
- [ ] Review security settings
- [ ] Test cancellation flow
- [ ] Verify refund process
- [ ] Update terms of service

## Support

For issues with:
- **PayPal Integration**: Check PayPal Developer Documentation
- **Edge Functions**: Review Supabase Edge Function logs
- **Database**: Check Supabase Dashboard logs
- **Frontend**: Check browser console errors

## Next Steps

Optional enhancements:

1. **Webhooks**: Implement PayPal webhooks for real-time updates
2. **Proration**: Handle mid-cycle upgrades/downgrades
3. **Coupons**: Add discount code support
4. **Invoices**: Generate PDF invoices
5. **Analytics**: Track subscription metrics
6. **Notifications**: Email users about subscription changes
