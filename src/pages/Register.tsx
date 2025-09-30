import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, ArrowLeft, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    teamName: '',
    leaderEmail: '',
    password: '',
    confirmPassword: '',
    memberNames: ['', '', '', ''],
    teamColor: '#00d9ff',
    avatarUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMemberChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      memberNames: prev.memberNames.map((name, i) => i === index ? value : name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    const filledMembers = formData.memberNames.filter(name => name.trim() !== '');
    if (filledMembers.length < 4) {
      toast({
        variant: "destructive",
        title: "Team roster incomplete",
        description: "You need exactly 4 player names to register (including the leader).",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if team name already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('name')
        .eq('name', formData.teamName)
        .single();

      if (existingTeam) {
        toast({
          variant: "destructive",
          title: "Team name taken",
          description: "Please choose a different team name.",
        });
        setLoading(false);
        return;
      }

      // Check if leader email already registered
      const { data: existingEmail } = await supabase
        .from('teams')
        .select('leader_email')
        .eq('leader_email', formData.leaderEmail)
        .single();

      if (existingEmail) {
        toast({
          variant: "destructive",
          title: "Email already registered",
          description: "This email is already registered with another team.",
        });
        setLoading(false);
        return;
      }

      // Create team record directly (no auth required)
      const { error: teamError, data: teamData } = await supabase
        .from('teams')
        .insert({
          name: formData.teamName,
          leader_email: formData.leaderEmail,
          password_hash: formData.password, // For simplicity, storing plaintext (use bcrypt in production)
          member_names: filledMembers,
          status: 'pending',
          team_color: formData.teamColor,
          avatar_url: formData.avatarUrl || null,
        })
        .select()
        .single();

      if (teamError) {
        console.error('Team registration error:', teamError);
        toast({
          variant: "destructive",
          title: "Team registration failed",
          description: teamError.message || "Failed to create team. Please try again.",
        });
        setLoading(false);
        return;
      }

      // Store team info in localStorage for dashboard access
      localStorage.setItem('currentTeam', JSON.stringify({
        id: teamData.id,
        name: teamData.name,
        leader_email: teamData.leader_email,
        status: teamData.status
      }));

      toast({
        title: "Registration successful!",
        description: "Your team is ready. Head to your dashboard to begin.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <Link to="/" className="flex items-center space-x-2">
          <ArrowLeft className="h-5 w-5 text-primary" />
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Campus Treasure Hunt</h1>
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card border-glass-border">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-foreground flex items-center justify-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Register Your Team
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Create your team account to join the treasure hunt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Team Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Team Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teamName" className="text-foreground">Team Name</Label>
                    <Input
                      id="teamName"
                      type="text"
                      placeholder="Enter your team name"
                      value={formData.teamName}
                      onChange={(e) => handleInputChange('teamName', e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamColor" className="text-foreground">Team Color</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="teamColor"
                          type="color"
                          value={formData.teamColor}
                          onChange={(e) => handleInputChange('teamColor', e.target.value)}
                          className="h-12 w-20 cursor-pointer border-border"
                        />
                        <div>
                          <p className="text-sm text-muted-foreground">Pick a highlight color for your team badge.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl" className="text-foreground">Team Avatar (optional)</Label>
                      <Input
                        id="avatarUrl"
                        type="url"
                        placeholder="https://example.com/avatar.png"
                        value={formData.avatarUrl}
                        onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                        className="bg-input border-border"
                      />
                      <p className="text-xs text-muted-foreground">Use a square image for best results.</p>
                    </div>
                  </div>
                </div>

                {/* Leader Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Team Leader (You)</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="leaderEmail" className="text-foreground">Email Address</Label>
                    <Input
                      id="leaderEmail"
                      type="email"
                      placeholder="your.email@college.edu"
                      value={formData.leaderEmail}
                      onChange={(e) => handleInputChange('leaderEmail', e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Team Members (up to 4 total)</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter the names of your team members. You can add up to 4 members including yourself.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.memberNames.map((name, index) => (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`member${index}`} className="text-foreground">
                          Member {index + 1}
                        </Label>
                        <Input
                          id={`member${index}`}
                          type="text"
                          placeholder="Team member name"
                          value={name}
                          onChange={(e) => handleMemberChange(index, e.target.value)}
                          required
                          className="bg-input border-border"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:glow-primary transition-glow"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Registering Team...' : 'Register Team'}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/" className="text-primary hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;