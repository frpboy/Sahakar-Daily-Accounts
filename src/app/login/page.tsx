"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic" | "forgot">("password");
  const supabase = createClient();

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Login link sent! Check your email.");
    }
    setLoading(false);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent! Check your email.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden px-4 select-none">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-[400px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-md relative z-10">
        <CardHeader className="space-y-1 pb-8 pt-8">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7 text-white"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center text-gray-900">
            Sahakar Accounts
          </CardTitle>
          <CardDescription className="text-center text-gray-500 font-medium">
            Daily outlet accounts — Sahakar Group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-5">
            {mode !== "forgot" && (
              <div className="flex p-1 bg-gray-100/80 rounded-lg">
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                    mode === "password"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setMode("password")}
                >
                  Password
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                    mode === "magic"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setMode("magic")}
                >
                  Magic Link
                </button>
              </div>
            )}

            {mode === "password" && (
              <form onSubmit={handleEmailPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all shadow-md shadow-gray-200"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            )}

            {mode === "magic" && (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="magic-email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all shadow-md shadow-gray-200"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Login Link"}
                </Button>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="mb-2">
                  <p className="text-sm font-semibold text-gray-800">Reset your password</p>
                  <p className="text-xs text-gray-400 mt-0.5">Enter your email and we&apos;ll send you a reset link.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all shadow-md shadow-gray-200"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <button
                  type="button"
                  onClick={() => setMode("password")}
                  className="w-full text-xs text-gray-400 hover:text-gray-700 transition-colors pt-1"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}
          </div>

          <div className="pt-2 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Don&apos;t have access?{" "}
              <Link
                href="/register"
                className="text-gray-900 font-bold hover:underline underline-offset-4 decoration-2 decoration-blue-500/30 transition-all"
              >
                Request Access
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
          Powered by Zabnix Private Limited
        </p>
      </div>
    </div>
  );
}
