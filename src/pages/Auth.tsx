import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, Users, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("signup") ? "signup" : "signin";
  const defaultRole = searchParams.get("role") === "organizer" ? "organizer" : "player";

  const [tab, setTab] = useState<"signin" | "signup">(defaultTab as any);
  const [role, setRole] = useState<"player" | "organizer">(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OAuth role selection state
  const [showOAuthRoleSelect, setShowOAuthRoleSelect] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Handle OAuth callback — if user exists but has no role set, show role picker
  useEffect(() => {
    if (authLoading || !user) return;

    // Check if this is an OAuth callback (hash fragment present)
    const isOAuthCallback = window.location.hash.includes("access_token");

    if (isOAuthCallback && profile && !profile.role) {
      // Profile exists but role not set — show role selection
      setShowOAuthRoleSelect(true);
      return;
    }

    if (profile?.role) {
      // Role already set, redirect
      navigate(profile.role === "organizer" ? "/organize" : "/dashboard", { replace: true });
    }
  }, [authLoading, user, profile, searchParams, navigate]);

  const handleOAuthRoleSelect = async (selectedRole: "player" | "organizer") => {
    if (!user) return;
    setOauthLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("id", user.id);
      if (updateError) throw updateError;

      navigate(selectedRole === "organizer" ? "/organize" : "/dashboard", { replace: true });
    } catch {
      setError("Failed to set role. Please try again.");
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "signup") {
        const { error: signUpError } = await signUp(email, password, fullName, role);
        if (signUpError) {
          setError(signUpError);
          return;
        }
        // After signup, redirect based on role
        navigate(role === "organizer" ? "/organize" : "/join");
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError);
          return;
        }
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Riddle Relay</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {tab === "signin"
                ? "Sign in to continue to your dashboard"
                : "Get started with Riddle Relay"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showOAuthRoleSelect ? (
              /* OAuth role selection after Google callback */
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">How would you like to use Riddle Relay?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={oauthLoading}
                    onClick={() => handleOAuthRoleSelect("player")}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      oauthLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    <Users className="h-6 w-6 text-primary mb-2" />
                    <span className="font-medium block">Play</span>
                    <span className="text-xs text-muted-foreground">Join & compete in events</span>
                  </button>
                  <button
                    type="button"
                    disabled={oauthLoading}
                    onClick={() => handleOAuthRoleSelect("organizer")}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      oauthLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    <Settings className="h-6 w-6 text-primary mb-2" />
                    <span className="font-medium block">Organize</span>
                    <span className="text-xs text-muted-foreground">Create & manage events</span>
                  </button>
                </div>
                {oauthLoading && (
                  <p className="text-center text-sm text-muted-foreground">Setting up your account...</p>
                )}
              </div>
            ) : (
              <>
            {/* Tab toggle */}
            <div className="flex rounded-lg border border-border p-1 mb-6">
              <button
                type="button"
                onClick={() => { setTab("signin"); setError(null); }}
                className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                  tab === "signin"
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setTab("signup"); setError(null); }}
                className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                  tab === "signup"
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Google OAuth */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const { error } = await signInWithGoogle();
                  if (error) {
                    setError(error);
                    setLoading(false);
                  }
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              {tab === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={tab === "signup" ? "Create a password" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Role selector for signup */}
              {tab === "signup" && (
                <div className="space-y-2">
                  <Label>I want to</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("player")}
                      className={`p-3 text-sm rounded-md border text-left transition-colors ${
                        role === "player"
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="font-medium block">Play</span>
                      <span className="text-xs">Join & compete</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("organizer")}
                      className={`p-3 text-sm rounded-md border text-left transition-colors ${
                        role === "organizer"
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="font-medium block">Organize</span>
                      <span className="text-xs">Create & manage</span>
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : tab === "signin"
                    ? "Sign in"
                    : "Create account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
