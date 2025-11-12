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

    let voices: any[] = [];

    // Fetch voices based on provider
    if (provider.name.toLowerCase().includes('openai')) {
      voices = await fetchOpenAIVoices(provider);
    } else if (provider.name.toLowerCase().includes('google')) {
      voices = await fetchGoogleVoices(provider);
    } else if (provider.name.toLowerCase().includes('elevenlabs')) {
      voices = await fetchElevenLabsVoices(provider);
    } else {
      throw new Error('Provider not supported for automatic voice fetching');
    }

    // Insert or update voices in database
    const insertedVoices = [];
    for (const voice of voices) {
      const { data, error } = await supabaseClient
        .from('ai_voices')
        .upsert({
          provider_id: provider_id,
          voice_id: voice.voice_id,
          voice_name: voice.voice_name,
          language: voice.language,
          gender: voice.gender,
          accent: voice.accent,
          sample_url: voice.sample_url,
          parameters: voice.parameters,
          is_active: true,
          is_default: false,
        }, {
          onConflict: 'provider_id,voice_id',
        })
        .select()
        .single();

      if (!error && data) {
        insertedVoices.push(data);
      }
    }

    return new Response(JSON.stringify({ voices: insertedVoices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

async function fetchOpenAIVoices(provider: any) {
  // OpenAI TTS voices (predefined list)
  return [
    {
      voice_id: 'alloy',
      voice_name: 'Alloy',
      language: 'en-US',
      gender: 'neutral',
      accent: null,
      sample_url: null,
      parameters: { speed: 1.0 },
    },
    {
      voice_id: 'echo',
      voice_name: 'Echo',
      language: 'en-US',
      gender: 'male',
      accent: null,
      sample_url: null,
      parameters: { speed: 1.0 },
    },
    {
      voice_id: 'fable',
      voice_name: 'Fable',
      language: 'en-US',
      gender: 'neutral',
      accent: null,
      sample_url: null,
      parameters: { speed: 1.0 },
    },
    {
      voice_id: 'onyx',
      voice_name: 'Onyx',
      language: 'en-US',
      gender: 'male',
      accent: null,
      sample_url: null,
      parameters: { speed: 1.0 },
    },
    {
      voice_id: 'nova',
      voice_name: 'Nova',
      language: 'en-US',
      gender: 'female',
      accent: null,
      sample_url: null,
      parameters: { speed: 1.0 },
    },
    {
      voice_id: 'shimmer',
      voice_name: 'Shimmer',
      language: 'en-US',
      gender: 'female',
      accent: null,
      sample_url: null,
      parameters: { speed: 1.0 },
    },
  ];
}

async function fetchGoogleVoices(provider: any) {
  // Google Cloud TTS - return a subset of popular voices
  return [
    {
      voice_id: 'en-US-Neural2-A',
      voice_name: 'English (US) - Neural2 A',
      language: 'en-US',
      gender: 'male',
      accent: 'US',
      sample_url: null,
      parameters: { pitch: 0, speakingRate: 1.0 },
    },
    {
      voice_id: 'en-US-Neural2-C',
      voice_name: 'English (US) - Neural2 C',
      language: 'en-US',
      gender: 'female',
      accent: 'US',
      sample_url: null,
      parameters: { pitch: 0, speakingRate: 1.0 },
    },
    {
      voice_id: 'en-GB-Neural2-A',
      voice_name: 'English (UK) - Neural2 A',
      language: 'en-GB',
      gender: 'female',
      accent: 'UK',
      sample_url: null,
      parameters: { pitch: 0, speakingRate: 1.0 },
    },
    {
      voice_id: 'en-GB-Neural2-B',
      voice_name: 'English (UK) - Neural2 B',
      language: 'en-GB',
      gender: 'male',
      accent: 'UK',
      sample_url: null,
      parameters: { pitch: 0, speakingRate: 1.0 },
    },
  ];
}

async function fetchElevenLabsVoices(provider: any) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': provider.api_key,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ElevenLabs voices');
    }

    const data = await response.json();
    const voices = data.voices || [];

    return voices.map((voice: any) => ({
      voice_id: voice.voice_id,
      voice_name: voice.name,
      language: voice.labels?.language || 'en',
      gender: voice.labels?.gender || null,
      accent: voice.labels?.accent || null,
      sample_url: voice.preview_url || null,
      parameters: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }));
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    return [];
  }
}
