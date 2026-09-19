import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Input, Field, Loader } from "@/components/ui";
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
  const [error, setError] = useState("");

  const signupMutation = useSignupMutation();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await signupMutation.mutateAsync({
        name: fullName,
        email,
        password,
        targetRole,
      });

      login(data.token, data.user);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    }
  };

  const loading = signupMutation.isPending;

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-brand-logo">
            <AppLogo size={44} color="#111827" />
          </div>
          <h1 className="auth-title">
            Create an account
          </h1>
          <p className="auth-subtitle">
            Start tracking your applications and interview goals
          </p>
        </div>

        <div className="auth-card">
          {error && (
            <div className="error-banner mb-4" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="auth-form">
            <Field label="Full name">
              <Input
                id="signup-name"
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
              />
            </Field>

            <Field label="Email address">
              <Input
                id="signup-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </Field>

            <Field label="Target role" required={false}>
              <Input
                id="signup-target-role"
                type="text"
                placeholder="e.g. Fullstack Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="form-input"
              />
            </Field>

            <Field label="Password">
              <Input
                id="signup-password"
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
                  <Loader size={16} aria-label="Creating account" />
                  <span>Creating account</span>
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#0a5c4d] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
