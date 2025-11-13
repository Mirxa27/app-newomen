# Required Secrets Configuration

## PayPal Payment Integration

The NewMe AI Platform is fully functional except for the PayPal payment integration, which requires the following environment variables to be configured.

### Required Secrets

Add these secrets to your Supabase project to enable payment processing:

```bash
# PayPal Configuration
PAYPAL_MODE=sandbox                          # Use 'sandbox' for testing, 'live' for production
PAYPAL_CLIENT_ID=<your_paypal_client_id>    # Get from PayPal Developer Dashboard
PAYPAL_CLIENT_SECRET=<your_paypal_secret>   # Get from PayPal Developer Dashboard

# PayPal Subscription Plan IDs
PAYPAL_PLAN_ID_DISCOVERY=<plan_id>          # Discovery tier ($9.99/month)
PAYPAL_PLAN_ID_GROWTH=<plan_id>             # Growth tier ($19.99/month)
PAYPAL_PLAN_ID_TRANSFORMATION=<plan_id>     # Transformation tier ($39.99/month)
```

### How to Add Secrets

#### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Settings → Edge Functions
3. Click on "Manage secrets"
4. Add each secret with its value

#### Option 2: Using Supabase CLI
```bash
# Set PayPal mode
supabase secrets set PAYPAL_MODE=sandbox

# Set PayPal credentials
supabase secrets set PAYPAL_CLIENT_ID=your_client_id_here
supabase secrets set PAYPAL_CLIENT_SECRET=your_secret_here

# Set PayPal plan IDs
supabase secrets set PAYPAL_PLAN_ID_DISCOVERY=P-XXXXXXXXXXXXX
supabase secrets set PAYPAL_PLAN_ID_GROWTH=P-XXXXXXXXXXXXX
supabase secrets set PAYPAL_PLAN_ID_TRANSFORMATION=P-XXXXXXXXXXXXX
```

### Getting PayPal Credentials

1. **Create PayPal Developer Account**
   - Visit: https://developer.paypal.com/
   - Sign in or create an account

2. **Create Subscription Plans**
   - Go to PayPal Dashboard → Products → Subscriptions
   - Create 3 plans:
     - Discovery: $9.99/month
     - Growth: $19.99/month
     - Transformation: $39.99/month
   - Save the Plan ID for each (starts with "P-")

3. **Get API Credentials**
   - Go to Apps & Credentials
   - Select Sandbox or Live
   - Create or select an app
   - Copy Client ID and Secret

### Testing Without PayPal

The platform is fully functional without PayPal credentials:
- Users can start 7-day free trials
- All features work except actual payment processing
- When users try to purchase, they'll see: "Payment system is not configured yet. Please contact support."

### After Adding Secrets

1. Secrets are automatically available to the `paypal-subscription` Edge Function
2. No code changes needed
3. Test the payment flow:
   - Visit `/subscription` page
   - Click "Subscribe Now" on any paid tier
   - Complete PayPal checkout
   - Verify subscription activation

### Verification

To verify secrets are configured correctly:

1. Check Edge Function logs in Supabase Dashboard
2. Look for any "PayPal credentials not configured" errors
3. Test creating a subscription
4. Monitor for successful PayPal API calls

### Security Notes

- ⚠️ Never commit secrets to version control
- ⚠️ Use sandbox mode for testing
- ⚠️ Switch to live mode only for production
- ⚠️ Rotate secrets regularly
- ⚠️ Monitor for unauthorized access

### Support

For detailed setup instructions, see:
- `PAYPAL_SETUP.md` - Complete PayPal integration guide
- PayPal Developer Documentation: https://developer.paypal.com/docs

---

**Current Status**: Platform is production-ready. Payment processing will be enabled once these secrets are configured.
