import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, Trophy, Users, MapPin } from 'lucide-react';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Campus Treasure Hunt</h1>
        </div>
        <Link to="/leaderboard">
          <Button variant="outline" className="glass-card">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </Button>
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-foreground leading-tight">
                Discover Your
                <span className="text-primary"> Campus</span>
                <br />
                Like Never Before
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join the ultimate geofencing treasure hunt. Solve riddles, explore landmarks, 
                and compete with your team for glory across your college campus.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <MapPin className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold text-foreground">Location-Based</h3>
                <p className="text-sm text-muted-foreground">Unlock clues by reaching real campus locations</p>
              </div>
              <div className="text-center space-y-2">
                <Users className="h-8 w-8 text-accent mx-auto" />
                <h3 className="font-semibold text-foreground">Team Play</h3>
                <p className="text-sm text-muted-foreground">Collaborate with up to 4 team members</p>
              </div>
              <div className="text-center space-y-2">
                <Trophy className="h-8 w-8 text-warning mx-auto" />
                <h3 className="font-semibold text-foreground">Real-Time Scoring</h3>
                <p className="text-sm text-muted-foreground">Compete on live leaderboards</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-primary hover:glow-primary transition-glow w-full sm:w-auto">
                  Register Your Team
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline" size="lg" className="glass-card w-full sm:w-auto">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Login Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md glass-card border-glass-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-foreground">Team Leader Login</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Sign in to access your team's dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Team leader email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:glow-primary transition-glow"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have a team account?{' '}
                    <Link to="/register" className="text-primary hover:underline font-medium">
                      Register here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;