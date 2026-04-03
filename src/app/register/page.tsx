"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/registration-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
      toast.success("Registration request submitted!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden px-4">
        {/* Background elements (mirrored from login) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
        </div>

        <Card className="w-full max-w-[440px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-md relative z-10 text-center">
          <CardHeader className="pt-10 pb-6">
            <div className="flex justify-center mb-6">
              <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Request Submitted</CardTitle>
            <CardDescription className="text-gray-500 font-medium px-4 pt-2 leading-relaxed">
              Your details have been securely sent to our administration team. 
              We&apos;ll review your request and send an invitation to your email shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10">
            <Link href="/login">
              <Button variant="outline" className="w-full h-11 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg">
                Return to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden px-4 select-none">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-[440px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-md relative z-10">
        <CardHeader className="space-y-1 pb-8 pt-8 text-center">
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
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6M23 11h-6" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Request Access</CardTitle>
          <CardDescription className="text-gray-500 font-medium">
            Join the Sahakar Accounts platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                Full Name
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Rajesh Kumar"
                className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                Business Email
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@company.com"
                className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                Phone Number <span className="opacity-50">(Optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Choose a password"
                className="h-11 bg-white border-gray-200 focus:ring-gray-900 focus:border-gray-900 transition-all"
                required
                minLength={6}
              />
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all shadow-md shadow-gray-200"
                disabled={loading}
              >
                {loading ? "Sending Request..." : "Request Access"}
              </Button>
            </div>
            
            <div className="pt-4 text-center">
              <p className="text-sm text-gray-500 font-medium">
                Already registered?{" "}
                <Link 
                  href="/login" 
                  className="text-gray-900 font-bold hover:underline underline-offset-4 decoration-2 decoration-blue-500/30 transition-all"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
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

