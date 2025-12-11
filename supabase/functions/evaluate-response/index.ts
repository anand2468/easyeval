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

    const { responseId } = await req.json();

    console.log('Evaluating response:', responseId);

    // Fetch response answers
    const { data: responseAnswers, error: answersError } = await supabaseClient
      .from('response_answers')
      .select(`
        id,
        question_id,
        image_url,
        answer_text,
        questions!inner(marks, answer_key)
      `)
      .eq('response_id', responseId);

    if (answersError) {
      console.error('Error fetching response answers:', answersError);
      throw answersError;
    }

    console.log('Found response answers:', responseAnswers?.length || 0);

    let totalMarks = 0;
    const allRemarks: string[] = [];

    // Evaluate each answer
    for (const answer of (responseAnswers || [])) {
      const maxMarks = (answer as any).questions?.marks || 1;
      
      // Simulate AI evaluation with random scoring based on max marks
      const earnedMarks = Math.floor(Math.random() * (maxMarks + 1));
      const remarks = [
        "Good attempt with clear explanations",
        "Excellent work with minor errors", 
        "Needs improvement in methodology",
        "Outstanding performance",
        "Partial credit for showing work",
        "Well structured answer"
      ][Math.floor(Math.random() * 6)];

      // Update individual answer
      const { error: updateAnswerError } = await supabaseClient
        .from('response_answers')
        .update({
          marks: earnedMarks,
          remarks: remarks,
          evaluated_at: new Date().toISOString()
        })
        .eq('id', answer.id);

      if (updateAnswerError) {
        console.error('Error updating answer:', updateAnswerError);
      }

      totalMarks += earnedMarks;
      allRemarks.push(`Q${answer.question_id.slice(0, 4)}: ${remarks}`);
    }

    // Update the main response with total marks
    const { error: updateError } = await supabaseClient
      .from('responses')
      .update({
        marks: totalMarks,
        remarks: `Total: ${totalMarks} marks. ${allRemarks.length} questions evaluated.`,
        evaluated_at: new Date().toISOString()
      })
      .eq('id', responseId);

    if (updateError) throw updateError;

    console.log('Response evaluated successfully:', { responseId, totalMarks });

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalMarks,
        answersEvaluated: responseAnswers?.length || 0
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
