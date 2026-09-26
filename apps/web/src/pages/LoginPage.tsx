import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Input, SensitiveInput, LayerCard, Button } from "@/components/ui";
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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[var(--bg-app)] px-4 py-12">
      <div className="mx-auto flex w-full max-w-[380px] flex-col items-center">
        <div className="mb-6 text-center">
          <div className="mb-3.5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
            <AppLogo size={32} color="#0a5c4d" />
          </div>
          <h1 className="m-0 text-xl font-semibold text-kumo-strong">
            Welcome back
          </h1>
          <p className="mt-1 text-xs text-kumo-subtle">
            Sign in to access your pipeline.
          </p>
        </div>

        <LayerCard className="w-full rounded-2xl bg-white px-7 py-6 border-0 ring-0 space-y-4">
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
              <SensitiveInput
                label="Password"
                id="password"
                required
                placeholder="••••••••"
                value={password}
                onValueChange={setPassword}
                autoComplete="current-password"
                size="base"
                className="w-full"
              />
              <div className="flex justify-end pt-0.5">
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-[#0a5c4d] hover:text-[#07473b] hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
              className="w-full h-10 text-xs font-semibold mt-1 transition-transform active:scale-[0.98]"
            >
              Sign in
            </Button>
          </form>

          <div className="text-center text-xs text-kumo-subtle pt-1">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#0a5c4d] font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </LayerCard>
      </div>
    </div>
  );
}

