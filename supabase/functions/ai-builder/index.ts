import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// TypeScript interfaces for AI Builder
interface AssessmentRequest {
  topic: string;
  category: 'personality' | 'relationships' | 'career' | 'wellness' | 'astrology' | 'shadow work';
  target_audience: 'visitor' | 'authenticated' | 'both';
  question_count: number;
  ai_model: string;
  question_types: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
}

interface ResourceRequest {
  resource_type: 'article' | 'guide' | 'exercise' | 'video' | 'audio';
  topic: string;
  target_audience: string;
  content_length: 'short' | 'medium' | 'long';
  tone: string;
  include_ai_content: boolean;
}

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'yes_no';
  options?: string[];
  min?: number;
  max?: number;
  scoring_weights?: Record<string, number>;
}

interface ScoringLogic {
  type: 'category_based' | 'trait_based' | 'numeric';
  categories?: Record<string, string>;
  traits?: Record<string, string>;
  weights?: Record<string, number>;
}

interface ResultCategory {
  id: string;
  title: string;
  description: string;
  score_range: [number, number];
  interpretation: string;
  recommendations: string[];
}

interface GeneratedAssessment {
  title: string;
  description: string;
  questions: Question[];
  scoring_logic: ScoringLogic;
  result_categories: ResultCategory[];
  estimated_duration: number;
  target_audience: string;
  difficulty_level: string;
  tags: string[];
  ai_model_used: string;
}

interface GeneratedResource {
  title: string;
  description: string;
  content: string;
  metadata: Record<string, unknown>;
  estimated_duration?: number;
  tags: string[];
  ai_model_used: string;
}

interface AIProvider {
  api_url: string;
  api_key: string;
}

// Helper function to get AI provider and model
async function getAiProvider(): Promise<AIProvider> {
  const { data: providers } = await supabase
    .from('api_providers')
    .select('*')
    .eq('type', 'ai_chat')
    .eq('is_active', true);
  
  if (!providers || providers.length === 0) {
    throw new Error('No active AI chat providers configured');
  }
  
  const provider = providers[0] as { api_url: string; api_key: string };
  if (!provider.api_url || !provider.api_key) {
    throw new Error('Provider missing API URL or API key');
  }
  
  return {
    api_url: provider.api_url,
    api_key: provider.api_key,
  };
}

interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Helper function to call AI model
async function callAiModel(provider: AIProvider, model: string, prompt: string, systemPrompt: string = '') {
  try {
    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI model call failed: ${response.statusText}`);
    }

    const data: AIResponse = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling AI model:', error);
    throw error;
  }
}

// Generate assessment using AI
async function generateAssessment(request: AssessmentRequest): Promise<GeneratedAssessment> {
  const provider = await getAiProvider();
  
  const systemPrompt = `You are an expert assessment designer with deep knowledge of psychology, personality theory, and wellness coaching. 
Create high-quality, scientifically-grounded assessments that provide meaningful insights.

NewMe Personality System Guidelines:
- Maintain consistency with NewMe's holistic approach to personal development
- Focus on growth, self-awareness, and empowerment
- Include questions that promote reflection and actionable insights
- Ensure questions are inclusive and avoid stereotypes
- Use warm, supportive language that encourages honest self-reflection

Assessment Requirements:
- Generate exactly ${request.question_count} questions
- Questions must be relevant to the topic: "${request.topic}"
- Category: ${request.category}
- Target audience: ${request.target_audience}
- Difficulty level: ${request.difficulty_level}
- Question types to include: ${request.question_types.join(', ')}

Return the assessment as a JSON object with this structure:
{
  "title": "Assessment Title",
  "description": "Clear, engaging description of the assessment purpose and what users will learn",
  "questions": [
    {
      "question": "Question text",
      "type": "multiple_choice|scale|text|yes_no",
      "options": ["option1", "option2"] (for multiple choice),
      "min": 1, (for scale)
      "max": 5, (for scale)
      "scoring_weights": {"option1": 1, "option2": 2} (for scoring)
    }
  ],
  "scoring_logic": {
    "type": "category_based",
    "categories": {
      "introvert": "Score 1-3: Introverted traits",
      "extrovert": "Score 4-5: Extroverted traits"
    }
  },
  "result_categories": [
    {
      "title": "Category Name",
      "description": "Category description",
      "score_range": [1, 3],
      "interpretation": "What this means for the user",
      "recommendations": ["Actionable recommendation 1", "Recommendation 2"]
    }
  ],
  "tags": ["tag1", "tag2"],
  "estimated_duration": ${request.estimated_duration}
}`;

  const prompt = `Create a comprehensive ${request.category} assessment about "${request.topic}" for ${request.target_audience} users. 
The assessment should be ${request.difficulty_level} level and take approximately ${request.estimated_duration} minutes to complete.

Focus on providing meaningful insights that help users understand themselves better and take positive action in their lives.`;

  const aiResponse = await callAiModel(provider, request.ai_model, prompt, systemPrompt);
  
  try {
    const assessment = JSON.parse(aiResponse);
    
    // Add metadata
    assessment.ai_model_used = request.ai_model;
    assessment.target_audience = request.target_audience;
    assessment.difficulty_level = request.difficulty_level;
    
    return assessment;
  } catch (_error) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

// Generate wellness resource using AI
async function generateResource(request: ResourceRequest): Promise<GeneratedResource> {
  const provider = await getAiProvider();
  
  const systemPrompt = `You are an expert wellness coach and content creator specializing in ${request.resource_type}s.
Create high-quality, actionable wellness content that aligns with NewMe's holistic approach.

NewMe Wellness Guidelines:
- Focus on practical, implementable advice
- Promote mental health and emotional wellbeing
- Use inclusive, non-judgmental language
- Include mindfulness and self-reflection elements
- Provide concrete next steps and actionable recommendations

Content Requirements:
- Resource type: ${request.resource_type}
- Topic: "${request.topic}"
- Target audience: ${request.target_audience}
- Content length: ${request.content_length}
- Tone: ${request.tone}

Return the content as a JSON object with this structure:
{
  "title": "Resource Title",
  "description": "Brief description of the resource",
  "content": "The full content of the resource",
  "metadata": {
    "estimated_reading_time": 5,
    "difficulty": "beginner|intermediate|advanced",
    "category": "wellness"
  },
  "tags": ["tag1", "tag2"]
}`;

  const prompt = `Create a ${request.resource_type} about "${request.topic}" for ${request.target_audience} users. 
The content should be ${request.content_length} in length with a ${request.tone} tone.`;

  const aiResponse = await callAiModel(provider, "gpt-4o-mini", prompt, systemPrompt);
  
  try {
    const resource = JSON.parse(aiResponse);
    resource.ai_model_used = "gpt-4o-mini";
    return resource;
  } catch (_error) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

// Main serve function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, ...requestData } = await req.json();

    if (!type) {
      return new Response(
        JSON.stringify({ error: "Request type is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    let result;
    
    switch (type) {
      case 'assessment':
        result = await generateAssessment(requestData as AssessmentRequest);
        break;
        
      case 'resource':
        result = await generateResource(requestData as ResourceRequest);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: `Unknown request type: ${type}` }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
    }

    // Log the interaction for analytics
    try {
      await supabase
        .from('ai_interaction_logs')
        .insert({
          function_id: 'ai-builder',
          provider_id: 'ai-builder',
          model_id: requestData.ai_model || 'gpt-4o-mini',
          input_text: JSON.stringify(requestData),
          output_text: JSON.stringify(result),
          status: 'success',
          tokens_used: null,
          response_time_ms: null,
        });
    } catch (logError) {
      console.error('Failed to log interaction:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error('AI Builder error:', error);
    
    // Log failed interaction
    try {
      await supabase
        .from('ai_interaction_logs')
        .insert({
          function_id: 'ai-builder',
          provider_id: 'ai-builder',
          model_id: 'gpt-4o-mini',
          input_text: '',
          output_text: '',
          status: 'error',
          error_message: error instanceof Error ? error.message : String(error),
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate content',
        message: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});