import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  provider_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { provider_id }: RequestBody = await req.json();

    if (!provider_id) {
      throw new Error('provider_id is required');
    }

    const { data: provider, error: providerError } = await supabaseClient
      .from('api_providers')
      .select('*')
      .eq('id', provider_id)
      .single();

    if (providerError || !provider) {
      throw new Error('Provider not found');
    }

    let testResult = {
      success: false,
      message: 'Connection test not implemented for this provider type',
    };

    // Test connection based on provider type
    if (provider.type === 'ai_chat') {
      testResult = await testAIChatProvider(provider);
    } else if (provider.type === 'tts') {
      testResult = await testTTSProvider(provider);
    } else if (provider.type === 'ai_image') {
      testResult = await testAIImageProvider(provider);
    }

    // Update provider test status
    await supabaseClient
      .from('api_providers')
      .update({
        test_status: testResult.success ? 'success' : 'failed',
        test_message: testResult.message,
        last_tested_at: new Date().toISOString(),
      })
      .eq('id', provider_id);

    return new Response(JSON.stringify(testResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

async function testAIChatProvider(provider: any) {
  try {
    if (!provider.api_key) {
      return { success: false, message: 'API key not configured' };
    }

    // Test OpenAI-compatible API
    if (provider.name.toLowerCase().includes('openai') || provider.api_url?.includes('openai')) {
      const response = await fetch(`${provider.api_url || 'https://api.openai.com/v1'}/models`, {
        headers: {
          'Authorization': `Bearer ${provider.api_key}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true, message: 'Connection successful' };
      } else {
        const error = await response.text();
        return { success: false, message: `Connection failed: ${error}` };
      }
    }

    // Test Anthropic API
    if (provider.name.toLowerCase().includes('anthropic')) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': provider.api_key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      if (response.ok || response.status === 400) {
        return { success: true, message: 'Connection successful' };
      } else {
        const error = await response.text();
        return { success: false, message: `Connection failed: ${error}` };
      }
    }

    return { success: false, message: 'Provider type not supported for testing' };
  } catch (error) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}

async function testTTSProvider(provider: any) {
  try {
    if (!provider.api_key) {
      return { success: false, message: 'API key not configured' };
    }

    // Add TTS provider testing logic here
    return { success: true, message: 'TTS provider connection test not yet implemented' };
  } catch (error) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}

async function testAIImageProvider(provider: any) {
  try {
    if (!provider.api_key) {
      return { success: false, message: 'API key not configured' };
    }

    // Add AI Image provider testing logic here
    return { success: true, message: 'AI Image provider connection test not yet implemented' };
  } catch (error) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}
