import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FileText, 
  Users, 
  Calendar, 
  BookOpen,
  TrendingUp,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

interface Exam {
  id: string;
  title: string;
  description: string;
  created_at: string;
  questions: { count: number }[];
  responses: { count: number }[];
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    totalResponses: 0,
    evaluatedResponses: 0
  });

  useEffect(() => {
    fetchExams();
    fetchStats();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          created_at,
          questions:questions(count),
          responses:responses(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch exams: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: examCount } = await supabase
        .from('exams')
        .select('id', { count: 'exact' });

      const { data: responseCount } = await supabase
        .from('responses')
        .select('id', { count: 'exact' });

      const { data: evaluatedCount } = await supabase
        .from('responses')
        .select('id', { count: 'exact' })
        .not('marks', 'is', null);

      setStats({
        totalExams: examCount?.length || 0,
        totalResponses: responseCount?.length || 0,
        evaluatedResponses: evaluatedCount?.length || 0
      });
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card academic-gradient-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-primary">ZenEval</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="academic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalExams}</div>
            </CardContent>
          </Card>

          <Card className="academic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalResponses}</div>
            </CardContent>
          </Card>

          <Card className="academic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluated</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.evaluatedResponses}</div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Exam Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Your Exams</h2>
          <Link to="/create-exam">
            <Button className="academic-gradient text-white shadow-[var(--shadow-primary)]">
              <Plus className="h-4 w-4 mr-2" />
              Create New Exam
            </Button>
          </Link>
        </div>

        {/* Exams Grid */}
        {exams.length === 0 ? (
          <Card className="academic-card text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No exams yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first exam to start evaluating answer sheets
              </p>
              <Link to="/create-exam">
                <Button className="academic-gradient text-white shadow-[var(--shadow-primary)]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Exam
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <Link key={exam.id} to={`/exam/${exam.id}`}>
                <Card className="academic-card hover:academic-card-primary cursor-pointer transition-all duration-300 animate-fadeIn">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold truncate">
                        {exam.title}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {exam.questions?.[0]?.count || 0} Questions
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {exam.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(exam.created_at)}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {exam.responses?.[0]?.count || 0} Responses
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;