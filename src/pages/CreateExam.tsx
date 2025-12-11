import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  questionText: string;
  answerKey: string;
  marks: number;
}

const CreateExam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', questionText: '', answerKey: '', marks: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([...questions, { id: newId, questionText: '', answerKey: '', marks: 1 }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: 'questionText' | 'answerKey' | 'marks', value: string | number) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create an exam');
      return;
    }

    if (questions.some(q => !q.questionText.trim() || !q.answerKey.trim())) {
      toast.error('Please fill in all question fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the exam
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          user_id: user.id,
          title: examTitle.trim(),
          description: examDescription.trim(),
        })
        .select()
        .single();

      if (examError) throw examError;

      // Create the questions
      const questionsToInsert = questions.map((question, index) => ({
        exam_id: exam.id,
        question_text: question.questionText.trim(),
        answer_key: question.answerKey.trim(),
        question_number: index + 1,
        marks: question.marks,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast.success('Exam created successfully!');
      navigate(`/exam/${exam.id}`);
    } catch (error: any) {
      toast.error('Failed to create exam: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card academic-gradient-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <GraduationCap className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-2xl font-bold text-primary">Create New Exam</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="academic-card">
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>
              Create a new exam with questions and answer keys for evaluation
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Exam Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Exam Title *</Label>
                  <Input
                    id="title"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g., Mathematics Final Exam 2024"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    placeholder="Brief description of the exam content and objectives"
                    rows={3}
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Questions & Answer Keys</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={question.id} className="academic-card bg-muted/50">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          {questions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(question.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor={`question-${question.id}`}>Question Text *</Label>
                          <Textarea
                            id={`question-${question.id}`}
                            value={question.questionText}
                            onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                            placeholder="Enter the question text..."
                            rows={2}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`answer-${question.id}`}>Answer Key *</Label>
                          <Textarea
                            id={`answer-${question.id}`}
                            value={question.answerKey}
                            onChange={(e) => updateQuestion(question.id, 'answerKey', e.target.value)}
                            placeholder="Enter the correct answer or key points..."
                            rows={2}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`marks-${question.id}`}>Marks *</Label>
                          <Input
                            id={`marks-${question.id}`}
                            type="number"
                            min={1}
                            value={question.marks}
                            onChange={(e) => updateQuestion(question.id, 'marks', parseInt(e.target.value) || 1)}
                            placeholder="Enter marks for this question"
                            className="w-32"
                            required
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !examTitle.trim()}
                  className="academic-gradient text-white shadow-[var(--shadow-primary)]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Exam...
                    </div>
                  ) : (
                    'Create Exam'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateExam;