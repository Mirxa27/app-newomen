import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface BatchAnalyzeRequest {
  functionKey?: string;
  limit?: number;
  analysisType?: 'error_detection' | 'quality_check' | 'improvement_suggestion';
  onlyErrors?: boolean;
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
    const { 
      functionKey, 
      limit = 10, 
      analysisType = 'quality_check',
      onlyErrors = false 
    }: BatchAnalyzeRequest = await req.json();

    // Build query
    let query = supabase
      .from('ai_mgmt_interaction_logs')
      .select('id, created_at, status')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by function if specified
    if (functionKey) {
      const { data: funcData } = await supabase
        .from('ai_mgmt_functions')
        .select('id')
        .eq('function_key', functionKey)
        .maybeSingle();

      if (funcData) {
        query = query.eq('function_id', funcData.id);
      }
    }

    // Filter by status if only errors
    if (onlyErrors) {
      query = query.eq('status', 'error');
    }

    // Get interactions to analyze
    const { data: interactions, error: interactionsError } = await query;

    if (interactionsError) {
      throw interactionsError;
    }

    if (!interactions || interactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No interactions found to analyze',
          analyzed: 0
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

    // Check which interactions already have reports
    const { data: existingReports } = await supabase
      .from('ai_mgmt_supervisor_reports')
      .select('analyzed_interaction_id')
      .in('analyzed_interaction_id', interactions.map(i => i.id));

    const existingReportIds = new Set(existingReports?.map(r => r.analyzed_interaction_id) || []);
    const toAnalyze = interactions.filter(i => !existingReportIds.has(i.id));

    if (toAnalyze.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All interactions already analyzed',
          analyzed: 0,
          skipped: interactions.length
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

    // Analyze each interaction by calling the supervisor-analyze function
    const results = [];
    const errors = [];

    for (const interaction of toAnalyze) {
      try {
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/supervisor-analyze`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({
              interactionId: interaction.id,
              analysisType
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.push({
            interactionId: interaction.id,
            success: true,
            reportId: data.report?.id
          });
        } else {
          const errorText = await response.text();
          errors.push({
            interactionId: interaction.id,
            error: errorText
          });
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        errors.push({
          interactionId: interaction.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analyzed: results.length,
        failed: errors.length,
        skipped: interactions.length - toAnalyze.length,
        results,
        errors: errors.length > 0 ? errors : undefined
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
    console.error('Error in batch supervisor analysis:', error);
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
