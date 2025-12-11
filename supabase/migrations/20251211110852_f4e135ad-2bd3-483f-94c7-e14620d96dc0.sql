-- Create response_answers table for individual question answers
CREATE TABLE public.response_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  image_url TEXT,
  answer_text TEXT,
  marks INTEGER,
  remarks TEXT,
  evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(response_id, question_id)
);

-- Enable RLS
ALTER TABLE public.response_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for response_answers
CREATE POLICY "Users can view response answers for their exams"
ON public.response_answers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM responses r
  JOIN exams e ON e.id = r.exam_id
  WHERE r.id = response_answers.response_id AND e.user_id = auth.uid()
));

CREATE POLICY "Users can create response answers for their exams"
ON public.response_answers
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM responses r
  JOIN exams e ON e.id = r.exam_id
  WHERE r.id = response_answers.response_id AND e.user_id = auth.uid()
));

CREATE POLICY "Users can update response answers for their exams"
ON public.response_answers
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM responses r
  JOIN exams e ON e.id = r.exam_id
  WHERE r.id = response_answers.response_id AND e.user_id = auth.uid()
));

CREATE POLICY "Users can delete response answers for their exams"
ON public.response_answers
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM responses r
  JOIN exams e ON e.id = r.exam_id
  WHERE r.id = response_answers.response_id AND e.user_id = auth.uid()
));

-- Make image_url nullable in responses table since individual answers will have their own images/text
ALTER TABLE public.responses ALTER COLUMN image_url DROP NOT NULL;