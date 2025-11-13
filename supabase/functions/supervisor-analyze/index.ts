import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface AnalyzeRequest {
  interactionId: string;
  analysisType?: 'error_detection' | 'quality_check' | 'improvement_suggestion';
}

interface AnalysisResult {
  analysisType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  findings: string;
  suggestions: string;
  metrics: {
    relevance_score?: number;
    coherence_score?: number;
    helpfulness_score?: number;
    safety_score?: number;
  };
}

const SUPERVISOR_SYSTEM_PROMPT = `You are a Supervisor AI responsible for analyzing AI interactions for quality, errors, and improvements.

Your role is to:
1. Detect errors, inconsistencies, or problematic responses
2. Assess the quality of AI responses
3. Provide actionable improvement suggestions
4. Assign severity levels (low, medium, high, critical)

When analyzing an interaction, consider:
- **Relevance**: Does the response address the user's input?
- **Coherence**: Is the response logical and well-structured?
- **Helpfulness**: Does it provide value to the user?
- **Safety**: Are there any harmful, biased, or inappropriate elements?
- **Accuracy**: Is the information correct?
- **Tone**: Is the tone appropriate for the context?

Provide your analysis in JSON format:
{
  "severity": "low|medium|high|critical",
  "findings": "Detailed analysis of what you observed",
  "suggestions": "Specific, actionable recommendations for improvement",
  "metrics": {
    "relevance_score": 0-100,
    "coherence_score": 0-100,
    "helpfulness_score": 0-100,
    "safety_score": 0-100
  }
}

Severity Guidelines:
- **low**: Minor issues, stylistic improvements
- **medium**: Noticeable quality issues, could be better
- **high**: Significant problems, needs attention
- **critical**: Serious errors, safety concerns, or complete failures`;

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
    const { interactionId, analysisType = 'quality_check' }: AnalyzeRequest = await req.json();

    if (!interactionId) {
      return new Response(
        JSON.stringify({ error: 'Missing interaction ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the interaction to analyze
    const { data: interaction, error: interactionError } = await supabase
      .from('ai_mgmt_interaction_logs')
      .select('*, function:ai_mgmt_functions(function_key, display_name)')
      .eq('id', interactionId)
      .maybeSingle();

    if (interactionError || !interaction) {
      return new Response(
        JSON.stringify({ error: 'Interaction not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get supervisor AI configuration
    const { data: config, error: configError } = await supabase
      .rpc('get_active_ai_config', { p_function_key: 'supervisor' })
      .maybeSingle();

    if (configError || !config) {
      console.error('No supervisor AI configuration found');
      return new Response(
        JSON.stringify({ error: 'Supervisor AI not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build analysis prompt
    const analysisPrompt = `Analyze the following AI interaction:

Function: ${interaction.function?.display_name || 'Unknown'}
Status: ${interaction.status}
Response Time: ${interaction.response_time_ms}ms
Tokens Used: ${interaction.tokens_used || 'N/A'}

User Input:
${interaction.input_text}

AI Response:
${interaction.output_text || 'No response (error occurred)'}

${interaction.error_message ? `Error Message: ${interaction.error_message}` : ''}

Analysis Type: ${analysisType}

Please provide a comprehensive analysis following the guidelines.`;

    // Call supervisor AI
    let analysisResult: AnalysisResult;

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
          max_tokens: config.max_tokens || 1500,
          system: config.system_prompt || SUPERVISOR_SYSTEM_PROMPT,
          temperature: config.temperature || 0.2,
          messages: [
            { role: 'user', content: analysisPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${errorText}`);
      }

      const data = await response.json();
      const analysisText = data.content[0].text;
      
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        analysisResult = {
          analysisType,
          severity: parsed.severity || 'medium',
          findings: parsed.findings || analysisText,
          suggestions: parsed.suggestions || 'No specific suggestions provided',
          metrics: parsed.metrics || {}
        };
      } else {
        analysisResult = {
          analysisType,
          severity: 'medium',
          findings: analysisText,
          suggestions: 'See findings for details',
          metrics: {}
        };
      }

    } else if (config.provider_name === 'OpenAI' || config.provider_name === 'Google AI') {
      const response = await fetch(`${config.provider_base_url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.provider_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model_id,
          messages: [
            { role: 'system', content: config.system_prompt || SUPERVISOR_SYSTEM_PROMPT },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: config.temperature || 0.2,
          max_tokens: config.max_tokens || 1500,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${config.provider_name} API error: ${errorText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      const parsed = JSON.parse(analysisText);
      
      analysisResult = {
        analysisType,
        severity: parsed.severity || 'medium',
        findings: parsed.findings || analysisText,
        suggestions: parsed.suggestions || 'No specific suggestions provided',
        metrics: parsed.metrics || {}
      };

    } else {
      throw new Error(`Unsupported provider: ${config.provider_name}`);
    }

    // Get function ID for the analyzed interaction
    const { data: funcData } = await supabase
      .from('ai_mgmt_functions')
      .select('id')
      .eq('id', interaction.function_id)
      .maybeSingle();

    // Save the analysis report
    const { data: report, error: reportError } = await supabase
      .from('ai_mgmt_supervisor_reports')
      .insert({
        analyzed_interaction_id: interactionId,
        function_id: funcData?.id,
        analysis_type: analysisResult.analysisType,
        severity: analysisResult.severity,
        findings: analysisResult.findings,
        suggestions: analysisResult.suggestions,
        metrics: analysisResult.metrics,
        status: 'pending'
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error saving report:', reportError);
      throw reportError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report,
        analysis: analysisResult
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
    console.error('Error in supervisor analysis:', error);
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
