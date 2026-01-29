import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, User, Lock, ShieldCheck, Mail } from 'lucide-react';
import logo from "@/assets/logo.png"; // Make sure this image exists in your assets folder

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, isLoading } = useAuth(); // Keeping your existing auth hook logic
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false); // State for the dialog
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the page they were trying to access
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both username and password.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use the login function from your AuthContext
      await login(formData);
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back to Shree Radhe Advertisers Admin.',
      });
      
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 flex flex-col items-center text-center pb-2">
          {/* Logo Section */}
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center border p-2 mb-2">
             <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight font-display">Admin Portal</CardTitle>
            <CardDescription className="text-base mt-1">
              Shree Radhe Advertisers Management
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="pl-9 h-10 bg-white"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={isSubmitting || isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                {/* Forgot Password Link */}
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-9 pr-9 h-10 bg-white"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isSubmitting || isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-10 text-base font-medium shadow-md transition-all hover:shadow-lg" 
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t bg-gray-50/50 py-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" /> Secure, encrypted connection
          </p>
        </CardFooter>
      </Card>

      {/* --- FORGOT PASSWORD DIALOG --- */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Mail className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Account Recovery</DialogTitle>
            <DialogDescription className="text-center pt-2">
              For security reasons, automated password resets are disabled.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 text-sm text-center text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border/50">
            <p className="mb-2 font-medium text-foreground">Please contact the System Administrator.</p>
            <p>They can verify your identity and reset your credentials.</p>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsForgotOpen(false)}>
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}