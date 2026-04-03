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
  const [mode, setMode] = useState<"password" | "magic">("password");
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
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Magic link sent! Check your email.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden px-4 select-none">
      {/* Decorative background elements */}
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
            Enterprise Grade Daily Account Management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Auth Form Container */}
          <div className="space-y-5">
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

            {mode === "password" ? (
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
                    placeholder="name@company.com"
                    className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Password
                    </Label>
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
                  {loading ? "Authenticating..." : "Sign In"}
                </Button>
              </form>
            ) : (
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
                    placeholder="name@company.com"
                    className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all shadow-md shadow-gray-200"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Secure Link"}
                </Button>
              </form>
            )}

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white/0 px-4 text-gray-400">Secure Access</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all"
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg className="mr-2.5 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
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

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
          Powered by Sahakar Group IT
        </p>
      </div>
    </div>
  );
}
