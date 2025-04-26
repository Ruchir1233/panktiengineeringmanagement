
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';

const Login = () => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(pin);
      if (success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/50">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:20px_20px] pointer-events-none" />
      
      <div className="w-full max-w-md px-8 py-12 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-primary/5 mb-4">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Pankti Engineering</h1>
          <p className="text-muted-foreground mt-2">Enter your PIN to sign in</p>
        </div>
        
        <div className="glass-card p-6 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="text-lg tracking-widest text-center py-6"
                  placeholder="• • • •"
                  maxLength={4}
                  required
                  inputMode="numeric"
                  autoFocus
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 text-base font-medium transition-all"
              disabled={isLoading || pin.length !== 4}
            >
              {isLoading ? 'Verifying...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
