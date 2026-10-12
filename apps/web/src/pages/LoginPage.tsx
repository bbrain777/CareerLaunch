import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth";
import { useLoginMutation } from "@/hooks/queries";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const data = await loginMutation.mutateAsync({ email, password });
      login(data.token, data.user);
      navigate({ to: "/" });
    } catch {
      return;
    }
  };

  const loading = loginMutation.isPending;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#fbfaf8] px-4 py-12">
      <div className="mx-auto flex w-full max-w-[360px] flex-col items-center">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex size-11 items-center justify-center rounded-[10px] bg-white border border-[#e9e7e2] shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
            <AppLogo size={26} color="#0a5c4d" />
          </div>
          <h1 className="text-[20px] font-semibold text-[#1d1c1a] tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-[13px] text-[#57544e]">
            Sign in to access your pipeline.
          </p>
        </div>

        {/* Auth Panel */}
        <div className="w-full rounded-[10px] bg-white border border-[#e9e7e2] p-6 shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              size="base"
              className="w-full"
            />

            <div className="flex flex-col gap-1">
              <Input
                label="Password"
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                size="base"
                className="w-full"
              />
              <div className="flex justify-end pt-0.5">
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-[11.5px] text-[#0a5c4d] hover:text-[#07473b] hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex h-[34px] w-full items-center justify-center gap-1.5 rounded-[6px] bg-[#0a5c4d] hover:bg-[#07473b] active:scale-[0.98] text-[13px] font-medium text-white transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-[#f0eeea] pt-4 text-center text-[12px] text-[#57544e]">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#0a5c4d] font-medium hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
