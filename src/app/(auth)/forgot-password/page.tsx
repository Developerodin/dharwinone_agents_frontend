"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { forgotPassword } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout>
      <AuthFormCard>
        <AuthHeader
          eyebrow="Reset password"
          title="Forgot your password?"
          description="Enter your account email and we'll send you a reset link."
        />
        {sent ? (
          <>
            <AuthAlert>
              If an account exists for {email}, a reset link is on its way. The link expires in 1
              hour.
            </AuthAlert>
            <p className="auth-footer-text">
              <Link href={ROUTES.signIn} className="auth-footer-link">
                Back to sign in
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
            {error && <AuthAlert variant="error">{error}</AuthAlert>}
            <AuthInput
              id="forgot-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <AuthSubmitButton disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </AuthSubmitButton>
            <p className="auth-footer-text">
              Remembered it?{" "}
              <Link href={ROUTES.signIn} className="auth-footer-link">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </AuthFormCard>
    </AuthPageLayout>
  );
}
