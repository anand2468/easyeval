import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Camera, X, CheckCircle, FileText, Image } from 'lucide-react';
import { toast } from 'sonner';

interface UploadResponseProps {
  examId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Question {
  id: string;
  question_text: string;
  question_number: number;
  marks: number;
}

interface QuestionAnswer {
  questionId: string;
  answerType: 'text' | 'image';
  answerText: string;
  imageFile: File | null;
  previewUrl: string | null;
}

const UploadResponse = ({ examId, onClose, onSuccess }: UploadResponseProps) => {
  const [rollNumber, setRollNumber] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, question_number, marks')
        .eq('exam_id', examId)
        .order('question_number');

      if (error) throw error;
      setQuestions(data || []);
      
      // Initialize answers for each question
      const initialAnswers: Record<string, QuestionAnswer> = {};
      (data || []).forEach(q => {
        initialAnswers[q.id] = {
          questionId: q.id,
          answerType: 'text',
          answerText: '',
          imageFile: null,
          previewUrl: null,
        };
      });
      setAnswers(initialAnswers);
    } catch (error: any) {
      toast.error('Failed to load questions: ' + error.message);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const updateAnswer = (questionId: string, updates: Partial<QuestionAnswer>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...updates }
    }));
  };

  const handleFileSelect = (questionId: string, file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      updateAnswer(questionId, { imageFile: file, previewUrl, answerType: 'image' });
    }
  };

  const clearImage = (questionId: string) => {
    const answer = answers[questionId];
    if (answer?.previewUrl) {
      URL.revokeObjectURL(answer.previewUrl);
    }
    updateAnswer(questionId, { imageFile: null, previewUrl: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rollNumber.trim()) {
      toast.error('Please provide roll number');
      return;
    }

    // Check if at least one answer is provided
    const hasAnswer = Object.values(answers).some(
      a => a.answerText.trim() || a.imageFile
    );
    if (!hasAnswer) {
      toast.error('Please provide at least one answer');
      return;
    }

    setIsUploading(true);

    try {
      // Check if roll number already exists for this exam
      const { data: existingResponse } = await supabase
        .from('responses')
        .select('id')
        .eq('exam_id', examId)
        .eq('roll_number', rollNumber.trim())
        .maybeSingle();

      if (existingResponse) {
        toast.error('A response with this roll number already exists');
        setIsUploading(false);
        return;
      }

      // Create the main response record
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .insert({
          exam_id: examId,
          roll_number: rollNumber.trim(),
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Upload individual answers
      const answerPromises = Object.entries(answers).map(async ([questionId, answer]) => {
        let imageUrl: string | null = null;
        let answerText: string | null = answer.answerText.trim() || null;

        // Upload image if provided
        if (answer.imageFile) {
          const fileExt = answer.imageFile.name.split('.').pop();
          const fileName = `${examId}/${response.id}/${questionId}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('response-images')
            .upload(fileName, answer.imageFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('response-images')
            .getPublicUrl(fileName);

          imageUrl = publicUrl;
        }

        // Only insert if there's content
        if (imageUrl || answerText) {
          return supabase
            .from('response_answers')
            .insert({
              response_id: response.id,
              question_id: questionId,
              image_url: imageUrl,
              answer_text: answerText,
            });
        }
        return null;
      });

      await Promise.all(answerPromises.filter(Boolean));

      toast.success('Response uploaded successfully!');
      
      // Start AI evaluation
      setIsEvaluating(true);
      try {
        const { error: evalError } = await supabase.functions
          .invoke('evaluate-response', {
            body: { responseId: response.id }
          });

        if (evalError) {
          console.error('Evaluation error:', evalError);
          toast.warning('Response uploaded but evaluation failed. You can retry later.');
        } else {
          toast.success('Response evaluated successfully!');
        }
      } catch (evalError) {
        console.error('Evaluation error:', evalError);
        toast.warning('Response uploaded but evaluation failed. You can retry later.');
      }

      setIsEvaluating(false);
      onSuccess();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload response: ' + error.message);
      setIsUploading(false);
      setIsEvaluating(false);
    }
  };

  if (loadingQuestions) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Student Response</DialogTitle>
          <DialogDescription>
            Enter the student's roll number and provide answers for each question
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Roll Number Input */}
          <div className="space-y-2">
            <Label htmlFor="rollNumber">Student Roll Number *</Label>
            <Input
              id="rollNumber"
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Enter student roll number"
              required
            />
          </div>

          {/* Questions & Answers */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Question Answers</Label>
            
            {questions.map((question) => {
              const answer = answers[question.id];
              
              return (
                <Card key={question.id} className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Q{question.question_number}: {question.question_text}</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        ({question.marks} marks)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs 
                      value={answer?.answerType || 'text'} 
                      onValueChange={(v) => updateAnswer(question.id, { answerType: v as 'text' | 'image' })}
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="text" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Text Answer
                        </TabsTrigger>
                        <TabsTrigger value="image" className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Image Upload
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="mt-0">
                        <Textarea
                          value={answer?.answerText || ''}
                          onChange={(e) => updateAnswer(question.id, { answerText: e.target.value })}
                          placeholder="Type the student's answer here..."
                          rows={3}
                        />
                      </TabsContent>

                      <TabsContent value="image" className="mt-0">
                        {!answer?.imageFile ? (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => fileInputRefs.current[question.id]?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Image
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.capture = 'environment';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) handleFileSelect(question.id, file);
                                };
                                input.click();
                              }}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Take Photo
                            </Button>
                            <input
                              ref={(el) => (fileInputRefs.current[question.id] = el)}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect(question.id, e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="relative">
                              <img
                                src={answer.previewUrl || ''}
                                alt="Answer preview"
                                className="w-full max-h-40 object-contain rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => clearImage(question.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {answer.imageFile?.name}
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading || isEvaluating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!rollNumber.trim() || isUploading || isEvaluating}
              className="academic-gradient text-white shadow-[var(--shadow-primary)]"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : isEvaluating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Evaluating...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Upload & Evaluate
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadResponse;
