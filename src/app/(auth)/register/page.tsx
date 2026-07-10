"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthInput, AuthPasswordInput } from "@/components/auth/auth-input";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { ROUTES } from "@/lib/constants";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must be at least 8 characters with a letter and a number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Try again.");
      setIsSubmitting(false);
    }
  };

  if (registered) {
    return (
      <AuthPageLayout>
        <AuthFormCard>
          <AuthHeader
            eyebrow="Almost there"
            title="Check your email"
            description={`We sent a verification link to ${email}. Click it to activate your account.`}
          />
          <p className="auth-footer-text">
            Already verified?{" "}
            <Link href={ROUTES.signIn} className="auth-footer-link">
              Sign in
            </Link>
          </p>
        </AuthFormCard>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <AuthFormCard>
        <AuthHeader
          eyebrow="Get started"
          title="Create your account"
          description="Set up your retailer account to deploy AI calling agents"
        />

        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <div className="flex w-full flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
            <div className="flex w-full flex-col gap-4 sm:gap-5">
              <AuthInput
                id="register-name"
                label="Full name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />

              <AuthInput
                id="register-email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <div className="flex w-full flex-col gap-2">
                <AuthPasswordInput
                  id="register-password"
                  label="Password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  showPassword={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  required
                />
                <p className="auth-hint">
                  At least 8 characters with one letter and one number.
                </p>
              </div>

              <AuthPasswordInput
                id="register-confirm"
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                showPassword={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
                required
              />
            </div>

            <AuthSubmitButton disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </AuthSubmitButton>

            <p className="auth-footer-text">
              Already have an account?{" "}
              <Link href={ROUTES.signIn} className="auth-footer-link">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </AuthFormCard>
    </AuthPageLayout>
  );
}
