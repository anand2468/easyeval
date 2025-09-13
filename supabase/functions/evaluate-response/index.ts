import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { responseId, imageUrl } = await req.json();

    console.log('Evaluating response:', responseId);

    // Simulate AI evaluation with random scoring
    const marks = Math.floor(Math.random() * 101); // 0-100
    const remarks = [
      "Good attempt with clear explanations",
      "Excellent work with minor calculation errors", 
      "Needs improvement in methodology",
      "Outstanding performance across all sections",
      "Partial credit for showing work steps",
      "Well structured answers with good reasoning"
    ][Math.floor(Math.random() * 6)];

    // Update the response with evaluation results
    const { error: updateError } = await supabaseClient
      .from('responses')
      .update({
        marks: marks,
        remarks: remarks,
        evaluated_at: new Date().toISOString()
      })
      .eq('id', responseId);

    if (updateError) throw updateError;

    console.log('Response evaluated successfully:', { responseId, marks, remarks });

    return new Response(
      JSON.stringify({ 
        success: true, 
        marks, 
        remarks 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Evaluation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});