import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Input, SensitiveInput, LayerCard, Button } from "@/components/ui";
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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[var(--bg-app)] px-4 py-12">
      <div className="mx-auto flex w-full max-w-[380px] flex-col items-center">
        <div className="mb-6 text-center">
          <div className="mb-3.5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
            <AppLogo size={32} color="#0a5c4d" />
          </div>
          <h1 className="m-0 text-xl font-semibold text-kumo-strong">
            Create an account
          </h1>
          <p className="mt-1 text-xs text-kumo-subtle">
            Start tracking your pipeline and goals.
          </p>
        </div>

        <LayerCard className="w-full rounded-2xl bg-white px-7 py-6 border-0 ring-0 space-y-4">
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

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
              className="w-full h-10 text-xs font-semibold mt-1 transition-transform active:scale-[0.98]"
            >
              Create account
            </Button>
          </form>

          <div className="text-center text-xs text-kumo-subtle pt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-[#0a5c4d] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </LayerCard>
      </div>
    </div>
  );
}

