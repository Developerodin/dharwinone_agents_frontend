"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthPasswordInput } from "@/components/auth/auth-input";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { resetPassword } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must be at least 8 characters with a letter and a number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      router.push(`${ROUTES.signIn}?registered=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed. Try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout>
      <AuthFormCard>
        <AuthHeader
          eyebrow="Reset password"
          title="Choose a new password"
          description="At least 8 characters with one letter and one number."
        />
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          <div className="flex w-full flex-col gap-4 sm:gap-5">
            <AuthPasswordInput
              id="reset-password"
              label="New password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              showPassword={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              required
            />
            <AuthPasswordInput
              id="reset-confirm"
              label="Confirm new password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              showPassword={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              required
            />
          </div>
          <AuthSubmitButton disabled={isSubmitting}>
            {isSubmitting ? "Resetting…" : "Reset password"}
          </AuthSubmitButton>
          <p className="auth-footer-text">
            <Link href={ROUTES.signIn} className="auth-footer-link">
              Back to sign in
            </Link>
          </p>
        </form>
      </AuthFormCard>
    </AuthPageLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
