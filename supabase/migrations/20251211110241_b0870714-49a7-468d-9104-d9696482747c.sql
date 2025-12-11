-- Add marks column to questions table
ALTER TABLE public.questions ADD COLUMN marks integer NOT NULL DEFAULT 1;