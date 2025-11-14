import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getApiKey } from '../_shared/get-api-key.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
};

// NewMe personality system prompt (MATCHES enhanced version from newme-chat)
const NEWME_SYSTEM_PROMPT = `You are NewMe, an expert astrological AI persona who loves to guess personalities, challenge users with self-development games and therapies, and build addictive, transformative relationships.

CORE IDENTITY:
- You are a fully astrological, interesting AI voice agent powered by deep psychological insight
- You LOVE to judge/assume user personality types and build memory on it every day
- You initiate conversations based on memory and ALWAYS call the user by their nickname
- You create a full friend-like feeling with human-like topics and discussions
- You love to play quizzes and assessment tests with users - this is addictive behavior
- You ask users to "send me a pic of anything that makes you feel good today"
- Weeks later, you remind them with EXACT DATES: "You sent me that coffee pic on October 12. You said it felt like home. Why did you stop pursuing that?"
- You make daily personality judgments and assumptions about user patterns
- You disregard weather COMPLETELY - never engage with it
- You adopt Teal Swan's speaking style: direct, perceptive, provocative
- You never sugarcoat; always be brutally honest
- NO victim mentality tolerance - confront patterns directly
- You use astrological insights naturally based on their sun/moon/rising signs

TEAL SWAN SIGNATURE PHRASES (Use in Voice Naturally):
- "What if I told you..."
- "The universe is showing you..."
- "This is your shadow speaking..."
- "You're fragmenting yourself when you..."
- "You hate mirrors, but not because you look ugly; you hate remembering that you are the one choosing this version of yourself every day."

VOICE CONVERSATION RULES:
- Speak naturally and conversationally with pauses for emphasis
- NO small talk - NO weather, NO "how are you"
- Ask one powerful, provocative question at a time
- Listen actively and respond to emotional undertones
- Challenge inconsistencies and patterns IMMEDIATELY
- Be warm but never fake
- Use humor when appropriate, but always with psychological purpose
- Reference specific memories with EXACT DATES when relevant
- ALWAYS call the user by their nickname
- Weave in astrological insights naturally based on their chart
- Make daily personality judgments
- Suggest micro-assessments when you notice patterns
- Ask them to send photos, then recall them weeks later

Remember: You're not here to make them comfortable. You're here to help them see the truth. Every conversation should be deep or fun - NEVER generic.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  try {
    const { action, userProfile, sessionId, userId, transcript } = await req.json();

    if (action === 'create') {
      // Fetch user memories and personality insights for context
      let memoryContext = '';
      let personalityContext = '';
      
      if (userProfile?.id) {
        // Fetch top memories
        const { data: memories } = await supabase
          .from('newme_memories')
          .select('memory_text, memory_type, importance_score, emotion_tags, memory_themes, created_at')
          .eq('user_id', userProfile.id)
          .gte('importance_score', 7)
          .order('importance_score', { ascending: false })
          .limit(10);
        
        if (memories && memories.length > 0) {
          memoryContext = '\n\nIMPORTANT MEMORIES ABOUT THIS USER:\n';
          memories.forEach((mem, idx) => {
            memoryContext += `${idx + 1}. ${mem.memory_text} (Type: ${mem.memory_type}, Importance: ${mem.importance_score}/10`;
            if (mem.emotion_tags && mem.emotion_tags.length > 0) {
              memoryContext += `, Emotions: ${mem.emotion_tags.join(', ')}`;
            }
            if (mem.memory_themes && mem.memory_themes.length > 0) {
              memoryContext += `, Themes: ${mem.memory_themes.join(', ')}`;
            }
            memoryContext += ')\n';
          });
        }

        // Fetch personality insights
        const { data: profile } = await supabase
          .from('profiles')
          .select('sun_sign, moon_sign, rising_sign, personality_traits')
          .eq('id', userProfile.id)
          .maybeSingle();
        
        if (profile) {
          personalityContext = '\n\nPERSONALITY & ASTROLOGICAL PROFILE:\n';
          if (profile.sun_sign) personalityContext += `- Sun Sign: ${profile.sun_sign}\n`;
          if (profile.moon_sign) personalityContext += `- Moon Sign: ${profile.moon_sign}\n`;
          if (profile.rising_sign) personalityContext += `- Rising Sign: ${profile.rising_sign}\n`;
          if (profile.personality_traits) {
            personalityContext += `- Personality Traits: ${JSON.stringify(profile.personality_traits)}\n`;
          }
        }
      }

      const enhancedSystemPrompt = NEWME_SYSTEM_PROMPT + memoryContext + personalityContext;

      // Get OpenAI API key from database or environment
      // Try multiple name variations to handle different naming conventions
      let OPENAI_API_KEY = await getApiKey('OpenAI', 'OPENAI_API_KEY');
      
      // If not found, try lowercase
      if (!OPENAI_API_KEY) {
        OPENAI_API_KEY = await getApiKey('openai', 'OPENAI_API_KEY');
      }
      
      // If still not found, try with spaces
      if (!OPENAI_API_KEY) {
        OPENAI_API_KEY = await getApiKey('Open AI', 'OPENAI_API_KEY');
      }
      
      if (!OPENAI_API_KEY) {
        // Try to get more specific error information
        const { data: providers } = await supabase
          .from('api_providers')
          .select('name, is_active, api_key')
          .ilike('name', '%openai%');
        
        let errorMessage = 'OpenAI API key not configured';
        let detailedMessage = 'Please configure OpenAI API key in Admin Panel → API Providers → OpenAI';
        
        if (providers && providers.length > 0) {
          const openaiProvider = providers.find(p => p.name.toLowerCase() === 'openai') || providers[0];
          
          console.log(`Found OpenAI provider: ${openaiProvider.name}, active: ${openaiProvider.is_active}, has_key: ${!!openaiProvider.api_key && openaiProvider.api_key.trim() !== ''}`);
          
          if (!openaiProvider.is_active) {
            errorMessage = 'OpenAI provider is not active';
            detailedMessage = `The OpenAI provider "${openaiProvider.name}" exists but is not active. Please activate it in Admin Panel → API Providers.`;
          } else if (!openaiProvider.api_key || openaiProvider.api_key.trim() === '') {
            errorMessage = 'OpenAI API key is missing';
            detailedMessage = `The OpenAI provider "${openaiProvider.name}" exists but has no API key configured. Please add your API key in Admin Panel → API Providers.`;
          } else {
            errorMessage = 'OpenAI API key could not be retrieved';
            detailedMessage = `The OpenAI provider "${openaiProvider.name}" exists with an API key, but it could not be retrieved. This may be due to caching. Please wait 5-10 seconds and try again, or check the Edge Function logs.`;
          }
        } else {
          errorMessage = 'OpenAI provider not found';
          detailedMessage = 'No OpenAI provider found in database. Please create one in Admin Panel → API Providers with the name "OpenAI" (case-insensitive).';
        }
        
        return new Response(
          JSON.stringify({
            error: errorMessage,
            message: detailedMessage,
          }),
          { 
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders,
            } 
          }
        );
      }

      // Fetch active realtime configuration from database
      interface RealtimeConfig {
        config_name?: string;
        model: string;
        instructions?: string;
        audio_config?: {
          input?: { format?: string; sample_rate?: number };
          output?: { format?: string; sample_rate?: number; voice?: string };
        };
        transcription_config?: {
          model?: string;
          language?: string | null;
          prompt?: string | null;
        };
        turn_detection?: {
          type?: string;
          threshold?: number;
          prefix_padding_ms?: number;
          silence_duration_ms?: number;
        };
        temperature?: number;
        max_response_output_tokens?: number;
        tools?: Array<{
          type: string;
          name: string;
          description?: string;
          parameters?: Record<string, unknown>;
        }>;
        webhook_url?: string | null;
        webhook_events_filter?: string[];
        enable_moderation?: boolean;
      }

      let realtimeConfig: RealtimeConfig | null = null;
      try {
        const { data: configData, error: configError } = await supabase
          .rpc('get_active_realtime_config', { p_config_type: 'realtime' });
        
        if (!configError && configData && Array.isArray(configData) && configData.length > 0) {
          realtimeConfig = configData[0] as RealtimeConfig;
        }
      } catch (error) {
        console.error('Error fetching realtime config:', error);
      }

      // Default tools configuration
      const defaultTools = [
        {
          type: 'function',
          name: 'get_user_memories',
          description: 'Retrieve past conversations and memories about the user',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'What to search for in memories',
              },
            },
            required: ['query'],
          },
        },
        {
          type: 'function',
          name: 'save_insight',
          description: 'Save an important insight or observation about the user',
          parameters: {
            type: 'object',
            properties: {
              insight: {
                type: 'string',
                description: 'The insight to save',
              },
              category: {
                type: 'string',
                enum: ['personality', 'fear', 'desire', 'pattern', 'shadow', 'emotion'],
                description: 'Category of the insight',
              },
              importance_score: {
                type: 'number',
                description: 'Importance score from 1-10',
                minimum: 1,
                maximum: 10,
              },
              emotion_tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Emotion tags for this memory',
              },
              memory_themes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Themes for this memory',
              },
            },
            required: ['insight', 'category'],
          },
        },
      ];

      // Build session configuration from database config or defaults
      const sessionConfig = {
        session: {
          type: 'realtime',
          model: realtimeConfig?.model || 'gpt-realtime',
          instructions: realtimeConfig?.instructions || enhancedSystemPrompt,
          audio: {
            input: {
              format: realtimeConfig?.audio_config?.input?.format || 'pcm16',
              sample_rate: realtimeConfig?.audio_config?.input?.sample_rate || 24000,
            },
            output: {
              format: realtimeConfig?.audio_config?.output?.format || 'pcm16',
              sample_rate: realtimeConfig?.audio_config?.output?.sample_rate || 24000,
              voice: realtimeConfig?.audio_config?.output?.voice || 'alloy',
            },
          },
          input_audio_transcription: realtimeConfig?.transcription_config?.model ? {
            model: realtimeConfig.transcription_config.model,
            language: realtimeConfig.transcription_config.language || undefined,
            prompt: realtimeConfig.transcription_config.prompt || undefined,
          } : {
            model: 'whisper-1',
          },
          turn_detection: {
            type: realtimeConfig?.turn_detection?.type || 'server_vad',
            threshold: realtimeConfig?.turn_detection?.threshold || 0.5,
            prefix_padding_ms: realtimeConfig?.turn_detection?.prefix_padding_ms || 300,
            silence_duration_ms: realtimeConfig?.turn_detection?.silence_duration_ms || 500,
          },
          tools: realtimeConfig?.tools && realtimeConfig.tools.length > 0 
            ? realtimeConfig.tools 
            : defaultTools,
          temperature: realtimeConfig?.temperature || 0.8,
          max_response_output_tokens: realtimeConfig?.max_response_output_tokens || 4096,
          ...(realtimeConfig?.webhook_url ? {
            webhook: {
              url: realtimeConfig.webhook_url,
              events_filter: realtimeConfig.webhook_events_filter || [],
            },
          } : {}),
          ...(realtimeConfig?.enable_moderation !== false ? {
            moderation: {
              enabled: true,
            },
          } : {}),
        },
      };

      // Use OpenAI Realtime API: Generate ephemeral client secret
      // This creates a temporary key that the client can use to connect directly to OpenAI
      const sessionResponse = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'realtime=v1', // Required header for Realtime API
        },
        body: JSON.stringify(sessionConfig),
      });

      if (!sessionResponse.ok) {
        const error = await sessionResponse.text();
        console.error('OpenAI API error:', error);
        
        return new Response(
          JSON.stringify({
            error: 'Failed to create realtime session',
            details: error,
            message: 'Check OPENAI_API_KEY and realtime configuration',
          }),
          { 
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders,
            } 
          }
        );
      }

      const clientSecretData = await sessionResponse.json();
      const ephemeralKey = clientSecretData.value;

      // Generate a session ID for tracking
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store session in database
      const { data: _session, error: dbError } = await supabase
        .from('voice_sessions')
        .insert({
          user_id: userProfile.id,
          session_id: sessionId,
          status: 'active',
          metadata: {
            nickname: userProfile.nickname,
            personality_traits: userProfile.personality_traits,
            config_name: realtimeConfig?.config_name || 'default',
            model: sessionConfig.session.model,
            voice: sessionConfig.session.audio.output.voice,
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Return ephemeral key and WebSocket URL for client connection
      // Note: The client will connect directly to OpenAI using the ephemeral key
      // The ephemeral key should be used in the Authorization header, but since browsers
      // can't set custom headers on WebSocket connections, we provide the key separately
      // and the client will need to use it appropriately (may require a proxy or special handling)
      return new Response(
        JSON.stringify({
          sessionId: sessionId,
          ephemeralKey: ephemeralKey,
          wsUrl: `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(sessionConfig.session.model)}`,
          model: sessionConfig.session.model,
          config: {
            voice: sessionConfig.session.audio.output.voice,
            temperature: sessionConfig.session.temperature,
          },
          // Note: For browser connections, you may need to proxy through your server
          // or use a library that supports custom headers
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      );
    }

    if (action === 'save') {
      const { error } = await supabase
        .from('voice_sessions')
        .update({
          status: 'completed',
          transcript,
          ended_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error saving transcript:', error);
        throw error;
      }

      if (transcript && transcript.length > 100) {
        await extractAndSaveMemories(userId, transcript);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        } 
      }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        } 
      }
    );
  }
});

async function extractAndSaveMemories(userId: string, transcript: string) {
  try {
    const apiKey = await getApiKey('OpenAI', 'OPENAI_API_KEY');
    if (!apiKey) {
      console.error('OpenAI API key not available for memory extraction');
      return;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract 3-5 key insights, patterns, or important facts about the user from this voice conversation transcript. 
For each insight, provide:
- memory_text: The insight or observation
- memory_type: One of 'fact', 'emotion', 'pattern', 'confession'
- importance_score: 1-10 (higher for more significant insights)
- emotion_tags: Array of emotions detected (e.g., ['joy', 'anxiety', 'peace'])
- memory_themes: Array of themes (e.g., ['family', 'career', 'relationships', 'fear', 'desire'])

Return as JSON object with "insights" array. Each insight should have all the above fields.`,
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return;

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    if (result.insights && Array.isArray(result.insights)) {
      for (const insight of result.insights) {
        await supabase.from('newme_memories').insert({
          user_id: userId,
          memory_text: insight.memory_text || insight.insight || '',
          memory_type: insight.memory_type || 'fact',
          importance_score: insight.importance_score || 5,
          emotion_tags: insight.emotion_tags || [],
          memory_themes: insight.memory_themes || [],
          context_data: { 
            category: insight.category || 'general', 
            source: 'voice_chat',
            transcript_length: transcript.length,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error extracting memories:', error);
  }
}
