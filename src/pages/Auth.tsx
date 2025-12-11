import { useState, useEffect, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { FluidCursor } from "@/components/ui/fluid-cursor";

// Spline Import
import Spline from "@splinetool/react-spline";

// -----------------------------------------------------------------------------
// SPLINE BOT COMPONENT
// -----------------------------------------------------------------------------
function SplineBot() {
  return (
    <div className="absolute inset-0 z-0">
      <Suspense 
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        }
      >
        <Spline 
          className="w-full h-full"
          scene="https://prod.spline.design/9951u9cumiw2Ehj8/scene.splinecode" 
        />
      </Suspense>
    </div>
  );
}

// -----------------------------------------------------------------------------
// PRELOADER COMPONENT
// -----------------------------------------------------------------------------
function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const intervalTime = 20;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const t = currentStep / steps;
      const easedT = 1 - Math.pow(1 - t, 3);
      
      const newProgress = Math.min(Math.round(easedT * 100), 100);
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(onComplete, 500);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center font-sans tracking-widest"
    >
      <div className="relative">
        {/* Minimal White Font for Preloader */}
        <span className="text-9xl font-bold text-white">
          {progress}
        </span>
        <span className="text-2xl text-white/40 absolute top-2 -right-8">%</span>
      </div>
      
      <div className="mt-8 flex gap-2 items-center">
        {/* Lines Removed */}
        <span className="text-xs uppercase text-white/40 tracking-[0.3em] animate-pulse">
          System Initialization
        </span>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// MAIN AUTH PAGE
// -----------------------------------------------------------------------------
export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPreloader, setShowPreloader] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isLogin) await signIn(email, password);
      else await signUp(email, password, fullName);
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] flex items-center justify-center font-sans">
      
      <AnimatePresence>
        {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} />}
      </AnimatePresence>

      <SplineBot />
      <FluidCursor />

      {/* Darker Overlay for better contrast with minimal white text */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />

      {!showPreloader && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md p-6 z-10"
        >
          {/* Card: Removed border/ring, pure glass */}
          <Card className="border-0 bg-black/20 backdrop-blur-3xl shadow-2xl">
            <CardHeader className="text-center pb-2">
              {/* Minimal White Title */}
              <CardTitle className="text-4xl font-bold text-white tracking-tight">
                ZenEval
              </CardTitle>
              <CardDescription className="text-white/40 font-light tracking-wide">
                {isLogin ? "Welcome back." : "Create profile."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {!isLogin && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest ml-1">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-white/30 group-focus-within:text-white transition-colors" />
                      <Input
                        required
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        // Minimal Input: No borders, subtle background, white text
                        className="pl-10 h-12 bg-white/5 border-0 text-white placeholder:text-white/20 focus:bg-white/10 focus:ring-0 transition-all duration-300 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest ml-1">Email Access</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-white/30 group-focus-within:text-white transition-colors" />
                    <Input
                      required
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-0 text-white placeholder:text-white/20 focus:bg-white/10 focus:ring-0 transition-all duration-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                     <Label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Passcode</Label>
                     {isLogin && <a href="#" className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white transition-colors">Forgot?</a>}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-white/30 group-focus-within:text-white transition-colors" />
                    <Input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-0 text-white placeholder:text-white/20 focus:bg-white/10 focus:ring-0 transition-all duration-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Minimal White Button */}
                <Button
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-bold tracking-wide transition-all duration-300 shadow-lg shadow-white/5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLogin ? "Enter System" : "Create ID"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <div className="mt-6 flex justify-center gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                     {isLogin ? "New user? " : "Existing user? "}
                     <span className="text-white font-medium hover:underline tracking-wide">{isLogin ? "Initialize Protocol" : "Log In"}</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
