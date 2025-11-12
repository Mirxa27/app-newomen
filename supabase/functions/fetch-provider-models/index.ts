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

    if (!provider.api_key) {
      throw new Error('Provider API key not configured');
    }

    let models: any[] = [];

    // Fetch models based on provider type
    if (provider.name.toLowerCase().includes('openai') || provider.api_url?.includes('openai')) {
      models = await fetchOpenAIModels(provider);
    } else if (provider.name.toLowerCase().includes('anthropic')) {
      models = await fetchAnthropicModels(provider);
    } else if (provider.name.toLowerCase().includes('google')) {
      models = await fetchGoogleModels(provider);
    } else {
      throw new Error('Provider not supported for automatic model fetching');
    }

    // Insert or update models in database
    const insertedModels = [];
    for (const model of models) {
      const { data, error } = await supabaseClient
        .from('ai_models')
        .upsert({
          provider_id: provider_id,
          model_id: model.model_id,
          model_name: model.model_name,
          model_type: model.model_type,
          capabilities: model.capabilities,
          parameters: model.parameters,
          is_active: true,
          is_default: false,
        }, {
          onConflict: 'provider_id,model_id',
        })
        .select()
        .single();

      if (!error && data) {
        insertedModels.push(data);
      }
    }

    return new Response(JSON.stringify({ models: insertedModels }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

async function fetchOpenAIModels(provider: any) {
  const response = await fetch(`${provider.api_url || 'https://api.openai.com/v1'}/models`, {
    headers: {
      'Authorization': `Bearer ${provider.api_key}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch OpenAI models');
  }

  const data = await response.json();
  const models = data.data || [];

  return models
    .filter((model: any) => {
      const id = model.id.toLowerCase();
      return id.includes('gpt') || id.includes('text-embedding') || id.includes('dall-e');
    })
    .map((model: any) => {
      const id = model.id.toLowerCase();
      let modelType = 'chat';
      
      if (id.includes('embedding')) {
        modelType = 'embedding';
      } else if (id.includes('dall-e')) {
        modelType = 'image';
      } else if (id.includes('whisper')) {
        modelType = 'audio';
      }

      return {
        model_id: model.id,
        model_name: model.id,
        model_type: modelType,
        capabilities: {
          streaming: modelType === 'chat',
          functions: modelType === 'chat' && (id.includes('gpt-4') || id.includes('gpt-3.5')),
        },
        parameters: {
          temperature: 0.7,
          max_tokens: modelType === 'chat' ? 2000 : 1000,
        },
      };
    });
}

async function fetchAnthropicModels(provider: any) {
  // Anthropic doesn't have a models endpoint, so we return known models
  return [
    {
      model_id: 'claude-3-opus-20240229',
      model_name: 'Claude 3 Opus',
      model_type: 'chat',
      capabilities: { streaming: true, functions: false },
      parameters: { temperature: 0.7, max_tokens: 4096 },
    },
    {
      model_id: 'claude-3-sonnet-20240229',
      model_name: 'Claude 3 Sonnet',
      model_type: 'chat',
      capabilities: { streaming: true, functions: false },
      parameters: { temperature: 0.7, max_tokens: 4096 },
    },
    {
      model_id: 'claude-3-haiku-20240307',
      model_name: 'Claude 3 Haiku',
      model_type: 'chat',
      capabilities: { streaming: true, functions: false },
      parameters: { temperature: 0.7, max_tokens: 4096 },
    },
  ];
}

async function fetchGoogleModels(provider: any) {
  // Google AI doesn't have a simple models endpoint, so we return known models
  return [
    {
      model_id: 'gemini-pro',
      model_name: 'Gemini Pro',
      model_type: 'chat',
      capabilities: { streaming: true, functions: false },
      parameters: { temperature: 0.7, max_tokens: 2048 },
    },
    {
      model_id: 'gemini-pro-vision',
      model_name: 'Gemini Pro Vision',
      model_type: 'chat',
      capabilities: { streaming: true, functions: false, vision: true },
      parameters: { temperature: 0.7, max_tokens: 2048 },
    },
  ];
}
