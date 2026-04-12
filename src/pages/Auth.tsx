import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from "lucide-react";
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

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "signup") {
        const { error: signUpError } = await signUp(email, password, fullName);
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
