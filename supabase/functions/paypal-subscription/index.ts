import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PAYPAL_API_BASE = Deno.env.get("PAYPAL_MODE") === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");

interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalLink {
  rel: string;
  href: string;
  method: string;
}

interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  status_update_time: string;
  plan_id: string;
  start_time: string;
  subscriber: {
    email_address: string;
  };
  links?: PayPalLink[];
}

interface CreateSubscriptionRequest {
  userId: string;
  tier: "discovery" | "growth" | "transformation";
  returnUrl: string;
  cancelUrl: string;
}

interface VerifySubscriptionRequest {
  userId: string;
  subscriptionId: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal access token: ${error}`);
  }

  const data: PayPalAccessTokenResponse = await response.json();
  return data.access_token;
}

function getPlanIdForTier(tier: string): string {
  const planIds = {
    discovery: Deno.env.get("PAYPAL_PLAN_ID_DISCOVERY"),
    growth: Deno.env.get("PAYPAL_PLAN_ID_GROWTH"),
    transformation: Deno.env.get("PAYPAL_PLAN_ID_TRANSFORMATION"),
  };

  const planId = planIds[tier as keyof typeof planIds];
  if (!planId) {
    throw new Error(`No PayPal plan ID configured for tier: ${tier}`);
  }

  return planId;
}

async function createSubscription(
  accessToken: string,
  request: CreateSubscriptionRequest
): Promise<PayPalSubscriptionResponse> {
  const planId = getPlanIdForTier(request.tier);

  const subscriptionData = {
    plan_id: planId,
    application_context: {
      brand_name: "NewMe AI",
      locale: "en-US",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      return_url: request.returnUrl,
      cancel_url: request.cancelUrl,
    },
    custom_id: request.userId,
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal subscription: ${error}`);
  }

  return await response.json();
}

async function getSubscriptionDetails(
  accessToken: string,
  subscriptionId: string
): Promise<PayPalSubscriptionResponse> {
  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get subscription details: ${error}`);
  }

  return await response.json();
}

async function updateUserSubscription(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  tier: string,
  subscriptionId: string
) {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // First get current subscription status
  const { data: currentProfile } = await supabaseClient
    .from("profiles")
    .select("subscription_tier, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await (supabaseClient as unknown as {
    from: (table: string) => {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      };
    };
  })
    .from("profiles")
    .update({
      subscription_tier: tier as "free" | "discovery" | "growth" | "transformation",
      subscription_status: "active" as "active" | "trial" | "canceled" | "expired",
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: endDate.toISOString(),
      trial_end_date: null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update user subscription: ${error.message}`);
  }

  const { error: historyError } = await (supabaseClient as unknown as {
    from: (table: string) => {
      insert: (values: Record<string, unknown>) => Promise<{ error: Error | null }>;
    };
  })
    .from("subscription_history")
    .insert({
      user_id: userId,
      previous_tier: (currentProfile as { subscription_tier?: string; subscription_status?: string } | null)?.subscription_tier || null,
      new_tier: tier,
      previous_status: (currentProfile as { subscription_tier?: string; subscription_status?: string } | null)?.subscription_status || null,
      new_status: "active",
      change_reason: `PayPal subscription created: ${subscriptionId}`,
      changed_by: userId,
    });

  if (historyError) {
    console.error("Failed to create subscription history:", historyError);
    // Don't throw - subscription update succeeded
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, ...requestData } = await req.json();

    if (action === "create") {
      const createRequest = requestData as CreateSubscriptionRequest;
      
      if (createRequest.userId !== user.id) {
        throw new Error("User ID mismatch");
      }

      const accessToken = await getPayPalAccessToken();
      const subscription = await createSubscription(accessToken, createRequest);

      const approvalUrl = subscription.links?.find(
        (link: PayPalLink) => link.rel === "approve"
      )?.href;

      return new Response(
        JSON.stringify({
          success: true,
          subscriptionId: subscription.id,
          approvalUrl,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (action === "verify") {
      const verifyRequest = requestData as VerifySubscriptionRequest;
      
      if (verifyRequest.userId !== user.id) {
        throw new Error("User ID mismatch");
      }

      const accessToken = await getPayPalAccessToken();
      const subscription = await getSubscriptionDetails(
        accessToken,
        verifyRequest.subscriptionId
      );

      if (subscription.status === "ACTIVE") {
        const tierMap: { [key: string]: string } = {
          [Deno.env.get("PAYPAL_PLAN_ID_DISCOVERY") || ""]: "discovery",
          [Deno.env.get("PAYPAL_PLAN_ID_GROWTH") || ""]: "growth",
          [Deno.env.get("PAYPAL_PLAN_ID_TRANSFORMATION") || ""]: "transformation",
        };

        const tier = tierMap[subscription.plan_id];
        if (!tier) {
          throw new Error("Unknown subscription plan");
        }

        await updateUserSubscription(
          supabase as ReturnType<typeof createClient>,
          verifyRequest.userId,
          tier,
          subscription.id
        );

        return new Response(
          JSON.stringify({
            success: true,
            tier,
            status: subscription.status,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            status: subscription.status,
            message: "Subscription is not active",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else if (action === "cancel") {
      const { subscriptionId } = requestData;
      
      const accessToken = await getPayPalAccessToken();
      
      const response = await fetch(
        `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: "User requested cancellation",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to cancel subscription: ${error}`);
      }

      const { error: updateError } = await (supabase as unknown as {
        from: (table: string) => {
          update: (values: Record<string, unknown>) => {
            eq: (column: string, value: string) => Promise<{ error: Error | null }>;
          };
        };
      })
        .from("profiles")
        .update({
          subscription_status: "canceled",
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(`Failed to update subscription status: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription canceled successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("PayPal subscription error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
