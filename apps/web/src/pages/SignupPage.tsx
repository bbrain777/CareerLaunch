import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Input, SensitiveInput } from "@/components/ui";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth";
import { useSignupMutation } from "@/hooks/queries";

export function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetRole, setTargetRole] = useState("");

  const signupMutation = useSignupMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const data = await signupMutation.mutateAsync({
        name: fullName,
        email,
        password,
        targetRole,
      });

      login(data.token, data.user);
      navigate({ to: "/" });
    } catch {
      return;
    }
  };

  const loading = signupMutation.isPending;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#fbfaf8] px-4 py-12">
      <div className="mx-auto flex w-full max-w-[360px] flex-col items-center">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex size-11 items-center justify-center rounded-[10px] bg-white border border-[#e9e7e2] shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
            <AppLogo size={26} color="#0a5c4d" />
          </div>
          <h1 className="text-[20px] font-semibold text-[#1d1c1a] tracking-tight">
            Create an account
          </h1>
          <p className="mt-1 text-[13px] text-[#57544e]">
            Start tracking your pipeline and goals.
          </p>
        </div>

        {/* Auth Panel */}
        <div className="w-full rounded-[10px] bg-white border border-[#e9e7e2] p-6 shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full name"
              id="signup-name"
              type="text"
              required
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              size="base"
              className="w-full"
            />

            <Input
              label="Email address"
              id="signup-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              size="base"
              className="w-full"
            />

            <Input
              label="Target role"
              id="signup-target-role"
              type="text"
              placeholder="e.g. Fullstack Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              size="base"
              className="w-full"
            />

            <SensitiveInput
              label="Password"
              id="signup-password"
              required
              placeholder="••••••••"
              value={password}
              onValueChange={setPassword}
              autoComplete="new-password"
              size="base"
              className="w-full"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex h-[34px] w-full items-center justify-center gap-1.5 rounded-[6px] bg-[#0a5c4d] hover:bg-[#07473b] active:scale-[0.98] text-[13px] font-medium text-white transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  <span>Creating account...</span>
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-[#f0eeea] pt-4 text-center text-[12px] text-[#57544e]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#0a5c4d] font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
