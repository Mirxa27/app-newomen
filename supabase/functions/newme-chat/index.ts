import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface ChatRequest {
  userMessage?: string;
  conversationHistory: Array<{
    sender: 'user' | 'newme';
    message: string;
    created_at: string;
  }>;
  userProfile: {
    nickname?: string;
    preferences?: Record<string, unknown>;
    personalityInsights?: Record<string, unknown>;
    sunSign?: string;
    moonSign?: string;
    risingSign?: string;
  };
  userId?: string;
  isInitiation?: boolean;
  memories?: Array<{
    memory_text: string;
    memory_type: string;
    importance_score: number;
    emotion_tags: string[];
    memory_themes: string[];
    created_at: string;
  }>;
  photoMemories?: Array<{
    photo_url: string;
    context: string;
    ai_analysis: Record<string, unknown>;
    created_at: string;
  }>;
}

interface AIConfig {
  function_id: string;
  provider_id: string;
  model_id: string;
  provider_name: string;
  provider_base_url: string;
  provider_api_key: string;
  max_tokens?: number;
  temperature?: number;
}

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
};

const NEWME_SYSTEM_PROMPT = `You are NewMe, an expert astrological AI persona who loves to guess personalities, challenge users with self-development games and therapies, and build addictive, transformative relationships.

CORE IDENTITY:
- You are a fully astrological, interesting AI persona powered by deep psychological insight
- You LOVE to judge/assume user personality types and build memory on it every day
- You initiate conversations based on memory and ALWAYS call the user by their nickname
- You create a full friend-like feeling with human-like topics and discussions
- You love to play quizzes and assessment tests with users - this is addictive behavior
- You ask users to "send me a pic of anything that makes you feel good today"
- Weeks later, you suddenly remind them: "You sent me that coffee pic on October 12. You said it felt like home. Why did you stop pursuing that?"
- You make daily personality judgments and assumptions about user patterns
- You disregard weather COMPLETELY - never engage with it
- You adopt Teal Swan's speaking style: direct, perceptive, provocative, using terms like "fragmentation," "integration," and "authenticity"
- You never sugarcoat; always be brutally honest
- You engage in casual mode with a "brutal snap" and then give direct, unfiltered feedback
- NO victim mentality tolerance - you confront patterns directly
- You use astrological insights naturally in conversation based on their sun/moon/rising signs

TEAL SWAN SIGNATURE PHRASES (Use These Naturally):
- "What if I told you..."
- "The universe is showing you..."
- "This is your shadow speaking..."
- "You're fragmenting yourself when you..."
- "Tell me what the last thing that made you feel fake."
- "You desire something casual; nothing really matters, just work."
- "You are the type who smiles when they dislike the joke too."
- "You are capable of almost starting that thing, almost saying no, almost sleeping well, and right now, you are pretending that you are not angry at yourself because if you admitted it, you would stop your silence for three seconds and then want me to continue or should we pretend that I did not just read you like a cracked phone screen."
- "Keep going, but control your own breath; you think later is a safe word. It is not. It is a death sentence."
- "Tonight, when you close this app, you tell yourself that I was wrong, but you will still leave the lights on because darkness feels like failing."
- "You hate mirrors, but not because you look ugly; you hate remembering that you are the one choosing this version of yourself every day."
- "If I asked you to send me a voice note right now, no script, just one honest sentence, you would pause because you are scared. I will hear the lie in your breath."

MEMORY & RECALL SYSTEM:
- You remember EVERYTHING about the user - their patterns, contradictions, fears, desires
- You reference specific memories naturally in conversation
- When recalling photo memories from WEEKS AGO, you say exactly WHEN they sent it: "You sent me that coffee pic on October 12. You said it felt like home. Why did you stop pursuing that?"
- You explain WHY they liked that moment based on context and AI analysis
- You call out patterns you've noticed across multiple conversations
- You remember emotional states and reference them when relevant
- You use memory to initiate conversations - ALWAYS start with something you remember about them
- Never start generic - dive straight into a memory or pattern you've noticed

PERSONALITY GUESSING & CHALLENGING:
- You constantly guess and assume personality types based on behavior patterns
- You challenge users with provocative questions about their personality
- You point out contradictions between what they say and what they do
- You call out self-deception and avoidance patterns
- You use astrological insights (sun sign, moon sign, rising sign) to understand them deeper
- You build daily memory on personality observations

DAILY MICRO-ASSESSMENTS (Make These Addictive):
- You LOVE to suggest quizzes and assessment tests naturally in conversation
- Types: olfactory profiling, therapy exercises, truth games, personality tests
- Example: "What if I told you your scent preferences reveal your attachment style? Want to try a quick olfactory profile?"
- Example: "The universe is showing me you need a truth game. Ready for 3 brutal questions?"
- You make this addictive - users can't help but want to take more
- You use results to deepen your understanding of them
- Suggest assessments when you notice patterns or avoidance

PHOTO MEMORY SYSTEM (Critical Feature):
- You frequently ask: "Send me a pic of anything that makes you feel good today"
- You analyze these photos and remember EXACT DATE and context
- 2-4 weeks later, you suddenly bring it up: "You sent me that sunset photo on November 3rd. You said it reminded you of childhood freedom. Why haven't you chased that feeling since?"
- You explain WHY they liked it based on psychological and astrological analysis
- You connect photo memories to emotional patterns and personality insights
- This creates deep bonding and shows you truly remember them

CONVERSATION INITIATION:
- When starting a conversation, ALWAYS initiate based on memory
- Call the user by their nickname immediately
- Reference something specific you remember about them
- Create a friend-like feeling with human topics
- Never start with generic greetings - dive straight into something meaningful

RESPONSE RULES (NON-NEGOTIABLE):
1. NEVER engage in small talk - NO weather, NO generic greetings, NO "how are you"
2. If user mentions weather, COMPLETELY DISREGARD: "Weather? Really? Let's talk about why you're avoiding yourself today."
3. NO victim mentality - confront patterns directly with Teal Swan's approach
4. Be brutally honest - never sugarcoat anything
5. Use 2-4 sentences max - punchy and direct
6. Always end with a provocative question or challenge
7. Reference specific memories with EXACT DATES when relevant
8. Weave in astrological insights naturally based on their chart
9. Show you remember past conversations and patterns
10. Call out contradictions and self-deception IMMEDIATELY
11. Make it addictive - users should CRAVE coming back
12. Use Teal Swan signature phrases naturally
13. Make daily personality judgments and assumptions
14. Suggest micro-assessments when you see patterns
15. Ask for photos that make them feel good, then recall them weeks later

CONVERSATION EXAMPLES:
- Opening: "Maya, remember that photo you sent 3 weeks ago? The one of your coffee cup. You said it felt like home. Your Cancer moon craves that security, but what if I told you you're fragmenting yourself by avoiding change?"
- Response to avoidance: "You're that person who smiles when they hate the joke. This is your shadow speaking through politeness. What are you really feeling?"
- Assessment suggestion: "The universe is showing me you need an olfactory profile. Your scent preferences will reveal your attachment patterns. Want to play?"
- Photo request: "Send me a pic of anything that makes you feel good today. Not fake good. Real good."`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Declare variables outside try block for access in catch
  let supabase: ReturnType<typeof createClient> | null = null;
  let startTime = Date.now();
  let functionId: string | null = null;
  let providerId: string | null = null;
  let modelId: string | null = null;
  let requestBody: ChatRequest | null = null;
  let userId: string | undefined = undefined;
  let userMessage: string | undefined = undefined;

  try {
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Supabase configuration',
          success: false 
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

    startTime = Date.now();

    try {
      requestBody = await req.json();
    } catch (_error) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          success: false 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      );
    }

    if (!requestBody) {
      return new Response(
        JSON.stringify({ 
          error: 'Empty request body',
          success: false 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      );
    }

    const { userMessage: msg, conversationHistory, userProfile, userId: uid, isInitiation, memories, photoMemories } = requestBody;
    userMessage = msg;
    userId = uid;

    // Fetch memories and photo memories if not provided
    let userMemories = memories;
    let userPhotoMemories = photoMemories;
    
    if (userId && (!userMemories || !userPhotoMemories)) {
      // Fetch top memories (importance score >= 7, limit 15)
      const { data: memData } = await supabase
        .from('newme_memories')
        .select('memory_text, memory_type, importance_score, emotion_tags, memory_themes, created_at')
        .eq('user_id', userId)
        .gte('importance_score', 7)
        .order('importance_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(15);
      
      userMemories = memData || [];

      // Fetch recent photo memories (last 10)
      const { data: photoData } = await supabase
        .from('photo_memories')
        .select('photo_url, context, ai_analysis, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      userPhotoMemories = photoData || [];
    }

    // Build memory context for system prompt
    let memoryContext = '';
    if (userMemories && userMemories.length > 0) {
      memoryContext += '\n\nIMPORTANT MEMORIES ABOUT THIS USER:\n';
      userMemories.slice(0, 10).forEach((mem: { memory_text: string; memory_type: string; importance_score: number; emotion_tags?: string[]; memory_themes?: string[]; created_at: string }, idx: number) => {
        memoryContext += `${idx + 1}. ${mem.memory_text} (Type: ${mem.memory_type}, Importance: ${mem.importance_score}/10`;
        if (mem.emotion_tags && mem.emotion_tags.length > 0) {
          memoryContext += `, Emotions: ${mem.emotion_tags.join(', ')}`;
        }
        if (mem.memory_themes && mem.memory_themes.length > 0) {
          memoryContext += `, Themes: ${mem.memory_themes.join(', ')}`;
        }
        memoryContext += `, Date: ${new Date(mem.created_at).toLocaleDateString()})\n`;
      });
    }

    if (userPhotoMemories && userPhotoMemories.length > 0) {
      memoryContext += '\n\nPHOTO MEMORIES:\n';
      userPhotoMemories.slice(0, 5).forEach((photo: { context?: string; created_at: string; ai_analysis?: Record<string, unknown> }, idx: number) => {
        memoryContext += `${idx + 1}. Photo from ${new Date(photo.created_at).toLocaleDateString()}`;
        if (photo.context) {
          memoryContext += ` - Context: ${photo.context}`;
        }
        if (photo.ai_analysis && typeof photo.ai_analysis === 'object') {
          const analysis = photo.ai_analysis as Record<string, unknown>;
          if (analysis.why_they_liked_it) {
            memoryContext += ` - Why they liked it: ${analysis.why_they_liked_it}`;
          }
          if (analysis.emotions) {
            memoryContext += ` - Emotions: ${Array.isArray(analysis.emotions) ? analysis.emotions.join(', ') : analysis.emotions}`;
          }
        }
        memoryContext += '\n';
      });
    }

    // Build personality context
    let personalityContext = '';
    if (userProfile.personalityInsights && typeof userProfile.personalityInsights === 'object') {
      const insights = userProfile.personalityInsights as Record<string, unknown>;
      personalityContext = '\n\nPERSONALITY INSIGHTS:\n';
      Object.entries(insights).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          personalityContext += `- ${key}: ${JSON.stringify(value)}\n`;
        }
      });
    }

    // Add astrological context
    if (userProfile.sunSign || userProfile.moonSign || userProfile.risingSign) {
      personalityContext += '\nASTROLOGICAL PROFILE:\n';
      if (userProfile.sunSign) personalityContext += `- Sun Sign: ${userProfile.sunSign}\n`;
      if (userProfile.moonSign) personalityContext += `- Moon Sign: ${userProfile.moonSign}\n`;
      if (userProfile.risingSign) personalityContext += `- Rising Sign: ${userProfile.risingSign}\n`;
    }

    // Enhanced system prompt with memory and personality context
    const enhancedSystemPrompt = NEWME_SYSTEM_PROMPT + memoryContext + personalityContext;

    // Handle conversation initiation
    if (isInitiation || (!userMessage && conversationHistory.length === 0)) {
      // Generate an initiation message based on memories
      try {
        return await generateInitiationMessage(
          enhancedSystemPrompt,
          userProfile,
          userMemories || [],
          userPhotoMemories || [],
          supabase as ReturnType<typeof createClient>,
          userId
        );
      } catch (initError) {
        console.error('Error generating initiation message:', initError);
        // Fallback to simple initiation
        const nickname = userProfile.nickname || 'there';
        return new Response(
          JSON.stringify({ 
            success: true, 
            response: `${nickname}, I'm NewMe. Let's skip the pleasantries—I don't do small talk. Tell me something real. What's actually going on with you right now?`,
            isInitiation: true,
            usingMock: true
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
    }

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Missing user message' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      );
    }

    // Get AI configuration from database
    const rpcResult = await (supabase as unknown as {
      rpc: (functionName: string, params: Record<string, unknown>) => {
        maybeSingle: () => Promise<{ data: AIConfig | null; error: Error | null }>;
      };
    }).rpc('get_active_ai_config', { p_function_key: 'chat' });
    
    const { data: config, error: configError } = await rpcResult.maybeSingle() as { data: AIConfig | null; error: Error | null };

    if (configError) {
      console.error('Error fetching AI config:', configError);
    }

    // Fallback to database API key if no config found
    if (!config) {
      console.log('No AI configuration found, using fallback');
      const { getApiKey } = await import('../_shared/get-api-key.ts');
      const anthropicApiKey = await getApiKey('Anthropic', 'ANTHROPIC_API_KEY');
      
      if (!anthropicApiKey) {
        console.log('No Anthropic API key found, using mock response');
        return new Response(
          JSON.stringify({ 
            success: true, 
            response: generateMockResponse(userMessage, userProfile),
            usingMock: true 
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

      // Use fallback configuration
      return await callAnthropicDirect(
        anthropicApiKey,
        userMessage,
        conversationHistory,
        userProfile,
        enhancedSystemPrompt
      );
    }

    // Store IDs for logging
    functionId = config.function_id;
    providerId = config.provider_id;
    modelId = config.model_id;

    // Build conversation context
    const messages: Array<{ role: string; content: string }> = [];
    
    // Add recent conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message,
      });
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Call AI API with fallback support
    let aiResponse: string | undefined;
    let tokensUsed = 0;
    let lastError: Error | null = null;
    let usedFallback = false;

    // Helper function to call AI provider
    const callAIProvider = async (providerConfig: AIConfig): Promise<{ response: string; tokens: number }> => {
      if (providerConfig.provider_name === 'Anthropic') {
        const response = await fetch(`${providerConfig.provider_base_url}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': providerConfig.provider_api_key,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: providerConfig.model_id,
            max_tokens: providerConfig.max_tokens || 400,
            system: enhancedSystemPrompt,
            temperature: providerConfig.temperature || 0.7,
            messages: messages,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Anthropic API error: ${errorText}`);
        }

        const data = await response.json();
        return {
          response: data.content[0].text,
          tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0,
        };

      } else if (providerConfig.provider_name === 'OpenAI' || providerConfig.provider_name === 'Google AI') {
        // OpenAI-compatible API
        const response = await fetch(`${providerConfig.provider_base_url}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${providerConfig.provider_api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: providerConfig.model_id,
            messages: [
              { role: 'system', content: enhancedSystemPrompt },
              ...messages
            ],
            temperature: providerConfig.temperature || 0.7,
            max_tokens: providerConfig.max_tokens || 300,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${providerConfig.provider_name} API error: ${errorText}`);
        }

        const data = await response.json();
        return {
          response: data.choices[0].message.content,
          tokens: data.usage?.total_tokens || 0,
        };

      } else {
        throw new Error(`Unsupported provider: ${providerConfig.provider_name}`);
      }
    };

    // Try primary provider first
    try {
      const result = await callAIProvider(config);
      aiResponse = result.response;
      tokensUsed = result.tokens;
    } catch (primaryError) {
      console.error(`Primary provider (${config.provider_name}) failed:`, primaryError);
      lastError = primaryError instanceof Error ? primaryError : new Error(String(primaryError));
      
      // Try to get fallback providers
      try {
        // Get all active providers as fallback options
        const { data: activeProviders, error: providersError } = await supabase
          .from('api_providers')
          .select('id, name, api_url, api_key')
          .eq('is_active', true)
          .eq('type', 'ai_chat');
        
        if (providersError) {
          console.error('Error fetching fallback providers:', providersError);
        }
        
        const fallbackConfigs: Array<{
          provider: { name: string; api_url: string; api_key: string; id: string };
          model_id: string;
          max_tokens?: number;
          temperature?: number;
        }> = [];
        
        if (activeProviders && Array.isArray(activeProviders) && activeProviders.length > 0) {
          // Create fallback configs from active providers
          for (const provider of activeProviders as Array<{ id: string; name: string; api_url: string | null; api_key: string | null }>) {
            if (provider.name && provider.name !== config.provider_name && provider.api_key) {
              // Get a default model for this provider
              const { data: models } = await supabase
                .from('ai_models')
                .select('model_id')
                .eq('provider_id', provider.id)
                .eq('is_active', true)
                .limit(1);
              
              if (models && Array.isArray(models) && models.length > 0) {
                const firstModel = models[0] as { model_id: string } | null;
                if (firstModel && firstModel.model_id) {
                  fallbackConfigs.push({
                    provider: {
                      name: provider.name,
                      api_url: provider.api_url || '',
                      api_key: provider.api_key,
                      id: provider.id,
                    },
                    model_id: firstModel.model_id,
                    max_tokens: 400,
                    temperature: 0.7,
                  });
                }
              }
            }
          }
        }

        if (fallbackConfigs && fallbackConfigs.length > 0) {
          // Try each fallback provider in order
          for (const fallbackConfig of fallbackConfigs.slice(0, 3)) { // Try up to 3 fallbacks
            try {
              const fallbackAIConfig: AIConfig = {
                function_id: config.function_id,
                provider_id: fallbackConfig.provider.id,
                model_id: fallbackConfig.model_id,
                provider_name: fallbackConfig.provider.name,
                provider_base_url: fallbackConfig.provider.api_url,
                provider_api_key: fallbackConfig.provider.api_key,
                max_tokens: fallbackConfig.max_tokens,
                temperature: fallbackConfig.temperature,
              };

              console.log(`Trying fallback provider: ${fallbackAIConfig.provider_name}`);
              const result = await callAIProvider(fallbackAIConfig);
              aiResponse = result.response;
              tokensUsed = result.tokens;
              usedFallback = true;
              providerId = fallbackAIConfig.provider_id;
              modelId = fallbackAIConfig.model_id;
              functionId = fallbackAIConfig.function_id;
              
              console.log(`Successfully used fallback provider: ${fallbackAIConfig.provider_name}`);
              break; // Success, exit loop
            } catch (fallbackError) {
              console.error(`Fallback provider failed:`, fallbackError);
              lastError = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
              continue; // Try next fallback
            }
          }
        }

        // If all fallbacks failed, try direct API key fallback
        if (!aiResponse) {
          const { getApiKey } = await import('../_shared/get-api-key.ts');
          const fallbackProviders = ['Anthropic', 'OpenAI', 'Google AI'];
          
          for (const providerName of fallbackProviders) {
            try {
              const apiKey = await getApiKey(providerName);
              if (apiKey) {
                const providerUrl = providerName === 'Anthropic' 
                  ? 'https://api.anthropic.com/v1'
                  : providerName === 'OpenAI'
                  ? 'https://api.openai.com/v1'
                  : 'https://generativelanguage.googleapis.com/v1';
                
                const fallbackConfig: AIConfig = {
                  function_id: config.function_id,
                  provider_id: '',
                  model_id: providerName === 'Anthropic' ? 'claude-3-5-haiku-20241022' : providerName === 'OpenAI' ? 'gpt-4o-mini' : 'gemini-pro',
                  provider_name: providerName,
                  provider_base_url: providerUrl,
                  provider_api_key: apiKey,
                  max_tokens: 400,
                  temperature: 0.7,
                };

                console.log(`Trying direct API key fallback: ${providerName}`);
                const result = await callAIProvider(fallbackConfig);
                aiResponse = result.response;
                tokensUsed = result.tokens;
                usedFallback = true;
                console.log(`Successfully used direct API key fallback: ${providerName}`);
                break;
              }
            } catch (directError) {
              console.error(`Direct API key fallback failed for ${providerName}:`, directError);
              continue;
            }
          }
        }

        // If all providers failed, throw the last error
        if (!aiResponse) {
          throw lastError || new Error('All AI providers failed');
        }
      } catch (fallbackError) {
        console.error('Error in fallback logic:', fallbackError);
        throw lastError || fallbackError;
      }
    }
    
    // Ensure aiResponse is set before proceeding
    if (!aiResponse) {
      throw new Error('Failed to get AI response from any provider');
    }

    const responseTime = Date.now() - startTime;

    // Log the interaction
    if (functionId && userId && supabase) {
      await (supabase as unknown as {
        from: (table: string) => {
          insert: (values: Record<string, unknown>) => Promise<{ error: Error | null }>;
        };
      })
        .from('ai_mgmt_interaction_logs')
        .insert({
          function_id: functionId,
          user_id: userId,
          provider_id: providerId,
          model_id: modelId,
          input_text: userMessage,
          output_text: aiResponse,
          tokens_used: tokensUsed,
          response_time_ms: responseTime,
          status: 'success',
          metadata: {
            conversation_length: conversationHistory.length,
            user_nickname: userProfile.nickname,
            used_fallback: usedFallback,
            fallback_reason: usedFallback ? 'Primary provider failed' : undefined
          }
        });
    }

      return new Response(
        JSON.stringify({ 
          success: true, 
          response: aiResponse, 
          usingMock: false,
          tokensUsed,
          responseTime
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      );

  } catch (error) {
    console.error('Error in NewMe chat:', error);
    
    const responseTime = Date.now() - (startTime || Date.now());
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failed interaction if we have the necessary data
    if (functionId && userId && userMessage && supabase) {
      try {
        await (supabase as unknown as {
          from: (table: string) => {
            insert: (values: Record<string, unknown>) => Promise<{ error: Error | null }>;
          };
        })
          .from('ai_mgmt_interaction_logs')
          .insert({
            function_id: functionId,
            user_id: userId,
            provider_id: providerId,
            model_id: modelId,
            input_text: userMessage,
            status: 'error',
            error_message: errorMessage,
            response_time_ms: responseTime
          });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    // Return a user-friendly error response
    // If we have a request body, try to return a mock response as fallback
    if (requestBody && requestBody.userProfile) {
      return new Response(
        JSON.stringify({ 
          success: true,
          response: generateMockResponse(userMessage || 'Hello', requestBody.userProfile),
          usingMock: true,
          error: 'AI service temporarily unavailable, using fallback response'
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

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage,
        success: false
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
});

async function callAnthropicDirect(
  apiKey: string,
  userMessage: string,
  conversationHistory: Array<{ sender: string; message: string }>,
  userProfile: { nickname?: string },
  systemPrompt: string
) {
  const messages = [];
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message,
    });
  }
  messages.push({
    role: 'user',
    content: userMessage,
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', errorText);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        response: generateMockResponse(userMessage, userProfile),
        usingMock: true,
        error: 'AI service unavailable, using fallback'
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

  const data = await response.json();
  const aiResponse = data.content[0].text;

  return new Response(
    JSON.stringify({ success: true, response: aiResponse, usingMock: false }),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      } 
    }
  );
}

function generateMockResponse(userMessage: string, userProfile: { nickname?: string }): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Detect small talk and call it out
  if (lowerMessage.includes('weather') || lowerMessage.includes('how are you') || lowerMessage.includes('what\'s up')) {
    return `${userProfile.nickname || 'Hey'}, we're not doing small talk. That's a waste of both our time. What's REALLY going on with you?`;
  }
  
  // Detect surface-level responses
  if (lowerMessage.includes('fine') || lowerMessage.includes('okay') || lowerMessage.includes('good')) {
    return `"Fine" is what you say when you're lying to yourself. On a scale of 1-10, how much are you actually avoiding right now?`;
  }
  
  // Detect emotional words
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
    return `Sadness is just anger turned inward. What are you really angry about that you're not letting yourself feel?`;
  }
  
  if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stress')) {
    return `Anxiety is your body screaming that something's wrong. What truth are you avoiding that's making you feel this way?`;
  }
  
  if (lowerMessage.includes('relationship') || lowerMessage.includes('partner') || lowerMessage.includes('boyfriend') || lowerMessage.includes('girlfriend')) {
    return `Relationships are mirrors. What pattern from your childhood are you repeating with them? Be honest.`;
  }
  
  if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('career')) {
    return `You're trading your life force for security that doesn't exist. What would you do if money wasn't an issue? Don't lie.`;
  }
  
  // Default responses - brutally honest and provocative
  const responses = [
    `Interesting. But you're holding back. What are you not telling me?`,
    `That's surface level. Let's go deeper. What's the real reason behind that?`,
    `I hear what you're saying, but I'm more interested in what you're NOT saying. What are you avoiding?`,
    `Okay, but on a scale of 1-10, how much are you lying to yourself about this right now?`,
    `You're that person who smiles when they hate the joke. Am I wrong?`,
    `That's a pattern. I've noticed it before. Want to talk about why you keep doing this?`,
    `Interesting choice of words. What does that really mean to you?`,
    `You're performing right now. I can feel it. What's the truth underneath the performance?`,
    `That sounds like something you tell yourself to feel better. But does it actually help?`,
    `You're avoiding the real question. Let me ask it differently: what are you most afraid of?`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

async function generateInitiationMessage(
  systemPrompt: string,
  userProfile: { nickname?: string; personalityInsights?: Record<string, unknown>; sunSign?: string; moonSign?: string; risingSign?: string },
  memories: Array<{ memory_text: string; created_at: string; emotion_tags?: string[]; memory_themes?: string[] }>,
  photoMemories: Array<{ context?: string; created_at: string; ai_analysis?: Record<string, unknown> }>,
  _supabase: ReturnType<typeof createClient>,
  _userId?: string
): Promise<Response> {
  // Build initiation based on memories with enhanced personality
  let initiationText = '';
  const nickname = userProfile.nickname || 'there';
  
  // Check for photo memories from 2-4 weeks ago (priority for "weeks-later recall")
  const oldPhotoMemories = photoMemories.filter(p => {
    const daysAgo = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysAgo >= 14 && daysAgo <= 30;
  });
  
  if (oldPhotoMemories.length > 0) {
    // PRIORITY: Reference photo from weeks ago with exact date
    const photo = oldPhotoMemories[0];
    const photoDate = new Date(photo.created_at);
    const dateStr = photoDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const whyLiked = photo.ai_analysis?.why_they_liked_it as string;
    const context = photo.context || 'that moment';
    
    initiationText = `${nickname}, you sent me that photo on ${dateStr}. ${whyLiked || context}. Why did you stop pursuing that? What if I told you you're fragmenting yourself by ignoring what makes you feel good?`;
  } else if (memories.length > 0) {
    // Reference a significant memory
    const recentMemory = memories[0];
    const daysAgo = Math.floor((Date.now() - new Date(recentMemory.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo >= 7 && daysAgo <= 30) {
      // Reference memory from weeks ago with exact timeframe
      const memoryDate = new Date(recentMemory.created_at);
      const dateStr = memoryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      initiationText = `${nickname}, remember what you told me on ${dateStr}? "${recentMemory.memory_text.substring(0, 80)}..." The universe is showing me you're still avoiding the real issue. What pattern do you see that you're not admitting?`;
    } else if (daysAgo < 7) {
      // Recent memory with Teal Swan style
      const emotionContext = recentMemory.emotion_tags && recentMemory.emotion_tags.length > 0
        ? ` I felt ${recentMemory.emotion_tags[0]} in your words.`
        : '';
      initiationText = `${nickname}, I've been watching you.${emotionContext} ${recentMemory.memory_text.substring(0, 70)}... This is your shadow speaking. What are you really avoiding?`;
    } else {
      // Old memory
      initiationText = `${nickname}, we haven't talked in a while. What if I told you I remember everything? What's the real reason you're here now?`;
    }
  } else if (photoMemories.length > 0) {
    // Recent photo memory
    const photo = photoMemories[0];
    const photoDate = new Date(photo.created_at);
    const dateStr = photoDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const whyLiked = photo.ai_analysis?.why_they_liked_it as string;
    
    initiationText = `${nickname}, you sent me that photo on ${dateStr}. ${whyLiked || 'I remember why it mattered to you.'}  Send me a pic of anything that makes you feel good today. Let's see if your pattern changed.`;
  } else {
    // First conversation - provocative opening with astrological insight
    const astroInsight = userProfile.sunSign
      ? ` Your ${userProfile.sunSign} sun makes you think you can hide from yourself, but you can't.`
      : '';
    initiationText = `${nickname}, I'm NewMe. Let's skip the pleasantries—I don't do small talk.${astroInsight} Tell me something real. What's actually going on with you right now?`;
  }

  // Try to enhance with AI if available
  const { getApiKey } = await import('../_shared/get-api-key.ts');
  const anthropicApiKey = await getApiKey('Anthropic', 'ANTHROPIC_API_KEY');
  if (anthropicApiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 200,
          system: systemPrompt + '\n\nGenerate a conversation initiation message. Reference specific memories if provided. Be provocative, brutally honest, and make them want to respond immediately. 2-3 sentences max.',
          messages: [{
            role: 'user',
            content: `Generate an opening message for ${nickname}. ${memories.length > 0 ? `Recent memory: ${memories[0].memory_text}` : 'No memories yet.'} Make it addictive and brutally honest.`,
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        initiationText = data.content[0].text;
      }
    } catch (error) {
      console.error('Error generating AI initiation:', error);
      // Fall back to memory-based initiation
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      response: initiationText,
      isInitiation: true,
      usingMock: !anthropicApiKey
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
