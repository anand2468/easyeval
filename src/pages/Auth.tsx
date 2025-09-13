import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Users, Award } from 'lucide-react';

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password, fullName);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen academic-gradient flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 text-white">
        <div className="max-w-md">
          <div className="flex items-center mb-8">
            <GraduationCap className="h-12 w-12 mr-4" />
            <h1 className="text-4xl font-bold">EasyEval</h1>
          </div>
          
          <h2 className="text-2xl font-semibold mb-6">
            Modern Answer Sheet Evaluation Platform
          </h2>
          
          <p className="text-lg mb-8 text-white/90">
            Streamline your exam evaluation process with intelligent image recognition and automated scoring.
          </p>

          <div className="space-y-4">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 mr-3 text-white/80" />
              <span>Create and manage exams effortlessly</span>
            </div>
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-3 text-white/80" />
              <span>Upload and evaluate student responses</span>
            </div>
            <div className="flex items-center">
              <Award className="h-6 w-6 mr-3 text-white/80" />
              <span>Automated scoring with AI assistance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8 bg-background/95">
        <div className="w-full max-w-md">
          <Card className="academic-card shadow-[var(--shadow-strong)]">
            <CardHeader className="text-center">
              <div className="lg:hidden flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 mr-2 text-primary" />
                <span className="text-2xl font-bold text-primary">EasyEval</span>
              </div>
              <CardTitle className="text-2xl font-bold">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? 'Sign in to your EasyEval account'
                  : 'Join EasyEval to start evaluating answer sheets'
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full academic-gradient text-white font-semibold shadow-[var(--shadow-primary)]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary-hover font-semibold"
                >
                  {isLogin ? 'Create account' : 'Sign in'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;