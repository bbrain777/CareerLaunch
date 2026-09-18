import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Input, Field, Loader } from "@/components/ui";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth";
import { useLoginMutation } from "@/hooks/queries";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useLoginMutation();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginMutation.mutateAsync({ email, password });
      login(data.token, data.user);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    }
  };

  const loading = loginMutation.isPending;

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-brand-logo">
            <AppLogo size={44} color="#111827" />
          </div>
          <h1 className="auth-title">
            Welcome back
          </h1>
          <p className="auth-subtitle">
            Sign in to continue tracking your career pipeline
          </p>
        </div>

        <div className="auth-card">
          {error && (
            <div className="error-banner mb-4" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="auth-form">
            <Field label="Email address">
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </Field>

            <Field
              label={
                <span className="flex items-center justify-between w-full">
                  <span>Password</span>
                  <a
                    href="#forgot"
                    onClick={(e) => e.preventDefault()}
                    className="text-xs text-[#0a5c4d] hover:underline font-normal"
                  >
                    Forgot password?
                  </a>
                </span>
              }
            >
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-auth flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={16} aria-label="Signing in" />
                  <span>Signing in</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#0a5c4d] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
