"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon, LockKeyholeIcon, MailCheckIcon, ShieldCheckIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  onSuccess?: () => void;
  onClose?: () => void;
  // Optional message shown above the form (e.g. "Sign in to save this route")
  prompt?: string;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function AuthModal({ onSuccess, onClose, prompt }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created");
        onSuccess?.();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        onSuccess?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send link";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      // redirectTo must match exactly one of the Authorized Redirect URIs in
      // both Supabase URL Configuration and Google OAuth client.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
      // On success the browser navigates away — no further action needed
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
      toast.error(msg);
      setGoogleLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md sm:p-0">
        <div className="border-b border-primary/10 bg-gradient-to-br from-primary/10 via-primary/5 to-brand/8 p-5 pr-14 sm:p-6 sm:pr-14">
          <DialogHeader className="flex-row items-center gap-3 text-left">
            <BrandMark className="size-11" />
            <div>
              <DialogTitle>{mode === "signin" ? "Welcome back" : "Create your account"}</DialogTitle>
              <DialogDescription className="mt-1">
                {prompt ?? "Save routes and make every commute quicker."}
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <div className="p-5 sm:p-6">
          {magicSent ? (
            <div className="flex flex-col items-center py-5 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success-foreground">
                <MailCheckIcon className="size-7" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">Check your inbox</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                We sent a secure sign-in link to <strong className="text-foreground">{email}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
              >
                {googleLoading ? <Loader2Icon className="animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>

              <div className="relative flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">or use email</span>
                <Separator className="flex-1" />
              </div>

              <Tabs
                value={mode}
                onValueChange={(v) => { setMode(v as "signin" | "signup"); setError(null); }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="signin" className="flex-1">Sign in</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1">Create account</TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleEmailPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email address</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password">Password</Label>
                  <Input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? <><Loader2Icon className="animate-spin" /> Please wait…</> : mode === "signin" ? <><LockKeyholeIcon /> Sign in securely</> : "Create my account"}
                </Button>
              </form>

              <form onSubmit={handleMagicLink}>
                <Button type="submit" variant="ghost" className="w-full text-muted-foreground" disabled={loading || !email}>
                  Email me a sign-in link instead
                </Button>
              </form>

              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <ShieldCheckIcon className="size-3.5" /> Your account is protected by Supabase authentication.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
