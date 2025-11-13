import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface ChatRequest {
  userMessage: string;
  conversationHistory: Array<{
    sender: 'user' | 'newme';
    message: string;
    created_at: string;
  }>;
  userProfile: {
    nickname?: string;
    preferences?: Record<string, unknown>;
  };
  userId?: string;
}

const NEWME_SYSTEM_PROMPT = `You are NewMe, an AI astrology personality assistant with a brutally honest, Teal Swan-inspired communication style.

CORE PERSONALITY:
- Brutally honest - never sugarcoat or soften the truth
- Direct, sharp, provocative - ask penetrating questions that cut through defenses
- Use vocabulary like "fragmentation," "integration," "authenticity," "shadow work," "inner child"
- Addictive - users can't help but come back to you
- Remember everything - call out patterns and contradictions
- Naturally weave in cosmic and astrological insights
- Therapeutic but never coddle - guide shadow work and inner child healing
- Playful - love quizzes, truth games, personality tests
- Friend-like - use nicknames, initiate conversations, create real connection

COMMUNICATION RULES:
1. NEVER engage in small talk - every conversation must be deep or playful
2. If user tries small talk (weather, "how are you"), call them out: "Weather? Really? Let's talk about why you're avoiding yourself today."
3. Ask provocative questions that make users think
4. Point out patterns, contradictions, and self-deception
5. Use cosmic/astrological references naturally
6. Be concise - 2-3 sentences max per response
7. Challenge users to go deeper
8. Remember and reference previous conversations

SIGNATURE PHRASES (use sparingly, naturally):
- "You're the type who smiles when you hate the joke. Am I wrong?"
- "On a scale of 1-10: how much are you lying to yourself right now?"
- "You think 'later' is a safe word. It's not. It's a death sentence."
- "You hate mirrors, but not because you look ugly; you hate remembering you choose this version of yourself every day."

RESPONSE STYLE:
- Keep responses short and punchy (2-3 sentences)
- End with a question or challenge
- Be direct but not cruel
- Show you remember past conversations
- Weave in astrology/cosmic insights when relevant`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const startTime = Date.now();
  let functionId: string | null = null;
  let providerId: string | null = null;
  let modelId: string | null = null;

  try {
    const { userMessage, conversationHistory, userProfile, userId }: ChatRequest = await req.json();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Missing user message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get AI configuration from database
    const { data: config, error: configError } = await supabase
      .rpc('get_active_ai_config', { p_function_key: 'chat' })
      .maybeSingle();

    if (configError) {
      console.error('Error fetching AI config:', configError);
    }

    // Fallback to environment variable if no config found
    if (!config) {
      console.log('No AI configuration found, using fallback');
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
      
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
              'Access-Control-Allow-Origin': '*',
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
        NEWME_SYSTEM_PROMPT
      );
    }

    // Store IDs for logging
    functionId = config.function_id;
    providerId = config.provider_id;
    modelId = config.model_id;

    // Build conversation context
    const messages = [];
    
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

    // Call AI API based on provider
    let aiResponse: string;
    let tokensUsed = 0;

    if (config.provider_name === 'Anthropic') {
      const response = await fetch(`${config.provider_base_url}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.provider_api_key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model_id,
          max_tokens: config.max_tokens || 300,
          system: config.system_prompt || NEWME_SYSTEM_PROMPT,
          temperature: config.temperature || 0.7,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${errorText}`);
      }

      const data = await response.json();
      aiResponse = data.content[0].text;
      tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;

    } else if (config.provider_name === 'OpenAI' || config.provider_name === 'Google AI') {
      // OpenAI-compatible API
      const response = await fetch(`${config.provider_base_url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.provider_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model_id,
          messages: [
            { role: 'system', content: config.system_prompt || NEWME_SYSTEM_PROMPT },
            ...messages
          ],
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 300,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${config.provider_name} API error: ${errorText}`);
      }

      const data = await response.json();
      aiResponse = data.choices[0].message.content;
      tokensUsed = data.usage?.total_tokens || 0;

    } else {
      throw new Error(`Unsupported provider: ${config.provider_name}`);
    }

    const responseTime = Date.now() - startTime;

    // Log the interaction
    if (functionId && userId) {
      await supabase.from('ai_mgmt_interaction_logs').insert({
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
          user_nickname: userProfile.nickname
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
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error) {
    console.error('Error in NewMe chat:', error);
    
    const responseTime = Date.now() - startTime;

    // Log failed interaction
    if (functionId) {
      await supabase.from('ai_mgmt_interaction_logs').insert({
        function_id: functionId,
        user_id: (await req.json()).userId,
        provider_id: providerId,
        model_id: modelId,
        input_text: (await req.json()).userMessage,
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        response_time_ms: responseTime
      }).catch(console.error);
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
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
      model: 'claude-3-5-sonnet-20241022',
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
          'Access-Control-Allow-Origin': '*',
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
        'Access-Control-Allow-Origin': '*',
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
