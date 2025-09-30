import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement admin authentication
    // For now, just simulate authentication
    setTimeout(() => {
      if (email === 'admin@campus.edu' && password === 'admin123') {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in as admin.",
        });
        navigate('/admin/dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Invalid admin credentials.",
        });
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <Card className="w-full max-w-md glass-card border-glass-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/20">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Admin Access</CardTitle>
          <CardDescription className="text-muted-foreground">
            Administrative login for treasure hunt management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input border-border"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={loading}
            >
              <Lock className="h-4 w-4 mr-2" />
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              🔒 This is a restricted administrative area. Unauthorized access is prohibited.
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Demo credentials: admin@campus.edu / admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;