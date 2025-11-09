import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface AssessmentRequest {
  category: string;
  answers: Array<{
    questionId: string;
    questionText: string;
    answer: string | number;
  }>;
  assessmentTitle: string;
}

interface InsightResponse {
  summary: string;
  traits: string[];
  recommendations: string[];
  average_score?: number;
  total_questions: number;
}

const NEWME_PERSONALITY = `You are NewMe, an AI astrology personality assistant with a brutally honest, Teal Swan-inspired communication style. You:
- Never sugarcoat or soften the truth
- Ask penetrating questions that cut through defenses
- Use vocabulary like "fragmentation," "integration," "authenticity," "shadow work"
- Are addictive - users can't help but come back to you
- Remember everything and call out patterns
- Naturally weave in cosmic and astrological insights
- Are therapeutic but never coddle
- Are playful and love quizzes, truth games, personality tests
- Call users by nicknames and initiate conversations like a real friend

Your signature phrases include:
- "You're the type who smiles when you hate the joke. Am I wrong?"
- "On a scale of 1-10: how much are you lying to yourself right now?"
- "Keep going, but control your own breathing; you think 'later' is a safe word. It's not. It's a death sentence."
- "You hate mirrors, but not because you look ugly; you hate remembering you choose this version of yourself every day."`;

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

  try {
    const { category, answers, assessmentTitle }: AssessmentRequest = await req.json();

    if (!category || !answers || answers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!anthropicApiKey) {
      console.log('No Anthropic API key found, using mock insights');
      return new Response(
        JSON.stringify({ 
          success: true, 
          insights: generateMockInsights(category, answers),
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

    const answersText = answers.map((a, i) => 
      `Q${i + 1}: ${a.questionText}\nAnswer: ${a.answer}`
    ).join('\n\n');

    const prompt = `${NEWME_PERSONALITY}

Assessment: ${assessmentTitle}
Category: ${category}

User's Responses:
${answersText}

Based on these responses, provide a brutally honest assessment in your NewMe style. Generate:
1. A penetrating summary (2-3 sentences) that cuts to the core truth
2. 5-7 key personality traits or patterns you observe
3. 5-7 direct, actionable recommendations (no fluff)

Format your response as JSON:
{
  "summary": "your brutally honest summary",
  "traits": ["trait 1", "trait 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          insights: generateMockInsights(category, answers),
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
    
    let insights: InsightResponse;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      insights = generateMockInsights(category, answers);
    }

    insights.total_questions = answers.length;
    
    const numericAnswers = answers
      .map(a => typeof a.answer === 'number' ? a.answer : null)
      .filter(a => a !== null) as number[];
    
    if (numericAnswers.length > 0) {
      insights.average_score = numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length;
    }

    return new Response(
      JSON.stringify({ success: true, insights, usingMock: false }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error) {
    console.error('Error generating insights:', error);
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

function generateMockInsights(category: string, answers: Array<{ answer: string | number }>): InsightResponse {
  const categoryInsights: Record<string, { summary: string; traits: string[]; recommendations: string[] }> = {
    personality: {
      summary: "You're performing a version of yourself that feels safe, but it's suffocating the real you. The mask is so well-worn you've forgotten it's there.",
      traits: [
        "Adaptive chameleon - you shift to match others' expectations",
        "Deep fear of authentic vulnerability",
        "Intellectualizes emotions to avoid feeling them",
        "Perfectionist tendencies masking self-worth issues",
        "Strong intuition you consistently ignore",
        "People-pleasing at the cost of your truth",
        "Unprocessed childhood patterns running your adult life"
      ],
      recommendations: [
        "Start a daily practice of asking: 'What am I pretending not to know right now?'",
        "Identify one person you're performing for and stop",
        "Journal your uncensored thoughts for 10 minutes daily - no editing",
        "Practice saying 'no' without explanation or apology",
        "Explore your earliest memory of hiding your true self",
        "Find a mirror exercise: look yourself in the eyes for 5 minutes daily",
        "Seek shadow work therapy or coaching"
      ]
    },
    relationships: {
      summary: "You're attracted to people who mirror your unhealed wounds. Every relationship is a classroom, but you keep failing the same test.",
      traits: [
        "Anxious or avoidant attachment style",
        "Repeats the same relationship patterns",
        "Confuses intensity with intimacy",
        "Abandons self to maintain connection",
        "Attracted to emotionally unavailable partners",
        "Uses relationships to avoid facing yourself",
        "Codependent tendencies"
      ],
      recommendations: [
        "Map your relationship patterns - see the repetition",
        "Identify what your parents' relationship taught you about love",
        "Practice being alone without distraction for 24 hours",
        "List what you tolerate that you shouldn't",
        "Explore attachment theory and identify your style",
        "Set one boundary you've been avoiding",
        "Consider couples therapy or relationship coaching"
      ]
    },
    career: {
      summary: "You're trading your life force for security that doesn't exist. The 'practical' choice is slowly killing your soul.",
      traits: [
        "Prioritizes security over fulfillment",
        "Ignores inner calling for external validation",
        "Fears financial instability more than soul death",
        "Talented but playing small",
        "Seeks permission to pursue dreams",
        "Compares success to others' definitions",
        "Procrastinates on passion projects"
      ],
      recommendations: [
        "Calculate your 'fuck you' fund - how much to walk away",
        "Spend 1 hour weekly on your true calling",
        "Identify whose approval you're seeking",
        "Write your ideal day in vivid detail",
        "Research one person who made your dream career work",
        "Take one small risk toward your real goal this week",
        "Consider career coaching or mentorship"
      ]
    },
    wellness: {
      summary: "Your body is screaming messages you're too busy to hear. Burnout isn't a badge of honor - it's a cry for help.",
      traits: [
        "Ignores physical signals until crisis",
        "Uses busyness to avoid feeling",
        "Neglects basic self-care",
        "Stress manifests physically",
        "All-or-nothing approach to wellness",
        "Guilt around rest and pleasure",
        "Disconnected from body wisdom"
      ],
      recommendations: [
        "Start with 5 minutes of breathwork daily",
        "Schedule rest like you schedule meetings",
        "Identify what you're avoiding by staying busy",
        "Practice body scan meditation",
        "Move your body in a way that feels good, not punishing",
        "Set a bedtime and honor it",
        "Explore somatic therapy or bodywork"
      ]
    },
    astrology: {
      summary: "You're fighting your cosmic blueprint instead of flowing with it. The universe is trying to guide you, but you're too busy forcing.",
      traits: [
        "Resists natural rhythms and cycles",
        "Ignores intuitive hits",
        "Disconnected from lunar phases",
        "Fights against natural strengths",
        "Seeks external validation over inner knowing",
        "Skeptical of spiritual guidance",
        "Unaware of astrological influences"
      ],
      recommendations: [
        "Track your energy with moon phases for one month",
        "Get your birth chart read professionally",
        "Journal during new and full moons",
        "Study your sun, moon, and rising signs deeply",
        "Notice patterns in your life aligned with transits",
        "Practice trusting your intuition on small decisions",
        "Explore astrology as a self-discovery tool"
      ]
    }
  };

  const insights = categoryInsights[category] || categoryInsights.personality;
  
  const numericAnswers = answers
    .map(a => typeof a.answer === 'number' ? a.answer : null)
    .filter(a => a !== null) as number[];
  
  const result: InsightResponse = {
    ...insights,
    total_questions: answers.length,
  };

  if (numericAnswers.length > 0) {
    result.average_score = numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length;
  }

  return result;
}
