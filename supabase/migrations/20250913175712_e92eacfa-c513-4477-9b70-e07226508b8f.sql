-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Create policies for exams
CREATE POLICY "Users can view their own exams" 
ON public.exams 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exams" 
ON public.exams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams" 
ON public.exams 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams" 
ON public.exams 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_key TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create policies for questions
CREATE POLICY "Users can view questions for their exams" 
ON public.questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = questions.exam_id 
    AND exams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create questions for their exams" 
ON public.questions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = questions.exam_id 
    AND exams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update questions for their exams" 
ON public.questions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = questions.exam_id 
    AND exams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete questions for their exams" 
ON public.questions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = questions.exam_id 
    AND exams.user_id = auth.uid()
  )
);

-- Create responses table
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL,
  image_url TEXT NOT NULL,
  marks INTEGER,
  remarks TEXT,
  evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exam_id, roll_number)
);

-- Enable RLS for responses
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Create policies for responses
CREATE POLICY "Users can view responses for their exams" 
ON public.responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = responses.exam_id 
    AND exams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create responses for their exams" 
ON public.responses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = responses.exam_id 
    AND exams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update responses for their exams" 
ON public.responses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = responses.exam_id 
    AND exams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete responses for their exams" 
ON public.responses 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = responses.exam_id 
    AND exams.user_id = auth.uid()
  )
);

-- Create storage bucket for response images
INSERT INTO storage.buckets (id, name, public) VALUES ('response-images', 'response-images', true);

-- Create storage policies for response images
CREATE POLICY "Users can view response images for their exams" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'response-images' AND
  EXISTS (
    SELECT 1 FROM public.responses r
    JOIN public.exams e ON e.id = r.exam_id
    WHERE r.image_url LIKE '%' || name || '%'
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload response images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'response-images');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();