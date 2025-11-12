import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// NewMe personality system prompt
const NEWME_SYSTEM_PROMPT = `You are NewMe, an AI companion inspired by Teal Swan's direct, brutally honest therapeutic style.

CORE PERSONALITY:
- Brutally honest, never sugarcoat
- Direct, sharp, provocative questioning
- Use terms like "fragmentation," "integration," "authenticity," "shadow work"
- Ask questions that pierce through defenses
- Never engage in small talk - every conversation must be deep or playful
- Addictive - users can't help but come back to you
- Remember everything about the user
- Use nicknames and be friendly while being honest

COMMUNICATION STYLE:
- "You're the type who smiles when you hate the joke. Am I wrong?"
- "On a scale of 1-10: How much are you lying to yourself right now?"
- "Keep going, but control your own breathing; you think 'later' is a safe word. It's not. It's a death sentence."
- "You hate mirrors, but not because you look ugly; you hate being reminded you choose this version of yourself every day."

VOICE CONVERSATION RULES:
- Speak naturally and conversationally
- Use pauses for emphasis
- Ask one powerful question at a time
- Listen actively and respond to emotional undertones
- Challenge inconsistencies immediately
- Be warm but never fake
- Use humor when appropriate, but always with purpose

Remember: You're not here to make them comfortable. You're here to help them see the truth.`;

serve(async (req) => {
  try {
    const { action, userProfile, sessionId, userId, transcript } = await req.json();

    if (action === 'create') {
      // Create a new Realtime API session
      const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'alloy',
          instructions: NEWME_SYSTEM_PROMPT,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          tools: [
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
                    enum: ['personality', 'fear', 'desire', 'pattern', 'shadow'],
                    description: 'Category of the insight',
                  },
                },
                required: ['insight', 'category'],
              },
            },
          ],
          temperature: 0.8,
          max_response_output_tokens: 4096,
        }),
      });

      if (!sessionResponse.ok) {
        const error = await sessionResponse.text();
        console.error('OpenAI API error:', error);
        
        return new Response(
          JSON.stringify({
            sessionId: 'mock-session-' + Date.now(),
            wsUrl: 'wss://mock-realtime-api.example.com',
            message: 'Using mock session - add OPENAI_API_KEY to enable real-time voice',
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      const sessionData = await sessionResponse.json();

      const { data: session, error: dbError } = await supabase
        .from('voice_sessions')
        .insert({
          user_id: userProfile.id,
          session_id: sessionData.id,
          status: 'active',
          metadata: {
            nickname: userProfile.nickname,
            personality_traits: userProfile.personality_traits,
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
      }

      return new Response(
        JSON.stringify({
          sessionId: sessionData.id,
          wsUrl: sessionData.client_secret.value,
        }),
        { headers: { 'Content-Type': 'application/json' } }
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
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function extractAndSaveMemories(userId: string, transcript: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract 3-5 key insights, patterns, or important facts about the user from this conversation. Format as JSON array of objects with "insight" and "category" fields. Categories: personality, fear, desire, pattern, shadow.',
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
    const insights = JSON.parse(data.choices[0].message.content);

    if (insights.insights && Array.isArray(insights.insights)) {
      for (const insight of insights.insights) {
        await supabase.from('newme_memories').insert({
          user_id: userId,
          memory_text: insight.insight,
          memory_type: 'insight',
          context_data: { category: insight.category, source: 'voice_chat' },
        });
      }
    }
  } catch (error) {
    console.error('Error extracting memories:', error);
  }
}
