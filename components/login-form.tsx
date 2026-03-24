"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        callbackUrl: callbackUrl,
        redirect: true,
      }) as any;
      if (result?.error) {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-none bg-transparent">
      <CardHeader className="space-y-1 pb-6 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] flex items-center justify-center text-[#0F1059]">
          <LogIn className="h-6 w-6" />
        </div>
        <CardTitle className="text-base font-normal tracking-wide text-[#0F1059] uppercase">
          Welcome Over
        </CardTitle>
        <p className="text-sm text-[#ADB5BD] font-normal uppercase tracking-wide">
          IT Service Portal Access
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-rose-50 p-3 text-rose-600 text-sm font-normal border border-rose-100">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-normal text-[#ADB5BD] uppercase tracking-wide px-1">Username</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-[#ADB5BD] group-focus-within:text-[#0F1059] transition-colors">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="User ID / Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-[#E9ECEF] bg-[#F8F9FA] py-2.5 pl-10 pr-4 outline-none focus:border-[#0F1059]/20 transition-all font-normal text-sm placeholder:text-[#ADB5BD]"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-normal text-[#ADB5BD] uppercase tracking-wide px-1">Password</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-[#ADB5BD] group-focus-within:text-[#0F1059] transition-colors">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-[#E9ECEF] bg-[#F8F9FA] py-2.5 pl-10 pr-4 outline-none focus:border-[#0F1059]/20 transition-all font-normal text-sm placeholder:text-[#ADB5BD]"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full mt-4 bg-[#0F1059] text-white font-normal text-sm"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Login to System"}
          </Button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-sm text-[#ADB5BD] font-normal uppercase tracking-[0.2em] opacity-40">System Powered by NDC</p>
        </div>
      </CardContent>
    </Card>
  );
}
