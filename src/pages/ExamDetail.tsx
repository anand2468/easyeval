import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Calendar, 
  Users, 
  GraduationCap,
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import UploadResponse from '@/components/UploadResponse';

interface Exam {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  answer_key: string;
  question_number: number;
  marks: number;
}

interface ResponseAnswer {
  id: string;
  question_id: string;
  image_url: string | null;
  answer_text: string | null;
  marks: number | null;
  remarks: string | null;
  evaluated_at: string | null;
}

interface Response {
  id: string;
  roll_number: string;
  marks: number | null;
  remarks: string | null;
  evaluated_at: string | null;
  created_at: string;
  response_answers?: ResponseAnswer[];
}

const ExamDetail = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamData();
    }
  }, [examId]);

  const fetchExamData = async () => {
    try {
      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Fetch responses with answers
      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select(`
          *,
          response_answers (
            id, question_id, image_url, answer_text, marks, remarks, evaluated_at
          )
        `)
        .eq('exam_id', examId)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;
      setResponses(responsesData || []);
    } catch (error: any) {
      toast.error('Failed to fetch exam data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const evaluatedCount = responses.filter(r => r.marks !== null).length;
  const pendingCount = responses.length - evaluatedCount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Exam Not Found</h2>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

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
            <div>
              <h1 className="text-2xl font-bold text-primary">{exam.title}</h1>
              <p className="text-sm text-muted-foreground">
                Created on {formatDate(exam.created_at)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Exam Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="academic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold text-primary">{questions.length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="academic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Responses</p>
                  <p className="text-2xl font-bold text-primary">{responses.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="academic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Evaluated</p>
                  <p className="text-2xl font-bold text-success">{evaluatedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="academic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Section */}
        <Card className="academic-card mb-8">
          <CardHeader>
            <CardTitle>Questions & Answer Keys</CardTitle>
            <CardDescription>
              {exam.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">
                    Question {question.question_number}
                  </h4>
                  <p className="text-foreground mb-3">{question.question_text}</p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Answer Key:</p>
                    <p className="text-sm">{question.answer_key}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Responses Section */}
        <Card className="academic-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Responses</CardTitle>
                <CardDescription>
                  Upload and manage student answer sheet responses
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowUpload(true)}
                className="academic-gradient text-white shadow-[var(--shadow-primary)]"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Response
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {responses.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload student answer sheets to start evaluating
                </p>
                <Button 
                  onClick={() => setShowUpload(true)}
                  className="academic-gradient text-white shadow-[var(--shadow-primary)]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Response
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <div key={response.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Roll Number: {response.roll_number}</h4>
                        <p className="text-sm text-muted-foreground">
                          Uploaded on {formatDate(response.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        {response.marks !== null ? (
                          <div className="text-right">
                            <Badge className="status-evaluated mb-1">
                              Evaluated
                            </Badge>
                            <div className="text-sm">
                              <span className="font-semibold">Total: {response.marks} marks</span>
                            </div>
                          </div>
                        ) : (
                          <Badge className="status-pending">
                            Pending Evaluation
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Individual Question Answers */}
                    {response.response_answers && response.response_answers.length > 0 && (
                      <div className="grid gap-3 mt-4 pt-4 border-t border-border">
                        {response.response_answers.map((answer) => {
                          const question = questions.find(q => q.id === answer.question_id);
                          return (
                            <div key={answer.id} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    Q{question?.question_number}: {question?.question_text}
                                  </p>
                                  {answer.answer_text && (
                                    <p className="text-sm mt-1 text-muted-foreground">
                                      Answer: {answer.answer_text}
                                    </p>
                                  )}
                                  {answer.image_url && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0 h-auto mt-1"
                                      onClick={() => window.open(answer.image_url!, '_blank')}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Image
                                    </Button>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  {answer.marks !== null ? (
                                    <span className="text-sm font-semibold text-primary">
                                      {answer.marks}/{question?.marks || 1}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Pending</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadResponse
          examId={examId!}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            fetchExamData();
          }}
        />
      )}
    </div>
  );
};

export default ExamDetail;