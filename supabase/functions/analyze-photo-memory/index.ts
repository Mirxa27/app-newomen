import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getApiKey } from '../_shared/get-api-key.ts';

interface PhotoAnalysisRequest {
  photoUrl: string;
  userId: string;
  context?: string;
  userMessage?: string;
}

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

  try {
    const { photoUrl, userId, context, userMessage }: PhotoAnalysisRequest = await req.json();

    if (!photoUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing photoUrl or userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, sun_sign, moon_sign, rising_sign, personality_traits')
      .eq('id', userId)
      .maybeSingle();

    // Get user's recent memories for context
    const { data: recentMemories } = await supabase
      .from('newme_memories')
      .select('memory_text, emotion_tags, memory_themes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Build context for AI analysis
    const analysisContext = `
User Context:
- Nickname: ${profile?.nickname || 'User'}
- Sun Sign: ${profile?.sun_sign || 'Unknown'}
- Moon Sign: ${profile?.moon_sign || 'Unknown'}
- Rising Sign: ${profile?.rising_sign || 'Unknown'}
${context ? `- Context: ${context}` : ''}
${userMessage ? `- User Message: ${userMessage}` : ''}

Recent Emotional Patterns:
${recentMemories?.map(m => `- ${m.memory_text} (Emotions: ${m.emotion_tags?.join(', ') || 'none'}, Themes: ${m.memory_themes?.join(', ') || 'none'})`).join('\n') || 'No recent memories'}

Analyze this photo that the user shared because it made them feel good. Determine:
1. Why they liked this moment/photo (be specific and psychological)
2. What emotions it evokes (joy, peace, nostalgia, empowerment, etc.)
3. What themes it represents (nature, connection, achievement, beauty, etc.)
4. How it relates to their personality patterns
5. What deeper meaning or need it might represent

Return as JSON with: why_they_liked_it, emotions (array), themes (array), personality_insight, deeper_meaning
`;

    // Use OpenAI Vision API or Anthropic with image support
    const openaiApiKey = await getApiKey('OpenAI', 'OPENAI_API_KEY');
    const anthropicApiKey = await getApiKey('Anthropic', 'ANTHROPIC_API_KEY');

    let analysis: Record<string, unknown> = {};

    if (openaiApiKey) {
      // Use OpenAI Vision API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: analysisContext + '\n\nAnalyze this photo and return JSON only with the requested fields.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: photoUrl,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        try {
          analysis = JSON.parse(content);
        } catch (e) {
          console.error('Error parsing OpenAI response:', e);
        }
      }
    } else if (anthropicApiKey) {
      // Use Anthropic Claude with image support
      // Note: Anthropic requires base64 encoding for images
      // For now, use text-only analysis
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 500,
          system: 'You are an expert at analyzing photos and understanding why people are drawn to certain images. Return only valid JSON.',
          messages: [{
            role: 'user',
            content: `${analysisContext}\n\nPhoto URL: ${photoUrl}\n\nAnalyze this photo and return JSON with: why_they_liked_it, emotions (array), themes (array), personality_insight, deeper_meaning`,
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0].text;
        try {
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Error parsing Anthropic response:', e);
        }
      }
    }

    // Fallback analysis if AI fails
    if (!analysis.why_they_liked_it) {
      analysis = {
        why_they_liked_it: 'This moment captured something meaningful to you - perhaps a feeling of peace, connection, or beauty that resonated with your inner state.',
        emotions: ['contentment', 'appreciation'],
        themes: ['moment', 'feeling'],
        personality_insight: 'You are drawn to moments that make you feel good, which suggests you value authentic experiences and emotional resonance.',
        deeper_meaning: 'This photo represents a moment of alignment with what truly matters to you.',
      };
    }

    // Ensure required fields
    analysis = {
      why_they_liked_it: analysis.why_they_liked_it || 'This moment resonated with you on a deeper level.',
      emotions: Array.isArray(analysis.emotions) ? analysis.emotions : ['contentment'],
      themes: Array.isArray(analysis.themes) ? analysis.themes : ['moment'],
      personality_insight: analysis.personality_insight || 'This choice reflects your values and emotional needs.',
      deeper_meaning: analysis.deeper_meaning || 'This represents something important to you.',
      analyzed_at: new Date().toISOString(),
      photo_url: photoUrl,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis 
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
    console.error('Error analyzing photo:', error);
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

